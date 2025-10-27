# 🚀 Deploying Your CBBA System to the Internet

## 📖 What This Guide Will Help You Do

This guide will help you **publish your Behavioral Biometric Authentication system online** so that:
- ✅ Anyone can access it from the internet
- ✅ Your data is stored securely in the cloud
- ✅ The system runs 24/7 automatically
- ✅ You don't need to keep your computer running

**Estimated time**: 2-3 hours for first-time deployment  
**Cost**: Starting from $28/month (or free for testing)  
**Difficulty**: Beginner-friendly with step-by-step instructions

---

## ❓ Why Can't I Just Use Vercel for Everything?

You might have heard that Vercel is easy for deploying websites. However, **Vercel cannot host your complete CBBA system** because:

### Think of it like this:
- Your project has **4 parts** that need to work together:
  1. **Frontend** (the website users see) ✅ Vercel can host this
  2. **Backend** (the .NET server) ❌ Vercel cannot run .NET
  3. **Python ML Service** (the AI that learns behavior) ❌ Vercel has time limits (10 seconds)
  4. **Database** (where user data is stored) ❌ Vercel doesn't provide SQL Server

### Simple Explanation:
- **Frontend** is like a restaurant's dining area (customers see it)
- **Backend** is like the kitchen (processes orders)
- **Python Service** is like the chef (makes intelligent decisions)
- **Database** is like the storage room (keeps all ingredients)

**Vercel can only host the dining area**, but you need all four parts!

---

## ✅ Best Solution: Multi-Platform Deployment

We'll deploy each part to a service that specializes in that type of hosting:

```
┌─────────────────────────────────────────────────────────┐
│           HOW YOUR SYSTEM WILL BE DEPLOYED               │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Frontend (Website)        →  Vercel (Free)             │
│  Backend (.NET Server)     →  Azure ($13/month)         │
│  Python AI Service         →  Azure ($10/month)         │
│  Database (SQL Server)     →  Azure ($5/month)          │
│                                                          │
│  Total Cost: ~$28/month (or free for 12 months trial)   │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

---

## 🎯 Choose Your Deployment Path

### Path 1: Azure Deployment (⭐ Recommended for Beginners)

**Why we recommend Azure:**
- ✅ Everything in one place (easier to manage)
- ✅ Works perfectly with .NET (your backend is built with .NET)
- ✅ Has SQL Server (exactly what your project uses)
- ✅ **FREE for 12 months** if you're a new user
- ✅ Microsoft provides step-by-step tutorials
- ✅ Best for students and professionals

**What you'll deploy:**
1. **Frontend** (Website) → Vercel (Free forever)
2. **Backend** (.NET Server) → Azure App Service
3. **Python AI** (Machine Learning) → Azure Container
4. **Database** (SQL Server) → Azure SQL Database

**Total Monthly Cost:**
- First 12 months: **FREE** (with Azure free trial)
- After 12 months: **$28/month**

**Good for:** Students, professionals, production systems

---

### Path 2: Railway Deployment (Simpler but More Expensive)

**Why choose Railway:**
- ✅ Everything on one platform (super simple)
- ✅ No complex setup needed
- ✅ Automatically detects your code
- ❌ **No free tier** (costs from day one)
- ❌ More expensive than Azure

**Total Monthly Cost:** $25-30/month from day one

**Good for:** Quick deployments, if you don't want to deal with multiple services

---

### Path 3: Render Deployment (Cheapest Option)

**Why choose Render:**
- ✅ Cheapest option ($14/month)
- ✅ Simple setup
- ❌ **Doesn't support SQL Server** (you'll need to convert to PostgreSQL)
- ❌ More technical work to convert database

**Total Monthly Cost:** $14-21/month

**Good for:** Budget-conscious users willing to do database migration

---

## 💡 Which Path Should You Choose?

| If you are... | Choose this path |
|--------------|------------------|
| **A student or new to cloud hosting** | Path 1: Azure (Free for 12 months) |
| **Want the simplest deployment** | Path 2: Railway (Pay now, deploy fast) |
| **On a tight budget** | Path 3: Render (Cheapest, but needs work) |
| **This is for production/business** | Path 1: Azure (Most professional) |

**We recommend Path 1 (Azure)** for most users. The rest of this guide focuses on Azure deployment.

---

# 📋 Step-by-Step Deployment Guide (Azure Path)

## ⚙️ Before You Start: Prerequisites

### What You Need:

#### 1. A Microsoft Azure Account
**What is Azure?** Microsoft's cloud platform (like Google Drive, but for running applications)

**Cost:** FREE for 12 months for new users ($200 credit)

**How to create an account:**
1. Go to [https://azure.microsoft.com/free](https://azure.microsoft.com/free)
2. Click **"Start free"**
3. Sign in with your Microsoft account (or create one)
4. Enter your credit card (won't be charged during free trial)
5. Complete verification

**Note:** You need a credit card, but Microsoft won't charge you without your permission.

---

#### 2. Install Azure CLI (Command Line Tool)

**What is Azure CLI?** A program that lets you control Azure from your computer's command line.

**How to install:**

Open PowerShell as Administrator and run:
```powershell
winget install Microsoft.AzureCLI
```

**After installation**, close and reopen PowerShell, then verify:
```powershell
az --version
```

You should see version information (like "azure-cli 2.XX.X")

---

#### 3. A Vercel Account (for Frontend)

**What is Vercel?** A free platform for hosting websites.

**How to create an account:**
1. Go to [https://vercel.com/signup](https://vercel.com/signup)
2. Click **"Continue with GitHub"**
3. Authorize Vercel to access your GitHub
4. That's it! No credit card needed.

---

#### 4. Your Project on GitHub

**Why GitHub?** Vercel needs to access your code to deploy it.

**If your code isn't on GitHub yet:**
1. Go to [https://github.com](https://github.com)
2. Click **"New repository"**
3. Name it `CISP_Behavioural_Biometric`
4. Click **"Create repository"**
5. Follow GitHub's instructions to push your code

**Already on GitHub?** Perfect! Move to the next step.

---

## ✅ Checklist Before Starting

- [ ] Azure account created
- [ ] Azure CLI installed and working (`az --version` shows version)
- [ ] Vercel account created
- [ ] Code is on GitHub
- [ ] PowerShell open and ready
- [ ] 2-3 hours of free time
- [ ] Coffee/tea ready ☕ (optional but recommended!)

---

## 🚀 Let's Start Deploying!

## 🗄️ STEP 1: Create Your Database (15 minutes)

### What We're Doing:
Creating a SQL Server database in the cloud to store all user data, behavioral patterns, and authentication information.

### 1.1 Login to Azure Portal

1. Open your browser and go to: [https://portal.azure.com](https://portal.azure.com)
2. Sign in with your Microsoft account
3. You'll see the Azure Portal dashboard (looks like a blue screen with lots of icons)

---

### 1.2 Create a SQL Database

**Step-by-step with explanations:**

1. **Click the "Create a resource" button**
   - It's a big green **+ Create** button near the top-left
   - Or search for "SQL Database" in the search bar at the top

2. **Select "SQL Database"**
   - Click **"Create"** button

3. **Fill in the Basic Settings** (one field at a time):

   **Subscription:**
   - Select your Azure subscription
   - If you just signed up, you'll see "Azure for Students" or "Free Trial"

   **Resource Group:**
   - Click **"Create new"**
   - Type: `cbba-production`
   - Think of this as a folder for all your CBBA resources
   - Click **"OK"**

   **Database Name:**
   - Type: `db_biometrics_mvp`
   - This is the name of your database (don't change it!)

   **Server:**
   - Click **"Create new"** (we need to create a server to hold the database)
   
   A popup will appear. Fill it in:

   **Server Name:**
   - Type: `cbba-sql-server-tank108` 
   - Example: `cbba-sql-server-john123`
   - **Must be unique worldwide!** If taken, add more numbers

   **Location:**
   - Choose the region closest to you:
     - **USA East Coast**: East US
     - **USA West Coast**: West US
     - **Europe**: West Europe
     - **Asia**: Southeast Asia
   - This affects speed - closer = faster!

   **Authentication:**
   - Select **"Use SQL authentication"**

   **Server Admin Login:**
   - Type: `cbbaadmin`
   - This is your database username

   **Password:**
   - Create a **strong password** and write it down!
   - Requirements: 
     - At least 8 characters
     - Contains uppercase, lowercase, numbers, and symbols
   - Example: `Cbba2024!Secure#`
   - ⚠️ **IMPORTANT**: Save this password somewhere safe! You'll need it later.

   Click **"OK"** to close the server creation popup.

4. **Configure Compute + Storage:**
   - Click **"Configure database"**
   - Select **"Basic"** tier (cheapest option)
     - 5 DTUs
     - 2 GB storage
     - Costs ~$5/month
   - Click **"Apply"**

5. **Review Your Settings:**
   - Click **"Review + create"** at the bottom
   - Double-check everything looks right
   - Click **"Create"**

6. **Wait for Deployment** (2-5 minutes)
   - Azure will show a "Deployment in progress" message
   - When done, you'll see "Your deployment is complete"
   - Click **"Go to resource"**

✅ **Checkpoint**: You now have a SQL Server database in Azure!

---

### 1.3 Configure Firewall (Security Settings)

**Why?** By default, Azure blocks all connections for security. We need to allow your computer and Azure services to connect.

