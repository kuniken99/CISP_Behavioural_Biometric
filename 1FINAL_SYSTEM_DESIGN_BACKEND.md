# Backend System Design Documentation

## 🏗️ Architecture Overview

The Backend is an **ASP.NET Core 8.0** web API that serves as the central hub for the CISP Behavioural Biometric system. It follows a **layered architecture** pattern with clear separation of concerns.

---

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                         │
│              Port 3000 - User Interface                     │
└─────────────────┬───────────────────────────────────────────┘
                  │ HTTP/HTTPS (JWT Auth)
                  │
┌─────────────────▼───────────────────────────────────────────┐
│              Backend API (ASP.NET Core)                     │
│                   Port 5000                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Controllers Layer                       │  │
│  │  • AuthController      • BiometricController        │  │
│  │  • UserManagement      • TwoFactorController        │  │
│  │  • AuditController     • AlertsController           │  │
│  └──────────────┬───────────────────────────────────────┘  │
│                 │                                            │
│  ┌──────────────▼───────────────────────────────────────┐  │
│  │              Services Layer                          │  │
│  │  • SecurityService       • EmailService             │  │
│  │  • TwoFactorAuthService  • RecaptchaService         │  │
│  │  • PythonCBBAService     • SessionManagementService │  │
│  └──────────────┬───────────────────────────────────────┘  │
│                 │                                            │
│  ┌──────────────▼───────────────────────────────────────┐  │
│  │              Data Access Layer                       │  │
│  │         Entity Framework Core + DbContext            │  │
│  └──────────────┬───────────────────────────────────────┘  │
└─────────────────┼────────────────────────────────────────────┘
                  │                    │
                  │                    │ HTTP
         ┌────────▼──────┐    ┌───────▼─────────┐
         │  SQL Server   │    │  Python CBBA    │
         │  Database     │    │  Service        │
         │  Port 1433    │    │  Port 5001      │
         └───────────────┘    └─────────────────┘
