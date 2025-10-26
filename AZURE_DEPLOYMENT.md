# Azure Deployment Guide for CBBA System

## Quick Start Checklist

- [ ] Azure account created
- [ ] Azure CLI installed
- [ ] SQL Database created
- [ ] Backend deployed to App Service
- [ ] Python service containerized
- [ ] Python service deployed to Container Instance
- [ ] Frontend deployed to Vercel
- [ ] All environment variables configured
- [ ] CORS configured
- [ ] Database migrations run
- [ ] End-to-end testing completed

## Azure Resource Group Setup

```powershell
# Login to Azure
az login

# Create resource group
az group create --name cbba-production --location eastus

# Set default resource group
az configure --defaults group=cbba-production location=eastus
```

## SQL Database Commands

```powershell
# Create SQL Server
az sql server create \
  --name cbba-sql-server-unique123 \
  --resource-group cbba-production \
  --location eastus \
  --admin-user cbbaadmin \
  --admin-password YourSecurePassword123!

# Create database
az sql db create \
  --resource-group cbba-production \
  --server cbba-sql-server-unique123 \
  --name db_biometrics_mvp \
  --service-objective Basic

# Configure firewall
az sql server firewall-rule create \
  --resource-group cbba-production \
  --server cbba-sql-server-unique123 \
  --name AllowAllAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0
```

## App Service Commands

```powershell
# Create App Service Plan
az appservice plan create \
  --name cbba-backend-plan \
  --resource-group cbba-production \
  --sku B1 \
  --is-linux false

# Create Web App
az webapp create \
  --name cbba-backend-unique123 \
  --resource-group cbba-production \
  --plan cbba-backend-plan \
  --runtime "DOTNET|8.0"

# Configure deployment
az webapp deployment source config \
  --name cbba-backend-unique123 \
  --resource-group cbba-production \
  --repo-url https://github.com/kuniken99/CISP_Behavioural_Biometric \
  --branch main \
  --manual-integration
```

## Container Registry Commands

```powershell
# Create container registry
az acr create \
  --resource-group cbba-production \
  --name cbbaregistry \
  --sku Basic

# Login to registry
az acr login --name cbbaregistry

# Build and push image
cd cbba_python_service
az acr build --registry cbbaregistry --image cbba-python-service:latest .

# Create container instance
az container create \
  --resource-group cbba-production \
  --name cbba-python-service \
  --image cbbaregistry.azurecr.io/cbba-python-service:latest \
  --cpu 1 --memory 1.5 \
  --registry-login-server cbbaregistry.azurecr.io \
  --registry-username cbbaregistry \
  --registry-password $(az acr credential show --name cbbaregistry --query "passwords[0].value" -o tsv) \
  --dns-name-label cbba-python-ml \
  --ports 5001 \
  --environment-variables \
    FLASK_PORT=5001 \
    ENCRYPTION_KEY=your-encryption-key \
    MODEL_STORAGE_PATH=/app/models \
    RISK_THRESHOLD_MODERATE=50 \
    RISK_THRESHOLD_HIGH=80
```

## Environment Variables Configuration

### Backend (Azure App Service)

```powershell
az webapp config appsettings set \
  --name cbba-backend-unique123 \
  --resource-group cbba-production \
  --settings \
    "ConnectionStrings__DefaultConnection=Server=tcp:cbba-sql-server-unique123.database.windows.net,1433;Database=db_biometrics_mvp;User ID=cbbaadmin;Password=YourPassword;Encrypt=True;" \
    "Jwt__Key=YourVeryLongSecretKeyThatIsAtLeast32CharactersLong123!" \
    "Jwt__Issuer=DbaConsole" \
    "Jwt__Audience=DbaConsoleUsers" \
    "PythonCBBAService__Url=http://cbba-python-ml.eastus.azurecontainer.io:5001" \
    "SMTP__Host=smtp.gmail.com" \
    "SMTP__Port=587" \
    "SMTP__FromEmail=your-email@gmail.com" \
    "SMTP__Password=your-app-password" \
    "ReCaptcha__SiteKey=your-site-key" \
    "ReCaptcha__SecretKey=your-secret-key" \
    "AppSettings__FrontendUrl=https://your-app.vercel.app"
```

## Monitoring Setup

```powershell
# Create Application Insights
az monitor app-insights component create \
  --app cbba-insights \
  --location eastus \
  --resource-group cbba-production

# Link to App Service
az monitor app-insights component connect-webapp \
  --app cbba-insights \
  --resource-group cbba-production \
  --web-app cbba-backend-unique123
```

## Useful Commands

```powershell
# View backend logs
az webapp log tail --name cbba-backend-unique123 --resource-group cbba-production

# View container logs
az container logs --resource-group cbba-production --name cbba-python-service

# Restart backend
az webapp restart --name cbba-backend-unique123 --resource-group cbba-production

# Restart container
az container restart --resource-group cbba-production --name cbba-python-service

# Get backend URL
az webapp show --name cbba-backend-unique123 --resource-group cbba-production --query defaultHostName -o tsv

# Get container IP
az container show --resource-group cbba-production --name cbba-python-service --query ipAddress.fqdn -o tsv

# Delete all resources (cleanup)
az group delete --name cbba-production --yes
```

## Cost Management

```powershell
# View current costs
az consumption usage list --start-date 2025-10-01 --end-date 2025-10-26

# Set budget alert
az consumption budget create \
  --resource-group cbba-production \
  --budget-name monthly-budget \
  --amount 50 \
  --time-grain Monthly \
  --start-date 2025-10-01 \
  --end-date 2026-10-01
```

## Backup Strategy

```powershell
# Create database backup (automatic in Azure SQL)
# Long-term retention policy
az sql db ltr-policy set \
  --resource-group cbba-production \
  --server cbba-sql-server-unique123 \
  --database db_biometrics_mvp \
  --weekly-retention P4W \
  --monthly-retention P12M
```

## Scaling

```powershell
# Scale up App Service
az appservice plan update \
  --name cbba-backend-plan \
  --resource-group cbba-production \
  --sku P1V2

# Scale container
az container create \
  --resource-group cbba-production \
  --name cbba-python-service-v2 \
  --cpu 2 --memory 3
```