1. **Go to Your SQL Server** (not the database):
   - In the Azure Portal, search for your server name: `cbba-sql-server-tank108`
   - Click on it

2. **Open Networking Settings:**
   - On the left menu, find **"Security"** section
   - Click **"Networking"**

3. **Add Your Computer's IP:**
   - Under "Firewall rules", click **"+ Add your client IPv4 address"**
   - This allows YOUR computer to connect
   - You'll see your IP address appear (like 123.45.67.89)

4. **Allow Azure Services:**
   - Find the toggle: **"Allow Azure services and resources to access this server"**
   - Click it to turn it **ON** (should turn blue/green)
   - This lets your backend and Python service connect

5. **Save Changes:**
   - Click **"Save"** button at the top
   - Wait for "Successfully updated" message

✅ **Checkpoint**: Your database is now accessible!

---

### 1.4 Get Your Database Connection String

**What is a connection string?** Think of it as the "address and password" your application needs to connect to the database.

1. **Go Back to Your Database:**
   - Search for `db_biometrics_mvp` in Azure Portal
   - Click on it

2. **Find Connection Strings:**
   - On the left menu, click **"Connection strings"**
   - You'll see a long text under "ADO.NET"

3. **Copy the Connection String:**
   - Click the **copy icon** next to the ADO.NET connection string
   - It looks like this:
   ```
   Server=tcp:cbba-sql-server-tank108.database.windows.net,1433;Initial Catalog=db_biometrics_mvp;Persist Security Info=False;User ID=cbbaadmin;Password={your_password};MultipleActiveResultSets=False;Encrypt=True;TrustServerCertificate=False;Connection Timeout=30;
   ```

4. **IMPORTANT - Update the Password:**
   - Find `{your_password}` in the string
   - Replace it with the actual password you created earlier
   - Example: Change `Password={your_password}` to `Password=Cbba2024!Secure#`

5. **Save This String:**
   - Open Notepad
   - Paste the connection string
   - Save the file as `connection-string.txt` on your desktop
   - You'll need this in the next steps!

✅ **Checkpoint**: You have your database connection string saved!

---

### 1.5 Set Up Database Tables

**What we're doing:** Creating the tables (like spreadsheet tabs) in your database for users, sessions, biometric data, etc.

1. **Open PowerShell:**
   - Press `Windows + X`
   - Select **"Windows PowerShell"** or **"Terminal"**

2. **Navigate to Your Project:**
   ```powershell
   cd E:\CISP_Behavioural_Biometric\backend
   ```

3. **Update Connection String Temporarily:**
   - Open `appsettings.json` file in the backend folder
   - Find the `"ConnectionStrings"` section
   - Replace the connection string with the one you saved
   - **Save the file**

4. **Run Database Migration:**
   ```powershell
   dotnet ef database update
   ```

   **What you'll see:**
   - Lots of text scrolling (applying migrations)
   - Should end with "Done." or "Apply completed"
   - If you see errors, make sure your connection string is correct!

5. **Verify It Worked:**
   - Go back to Azure Portal
   - Open your database → **"Query editor"**
   - Login with your admin credentials
   - You should see tables like `Users`, `BiometricProfiles`, `Sessions`, etc.

✅ **Checkpoint**: Your database is ready with all tables created!

**⏱️ Time check**: You should be ~15 minutes in. Great job! Let's move to the backend.

---

























## 🖥️ STEP 2: Deploy Backend (.NET Server) (20 minutes)

### What We're Doing:
Deploying your ASP.NET Core backend to Azure App Service. This is the "brain" of your application that processes requests, handles authentication, and manages all business logic.

### 2.1 Create App Service (Web Hosting)

**What is App Service?** Think of it as renting a computer in the cloud that runs your .NET application 24/7.

