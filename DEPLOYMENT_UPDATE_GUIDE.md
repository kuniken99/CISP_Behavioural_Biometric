# Complete Deployment Update Guide

## Overview

This guide covers how to update **all three components** of the CBBA system:
1. Frontend (React → Vercel)
2. Backend (ASP.NET Core → Azure App Service)
3. Python ML Service (Flask → Azure Container Instance)

---

## 🔑 Key Changes in This Update

### Advanced Keystroke Dynamics Anomaly Detection

**New Features:**
1. ✅ **Hesitation and Errors Detection** - Detects slow typing, frequent pauses, excessive backspace usage
2. ✅ **Dwell Time Shift Detection** - Identifies changes in key hold duration (heavy vs light touch)
3. ✅ **Speed/Rhythm Change Detection** - Catches sudden typing speed changes (e.g., 60 WPM → 120 WPM)
4. ✅ **Heavy-Fingered Typing Detection** - Identifies different touch pressure patterns
5. ✅ **Rhythm Disruption Detection** - Detects flight time anomalies (timing between keys)

**Technical Implementation:**
- New file: `keystroke_anomaly_detector.py` - Specialized keystroke pattern analyzer
- Updated: `anomaly_detection.py` - Integrated keystroke anomaly scoring (20% weight)
- Updated: `cbba_service.py` - Passes raw keystroke data for analysis

**Risk Scoring Updated:**
- Isolation Forest: 20% (reduced from 25%)
- SVM: 50% (reduced from 60%)
- Feature Distance: 10% (reduced from 15%)
- **Keystroke Anomalies: 20% (NEW!)**

---

## 📁 Files Modified

### Python ML Service (`cbba_python_service/`)
- ✅ **NEW**: `keystroke_anomaly_detector.py` (467 lines)
- ✅ **MODIFIED**: `anomaly_detection.py` (added keystroke detector integration)
- ✅ **MODIFIED**: `cbba_service.py` (passes keystroke_data to predict method)

### Backend (No changes required for this update)
### Frontend (No changes required for this update)

---

## 🚀 Deployment Steps

### **Step 1: Update Python ML Service**

#### Option A: Using Azure Container Instance (Recommended)

```powershell
# 1. Navigate to Python service directory
cd E:\CISP_Behavioural_Biometric\cbba_python_service

# 2. Build new Docker image
docker build -t cbba-python-service:latest .

# 3. Tag image for Azure Container Registry (if using ACR)
docker tag cbba-python-service:latest <your-acr-name>.azurecr.io/cbba-python-service:latest

# 4. Push to ACR
az acr login --name <your-acr-name>
docker push <your-acr-name>.azurecr.io/cbba-python-service:latest

# 5. Restart container instance to pull new image
az container restart --resource-group cbba-production --name cbba-python-service-tank108
```

#### Option B: Direct File Update (If not using containers)

```powershell
# 1. Stop the Python service
# (If running as a service on VM, stop it first)

# 2. Copy new files to deployment location
scp keystroke_anomaly_detector.py user@<your-vm-ip>:/path/to/cbba_python_service/
scp anomaly_detection.py user@<your-vm-ip>:/path/to/cbba_python_service/
scp cbba_service.py user@<your-vm-ip>:/path/to/cbba_python_service/

# 3. SSH into server and restart service
ssh user@<your-vm-ip>
cd /path/to/cbba_python_service
python app.py  # Or restart your service manager
```

#### Option C: Current Deployment (Azure Container Instance - Manual Update)

```powershell
# 1. Navigate to cbba_python_service
cd E:\CISP_Behavioural_Biometric\cbba_python_service

# 2. Rebuild Docker image
docker build -t cbba-ml-service:latest .

# 3. Delete existing container instance
az container delete --resource-group cbba-production --name cbba-python-service-tank108 --yes

# 4. Create new container instance with updated image
az container create `
  --resource-group cbba-production `
  --name cbba-python-service-tank108 `
  --image cbba-ml-service:latest `
  --cpu 1 `
  --memory 2 `
  --ports 5001 `
  --ip-address Public `
  --environment-variables `
    FLASK_ENV=production `
    MODEL_PATH=/app/models `
  --command-line "python app.py"

