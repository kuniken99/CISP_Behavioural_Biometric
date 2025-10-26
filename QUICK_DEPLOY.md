# 🚀 Quick Deployment Reference

## ⚠️ IMPORTANT: Vercel Limitation

**Vercel CANNOT host the complete CBBA system** because:
- ❌ No .NET support (backend is ASP.NET Core)
- ❌ No SQL Server support
- ❌ Serverless functions timeout after 10 seconds (your ML needs longer)
- ❌ No persistent storage for ML models

## ✅ Recommended Approach

**Multi-Platform Deployment:**
- Frontend → **Vercel** (Free)
- Backend → **Azure App Service** (~$13/month)
- Python ML → **Azure Container Instances** (~$10/month)
- Database → **Azure SQL Database** (~$5/month)
- **Total: ~$28/month**

---

## 🎯 Deployment Order

1. **Database First** (Azure SQL)
2. **Backend Second** (Azure App Service)
3. **Python ML Third** (Azure Container)
4. **Frontend Last** (Vercel)

---

## 📋 Prerequisites Checklist

- [ ] Azure account (free tier available)
- [ ] Vercel account (free tier available)
- [ ] GitHub repository
- [ ] Azure CLI installed: `winget install Microsoft.AzureCLI`
- [ ] Vercel CLI installed: `npm install -g vercel`
- [ ] Production secrets ready (JWT key, SMTP password, reCAPTCHA keys)

---

## 🔐 Secrets You Need

### Generate These:

```powershell
# JWT Secret Key (32+ characters)
$jwtKey = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})
Write-Host "JWT_KEY: $jwtKey"

# Encryption Key for Python (64 hex characters)
$encKey = -join ((0..63) | ForEach-Object { '{0:x}' -f (Get-Random -Maximum 16) })
Write-Host "ENCRYPTION_KEY: $encKey"
```

### Obtain These:

- **reCAPTCHA Keys**: https://www.google.com/recaptcha/admin
- **Gmail App Password**: https://myaccount.google.com/apppasswords

---

## 🌐 Deployment URLs

After deployment, you'll have:

```
Frontend:  https://cbba-system.vercel.app
Backend:   https://cbba-backend-xyz.azurewebsites.net
Python:    http://cbba-python-ml.eastus.azurecontainer.io:5001
Database:  cbba-sql-server-xyz.database.windows.net
```

---

## 📦 Step 1: Deploy Database (5 minutes)

```powershell
# Login to Azure
az login

# Create resource group
az group create --name cbba-production --location eastus

# Create SQL Server (replace 'unique123' with your unique ID)
az sql server create \
  --name cbba-sql-server-unique123 \
  --resource-group cbba-production \
  --location eastus \
  --admin-user cbbaadmin \
  --admin-password "YourSecurePassword123!"

# Create database
az sql db create \
  --resource-group cbba-production \
  --server cbba-sql-server-unique123 \
  --name db_biometrics_mvp \
  --service-objective Basic

# Allow Azure services
az sql server firewall-rule create \
  --resource-group cbba-production \
  --server cbba-sql-server-unique123 \
  --name AllowAzure \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

**Get connection string:**
```
Server=tcp:cbba-sql-server-unique123.database.windows.net,1433;Database=db_biometrics_mvp;User ID=cbbaadmin;Password=YourSecurePassword123!;Encrypt=True;
```

---

## 📦 Step 2: Deploy Backend (10 minutes)

```powershell
# Create App Service
az webapp create \
  --name cbba-backend-unique123 \
  --resource-group cbba-production \
  --plan cbba-backend-plan \
  --runtime "DOTNET|8.0"

# Navigate to backend folder
cd backend

# Publish locally first
dotnet publish -c Release -o ./publish