1. **Go to Azure Portal:**
   - Still at [portal.azure.com](https://portal.azure.com)

2. **Create a New Web App:**
   - Click **"+ Create a resource"** (top-left)
   - Search for: `Web App`
   - Click **"Web App"** → **"Create"**

3. **Fill in the Basics** (carefully, one by one):

   **Subscription:**
   - Select your Azure subscription (same as before)

   **Resource Group:**
   - Select: `cbba-production` (the one we created earlier)
   - This groups everything together!

   **Name:**
   - Type: `cbba-backend-tank108`
   - Example: `cbba-backend-john123`
   - **Must be unique worldwide!**
   - This becomes your URL: `cbba-backend-john123.azurewebsites.net`
   - ⚠️ **Write this down!** You'll need it for frontend configuration.

   **Publish:**
   - Select: **Code** (not Docker Container)

   **Runtime stack:**
   - Select: **.NET 8 (LTS)**
   - ⚠️ Make sure it's .NET 8, not 6 or 7!

   **Operating System:**
   - Select: **Windows**

   **Region:**
   - Select: **Same region as your database!**
   - Example: If database is in "East US", choose "East US"
   - Same region = faster communication = better performance

   **Pricing Plan:**
   - Click **"Create new"** under App Service Plan
   - Plan name: `cbba-backend-plan`
   - For testing: Select **Free F1** (free but limited)
   - For production: Select **Basic B1** (~$13/month, much better performance)
   - Click **"OK"**

4. **Review and Create:**
   - Click **"Review + create"** at the bottom
   - Verify all settings
   - Click **"Create"**

5. **Wait for Deployment** (2-3 minutes)
   - You'll see "Deployment in progress"
   - When done: "Your deployment is complete"
   - Click **"Go to resource"**

✅ **Checkpoint**: Your App Service is created! But it's empty - we need to configure and deploy code.

---








### 2.2 Generate Security Secrets

**Before configuring, we need to generate secure keys!**

1. **Open PowerShell** (keep it open)

2. **Run the secrets generator:**
   ```powershell
   cd E:\CISP_Behavioural_Biometric
   .\generate-secrets.ps1
   ```

3. **Save the output:**
   - The script will generate JWT keys, encryption keys, and passwords
   - When asked "Save to file?", type `y`
   - Save the file somewhere safe (NOT in your Git repository!)

4. **You now have:**
   - JWT Secret Key (for backend authentication)
   - Encryption Key (for Python service)
   - SQL Admin Password (you already have this)

**Keep this PowerShell window open with the secrets!**

---

### 2.3 Configure Backend Environment Variables

**What are environment variables?** Secret settings your backend needs to run (like passwords, API keys, etc.)

1. **Go to Your App Service:**
   - In Azure Portal, find your `cbba-backend-tank108` app

2. **Open Configuration:**
   - Left menu → **"Settings"** section
   - Click **"Configuration"**

3. **Add Application Settings** (one by one, clicking "+ New application setting" each time):

   **Connection String (Database):**
   - Click **"+ New connection string"** (different button!)
   - Name: `DefaultConnection`
   - Value: [Paste your connection string from step 1.4]
   - Type: `SQLAzure`
   - Click **"OK"**

   Now click **"+ New application setting"** for each of these:

   **JWT Settings (Authentication):**
   
   Setting 1:
   - Name: `Jwt__Key`
   - Value: [Copy the JWT Secret Key from the secrets generator]
   - Click **"OK"**

   Setting 2:
   - Name: `Jwt__Issuer`
   - Value: `DbaConsole`
   - Click **"OK"**

   Setting 3:
   - Name: `Jwt__Audience`
   - Value: `DbaConsoleUsers`
   - Click **"OK"**

   **Email Settings (Gmail SMTP):**

   Setting 4:
   - Name: `SMTP__Host`
   - Value: `smtp.gmail.com`
   - Click **"OK"**

   Setting 5:
   - Name: `SMTP__Port`
   - Value: `587`
   - Click **"OK"**

   Setting 6:
   - Name: `SMTP__FromEmail`
   - Value: [Your Gmail address]
   - Example: `john.doe@gmail.com`
   - Click **"OK"**

   Setting 7:
   - Name: `SMTP__Password`
   - Value: [Your Gmail App Password - see note below]
   - Click **"OK"**

   **📧 Getting Gmail App Password:**
   - Go to: https://myaccount.google.com/apppasswords
   - Sign in to your Gmail
   - Click "Select app" → "Mail"
   - Click "Select device" → "Other" → Type "CBBA Backend"
   - Click "Generate"
   - Copy the 16-character password (like `abcd efgh ijkl mnop`)
   - Use this as your SMTP__Password

   **reCAPTCHA Settings:**

   Setting 8:
   - Name: `ReCaptcha__SiteKey`
   - Value: [Your reCAPTCHA site key - see note below]
   - Click **"OK"**

   Setting 9:
   - Name: `ReCaptcha__SecretKey`
   - Value: [Your reCAPTCHA secret key]
   - Click **"OK"**

   **🤖 Getting reCAPTCHA Keys:**
   - Go to: https://www.google.com/recaptcha/admin
   - Click "+ " to create new site
   - Label: "CBBA Production"
   - reCAPTCHA type: "reCAPTCHA v2" → "I'm not a robot"
   - Domains: Add your future Vercel domain (or localhost for now)
   - Click "Submit"
   - Copy both "Site Key" and "Secret Key"

   **Placeholder Settings (we'll update these later):**

   Setting 10:
   - Name: `PythonCBBAService__Url`
   - Value: `http://placeholder-will-update-later.com`
   - Click **"OK"**
   - ℹ️ We'll update this after deploying Python service

   Setting 11:
   - Name: `AppSettings__FrontendUrl`
   - Value: `http://placeholder-will-update-later.com`
   - Click **"OK"**
   - ℹ️ We'll update this after deploying frontend

4. **Save All Settings:**
   - Click **"Save"** at the top
   - Click **"Continue"** when warned about restart
   - Wait for "Settings saved successfully"

✅ **Checkpoint**: Backend is configured with all environment variables!

---

### 2.4 Deploy Your Backend Code to Azure

**Now we upload your actual code!**

#### Option A: Using PowerShell (Easiest for Beginners)

1. **Login to Azure CLI:**
   ```powershell
   az login
   ```
   - Your browser will open
   - Sign in with your Azure account
   - Close the browser when done
   - PowerShell will say "You have logged in"

2. **Navigate to Backend Folder:**
   ```powershell
   cd E:\CISP_Behavioural_Biometric\backend
   ```

3. **Build Your Project:**
   ```powershell
   dotnet publish -c Release -o ./publish
   ```
   - This compiles your code for production
   - Takes 30-60 seconds
   - You'll see "Build succeeded"

4. **IMPORTANT - Verify web.config Hosting Model:**
   - Open the file: `E:\CISP_Behavioural_Biometric\backend\publish\web.config`
   - Find the line with `hostingModel=`
   - Make sure it says: `hostingModel="outofprocess"`
   - If it says `"inprocess"`, change it to `"outofprocess"`
   - Also ensure: `stdoutLogEnabled="true"` for better debugging
   - Save the file

   **Why this matters:** Azure App Service requires out-of-process hosting for ASP.NET Core 8. Using in-process mode will cause HTTP 500.30 errors.

5. **Create ZIP File:**
   ```powershell
   Compress-Archive -Path ./publish/* -DestinationPath ./publish.zip -Force
   ```
   - This packages everything into one file

6. **Deploy to Azure:**
   ```powershell
   az webapp deployment source config-zip --resource-group cbba-production --name cbba-backend-tank108 --src ./publish.zip
   ```
   - **Replace `cbba-backend-tank108`** with YOUR backend name!
   - This uploads your code to Azure
   - Takes 2-3 minutes
   - You'll see lots of output, ending with `"provisioningState": "Succeeded"`





**⏱️ Deployment time: 3-5 minutes**

#### Option B: Using Visual Studio (If You Have It)

1. Open your backend project in Visual Studio
2. Right-click the project → **"Publish"**
3. Click **"Add a publish profile"**
4. Select **"Azure"** → **"Next"**
5. Select **"Azure App Service (Windows)"** → **"Next"**
6. Sign in to Azure
7. Select your subscription and `cbba-backend-tank108`
8. Click **"Finish"**
9. Click **"Publish"** button
10. Wait for "Publish succeeded"

---





### 2.5 Verify Backend is Running

1. **Get Your Backend URL:**
   - In Azure Portal, go to your App Service: `cbba-backend-tank108`
   - On the Overview page, copy the **"Default domain"**
   - It will look like: `cbba-backend-tank108-cqaqdefdf8ffehfx.southeastasia-01.azurewebsites.net`
   - **Note:** The URL includes a random string and region - this is normal!

2. **Test Health Endpoint:**
   ```powershell
   curl https://[YOUR-BACKEND-URL]/api/health
   ```
   - Replace `[YOUR-BACKEND-URL]` with your actual URL
   - Example: `https://cbba-backend-tank108-cqaqdefdf8ffehfx.southeastasia-01.azurewebsites.net/api/health`
   
   **Expected Response:**
   ```json
   {
     "status": "healthy",
     "message": "CBBA Backend is running"
   }
   ```

3. **What if I get an error?**

   **HTTP 500.30 - App failed to start:**
   - Check web.config hosting model (should be `outofprocess`)
   - Redeploy after fixing
   - Wait 60 seconds after deployment for app to fully start

   **HTTP 404 - Not Found:**
   - This is OK for the root URL `/`
   - Try the health endpoint: `/api/health`
   - API routes are at `/api/*`, not at root

   **HTTP 503 - Service Unavailable:**
   - App is still starting, wait 30 more seconds
   - Or restart: `az webapp restart --resource-group cbba-production --name cbba-backend-tank108`

4. **Check Logs if There's a Problem:**
   - Go to Azure Portal → Your App Service
   - Left menu → **"Monitoring"** → **"Log stream"**
   - Wait 30 seconds to see live logs
   - Look for any error messages in red
   - Common errors:
     - Connection string issues
     - Missing environment variables
     - Database connectivity problems

5. **Download Detailed Logs (if needed):**
   ```powershell
   az webapp log download --resource-group cbba-production --name cbba-backend-tank108 --log-file backend-logs.zip
   ```
   - Extract and check the logs folder
   - Look in `LogFiles/Application/` for errors

✅ **Checkpoint**: Your backend is live and running on Azure!

**⏱️ Time check**: You should be ~35 minutes in. Halfway there!

---




















## 🤖 STEP 3: Deploy Python ML Service (AI Service) (25 minutes)

### What We're Doing:
Deploying your Python machine learning service that analyzes behavioral patterns and calculates risk scores. We'll use Docker containers for this.

### What is Docker?
Think of Docker like a "box" that contains everything your Python app needs (Python itself, all libraries, your code). This box can run anywhere!

---

### 3.1 Prepare Docker Files (Already Done!)

Good news! I already created the Dockerfile for you. Let's verify:

1. **Check if Dockerfile exists:**
   ```powershell
   cd E:\CISP_Behavioural_Biometric\cbba_python_service
   dir Dockerfile
   ```

2. **If you see "File Not Found", create it:**
   - The Dockerfile should already exist from earlier setup
   - If not, create `Dockerfile` (no extension) with the Python configuration

✅ **Checkpoint**: Dockerfile exists in cbba_python_service folder

---

### 3.2 Create Azure Container Registry (Storage for Docker Images)

**What is Container Registry?** A place to store your Docker images (like GitHub but for containers).

1. **Create Container Registry:**
   ```powershell
   cd E:\CISP_Behavioural_Biometric\cbba_python_service
   
   az acr create --resource-group cbba-production --name cbbaregistrytank108 --sku Basic --location eastus
   ```
   - **Replace `tank108`** with something unique (e.g., `cbbaregistryjohn123`)
   - ⚠️ **Must be lowercase letters and numbers only, no dashes!**
   - Takes 2-3 minutes

2. **Wait for "provisioningState": "Succeeded"**




3. **Login to the Registry:**
   ```powershell
   az acr login --name cbbaregistrytank108
   ```
   - **Replace `cbbaregistrytank108`** with YOUR registry name
   - You'll see "Login Succeeded"

✅ **Checkpoint**: Container Registry created and logged in!

---

### 3.3 Build and Upload Docker Image

**What we're doing:** Building a "box" (Docker image) with your Python app and uploading it to Azure.

**⚠️ IMPORTANT NOTE:** The `az acr build` command is NOT available on Basic SKU registries. We'll build locally and push instead.

1. **Make sure Docker Desktop is running:**
   - Open Docker Desktop application
   - Wait for it to show "Engine running"

2. **Navigate to Python service folder:**
   ```powershell
   cd E:\CISP_Behavioural_Biometric\cbba_python_service
   ```

3. **Build Docker image locally:**
   ```powershell
   docker build -t cbba-python-service:latest .
   ```
   - The `.` at the end is important! (means "current directory")
   - This will build your Docker image (3-5 minutes)
   - You'll see output like "Step 1/7", "Step 2/7", etc.
   - Wait for "Successfully built" and "Successfully tagged"

4. **Login to Azure Container Registry:**
   ```powershell
   az acr login --name cbbaregistrytank108
   ```
   - **Replace `cbbaregistrytank108`** with YOUR registry name
   - You'll see "Login Succeeded"

5. **Tag the image for Azure:**
   ```powershell
   docker tag cbba-python-service:latest cbbaregistrytank108.azurecr.io/cbba-python-service:latest
   ```
   - **Replace `cbbaregistrytank108`** with YOUR registry name

6. **Push image to Azure Container Registry:**
   ```powershell
   docker push cbbaregistrytank108.azurecr.io/cbba-python-service:latest
   ```
   - **Replace `cbbaregistrytank108`** with YOUR registry name
   - This uploads your image to Azure (2-3 minutes)
   - You'll see upload progress for each layer
   - Wait for "latest: digest: sha256:..." message

**⏱️ Total time: 7-10 minutes** (great time for a coffee break!)

✅ **Checkpoint**: Docker image built locally and uploaded to Azure!

---












### 3.4 Deploy Container Instance (Run Your Python Service)

**What we're doing:** Actually running the Docker container in Azure.

**⚠️ IMPORTANT - One-time Setup Required:**

1. **Register Container Instance Provider (First Time Only):**
   ```powershell
   az provider register --namespace Microsoft.ContainerInstance
   ```
   - This is a one-time setup for your Azure subscription
   - Takes 2-5 minutes to complete

2. **Check Registration Status:**
   ```powershell
   az provider show -n Microsoft.ContainerInstance --query "registrationState"
   ```
   - Wait until it shows: `"Registered"`
   - If it shows `"Registering"`, wait 1 minute and check again

**Now Deploy Your Container:**

3. **Get Your Encryption Key:**
   - Look at your saved secrets file from step 2.2
   - Find the "ENCRYPTION_KEY" value
   - Copy it (should be 64 characters long)

4. **Get Registry Password:**
   ```powershell
   az acr credential show --name cbbaregistrytank108 --query "passwords[0].value" --output tsv
   ```
   - **Replace `cbbaregistrytank108`** with YOUR registry name
   - Copy the password that appears

5. **Create Container Instance:**
   ```powershell
   az container create --resource-group cbba-production --name cbba-python-service --image cbbaregistrytank108.azurecr.io/cbba-python-service:latest --cpu 1 --memory 1.5 --os-type Linux --registry-login-server cbbaregistrytank108.azurecr.io --registry-username cbbaregistrytank108 --registry-password [PASTE_REGISTRY_PASSWORD_HERE] --dns-name-label cbba-python-tank108 --ports 5001 --environment-variables FLASK_PORT=5001 FLASK_HOST=0.0.0.0 ENCRYPTION_KEY=[PASTE_ENCRYPTION_KEY_HERE] MODEL_STORAGE_PATH=/app/models RISK_THRESHOLD_MODERATE=50 RISK_THRESHOLD_HIGH=80
   ```

   **⚠️ IMPORTANT - Replace these values:**
   - `cbbaregistrytank108` → Your registry name (appears 3 times!)
   - `[PASTE_REGISTRY_PASSWORD_HERE]` → The password from step 4
   - `cbba-python-tank108` → Unique DNS name (e.g., `cbba-python-yourname`)
   - `[PASTE_ENCRYPTION_KEY_HERE]` → Your encryption key from secrets (64 chars)

   **Example of final command:**
   ```powershell
   az container create --resource-group cbba-production --name cbba-python-service --image cbbaregistryjohn.azurecr.io/cbba-python-service:latest --cpu 1 --memory 1.5 --os-type Linux --registry-login-server cbbaregistryjohn.azurecr.io --registry-username cbbaregistryjohn --registry-password "abc123xyz789password" --dns-name-label cbba-python-john --ports 5001 --environment-variables FLASK_PORT=5001 FLASK_HOST=0.0.0.0 ENCRYPTION_KEY="a1b2c3d4e5f6..." MODEL_STORAGE_PATH=/app/models RISK_THRESHOLD_MODERATE=50 RISK_THRESHOLD_HIGH=80
   ```

6. **Wait for Deployment** (2-3 minutes)
   - You'll see JSON output
   - Look for `"provisioningState": "Succeeded"`
   - Look for `"state": "Running"` in the output

7. **Verify Container is Running:**
   ```powershell
   az container logs --resource-group cbba-production --name cbba-python-service
   ```
   - You should see:
     ```
     Starting CBBA Python Service on port 5001
     Model storage path: /app/models
     * Running on all addresses (0.0.0.0)
     * Running on http://127.0.0.1:5001
     ```

✅ **Checkpoint**: Python service is running in Azure!

---

### 3.5 Get Your Python Service URL

1. **Get the Public IP Address:**
   ```powershell
   az container show --resource-group cbba-production --name cbba-python-service --query ipAddress.ip --output tsv
   ```
   - Copy the IP address (e.g., `4.144.154.255`)

2. **Your Python Service URL is:**
   ```
   http://[YOUR_IP_ADDRESS]:5001
   ```
   - Example: `http://4.144.154.255:5001`

3. **Test it in PowerShell:**
   ```powershell
   curl http://[YOUR_IP_ADDRESS]:5001/health
   ```
   - Replace `[YOUR_IP_ADDRESS]` with your actual IP
   - You should see:
   ```json
   {
     "service": "CBBA Python Service",
     "status": "healthy",
     "version": "1.0.0"
   }
   ```

4. **⚠️ IMPORTANT - Save this IP address!** 
   - Write it down or save it in Notepad
   - Format: `http://4.144.154.255:5001` (use YOUR IP)
   - You'll need it for the next step to connect the backend

**Troubleshooting:**
- If you get "Unable to connect", wait 30 seconds for the container to fully start
- Check container logs: `az container logs --resource-group cbba-production --name cbba-python-service`
- Verify the container is running: Look for "Running on all addresses (0.0.0.0)" in logs

✅ **Checkpoint**: Python service is accessible and responding!

---




### 3.6 Connect Backend to Python Service

**Now tell your backend where to find the Python service:**

1. **Get Your Python Service IP Address:**
   ```powershell
   az container show --resource-group cbba-production --name cbba-python-service --query ipAddress.ip --output tsv
   ```
   - Copy the IP address (e.g., `4.144.154.255`)
   - **Note:** Use IP address instead of DNS name for better reliability

2. **Update Backend Configuration via Azure CLI:**
   ```powershell
   az webapp config appsettings set --resource-group cbba-production --name cbba-backend-tank108 --settings PythonCBBAService__Url=http://[4.144.154.255]:5001
   ```
   - **Replace `[YOUR_IP_HERE]`** with the IP from step 1
   - **Replace `cbba-backend-tank108`** with YOUR backend name
   - Example: `PythonCBBAService__Url=http://4.144.154.255:5001`

   **Alternative: Via Azure Portal:**
   - Go to Azure Portal → Your App Service: `cbba-backend-tank108`
   - Left menu → **"Configuration"**
   - Find the setting: `PythonCBBAService__Url`
   - Click on it to edit
   - Change value to: `http://4.144.154.255:5001` (use YOUR IP)
   - Click **"OK"**
   - Click **"Save"** at the top
   - Click **"Continue"** on the restart warning

3. **Wait for Backend to Restart** (30 seconds)

4. **Verify Connection:**
   - Test that Python service responds: `http://4.144.154.255:5001/health`
   - You should see: `{"service":"CBBA Python Service","status":"healthy","version":"1.0.0"}`

✅ **Checkpoint**: Backend and Python service are now connected!

**⏱️ Time check**: You should be ~60 minutes in. One more component to go!

---











## 🌐 STEP 4: Deploy Frontend (Website) to Vercel (15 minutes)

### What We're Doing:
Deploying your React website to Vercel so anyone can access it on the internet!

---

### 4.1 Prepare Frontend Configuration

1. **Create Production Environment File:**
   ```powershell
   cd E:\CISP_Behavioural_Biometric\frontend
   ```

2. **Create `.env.production` file:**
   - Open Notepad
   - Paste this (update the values!):
   ```properties
   REACT_APP_API_URL=https://cbba-backend-tank108.azurewebsites.net
   REACT_APP_RECAPTCHA_SITE_KEY=your-recaptcha-site-key-from-earlier
   ```
   - **Replace `cbba-backend-tank108`** with YOUR backend URL
   - **Replace `your-recaptcha-site-key-from-earlier`** with the Site Key (not Secret Key!)
   - Save as: `E:\CISP_Behavioural_Biometric\frontend\.env.production`
   - ⚠️ Make sure it's `.env.production`, not `.env.production.txt`!

---



### 4.2 Deploy to Vercel (Using Dashboard - Easiest)

**Step-by-step deployment:**

1. **Make Sure Code is on GitHub:**
   - Your project should already be on GitHub
   - If not, push your latest changes:
   ```powershell
   cd E:\CISP_Behavioural_Biometric
   git add .
   git commit -m "Ready for deployment"
   git push
   ```

2. **Go to Vercel Dashboard:**
   - Open: [https://vercel.com/dashboard](https://vercel.com/dashboard)
   - Sign in with GitHub (if not already signed in)

3. **Create New Project:**
   - Click **"Add New..."** → **"Project"**
   - You'll see your GitHub repositories

4. **Import Your Repository:**
   - Find `CISP_Behavioural_Biometric` repository
   - Click **"Import"**

5. **Configure Project Settings:**

   **Framework Preset:**
   - Vercel should auto-detect: **Create React App**
   - If not, select it from dropdown

   **Root Directory:**
   - Click **"Edit"**
   - Type: `frontend`
   - This tells Vercel your React app is in the frontend folder

   **Build Settings (leave as default):**
   - Build Command: `npm run build`
   - Output Directory: `build`
   - Install Command: `npm install`

   **Environment Variables:**
   - Click **"Environment Variables"** section to expand it
   
   **⚠️ IMPORTANT:** Enter each variable individually, NOT as a reference to secrets.
   
   Add Variable 1:
   - Key (Name): `REACT_APP_API_URL`
   - Value: Paste your full backend URL
   - Example: `https://cbba-backend-tank108-cqaqdefdf8ffehfx.southeastasia-01.azurewebsites.net`
   - ⚠️ **Use YOUR actual backend URL** from Step 2.5!
   - **Do NOT** add quotes around the URL
   - Environment: Select **"Production"** (default)
   - Click **"Add"** button

   Add Variable 2:
   - Key (Name): `REACT_APP_RECAPTCHA_SITE_KEY`
   - Value: Paste your reCAPTCHA Site Key (NOT Secret Key!)
   - Example: `6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI`
   - **Do NOT** add quotes
   - Environment: Select **"Production"** (default)
   - Click **"Add"** button

   **Double-check both variables are added** before proceeding!

6. **Deploy!**
   - Click **"Deploy"** button
   - Vercel will:
     - Clone your code (30 seconds)
     - Install dependencies (1-2 minutes)
     - Build your React app (1-2 minutes)
     - Deploy to their CDN (30 seconds)

7. **Wait for Deployment** (3-5 minutes total)
   - You'll see a progress screen with steps
   - When done, you'll see: **"Congratulations! 🎉"**
   - You'll see your URL: `https://cisp-behavioural-biometric-tank108.vercel.app`

8. **Visit Your Website!**
   - Click the preview or visit the URL
   - Your CBBA system should load!

✅ **Checkpoint**: Frontend is live on Vercel!

---

### 4.3 Connect Frontend to Backend (CORS Configuration)

**What is CORS?** Security feature that controls which websites can talk to your backend.

1. **Get Your Vercel URL:**
   - From Vercel dashboard, copy your full URL
   - Example: `https://cisp-behavioural-biometric-john.vercel.app`

2. **Update Backend CORS Settings:**
   
   **Option A: Via Code (Better for Long-term):**
   - Open: `E:\CISP_Behavioural_Biometric\backend\Startup.cs`
   - Find the `UseCors` section (around line 50-60)
   - Update it to include your Vercel URL:
   ```csharp
   app.UseCors(policy => policy
       .WithOrigins(
           "http://localhost:3000",
           "https://cisp-behavioural-biometric-john.vercel.app"  // Add YOUR Vercel URL
       )
       .AllowAnyMethod()
       .AllowAnyHeader()
       .AllowCredentials());
   ```
   - Save the file
   - Redeploy backend (repeat step 2.4)

   **Option B: Via App Service Configuration (Quick Fix):**
   - Azure Portal → Your App Service → **"CORS"**
   - Add your Vercel URL to allowed origins
   - Click **"Save"**

---

### 4.4 Update Backend with Frontend URL

1. **Go to Backend Configuration:**
   - Azure Portal → `cbba-backend-tank108` → **"Configuration"**

2. **Update Frontend URL Setting:**
   - Find: `AppSettings__FrontendUrl`
   - Change value to: `https://cisp-behavioural-biometric-tank108.vercel.app`
   - Click **"OK"**
   - Click **"Save"**
   - Click **"Continue"** on restart warning

✅ **Checkpoint**: Frontend and Backend are fully connected!

---

## 🎉 STEP 5: Final Testing & Verification (10 minutes)

### Let's Make Sure Everything Works!

### 5.1 Test Complete System Flow

**Follow this exact sequence to verify everything is working:**

1. **Open Your Frontend:**
   - Go to your Vercel URL: `https://cisp-behavioural-biometric-tank108.vercel.app`
   - Page should load (no errors in browser console)

2. **Test User Registration:**
   - Click **"Register"** or sign up button
   - Fill in the form:
     - Email: Use a real email address
     - Password: Create a secure password
     - Other required fields
   - Click **"Register"**
   - ✅ Success = You see confirmation message or redirect to dashboard

3. **Check Your Email:**
   - You should receive a verification email
   - This confirms SMTP settings are working!
   - Click the verification link

4. **Test Login:**
   - Go back to the website
   - Click **"Login"**
   - Enter your email and password
   - Solve the reCAPTCHA
   - Click **"Login"**
   - ✅ Success = You're logged in and see the dashboard

5. **Test CBBA Training:**
   - You should see a prompt to start behavioral training
   - Follow the on-screen instructions
   - Complete all training exercises
   - ✅ Success = Training completes, you see "Training Complete" message

6. **Test Real-time Monitoring:**
   - Use the application normally
   - Move your mouse, type, click around
   - Open browser console (F12) → Network tab
   - You should see requests to `/api/cbba/analyze` every few seconds
   - ✅ Success = No errors, risk scores being calculated

7. **Test Session Lock (Optional but Recommended):**
   - Try behaving very differently from training
   - Type very fast or very slow
   - Make erratic mouse movements
   - After sustained unusual behavior, you should see session lock
   - ✅ Success = Session locks when risk is high

---

### 5.2 Check All Components Are Connected

**Run these quick URL tests:**

1. **Backend Health Check:**
   ```powershell
   curl https://[YOUR-BACKEND-URL]/api/health
   ```
   - Replace `[YOUR-BACKEND-URL]` with your actual backend domain
   - Example: `cbba-backend-tank108-cqaqdefdf8ffehfx.southeastasia-01.azurewebsites.net`
   - ✅ Expected: `{"status":"healthy","message":"CBBA Backend is running"}`
   - ❌ If error: Check backend logs in Azure Portal → Log stream

2. **Python Service Health Check:**
   ```powershell
   curl http://[YOUR-PYTHON-IP]:5001/health
   ```
   - Replace `[YOUR-PYTHON-IP]` with your Python service IP (e.g., `4.144.154.255`)
   - ✅ Expected: `{"service":"CBBA Python Service","status":"healthy","version":"1.0.0"}`
   - ❌ If error: Check container logs: `az container logs --resource-group cbba-production --name cbba-python-service`

3. **Database Connection:**
   - Login to your application
   - If login works, database is connected! ✅
   - ❌ If error: 
     - Check connection string in backend configuration
     - Verify database firewall rules allow Azure services
     - Check if database is running in Azure Portal

4. **Backend → Python Service Connection:**
   - After completing CBBA training (step 5.1.5)
   - Check backend logs for Python service communication
   - Should show successful ML model training requests
   - ❌ If error: Verify `PythonCBBAService__Url` is set to correct IP in backend config

5. **Frontend → Backend CORS:**
   - Open browser Developer Tools (F12)
   - Go to Console tab
   - Try to login or register
   - Check Network tab for API calls
   - ✅ Successful: API calls return 200/201 status codes
   - ❌ If CORS errors appear: Update backend CORS settings with your Vercel URL

---

### 5.3 What to Do If Something Doesn't Work

**Problem: Frontend loads but can't connect to backend**

Solution:
- Check CORS configuration (step 4.3)
- Verify backend URL in frontend .env.production
- Check browser console for exact error message
- Make sure backend is running (check Azure Portal)

**Problem: "500 Internal Server Error" from backend**

Solution:
- Go to Azure Portal → Your App Service → **"Log stream"**
- Wait for logs to appear (30 seconds)
- Look for error messages in red
- Common issues:
  - **HTTP 500.30**: web.config hosting model is wrong (should be `outofprocess`)
  - Database connection string incorrect or has curly braces in password
  - Missing environment variables (check Configuration settings)
  - JWT key not set or invalid

**Problem: Backend returns HTTP 500.30 - App failed to start**

Solution:
1. Check web.config hosting model:
   - Open: `backend/publish/web.config`
   - Find: `hostingModel=`
   - Should be: `hostingModel="outofprocess"`
   - If it says `inprocess`, change to `outofprocess`
2. Rebuild and redeploy:
   ```powershell
   cd E:\CISP_Behavioural_Biometric\backend
   dotnet publish -c Release -o ./publish
   Compress-Archive -Path ./publish/* -DestinationPath ./publish.zip -Force
   az webapp deployment source config-zip --resource-group cbba-production --name cbba-backend-tank108 --src ./publish.zip
   ```
3. Wait 60 seconds after deployment
4. Test again: `curl https://[YOUR-BACKEND-URL]/api/health`

**Problem: Python service can't connect (Connection refused)**

Solution:
- Check if Flask is binding to 0.0.0.0 (not 127.0.0.1)
- Verify environment variable: `FLASK_HOST=0.0.0.0` is set
- Check container logs: `az container logs --resource-group cbba-production --name cbba-python-service`
- Should see: "Running on all addresses (0.0.0.0)"
- If seeing "Running on http://127.0.0.1", rebuild with correct config

**Problem: "ACR Tasks not permitted" when building Docker image**

Solution:
- Azure Container Registry Basic SKU doesn't support `az acr build`
- Use local Docker build instead:
  ```powershell
  docker build -t cbba-python-service:latest .
  az acr login --name cbbaregistrytank108
  docker tag cbba-python-service:latest cbbaregistrytank108.azurecr.io/cbba-python-service:latest
  docker push cbbaregistrytank108.azurecr.io/cbba-python-service:latest
  ```

**Problem: "MissingSubscriptionRegistration" for Container Instance**

Solution:
- Register the provider (one-time):
  ```powershell
  az provider register --namespace Microsoft.ContainerInstance
  ```
- Wait 2-5 minutes, check status:
  ```powershell
  az provider show -n Microsoft.ContainerInstance --query "registrationState"
  ```
- Wait until it shows: `"Registered"`
- Then retry creating container instance

**Problem: CBBA analysis not working**

Solution:
- Check Python service is running
- Verify `PythonCBBAService__Url` in backend configuration
- Check Python service logs in Azure Portal
- Verify encryption keys match between backend and Python service

**Problem: Emails not sending**

Solution:
- Verify Gmail App Password is correct
- Check SMTP settings in backend configuration
- Make sure "Less secure app access" is OFF (use App Password instead)
- Check backend logs for SMTP errors

**Problem: Vercel build fails with "references Secret which does not exist"**

Solution:
- This happens when environment variables are entered incorrectly
- **Fix:**
  1. Go to Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
  2. Delete the problematic variable
  3. Re-add it with the actual VALUE (not a reference):
     - Key: `REACT_APP_API_URL`
     - Value: `https://cbba-backend-tank108-cqaqdefdf8ffehfx.southeastasia-01.azurewebsites.net`
     - **Do NOT** use quotes or secret references
  4. Go to **Deployments** tab
  5. Click the three dots (•••) on the latest deployment
  6. Click **"Redeploy"** → **"Use existing build cache"** → **"Redeploy"**

**Problem: Frontend loads but shows "Network Error" or "Cannot connect to API"**

Solution:
- Open browser Developer Tools (F12) → Console tab
- Check for CORS errors
- Verify `REACT_APP_API_URL` is set correctly in Vercel (Settings → Environment Variables)
- Make sure backend URL starts with `https://` (not `http://`)
- Check backend is running: Test `https://[backend-url]/api/health`
- Update CORS in backend to include your Vercel URL (see Step 4.3)

---

### 5.4 Monitor Your Deployment

**Set up basic monitoring:**

1. **Azure Portal Monitoring:**
   - Go to each resource (App Service, Container, Database)
   - Pin to dashboard for quick access
   - Check **"Metrics"** to see CPU, memory, requests

2. **Enable Application Insights (Recommended):**
   - Go to Backend App Service
   - Left menu → **"Application Insights"**
   - Click **"Turn on Application Insights"**
   - Creates automatic monitoring and error tracking

3. **Check Costs:**
   - Azure Portal → **"Cost Management + Billing"**
   - See your current spending
   - Set up billing alerts if desired

✅ **CONGRATULATIONS! Your CBBA system is fully deployed and running in production!**

**⏱️ Total time**: ~90 minutes (if following all steps carefully)

---

## 📊 Your Deployed Architecture

Here's what you've built:

```
┌─────────────────────────────────────────────────────────┐
│                  INTERNET USERS                         │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  FRONTEND (Vercel)                                      │
│  https://cisp-behavioural-biometric-you.vercel.app      │
│  - React App                                            │
│  - Static hosting (FREE)                                │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────┐
│  BACKEND (Azure App Service)                            │
│  https://cbba-backend-you.azurewebsites.net             │
│  - ASP.NET Core 8                                       │
│  - Authentication & Business Logic                      │
│  - Cost: $13/month (Basic) or FREE (F1)                 │
└────────────┬───────────────────────┬────────────────────┘
             │                       │
             ▼                       ▼
┌────────────────────────┐  ┌──────────────────────────┐
│  DATABASE              │  │  PYTHON ML SERVICE       │
│  (Azure SQL)           │  │  (Azure Container)       │
│  - User data           │  │  - Behavioral analysis   │
│  - Biometric profiles  │  │  - Risk calculation      │
│  - Sessions            │  │  - ML models             │
│  Cost: $5/month        │  │  Cost: $10/month         │
└────────────────────────┘  └──────────────────────────┘

TOTAL MONTHLY COST: ~$28/month (FREE for 12 months with trial)
```

---

## � Alternative Deployment Options (For Advanced Users)

The following are alternative platforms if you don't want to use Azure. These require more technical knowledge.

---

### Option 2: Railway Deployment

**Pros:** Simple, all-in-one platform  
**Cons:** No free tier, more expensive ($25-30/month)

**Quick Steps:**

1. **Sign up at Railway:**
   - Go to [railway.app](https://railway.app)
   - Sign in with GitHub

2. **Create New Project:**
   - Click **"New Project"**
   - **"Deploy from GitHub repo"**
   - Select your `CISP_Behavioural_Biometric` repo

3. **Add Database:**
   - Click **"+ New"** → **"Database"** → **"PostgreSQL"**
   - ⚠️ Note: You'll need to convert from SQL Server to PostgreSQL!

4. **Deploy Backend:**
   - Click **"+ New"** → **"GitHub Repo"**
   - Root Directory: `backend`
   - Railway auto-detects .NET
   - Add environment variables (same as Azure)

5. **Deploy Python Service:**
   - Click **"+ New"** → **"GitHub Repo"**
   - Root Directory: `cbba_python_service`
   - Railway auto-detects Python
   - Add environment variables

6. **Deploy Frontend:**
   - Use Vercel (same as Azure path)
   - Point to Railway backend URL

**Converting to PostgreSQL:**
- Install npgsql package in backend
- Update connection string format
- Modify Entity Framework configurations
- Re-run migrations

---

### Option 3: Render Deployment

**Pros:** Cheapest option ($14/month)  
**Cons:** No SQL Server support, requires PostgreSQL conversion

**Quick Steps:**

1. **Sign up at Render:**
   - Go to [render.com](https://render.com)
   - Sign in with GitHub

2. **Create PostgreSQL Database:**
   - Dashboard → **"New"** → **"PostgreSQL"**
   - Free tier available (90 days)

3. **Deploy Backend:**
   - **"New"** → **"Web Service"**
   - Connect GitHub repo
   - Root Directory: `backend`
   - Build Command: `dotnet publish -c Release -o out`
   - Start Command: `dotnet out/db_biometrics_mvp.Backend.dll`
   - Add environment variables

4. **Deploy Python Service:**
   - **"New"** → **"Web Service"**
   - Root Directory: `cbba_python_service`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python app.py`

5. **Deploy Frontend:**
   - Use Vercel
   - Point to Render backend URL

**Cost Breakdown:**
- PostgreSQL: Free for 90 days, then $7/month
- Backend Web Service: $7/month
- Python Web Service: $7/month
- **Total: $14-21/month**

---

### Option 4: Self-Hosting (For Experts Only)

**Pros:** Full control, potentially free (using your own server)  
**Cons:** You manage everything, security risks, requires DevOps knowledge

**Requirements:**
- VPS (Virtual Private Server) or dedicated server
- Ubuntu/Windows Server
- Public IP address
- Domain name (optional but recommended)

**Quick Overview:**

1. **Set up Server:**
   - Install .NET 8 SDK
   - Install Python 3.11
   - Install SQL Server or PostgreSQL
   - Configure firewall

2. **Deploy Backend:**
   - Copy files to server
   - Configure reverse proxy (nginx/IIS)
   - Set up SSL certificates (Let's Encrypt)
   - Run as systemd service (Linux) or Windows Service

3. **Deploy Python Service:**
   - Install dependencies
   - Run as background service
   - Configure to auto-restart

4. **Deploy Frontend:**
   - Build React app
   - Serve with nginx or host on Vercel

**Not recommended unless you have DevOps experience!**

---

---

## 📚 Quick Reference

### All Your URLs (Fill in as you deploy)

```
Frontend (Vercel):
https://_____________________________.vercel.app

Backend (Azure):
https://_____________________________.azurewebsites.net

Python Service (Azure):
http://_____________________________.azurecontainer.io:5001

Database Server:
_____________________________.database.windows.net
```

---

### Environment Variables Checklist

**Backend (11 settings):**
- [ ] `ConnectionStrings__DefaultConnection` (database connection)
- [ ] `Jwt__Key` (32+ character secret)
- [ ] `Jwt__Issuer` = DbaConsole
- [ ] `Jwt__Audience` = DbaConsoleUsers
- [ ] `SMTP__Host` = smtp.gmail.com
- [ ] `SMTP__Port` = 587
- [ ] `SMTP__FromEmail` (your Gmail)
- [ ] `SMTP__Password` (Gmail App Password)
- [ ] `ReCaptcha__SiteKey` (from reCAPTCHA admin)
- [ ] `ReCaptcha__SecretKey` (from reCAPTCHA admin)
- [ ] `PythonCBBAService__Url` (Python service URL)
- [ ] `AppSettings__FrontendUrl` (Vercel URL)

**Python Service (5 settings):**
- [ ] `FLASK_PORT` = 5001
- [ ] `ENCRYPTION_KEY` (64-character hex)
- [ ] `MODEL_STORAGE_PATH` = /app/models
- [ ] `RISK_THRESHOLD_MODERATE` = 50
- [ ] `RISK_THRESHOLD_HIGH` = 80

**Frontend (2 settings):**
- [ ] `REACT_APP_API_URL` (backend URL)
- [ ] `REACT_APP_RECAPTCHA_SITE_KEY` (site key, not secret)

---

### Useful Azure CLI Commands

**Check all your resources:**
```powershell
az resource list --resource-group cbba-production --output table
```

**Restart backend:**
```powershell
az webapp restart --name cbba-backend-tank108 --resource-group cbba-production
```

**View backend logs:**
```powershell
az webapp log tail --name cbba-backend-tank108 --resource-group cbba-production
```

**Check container status:**
```powershell
az container show --name cbba-python-service --resource-group cbba-production --query "{Status:instanceView.state, IP:ipAddress.fqdn}"
```

**Stop container (save money):**
```powershell
az container stop --name cbba-python-service --resource-group cbba-production
```

**Start container:**
```powershell
az container start --name cbba-python-service --resource-group cbba-production
```

**Delete everything (careful!):**
```powershell
az group delete --name cbba-production --yes --no-wait
```

---

### Cost Management Tips

**Free for 12 Months (Azure Free Trial):**
- $200 credit for first 30 days
- Free services for 12 months:
  - SQL Database (250 GB)
  - App Service (10 web apps)
  - Container storage

**Minimize Costs:**
1. Use Free (F1) tier for App Service during testing
2. Use Basic tier for SQL Database ($5/month)
3. Stop container instances when not actively testing
4. Delete old container images from registry
5. Set up spending alerts in Azure

**Monitor Costs:**
- Azure Portal → **"Cost Management + Billing"**
- Set daily spending limit
- Get email alerts at 50%, 75%, 100% of budget

---

## 💰 Cost Estimates (Accurate as of 2025)

### Azure Deployment (Recommended)

**Free Tier (First 12 months):**
- SQL Database: FREE (250 GB included)
- App Service: FREE (10 web apps, F1 tier)
- Container Instances: Limited free hours
- **Total: FREE** (using free tier services)

**After Free Tier (Production Pricing):**
- **SQL Database** (Basic, 2 GB): ~$5/month
- **App Service** (Basic B1, 1.75 GB RAM): ~$13/month
- **Container Instance** (1 CPU, 1.5 GB, continuous): ~$10/month
- **Frontend (Vercel)**: FREE
- **Container Registry** (Basic, 10 GB): ~$5/month
- **Total: ~$33/month**

**Budget Option (Testing/Development):**
- SQL Database (Basic): ~$5/month
- App Service (Free F1): FREE
- Container Instance (stop when not testing): ~$2/month
- Frontend (Vercel): FREE
- **Total: ~$7/month**

---

### Railway Deployment

**Pricing:**
- **Starter Plan**: $5/month (500 GB hours)
- **Estimated Usage**:
  - Backend: ~$8-10/month
  - Python Service: ~$8-10/month
  - PostgreSQL Database: ~$5-10/month
- **Total: ~$21-30/month** (no free tier)

---

### Render Deployment

**Pricing:**
- PostgreSQL: FREE for 90 days, then $7/month
- Backend Web Service: $7/month (Starter tier)
- Python Web Service: $7/month
- Frontend (Vercel): FREE
- **Total: $14-21/month** (cheapest paid option)

---

### Platform Comparison

| Platform | First Year | After Year 1 | Pros | Cons |
|----------|-----------|--------------|------|------|
| **Azure** | FREE | $28-33/mo | SQL Server, .NET native, robust | Complex setup |
| **Railway** | $21-30/mo | $21-30/mo | Super simple, auto-deploys | No free tier, pricey |
| **Render** | $14-21/mo | $14-21/mo | Cheapest, simple | No SQL Server, PostgreSQL only |

**💡 Recommendation:** Azure for first-time deployers (free for 12 months to learn)

---

## 🔒 Security Best Practices for Production

### Essential Security Checklist

- [ ] **Change ALL default passwords and secrets**
  - Generate new JWT secret (32+ characters, random)
  - Generate new encryption key (64 characters, random)
  - Use strong SQL admin password
  - Never commit secrets to Git!

- [ ] **Use Production reCAPTCHA keys**
  - Don't use test keys in production
  - Create separate site for production domain

- [ ] **Enable HTTPS everywhere**
  - Azure enables HTTPS by default
  - Vercel enables HTTPS automatically
  - Never send passwords over HTTP

- [ ] **Configure CORS properly**
  - Only allow your actual frontend domain
  - Remove localhost from production CORS settings
  - Don't use wildcard (`*`) origins

- [ ] **Set up database backups**
  - Azure SQL: Enable automated backups (on by default)
  - Keep at least 7 days of backups
  - Test restore procedure once

- [ ] **Enable database encryption**
  - Azure SQL: Transparent Data Encryption (on by default)
  - Verify it's enabled in database settings

- [ ] **Use environment variables for ALL secrets**
  - Never hardcode passwords
  - Never commit .env files
  - Use Azure App Service configuration

- [ ] **Set up monitoring**
  - Enable Application Insights
  - Set up email alerts for errors
  - Monitor unusual activity

- [ ] **Configure rate limiting**
  - Protect login endpoint (max 5 attempts/minute)
  - Protect registration endpoint
  - Azure App Service can add this

- [ ] **Review firewall rules**
  - SQL Server: Only allow Azure services
  - Remove your personal IP after deployment
  - Use private endpoints for sensitive data

- [ ] **Keep software updated**
  - Update .NET packages regularly
  - Update Python packages monthly
  - Update npm packages in frontend

---

### Additional Security Tips

**For Production:**
1. Enable Multi-Factor Authentication on Azure account
2. Use Azure Key Vault for storing secrets (advanced)
3. Enable DDoS protection (available in higher tiers)
4. Review and audit access logs monthly
5. Use managed identities instead of passwords where possible
6. Implement proper logging (don't log sensitive data!)

**What NOT to do:**
- ❌ Don't use "admin" or "password123" anywhere
- ❌ Don't commit .env files to GitHub
- ❌ Don't share database credentials
- ❌ Don't disable SSL/TLS
- ❌ Don't use SQL authentication in connection strings if avoidable
- ❌ Don't leave debug mode enabled in production

---

## 📊 Monitoring and Maintenance

### Set Up Application Insights (Recommended)

**What is Application Insights?** Azure's monitoring tool that tracks errors, performance, usage patterns.

**How to enable:**

1. **Go to Your Backend App Service:**
   - Azure Portal → `cbba-backend-tank108`

2. **Enable Application Insights:**
   - Left menu → **"Application Insights"**
   - Click **"Turn on Application Insights"**
   - Choose "Create new resource"
   - Name: `cbba-insights`
   - Click **"Apply"**

3. **What you get:**
   - Automatic error tracking
   - Performance monitoring
   - Live metrics
   - User analytics
   - Dependency tracking

4. **View Insights:**
   - Go to Application Insights resource
   - **"Live Metrics"** - See real-time requests
   - **"Failures"** - See all errors
   - **"Performance"** - See slow requests

---

### Regular Maintenance Tasks

**Daily (automated):**
- Azure performs automatic backups
- Monitor costs in billing dashboard

**Weekly:**
- Check Application Insights for errors
- Review security alerts
- Check disk space usage

**Monthly:**
- Update NuGet packages in backend
- Update npm packages in frontend
- Update Python packages
- Review and rotate secrets (quarterly is fine too)
- Check for new Azure security updates

**Quarterly:**
- Full security audit
- Review and update firewall rules
- Test backup restore procedure
- Review costs and optimize
- Rotate JWT and encryption keys

---

### Useful Monitoring Commands

**Check backend health:**
```powershell
curl https://cbba-backend-tank108.azurewebsites.net/api/health
```

**Check Python service health:**
```powershell
curl http://cbba-python-tank108.azurecontainer.io:5001/api/cbba/health
```

**View live backend logs:**
```powershell
az webapp log tail --name cbba-backend-tank108 --resource-group cbba-production
```

**Check container status:**
```powershell
az container show --resource-group cbba-production --name cbba-python-service --query "instanceView.state"
```

**Get database size:**
```powershell
az sql db show --resource-group cbba-production --server cbba-sql-server-tank108 --name db_biometrics_mvp --query "maxSizeBytes"
```

---

---

## 🛠️ Troubleshooting Common Issues

### Issue 1: "Cannot connect to backend" (CORS Error)

**Symptoms:**
- Frontend loads but shows errors when trying to login
- Browser console shows: `Access to fetch has been blocked by CORS policy`

**Solution:**
1. Open `backend/Startup.cs`
2. Find the `UseCors` section
3. Add your Vercel URL:
   ```csharp
   app.UseCors(policy => policy
       .WithOrigins(
           "http://localhost:3000",
           "https://your-actual-vercel-url.vercel.app"
       )
       .AllowAnyMethod()
       .AllowAnyHeader()
       .AllowCredentials());
   ```
4. Redeploy backend:
   ```powershell
   cd backend
   dotnet publish -c Release -o ./publish
   Compress-Archive -Path ./publish/* -DestinationPath ./publish.zip -Force
   az webapp deployment source config-zip --resource-group cbba-production --name cbba-backend-tank108 --src ./publish.zip
   ```

---

### Issue 2: "500 Internal Server Error" from Backend

**Symptoms:**
- Backend URL shows error page
- Login/Register fails with 500 error

**How to Diagnose:**
1. Azure Portal → Your App Service
2. Left menu → **"Log stream"**
3. Wait 30 seconds for logs to appear
4. Look for red error messages

**Common Causes & Solutions:**

**Missing Connection String:**
- Check Configuration → Connection strings
- Verify `DefaultConnection` is set
- Password should NOT have `{your_password}` placeholder

**Missing JWT Key:**
- Check Configuration → Application settings
- Verify `Jwt__Key` exists and has 32+ characters

**Database Not Migrated:**
```powershell
cd E:\CISP_Behavioural_Biometric\backend
dotnet ef database update
```

---

### Issue 3: Python Service Not Responding

**Symptoms:**
- CBBA training fails
- Risk scores not calculating
- Backend logs show Python connection errors

**How to Check:**
1. Test Python service health:
   ```
   http://your-python-url:5001/api/cbba/health
   ```
2. If timeout or error, check container logs:
   - Azure Portal → Container Instances → `cbba-python-service`
   - Click **"Containers"** → **"Logs"**

**Common Causes & Solutions:**

**Container Not Running:**
- Azure Portal → Container Instances → Check "Status"
- If not "Running", click **"Restart"**

**Wrong URL in Backend:**
- Backend Configuration → `PythonCBBAService__Url`
- Should be: `http://cbba-python-tank108.region.azurecontainer.io:5001`
- Make sure it's `http://` not `https://`
- Don't forget the `:5001` port!

**Encryption Key Mismatch:**
- Make sure backend and Python service use SAME encryption key
- Check both configurations

---

### Issue 4: Database Connection Failed

**Symptoms:**
- Backend crashes on startup
- Logs show "Cannot open database"
- SQL connection errors

**Solutions:**

**Check Firewall Rules:**
1. Azure Portal → SQL Server
2. **"Networking"** → Firewall rules
3. Make sure these are ON:
   - Your client IP is added
   - "Allow Azure services" is enabled

**Verify Connection String:**
1. Get fresh connection string from Azure Portal
2. Database → **"Connection strings"** → Copy ADO.NET
3. Replace `{your_password}` with actual password
4. Update in Backend Configuration

**Test Connection:**
```powershell
# Install SQL tools if needed
dotnet tool install --global dotnet-sql-cache

# Test connection (replace with your details)
sqlcmd -S cbba-sql-server-tank108.database.windows.net -U cbbaadmin -P YourPassword -d db_biometrics_mvp -Q "SELECT @@VERSION"
```

---

### Issue 5: Vercel Build Fails

**Symptoms:**
- Deployment fails in Vercel dashboard
- Build logs show npm errors

**Solutions:**

**Missing Environment Variables:**
1. Vercel Dashboard → Your Project → **"Settings"**
2. **"Environment Variables"**
3. Add:
   - `REACT_APP_API_URL`
   - `REACT_APP_RECAPTCHA_SITE_KEY`
4. Click **"Redeploy"**

**Node Version Mismatch:**
1. Vercel Dashboard → Settings → **"General"**
2. Set Node.js Version to: `18.x`

**Clear Cache and Rebuild:**
1. Vercel Dashboard → Deployments
2. Click `...` → **"Redeploy"**
3. Check **"Use existing Build Cache"** → Turn OFF
4. Click **"Redeploy"**

---

### Issue 6: Emails Not Sending

**Symptoms:**
- Registration completes but no verification email
- Password reset doesn't send emails

**Solutions:**

**Gmail App Password Wrong:**
1. Go to: https://myaccount.google.com/apppasswords
2. Remove old app password
3. Generate new one
4. Update in Backend Configuration → `SMTP__Password`

**Gmail Blocking:**
- Check Gmail inbox for "security alert"
- You may need to allow "less secure apps" temporarily
- Better: Use App Password (not regular Gmail password)

**SMTP Configuration:**
Verify these settings in Backend Configuration:
```
SMTP__Host = smtp.gmail.com
SMTP__Port = 587
SMTP__FromEmail = your-gmail@gmail.com
SMTP__Password = your-16-char-app-password
```

**Test Email in Logs:**
- Backend Log stream should show email attempts
- Look for "Email sent successfully" or SMTP errors

---

### Issue 7: High Azure Costs

**Symptoms:**
- Bill higher than expected
- Want to reduce costs

**Solutions to Reduce Costs:**

**Use Free Tier for Testing:**
- App Service: F1 (Free tier)
- Database: Basic (cheapest)
- Container: Reduce memory to 1.0 GB
- Turn off services when not testing

**Stop Container When Not in Use:**
```powershell
# Stop container
az container stop --resource-group cbba-production --name cbba-python-service

# Start again when needed
az container start --resource-group cbba-production --name cbba-python-service
```

**Monitor Spending:**
1. Azure Portal → **"Cost Management + Billing"**
2. Set up budget alerts
3. Review daily costs

**Delete Unused Resources:**
- Remove old container images from registry
- Delete unused resource groups
- Stop unused databases

---

### Still Having Issues?

**Get More Help:**

1. **Check Azure Logs:**
   - Every service has **"Log stream"** or **"Logs"** section
   - Read error messages carefully
   - Google exact error text

2. **Check Browser Console:**
   - Press F12 in browser
   - Go to **"Console"** tab
   - Look for red errors
   - Go to **"Network"** tab to see failed requests

3. **Verify Environment Variables:**
   - Print ALL variables using a checklist
   - Make sure no placeholders like `[YOUR_VALUE_HERE]`

4. **Test Each Component Separately:**
   - Test database connection
   - Test backend health endpoint
   - Test Python service health endpoint
   - Test frontend builds locally first

5. **Start Over (Last Resort):**
   - Delete resource group
   - Follow guide again from Step 1
   - Sometimes faster than debugging!

---

## 📋 Deployment Summary & Quick Reference

### Your Deployed Components:

**✅ Backend API (ASP.NET Core)**
- URL Pattern: `https://cbba-backend-[name]-[random].southeastasia-01.azurewebsites.net`
- Health Check: `https://[your-backend-url]/api/health`
- Platform: Azure App Service (Windows, .NET 8)
- **Important:** Hosting model must be `outofprocess` in web.config

**✅ Python ML Service (Flask)**
- URL: `http://[YOUR-IP]:5001` (use IP address, not DNS)
- Health Check: `http://[your-ip]:5001/health`
- Platform: Azure Container Instance (Linux)
- **Important:** Flask must bind to `0.0.0.0` (not `127.0.0.1`)

**✅ Database (Azure SQL)**
- Server: `cbba-sql-server-[name].database.windows.net`
- Database: `db_biometrics_mvp`
- **Important:** Remove curly braces from passwords in connection strings

**✅ Frontend (React on Vercel)**
- URL: `https://cisp-behavioural-biometric-[name].vercel.app`
- Build: Automatic on Git push
- Root Directory: `frontend`

---

### Quick Commands Reference:

**Redeploy Backend:**
```powershell
cd E:\CISP_Behavioural_Biometric\backend
dotnet publish -c Release -o ./publish
Compress-Archive -Path ./publish/* -DestinationPath ./publish.zip -Force
az webapp deployment source config-zip --resource-group cbba-production --name cbba-backend-tank108 --src ./publish.zip
```

**Redeploy Python Service:**
```powershell
cd E:\CISP_Behavioural_Biometric\cbba_python_service
docker build -t cbba-python-service:latest .
az acr login --name cbbaregistrytank108
docker tag cbba-python-service:latest cbbaregistrytank108.azurecr.io/cbba-python-service:latest
docker push cbbaregistrytank108.azurecr.io/cbba-python-service:latest
az container delete --resource-group cbba-production --name cbba-python-service --yes
# Then recreate container with az container create command
```

**View Logs:**
```powershell
# Backend logs (live)
az webapp log tail --resource-group cbba-production --name cbba-backend-tank108

# Python service logs
az container logs --resource-group cbba-production --name cbba-python-service

# Download backend logs
az webapp log download --resource-group cbba-production --name cbba-backend-tank108 --log-file logs.zip
```

**Restart Services:**
```powershell
# Backend
az webapp restart --resource-group cbba-production --name cbba-backend-tank108

# Python service (delete and recreate)
az container restart --resource-group cbba-production --name cbba-python-service
```

---

## 🎓 Next Steps After Deployment

### You've Successfully Deployed! Now What?

1. **Test thoroughly:**
   - Have friends/colleagues test the system
   - Try different browsers (Chrome, Firefox, Edge, Safari)
   - Test on mobile devices
   - Verify all features work

2. **Share your project:**
   - Add the URL to your resume
   - Share on LinkedIn
   - Include in your portfolio
   - Demo to potential employers

3. **Improve the system:**
   - Collect user feedback
   - Monitor Application Insights for errors
   - Add new features
   - Improve UI/UX

4. **Scale if needed:**
   - Upgrade to higher App Service tier for better performance
   - Add Azure CDN for faster frontend loading
   - Implement Redis cache for sessions
   - Add load balancer for high traffic

5. **Learn more:**
   - Azure documentation: [docs.microsoft.com/azure](https://docs.microsoft.com/azure)
   - Vercel documentation: [vercel.com/docs](https://vercel.com/docs)
   - Monitor best practices
   - Security hardening

---

## 🆘 Getting Help

### If You're Stuck:

**1. Check the logs first:**
- Backend: Azure Portal → App Service → Log stream
- Python: Azure Portal → Container Instances → Logs
- Frontend: Vercel → Deployments → Build logs

**2. Common resources:**
- Azure Documentation: [docs.microsoft.com/azure](https://docs.microsoft.com/azure)
- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Stack Overflow: Tag questions with `azure`, `vercel`, `asp.net-core`

**3. Azure Support:**
- Free tier: Community support only
- Paid tiers: 24/7 support available
- Azure Portal has built-in chat support

**4. Review this guide:**
- Re-read troubleshooting section
- Check you completed ALL steps
- Verify ALL environment variables are set correctly

---

## 📝 Summary

### What You Accomplished:

✅ Deployed a SQL Server database to Azure  
✅ Deployed an ASP.NET Core backend to Azure App Service  
✅ Containerized and deployed a Python ML service  
✅ Deployed a React frontend to Vercel  
✅ Connected all 4 components to work together  
✅ Configured security (HTTPS, CORS, authentication)  
✅ Set up monitoring and logging  
✅ Created a production-ready biometric authentication system  

### Your System:

- **Frontend URL:** `https://your-app.vercel.app`
- **Backend URL:** `https://cbba-backend-tank108.azurewebsites.net`
- **Python Service:** `http://cbba-python-tank108.azurecontainer.io:5001`
- **Database:** `cbba-sql-server-tank108.database.windows.net`

### Monthly Cost:

- **Year 1 (Azure Free Trial):** FREE
- **After Year 1:** ~$28-33/month
- **Budget Option:** ~$7/month (using free tiers where possible)

---

## 🎉 Congratulations!

You've successfully deployed a complex, multi-component application to the cloud! This is a significant achievement that demonstrates:

- Full-stack development skills
- Cloud platform knowledge (Azure)
- DevOps capabilities
- Security awareness
- Problem-solving ability

**This project is portfolio-worthy and shows real-world production deployment experience!**

---

## 📞 Questions or Feedback?

If you found this guide helpful or have suggestions for improvement:
- Consider starring the project on GitHub
- Share with others who might benefit
- Provide feedback for future improvements

**Good luck with your CBBA system! 🚀**

---

*Last Updated: October 2025*  
*Guide Version: 2.0 (Beginner-Friendly Edition)*