# 5. Get new IP address
az container show --resource-group cbba-production --name cbba-python-service-tank108 --query ipAddress.ip --output tsv
```

---

### **Step 2: Update Backend (If needed)**

```powershell
# 1. Navigate to backend directory
cd E:\CISP_Behavioural_Biometric\backend

# 2. Build backend
dotnet publish -c Release -o ./publish

# 3. Fix web.config (Azure requirement)
cd publish
(Get-Content web.config) -replace 'hostingModel="inprocess"', 'hostingModel="outofprocess"' | Set-Content web.config
cd ..

# 4. Compress for deployment
Compress-Archive -Path ./publish/* -DestinationPath ./publish.zip -Force

# 5. Deploy to Azure App Service
az webapp deployment source config-zip `
  --resource-group cbba-production `
  --name cbba-backend-tank108 `
  --src ./publish.zip

# 6. Restart backend
az webapp restart --resource-group cbba-production --name cbba-backend-tank108

# 7. Wait 30 seconds for restart
Start-Sleep -Seconds 30

# 8. Verify deployment
curl https://cbba-backend-tank108-cqaqdefdf8ffehfx.southeastasia-01.azurewebsites.net/api/health
```

---

### **Step 3: Update Frontend (If needed)**

#### Option A: Automatic via GitHub Actions (Recommended)

```powershell
# 1. Commit and push changes
cd E:\CISP_Behavioural_Biometric
git add .
git commit -m "Add advanced keystroke anomaly detection"
git push origin main

# GitHub Actions will automatically:
# - Build the frontend
# - Deploy to Vercel
# - Take ~2-3 minutes
```

#### Option B: Manual Vercel Deployment

```powershell
# 1. Navigate to frontend
cd E:\CISP_Behavioural_Biometric\frontend

# 2. Install dependencies (if needed)
npm install

# 3. Build frontend
$env:CI="false"
$env:REACT_APP_API_BASE_URL="https://cbba-backend-tank108-cqaqdefdf8ffehfx.southeastasia-01.azurewebsites.net/api"
$env:REACT_APP_RECAPTCHA_SITE_KEY="6LfogeErAAAAAPl-jd4Opxslssej0QCL87ZWtYov"
npm run build

# 4. Deploy to Vercel
npx vercel --prod

# Or using Vercel CLI (if installed globally)
vercel --prod
```

---

## ✅ Verification Steps

### 1. Verify Python ML Service

```powershell
# Check health endpoint
curl http://<python-service-ip>:5001/health

# Expected response:
# {"status": "healthy", "service": "CBBA ML Service"}
```

### 2. Verify Backend

```powershell
# Check backend health
curl https://cbba-backend-tank108-cqaqdefdf8ffehfx.southeastasia-01.azurewebsites.net/api/health

# Expected: 200 OK
```

### 3. Verify Frontend

```powershell
# Check frontend
curl https://csip-ken.vercel.app

# Expected: HTML response with React app
```

### 4. Test Keystroke Anomaly Detection

1. **Login to your account**: https://csip-ken.vercel.app
2. **Navigate to User Management** (admin page)
3. **Type normally** - observe risk score stays low (green)
4. **Type very slowly with many pauses** - observe risk score increases (orange/red)
5. **Type very fast/carelessly** - observe risk score increases
6. **Use backspace frequently** - observe hesitation detection triggers
7. **Check console logs** in browser developer tools for detailed anomaly breakdown

---

## 📊 Testing Advanced Keystroke Detection

### Test Scenario 1: Hesitation and Errors
**Action**: Type very slowly with long pauses and frequent backspaces
**Expected**: Risk score increases by 20-50%
**Indicators**: "Slow typing", "Frequent pauses", "High error rate"

### Test Scenario 2: Dwell Time Shift
**Action**: Hold keys much longer than usual (heavy-fingered typing)
**Expected**: Risk score increases by 15-30%
**Indicators**: "Heavy-fingered: XXXms vs baseline XXXms"

### Test Scenario 3: Speed Change
**Action**: Type much faster or slower than training baseline
**Expected**: Risk score increases by 30-60%
**Indicators**: "Much faster/slower typing: XXX WPM vs baseline XXX WPM"

### Test Scenario 4: Rhythm Disruption
**Action**: Type with inconsistent timing between keys
**Expected**: Risk score increases by 15-40%
**Indicators**: "Abnormal rhythm", "Inconsistent rhythm"

---

## 🔧 Troubleshooting

### Issue: Python service won't start after update

**Solution:**
```powershell
# Check logs
az container logs --resource-group cbba-production --name cbba-python-service-tank108

# Common issue: Missing dependency
# Fix: Rebuild Docker image with all dependencies
docker build --no-cache -t cbba-ml-service:latest .
```

### Issue: "Module keystroke_anomaly_detector not found"

**Solution:**
```powershell
# Ensure file exists in container/deployment
docker exec <container-id> ls -la /app/keystroke_anomaly_detector.py

# If missing, rebuild container with new file
```

### Issue: Risk scores not changing with different typing patterns

**Solution:**
1. Check if model is trained (need at least 10 samples)
2. Verify keystroke data is being collected (check browser console)
3. Check Python service logs for keystroke anomaly scores
4. Retrain model with diverse typing samples

### Issue: Backend returns 500 errors after update

**Solution:**
```powershell
# Check backend logs
az webapp log tail --resource-group cbba-production --name cbba-backend-tank108

# Restart backend
az webapp restart --resource-group cbba-production --name cbba-backend-tank108
```

---

## 📝 Rollback Procedure

If something goes wrong, rollback to previous version:

### Rollback Python Service

```powershell
# Option 1: Restore previous Docker image
docker tag cbba-ml-service:previous cbba-ml-service:latest
az container restart --resource-group cbba-production --name cbba-python-service-tank108

# Option 2: Git rollback
git revert <commit-hash>
git push origin main
# Then redeploy
```

### Rollback Backend

```powershell
# Redeploy previous version from Git
git checkout <previous-commit-hash>
cd backend
dotnet publish -c Release -o ./publish
# ... follow deployment steps
```

### Rollback Frontend

```powershell
# Vercel keeps deployment history
# Go to Vercel Dashboard → Deployments → Select previous → Promote to Production
```

---

## 🎯 Summary Checklist

Before deploying:
- [ ] All files saved and committed to Git
- [ ] Docker image built successfully
- [ ] Environment variables configured
- [ ] Backup of current deployment taken

After deploying:
- [ ] Python service health check passes
- [ ] Backend health check passes  
- [ ] Frontend loads successfully
- [ ] Login works
- [ ] Keystroke anomaly detection triggers on unusual typing
- [ ] Risk scores update in real-time
- [ ] Session lock triggers at 80%+ risk

---

## 📌 Production URLs

- **Frontend**: https://csip-ken.vercel.app
- **Backend**: https://cbba-backend-tank108-cqaqdefdf8ffehfx.southeastasia-01.azurewebsites.net
- **Python ML**: http://4.144.154.255:5001 (Update after redeployment)
- **Database**: cbba-sql-server-tank108.database.windows.net

---

## 🆘 Support

If issues persist:
1. Check all service logs
2. Verify network connectivity between services
3. Test each component independently
4. Review recent Git commits for breaking changes
5. Retrain CBBA model if risk scores seem off

---

**Last Updated**: October 27, 2025
**Version**: 2.0 - Advanced Keystroke Anomaly Detection