```

---

## 🎯 Core Components

### 1. **Entry Point (Program.cs)**

**Purpose:** Application bootstrapping and configuration

**Key Configurations:**
- Kestrel server setup with 500MB request limit
- Host builder configuration
- Startup class registration

```csharp
webBuilder.UseKestrel(options =>
{
    options.Limits.MaxRequestBodySize = 524288000; // 500MB
});
```

**Why 500MB?** Supports training with up to 10,000 biometric samples

---

### 2. **Startup Configuration (Startup.cs)**

**Purpose:** Service registration and middleware pipeline configuration

**Service Registration:**

| Service | Purpose | Lifetime |
|---------|---------|----------|
| DbContext | Entity Framework database access | Scoped |
| JWT Authentication | Token-based security | Singleton |
| HttpClient | External API calls | Transient |
| CORS | Cross-origin requests | Singleton |
| Session | User session management | Singleton |
| Custom Services | Business logic | Scoped/Singleton |

**Middleware Pipeline Order:**
1. CORS (Cross-Origin Resource Sharing)
2. HTTPS Redirection
3. Routing
4. Session Tracking
5. Authentication
6. Authorization
7. Endpoints

---

## 📁 Layer Architecture

### **Layer 1: Controllers (API Endpoints)**

**Location:** `backend/Controllers/`

**Responsibilities:**
- HTTP request/response handling
- Input validation
- Route mapping
- Authorization checks
- Calling service layer

#### Controller Inventory

| Controller | Endpoints | Purpose |
|------------|-----------|---------|
| **AuthController** | `/api/Auth/*` | User authentication, login, registration, password reset |
| **BiometricController** | `/api/Biometric/*` | CBBA training, risk assessment, profile management |
| **UserManagementController** | `/api/UserManagement/*` | User CRUD operations, role management |
| **TwoFactorController** | `/api/TwoFactor/*` | 2FA setup, verification, QR code generation |
| **AuditController** | `/api/Audit/*` | Audit logging, security event tracking |
| **AlertsController** | `/api/Alerts/*` | Security alerts, notifications |
| **DashboardController** | `/api/Dashboard/*` | Dashboard statistics, analytics |
| **DbManagementController** | `/api/DbManagement/*` | Database administration |
| **RoleManagementController** | `/api/RoleManagement/*` | Role-based access control |
| **ConfigController** | `/api/Config/*` | System configuration |
| **ContentController** | `/api/Content/*` | CMS content management |

---

### **Layer 2: Services (Business Logic)**

**Location:** `backend/Services/`

**Responsibilities:**
- Business rule implementation
- Data transformation
- External service integration
- Complex operations orchestration

#### Service Inventory

| Service | Purpose | Key Methods |
|---------|---------|-------------|
| **SecurityService** | Password hashing, validation, JWT generation | `HashPassword()`, `VerifyPassword()`, `GenerateJWT()` |
| **TwoFactorAuthService** | TOTP generation/validation, QR codes | `GenerateSecret()`, `ValidateCode()`, `GenerateQRCode()` |
| **EmailService** | Email notifications (verification, password reset) | `SendVerificationEmail()`, `SendPasswordResetEmail()` |
| **RecaptchaService** | Google reCAPTCHA validation | `ValidateCaptcha()` |
| **SessionManagementService** | User session tracking, timeout management | `TrackSession()`, `CheckTimeout()` |
| **PythonCBBAService** | HTTP client for CBBA Python service | `AssessRisk()`, `TrainUserProfile()`, `UpdateProfile()` |
| **BiometricEncryptionService** | Biometric data encryption/decryption | `EncryptProfile()`, `DecryptProfile()` |

---

### **Layer 3: Data Access (Entity Framework Core)**

**Location:** `backend/Data/AppDbContext.cs`

**Purpose:** Database abstraction and ORM mapping

**Key Features:**
- Entity relationship management
- Migration support
- LINQ query support
- Change tracking
- Connection pooling

**Database Provider:** SQL Server

---

### **Layer 4: Models (Data Structures)**

**Location:** `backend/Models/`

**Categories:**

#### User & Authentication Models
- **User.cs** - User accounts, credentials, roles
- **EmailVerificationToken.cs** - Email verification tokens
- **PasswordResetToken.cs** - Password reset tokens
- **TwoFactorAuth.cs** - 2FA settings per user

#### Biometric & Security Models
- **BiometricProfiles.cs** - Encrypted ML models, training status
- **BehavioralData.cs** - Raw behavioral data
- **KeyStroke.cs** - Keystroke timing events
- **MouseMovement.cs** - Mouse movement events
- **RiskScore.cs** - Historical risk scores

#### Audit & Logging Models
- **AuditLog.cs** - System audit trail
- **SecurityLogs.cs** - Security events
- **CaptchaVerification.cs** - reCAPTCHA logs

#### Administration Models
- **DbConfiguration.cs** - System configuration
- **UniqueCode.cs** - Admin registration codes
- **PrivilegedAdministrator.cs** - Admin user records
- **DTable.cs** - Dynamic table management
- **DBAConsole.cs** - Database console operations

---

## 🔐 Security Architecture

### **Authentication Flow**

```
┌──────────┐     1. Login Request      ┌─────────────┐
│  Client  │ ────────────────────────► │   Backend   │
└──────────┘                            └─────────────┘
                                               │
                                        2. Verify Credentials
                                        3. Check 2FA (if enabled)
                                               │
     ┌─────────────────────────────────────────┘
     │
     ▼
┌─────────────────────┐
│  Generate JWT       │
│  - User ID          │
│  - Username         │
│  - Role             │
│  - Expiration       │
└──────────┬──────────┘
           │
           ▼
     Return JWT + User Info
           │
     ┌─────▼──────┐
     │   Client   │ ──► Store JWT in localStorage
     │  (React)   │ ──► Include in Authorization header
     └────────────┘      for subsequent requests
```

### **Authorization Middleware**

**JWT Bearer Token Validation:**
```csharp
[Authorize] // Requires valid JWT
[Authorize(Roles = "admin")] // Requires admin role
[AllowAnonymous] // Public endpoint
```

**Key Security Features:**
- Token expiration (configurable)
- Role-based access control (RBAC)
- Session tracking and timeout
- Password hashing (BCrypt/PBKDF2)
- SQL injection prevention (parameterized queries)
- XSS protection (input sanitization)
- CSRF protection (session tokens)

---








## 🔄 CBBA Integration Architecture

### **Backend ↔ Python Service Communication**

```
┌─────────────────────────────────────────────────────────────┐
│                    Backend (C#)                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │         BiometricController                          │  │
│  │  • POST /api/Biometric/train                        │  │
│  │  • POST /api/Biometric/assess                       │  │
│  │  • POST /api/Biometric/update-profile               │  │
│  │  • GET  /api/Biometric/status                       │  │
│  └───────────────────┬──────────────────────────────────┘  │
│                      │                                      │
│  ┌───────────────────▼──────────────────────────────────┐  │
│  │         PythonCBBAService                           │  │
│  │  • HttpClient for HTTP requests                     │  │
│  │  • JSON serialization (System.Text.Json)            │  │
│  │  • JsonElement → JArray conversion                  │  │
│  │  • Error handling & retry logic                     │  │
│  └───────────────────┬──────────────────────────────────┘  │
└──────────────────────┼──────────────────────────────────────┘
                       │ HTTP POST
                       │ Content-Type: application/json
                       │
┌──────────────────────▼──────────────────────────────────────┐
│              Python CBBA Service (Flask)                    │
│                   Port 5001                                 │
│  • POST /api/cbba/train                                    │
│  • POST /api/cbba/assess                                   │
│  • POST /api/cbba/update                                   │
│  • GET  /api/cbba/status/{user_id}                         │
└─────────────────────────────────────────────────────────────┘
```

### **Data Flow for Risk Assessment**

```
1. Frontend collects biometric data (mouse, keyboard)
      ↓
2. Frontend → Backend: POST /api/Biometric/assess
   Body: { keystrokeData: [...], mouseData: [...] }
      ↓
3. Backend → Python: POST /api/cbba/assess
   Body: { user_id: "tank108", keystroke_data: [...], mouse_data: [...] }
      ↓
4. Python processes:
   - Extract 18 features
   - Run Isolation Forest
   - Run One-Class SVM
   - Calculate combined risk
   - Determine action (monitor/challenge/lock)
      ↓
5. Python → Backend: Response
   { success: true, risk_score: 75.2, action: "challenge", ... }
      ↓
6. Backend stores risk in session:
   - RiskScore, RiskLevel, Action
   - IsLocked flag (if ≥80%)
   - RequiresAuth flag (if 50-79%)
      ↓
7. Backend → Frontend: Response
   { riskScore: 75.2, action: "challenge", ... }
      ↓
8. Frontend displays:
   - Step-up auth modal (50-79%)
   - Session lock modal (80-100%)
```

---

## 📊 Database Schema Design

### **Key Tables**

```sql
Users
├── Id (PK)
├── Username (Unique)
├── Email (Unique)
├── PasswordHash
├── Role (admin/user)
├── IsEmailVerified
├── IsTwoFactorEnabled
├── IsLocked
├── CreatedAt
└── LastLoginAt

BiometricProfiles
├── Id (PK)
├── UserId (FK → Users)
├── EncryptedProfile (varbinary)
├── IsTrained
├── TrainedAt
├── SampleCount
├── LastUpdated
└── ProfileAccuracy

AuditLogs
├── Id (PK)
├── Username
├── Action
├── Details
├── SessionId
├── Timestamp
└── IpAddress

TwoFactorAuth
├── Id (PK)
├── UserId (FK → Users)
├── Secret
├── IsEnabled
├── BackupCodes
└── CreatedAt

RiskScores (Historical)
├── Id (PK)
├── UserId (FK → Users)
├── Score
├── RiskLevel
├── Action
├── Timestamp
└── Details (JSON)
```

---

## 🔧 Configuration Management

### **appsettings.json Structure**

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "SQL Server connection string"
  },
  "JwtSettings": {
    "SecretKey": "JWT signing key",
    "Issuer": "DbaConsole",
    "Audience": "DbaConsoleUsers",
    "ExpirationMinutes": 60
  },
  "EmailSettings": {
    "SmtpServer": "smtp.gmail.com",
    "SmtpPort": 587,
    "SenderEmail": "noreply@example.com"
  },
  "RecaptchaSettings": {
    "SecretKey": "Google reCAPTCHA secret"
  },
  "CBBASettings": {
    "PythonServiceUrl": "http://localhost:5001",
    "Timeout": 30000
  }
}
```

---

## 🚀 Scalability & Performance

### **Optimizations**

1. **Connection Pooling**
   - Entity Framework manages SQL connection pool
   - Reduces connection overhead

2. **Async/Await Pattern**
   - All I/O operations are asynchronous
   - Improves concurrency and throughput

3. **Request Size Limits**
   - 500MB max request body
   - Supports large training datasets

4. **JSON Serialization**
   - System.Text.Json for performance
   - Newtonsoft.Json for compatibility

5. **Session Management**
   - In-memory session store
   - Configurable timeout (15-30 minutes)

6. **Caching Strategy**
   - Session-based caching for user data
   - Risk score caching (5-second intervals)

---

## 📡 API Design Patterns

### **RESTful Conventions**

```
GET    /api/Resource       - List all
GET    /api/Resource/{id}  - Get by ID
POST   /api/Resource       - Create new
PUT    /api/Resource/{id}  - Update existing
DELETE /api/Resource/{id}  - Delete
```

### **Response Format (Standardized)**

```json
// Success Response
{
  "success": true,
  "data": { ... },
  "message": "Operation successful"
}

// Error Response
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

### **HTTP Status Codes**

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET/PUT/DELETE |
| 201 | Created | Successful POST |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Missing/invalid JWT |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 500 | Server Error | Unhandled exception |

---

## 🔍 Monitoring & Logging

### **Audit Trail**

Every critical operation is logged:
- User login/logout
- Password changes
- Role changes
- CBBA profile training
- High-risk detections
- Session locks
- 2FA setup/changes

### **Log Levels**

```csharp
_logger.LogInformation("User logged in successfully");
_logger.LogWarning("High risk detected: 85%");
_logger.LogError("Failed to connect to CBBA service");
```

---

## 🛡️ Error Handling Strategy

### **Global Exception Handling**

```csharp
try
{
    // Business logic
}
catch (DbUpdateException ex)
{
    // Database errors
    return StatusCode(500, "Database error");
}
catch (HttpRequestException ex)
{
    // External service errors
    return StatusCode(503, "CBBA service unavailable");
}
catch (Exception ex)
{
    // General errors
    _logger.LogError(ex, "Unexpected error");
    return StatusCode(500, "Internal server error");
}
```

---

## 🔄 Deployment Architecture

```
Production Environment:

┌─────────────────────────────────────┐
│      Load Balancer / Reverse Proxy │
│            (IIS / Nginx)            │
└───────────────┬─────────────────────┘
                │
        ┌───────┴────────┐
        │                │
┌───────▼──────┐  ┌──────▼───────┐
│  Backend     │  │  Backend     │
│  Instance 1  │  │  Instance 2  │
│  Port 5000   │  │  Port 5001   │
└───────┬──────┘  └──────┬───────┘
        │                │
        └───────┬────────┘
                │
┌───────────────▼─────────────────┐
│      SQL Server (Clustered)     │
│        High Availability        │
└─────────────────────────────────┘
```

---

## 📈 Performance Metrics

**Target Performance:**
- API Response Time: < 200ms (p95)
- Database Query Time: < 50ms (p95)
- CBBA Assessment: < 1000ms
- Concurrent Users: 1000+
- Requests/Second: 500+

---

## 🔐 Security Best Practices

1. ✅ **Never store plaintext passwords** - Always hash with salt
2. ✅ **Use parameterized queries** - Prevent SQL injection
3. ✅ **Validate all input** - Sanitize user data
4. ✅ **Use HTTPS in production** - Encrypt data in transit
5. ✅ **Implement rate limiting** - Prevent brute force attacks
6. ✅ **Log security events** - Maintain audit trail
7. ✅ **Use secure session management** - HttpOnly, Secure cookies
8. ✅ **Implement CORS properly** - Restrict allowed origins
9. ✅ **Keep dependencies updated** - Patch security vulnerabilities
10. ✅ **Use environment variables** - Never commit secrets to Git

---

## 📚 Technology Stack Summary

| Component | Technology | Version |
|-----------|-----------|---------|
| **Framework** | ASP.NET Core | 8.0 |
| **Language** | C# | 11.0 |
| **ORM** | Entity Framework Core | 9.0 |
| **Database** | SQL Server | 2019+ |
| **Authentication** | JWT Bearer | - |
| **Serialization** | System.Text.Json + Newtonsoft | - |
| **Logging** | ILogger (built-in) | - |
| **Testing** | xUnit (optional) | - |

---

## 🎯 Key Design Decisions

1. **Layered Architecture** - Clear separation of concerns
2. **Dependency Injection** - Loose coupling, testability
3. **Async/Await** - Non-blocking I/O operations
4. **RESTful API** - Standard HTTP conventions
5. **JWT Authentication** - Stateless, scalable
6. **Entity Framework** - Type-safe, LINQ support
7. **External CBBA Service** - Microservice architecture
8. **Session-based Risk Storage** - Persist across page refreshes

---

## 📝 Conclusion

The Backend system is a robust, secure, and scalable API built with modern ASP.NET Core practices. It serves as the central orchestration layer, managing authentication, authorization, data persistence, and integration with external services like the CBBA Python ML service.

**Key Strengths:**
- ✅ Layered architecture for maintainability
- ✅ Comprehensive security (JWT, 2FA, encryption)
- ✅ Scalable design (async, connection pooling)
- ✅ Extensive audit logging
- ✅ RESTful API design
- ✅ Seamless CBBA integration

**Total Lines of Code:** ~15,000+ (estimated)  
**Total Endpoints:** 50+ REST APIs  
**Database Tables:** 18 entities