# Create zip file
Compress-Archive -Path ./publish/* -DestinationPath ./publish.zip -Force

# Deploy to Azure
az webapp deployment source config-zip \
  --resource-group cbba-production \
  --name cbba-backend-unique123 \
  --src ./publish.zip
```

**Configure environment variables** (see AZURE_DEPLOYMENT.md for full list)

---

## 📦 Step 3: Deploy Python ML Service (15 minutes)

```powershell
# Create container registry
az acr create --resource-group cbba-production --name cbbaregistry --sku Basic

# Build and push Docker image
cd cbba_python_service
az acr build --registry cbbaregistry --image cbba-python-service:latest .

# Deploy container
az container create \
  --resource-group cbba-production \
  --name cbba-python-service \
  --image cbbaregistry.azurecr.io/cbba-python-service:latest \
  --cpu 1 --memory 1.5 \
  --dns-name-label cbba-python-ml \
  --ports 5001 \
  --environment-variables \
    FLASK_PORT=5001 \
    ENCRYPTION_KEY="your-64-char-hex-key" \
    MODEL_STORAGE_PATH=/app/models \
    RISK_THRESHOLD_MODERATE=50 \
    RISK_THRESHOLD_HIGH=80
```

---

## 📦 Step 4: Deploy Frontend to Vercel (5 minutes)

### Method 1: Vercel Dashboard (Easiest)

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure:
   - **Root Directory**: `frontend`
   - **Framework**: Create React App
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
4. Add environment variables:
   ```
   REACT_APP_API_URL=https://cbba-backend-unique123.azurewebsites.net
   REACT_APP_RECAPTCHA_SITE_KEY=your-production-key
   ```
5. Click **Deploy**

### Method 2: Vercel CLI

```powershell
cd frontend

# Create .env.production
@"
REACT_APP_API_URL=https://cbba-backend-unique123.azurewebsites.net
REACT_APP_RECAPTCHA_SITE_KEY=your-production-key
"@ | Out-File -FilePath .env.production

# Login to Vercel
vercel login

# Deploy
vercel --prod
```

---

## 🔗 Step 5: Connect Everything

### Update Backend CORS

In `backend/Startup.cs`, add your Vercel domain:

```csharp
app.UseCors(policy => policy
    .WithOrigins(
        "http://localhost:3000",
        "https://cbba-system.vercel.app"  // Your actual Vercel domain
    )
    .AllowAnyMethod()
    .AllowAnyHeader()
    .AllowCredentials());
```

Redeploy backend:
```powershell
cd backend
dotnet publish -c Release -o ./publish
Compress-Archive -Path ./publish/* -DestinationPath ./publish.zip -Force
az webapp deployment source config-zip --resource-group cbba-production --name cbba-backend-unique123 --src ./publish.zip
```

### Update Backend Environment Variables

```powershell
az webapp config appsettings set \
  --name cbba-backend-unique123 \
  --resource-group cbba-production \
  --settings \
    "PythonCBBAService__Url=http://cbba-python-ml.eastus.azurecontainer.io:5001" \
    "AppSettings__FrontendUrl=https://cbba-system.vercel.app"
```

---

## ✅ Step 6: Test Deployment

1. Visit your Vercel URL: `https://cbba-system.vercel.app`
2. Register new user
3. Complete CBBA training (1 minute)
4. Test real-time monitoring
5. Test step-up authentication
6. Test session lock

---

## 🐛 Common Issues

### Backend 500 Error
```powershell
# View logs
az webapp log tail --name cbba-backend-unique123 --resource-group cbba-production
```

### Python Service Not Responding
```powershell
# View container logs
az container logs --resource-group cbba-production --name cbba-python-service

# Restart container
az container restart --resource-group cbba-production --name cbba-python-service
```

### CORS Error
- Add Vercel domain to backend CORS policy
- Ensure using HTTPS, not HTTP
- Redeploy backend after changes

### Database Connection Failed
- Check firewall allows Azure services
- Verify connection string
- Test connection in Azure Portal Query Editor

---

## 💰 Cost Breakdown

| Service | Tier | Cost/Month |
|---------|------|------------|
| Azure SQL Database | Basic (5 DTU) | $4.99 |
| Azure App Service | B1 (1 core, 1.75GB) | $12.41 |
| Azure Container Instance | 1 CPU, 1.5GB RAM | $9.87 |
| Azure Container Registry | Basic | $5.00 |
| **Vercel** | **Hobby (Free)** | **$0.00** |
| **TOTAL** | | **~$32/month** |

**Free alternatives:**
- Azure App Service: F1 tier (free but limited)
- Azure SQL: Use PostgreSQL on free tier elsewhere
- Vercel: Always free for hobby projects

---

## 📊 Monitoring

### View Metrics

```powershell
# Backend metrics
az monitor metrics list \
  --resource /subscriptions/YOUR_SUB/resourceGroups/cbba-production/providers/Microsoft.Web/sites/cbba-backend-unique123 \
  --metric "CpuPercentage,MemoryPercentage,Http2xx,Http5xx"

# Container metrics
az container show \
  --resource-group cbba-production \
  --name cbba-python-service \
  --query "{CPU:containers[0].instanceView.currentState.detailStatus, Memory:containers[0].resourceRequirements.memoryInGB}"
```

---

## 🔄 CI/CD Setup

GitHub Actions workflow already created at `.github/workflows/deploy-frontend.yml`

**Add secrets to GitHub:**
1. Go to repository Settings → Secrets → Actions
2. Add:
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`
   - `REACT_APP_API_URL`
   - `REACT_APP_RECAPTCHA_SITE_KEY`

Get Vercel tokens:
```powershell
vercel login
vercel project ls
# Copy org ID and project ID
```

---

## 🧹 Cleanup (Delete Everything)

```powershell
# Delete entire resource group (irreversible!)
az group delete --name cbba-production --yes --no-wait

# Delete Vercel project
vercel remove cbba-system
```

---

## 📚 Full Documentation

- **Complete Guide**: `DEPLOYMENT_GUIDE.md`
- **Azure Commands**: `AZURE_DEPLOYMENT.md`
- **Project README**: `README.md`

---

## 🆘 Need Help?

1. Check logs: `az webapp log tail --name cbba-backend-unique123`
2. Test endpoints: `curl https://cbba-backend-unique123.azurewebsites.net`
3. Review environment variables: `az webapp config appsettings list --name cbba-backend-unique123`
4. Check Azure Portal for visual status
5. Review `DEPLOYMENT_GUIDE.md` for troubleshooting

---

**Time to Deploy: ~35-45 minutes total**
- Database: 5 min
- Backend: 10 min
- Python: 15 min
- Frontend: 5 min
- Testing: 10 min
