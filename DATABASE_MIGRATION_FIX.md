# CBBA Database Migration & JSON Fix

## Issues Fixed

### Issue 1: JSON Deserialization Error ❌
```
Error: Could not convert string to integer: tank108. Path 'user_id', line 1, position 233.
```

**Cause**: Python service returns `user_id` as string (`"tank108"`), but C# models expected `int`.

**Fix**: Changed `UserId` type from `int` to `object` in response models:
- `CBBATrainingResult`
- `CBBAUpdateResult`  
- `CBBAStatusResult`

### Issue 2: Missing Database Columns ❌
```
Error: Invalid column name 'EncryptedProfile', 'IsTrained', 'KeystrokeProfile', ...
```

**Cause**: BiometricProfiles table doesn't have CBBA fields.

**Fix**: SQL migration script ready to add columns.

---

## Files Modified

✅ **backend/Services/PythonCBBAService.cs**
- Changed `UserId` from `int` to `object` in 3 models
- Now accepts both string usernames and integer IDs

---

## Migration Steps

### Option 1: PowerShell Script (Recommended)

1. **Open PowerShell in backend directory**:
   ```powershell
   cd E:\CISP_Behavioural_Biometric\backend
   ```

2. **Run migration script**:
   ```powershell
   .\run-cbba-migration.ps1
   ```

3. **Follow prompts**:
   - Script will show connection string
   - Confirm with `Y` to run migration

### Option 2: SQL Server Management Studio

1. **Open SSMS**

2. **Connect to your database server**

3. **Open migration file**:
   ```
   E:\CISP_Behavioural_Biometric\backend\Migrations\AddCBBAFields.sql
   ```

4. **Execute the script** (F5)

### Option 3: Command Line (sqlcmd)

```powershell
cd E:\CISP_Behavioural_Biometric\backend
sqlcmd -S localhost -d db_biometrics_mvp -i Migrations\AddCBBAFields.sql -E
```

**Replace**:
- `localhost` with your SQL Server name
- `db_biometrics_mvp` with your database name

---

## What the Migration Does

Adds these columns to `BiometricProfiles` table:

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `EncryptedProfile` | NVARCHAR(MAX) | YES | NULL | AES-256 encrypted biometric profile BLOB |
| `IsTrained` | BIT | NO | 0 | Whether ML model has been trained |
| `TrainedAt` | DATETIME2 | YES | NULL | When model was last trained |
| `SampleCount` | INT | NO | 0 | Number of samples used for training |

Also creates indexes:
- `IX_BiometricProfiles_UserId` - For faster user lookups
- `IX_BiometricProfiles_IsTrained` - For filtering trained profiles

---

## Verification

After running migration, verify:

```sql
SELECT 
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_DEFAULT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_NAME = 'BiometricProfiles'
    AND COLUMN_NAME IN ('EncryptedProfile', 'IsTrained', 'TrainedAt', 'SampleCount')
ORDER BY ORDINAL_POSITION;
```

**Expected output**:
```
COLUMN_NAME         DATA_TYPE      IS_NULLABLE  COLUMN_DEFAULT
EncryptedProfile    nvarchar       YES          NULL
IsTrained           bit            NO           ((0))
TrainedAt           datetime2      YES          NULL
SampleCount         int            NO           ((0))
```

---

## After Migration

### 1. Restart Backend

```powershell
cd E:\CISP_Behavioural_Biometric\backend
dotnet run
```

### 2. Test CBBA System

1. **Login as `tank108`**
2. **Check logs** - should see:
   ```
   ✅ No "Invalid column name" errors
   ✅ Risk assessments working
   ✅ Profile status queries successful
   ```

### 3. Expected Behavior

**Backend logs should show**:
```
info: Assessing CBBA risk for user tank108
info: Risk assessment complete: 25% (low)
```

**No more errors like**:
- ❌ Invalid column name 'EncryptedProfile'
- ❌ Could not convert string to integer: tank108

---

## Troubleshooting

### Migration Fails: "Object already exists"
**Solution**: Migration is idempotent - safe to re-run. It checks if columns exist first.

### Cannot connect to database
**Solution**: 
1. Check connection string in `appsettings.json`
2. Ensure SQL Server is running
3. Verify Windows Authentication permissions

### Still getting "Invalid column name"
**Solution**:
1. Verify migration ran successfully
2. Check which database it ran against
3. Restart backend to clear Entity Framework cache

### JSON deserialization still failing
**Solution**:
1. Rebuild backend: `dotnet build`
2. Restart backend service
3. Clear browser cache (Ctrl+Shift+R)

---

## Summary

### Before Migration:
- ❌ Database missing CBBA columns
- ❌ JSON deserialization error with string user IDs
- ❌ Backend crashes on profile queries

### After Migration:
- ✅ BiometricProfiles table has CBBA columns
- ✅ JSON models accept both string and int user IDs
- ✅ Risk assessment works properly
- ✅ Profile status queries successful
- ✅ Real-time CBBA monitoring functional

---

**Status**: ✅ Ready to Run Migration  
**Date**: October 18, 2025
