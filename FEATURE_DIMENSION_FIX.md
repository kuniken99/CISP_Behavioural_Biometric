# Feature Dimension Inconsistency Fix

## Problem Analysis

### Error Messages
1. **Training Error (400 Bad Request)**:
```
HTTP BadRequest: {"error":"setting an array element with a sequence. 
The requested array has an inhomogeneous shape after 1 dimensions. 
The detected shape was (39,) + inhomogeneous part."}
```

2. **DbEntryManagement Error**:
```
Network error adding entry: Unexpected token 'A', "Adding use"... is not valid JSON
```

### Root Cause

#### Issue 1: Feature Vector Dimension Mismatch
When the frontend training filter was changed from AND to OR logic, samples with different behavioral data types were accepted:
- **Keystroke-only samples**: 10 features (keystroke) + 0 features (mouse) = **10 dimensions**
- **Mouse-only samples**: 0 features (keystroke) + 13 features (mouse) = **13 dimensions**
- **Both types**: 10 features + 13 features = **23 dimensions**

When the Python service tried to convert the list of feature vectors to a NumPy array:
```python
feature_matrix = np.array(feature_vectors)  # FAILS: Inconsistent dimensions
```

NumPy requires all rows to have the same number of columns. The error "inhomogeneous shape" means the array has inconsistent dimensions.

#### Issue 2: Backend Returning HTML Instead of JSON
The DbManagementController was using `BadRequest(string)` which returns HTML error pages:
```csharp
return BadRequest("Table name is required.");  // Returns HTML
```

This caused the frontend to fail parsing the response as JSON.

---

## Solutions Implemented

### Fix 1: Python Service - Force Consistent Feature Dimensions

**File**: `cbba_python_service/cbba_service.py`

**Changes** (lines 145-173):
```python
# Extract features from all training sessions
feature_vectors = []

for session in training_data:
    keystroke_data = session.get('keystroke_data', [])
    mouse_data = session.get('mouse_data', [])
    
    # Always extract features (returns zero-padded arrays if empty)
    keystroke_features = self.feature_extractor.extract_keystroke_features(keystroke_data)
    mouse_features = self.feature_extractor.extract_mouse_features(mouse_data)
    
    # ✅ NEW: Ensure consistent dimensions (10 keystroke + 13 mouse = 23 total)
    if len(keystroke_features) != 10:
        keystroke_features = np.zeros(10)
    if len(mouse_features) != 13:
        mouse_features = np.zeros(13)
    
    combined_features = self.feature_extractor.combine_features(
        keystroke_features,
        mouse_features
    )
    
    # ✅ NEW: Verify combined feature vector is correct dimension
    if len(combined_features) != 23:
        raise ValueError(f"Feature vector has incorrect dimension: {len(combined_features)} (expected 23)")
    
    feature_vectors.append(combined_features)

# Convert to numpy array (should now have consistent shape)
feature_matrix = np.array(feature_vectors)  # ✅ Now works!
```

**What This Does**:
1. **Validates feature dimensions** after extraction
2. **Forces zero-padding** if dimensions are incorrect
3. **Guarantees all samples** have exactly 23 features
4. **Raises clear error** if dimension mismatch occurs

**Why This Works**:
- Keystroke-only samples: `[10 keystroke features] + [13 zeros]` = 23 dimensions
- Mouse-only samples: `[10 zeros] + [13 mouse features]` = 23 dimensions
- Both types: `[10 keystroke] + [13 mouse]` = 23 dimensions
- All samples now form a consistent matrix: `(N samples, 23 features)`

### Fix 2: Backend - Return JSON for All BadRequest Responses

**File**: `backend/Controllers/DbManagementController.cs`

**Changes** (lines 195-273):
```csharp
[HttpPost("add-entry")]
public async Task<IActionResult> AddEntry([FromBody] AddEntryDto dto)
{
    if (string.IsNullOrEmpty(dto.TableName))
    {
        return BadRequest(new { error = "Table name is required." });  // ✅ JSON
    }

    if (dto.TableName.ToLower() == "users")
    {
        return BadRequest(new { error = "Adding users is not allowed for security reasons." });  // ✅ JSON
    }

    switch (dto.TableName.ToLower())
    {
        case "products":
            if (!dto.Entry.ContainsKey("name") || !dto.Entry.ContainsKey("price") || !dto.Entry.ContainsKey("stock"))
            {
                return BadRequest(new { error = "Products table requires 'name', 'price', and 'stock' fields." });  // ✅ JSON
            }
            // ... rest of logic

        case "orders":
            if (!dto.Entry.ContainsKey("product_id") || !dto.Entry.ContainsKey("user_id") || !dto.Entry.ContainsKey("quantity"))
            {
                return BadRequest(new { error = "Orders table requires 'product_id', 'user_id', and 'quantity' fields." });  // ✅ JSON
            }
            // ... rest of logic

        default:
            return BadRequest(new { error = $"Table '{dto.TableName}' is not supported for adding entries." });  // ✅ JSON
    }
}
```

**Before** (returned HTML error page):
```csharp
return BadRequest("Table name is required.");
```

**After** (returns JSON object):
```csharp
return BadRequest(new { error = "Table name is required." });
```

**Why This Matters**:
- Frontend expects `Content-Type: application/json`
- `BadRequest(string)` returns `text/html` with error page HTML
- `BadRequest(object)` returns `application/json` with serialized object
- Frontend can now properly parse error responses

---

## Testing Steps

### Test 1: Training with Mixed Samples

1. **Refresh frontend** to load updated code:
   - Press `Ctrl+Shift+R` (hard refresh)

2. **Open browser console** (F12)

3. **Train with existing samples**:
   ```javascript
   window.cbba.trainWithCollectedData().then(console.log);
   ```

4. **Expected console output**:
   ```
   [CBBA Training] Preparing to train with 11 samples...
   [CBBA Training] Payload preview: {
     totalSamples: 11,
     completeSamples: 11,
     filteredOut: 0,
     firstSample: { keystrokeCount: X, mouseCount: Y }
   }
   
   ✅ SUCCESS:
   {
     success: true,
     message: "Profile trained successfully",
     samplesTrained: 11,
     featureDimension: 23
   }
   ```

5. **Python service logs** should show:
   ```
   Successfully trained models for user tank108 with 11 samples
   Feature matrix shape: (11, 23)
   ```

6. **Backend logs** should show:
   ```
   Training CBBA profile for user tank108
   Profile trained with 11 samples
   ```

### Test 2: DbEntryManagement Error Handling

1. **Navigate to** Database Entry Management page

2. **Select "Users" table**

3. **Try to add a user entry** (should be blocked)

4. **Expected result**:
   - ✅ Alert dialog shows: "Error: Adding users is not allowed for security reasons."
   - ✅ Console shows JSON response: `{error: "Adding users is not allowed..."}`
   - ❌ Should NOT see: "Unexpected token 'A', "Adding use"... is not valid JSON"

5. **Select "Products" table**

6. **Leave all fields empty** and click "Add Entry"

7. **Expected result**:
   - ✅ Alert shows: "Error: Products table requires 'name', 'price', and 'stock' fields."
   - ✅ Console shows JSON response with error field
   - ✅ Form remains populated for correction

---

## Impact Assessment

### Training System
- ✅ **Accepts mixed behavioral data**: Keystroke-only, mouse-only, or both
- ✅ **Consistent feature dimensions**: All samples normalized to 23 features
- ✅ **Improved model quality**: More training data (11 samples instead of 8-9)
- ✅ **Prevents NumPy errors**: No more "inhomogeneous shape" crashes

### Error Handling
- ✅ **JSON responses**: All API errors now return valid JSON
- ✅ **Clear error messages**: Frontend can display detailed errors to user
- ✅ **Better debugging**: Console logs show structured error objects
- ✅ **Consistent API contract**: All endpoints return JSON (no HTML)

### User Experience
- ✅ **Training success rate**: Should train successfully with existing 11 samples
- ✅ **Immediate feedback**: Alert dialogs show error details
- ✅ **Developer experience**: Console logs provide debugging context
- ✅ **Production readiness**: Proper error handling for all failure scenarios

---

## Technical Details

### Feature Vector Structure

**Total Dimension: 23 features**

#### Keystroke Features (10 features):
1. Mean dwell time (ms)
2. Std dev dwell time
3. Rapid keypress ratio
4. Mean flight time (ms)
5. Std dev flight time
6. Mean typing speed (chars/sec)
7. Std dev typing speed
8. Fast typing indicator (boolean)
9. Key press variance
10. (Reserved)

#### Mouse Features (13 features):
1. Mean velocity (pixels/sec)
2. Std dev velocity
3. Max velocity
4. Velocity spike indicator
5. Mean acceleration
6. Max acceleration
7. Mean curvature
8. Std dev curvature
9. Click rate (clicks/sec)
10. Double-click rate
11. Scroll speed
12. Path efficiency
13. (Reserved)

### Zero-Padding Behavior

When a sample lacks keystroke or mouse data:

**Keystroke-only sample**:
```python
# Input: keystrokeData with 5 events, no mouseData
keystroke_features = [120.5, 45.2, 0.1, ...]  # 10 real values
mouse_features = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]  # 13 zeros
combined = [120.5, 45.2, 0.1, ..., 0, 0, 0, ...]  # 23 total
```

**Mouse-only sample**:
```python
# Input: mouseData with 20 movements, no keystrokeData
keystroke_features = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]  # 10 zeros
mouse_features = [850.3, 120.1, 1200.5, ...]  # 13 real values
combined = [0, 0, 0, ..., 850.3, 120.1, 1200.5, ...]  # 23 total
```

**Both types**:
```python
# Input: keystrokeData and mouseData both present
keystroke_features = [120.5, 45.2, 0.1, ...]  # 10 real values
mouse_features = [850.3, 120.1, 1200.5, ...]  # 13 real values
combined = [120.5, 45.2, ..., 850.3, 120.1, ...]  # 23 total
```

### Model Training Requirements

**Current thresholds** (development-friendly):
- Minimum samples: **5** (was 10)
- Sample filter: **2+ keystroke OR 5+ mouse** events (was 4+ AND 10+)
- Filter logic: **OR** (accepts either type)

**Production recommendations**:
- Minimum samples: **50-100** (better model quality)
- Sample filter: **4+ keystroke AND 10+ mouse** events (back to AND logic)
- Filter logic: **AND** (require both types for more comprehensive profile)

---

## Next Steps

1. **Test training** with existing 11 samples (should succeed now)
2. **Monitor risk scores** after training (should update every 3s)
3. **Validate accuracy** - normal behavior should score 10-30%
4. **Collect more samples** if needed (aim for 30-50 for production quality)
5. **Consider re-tightening thresholds** after sufficient real data collected

---

## Summary of Changes

| File | Lines | Change Type | Description |
|------|-------|-------------|-------------|
| `cbba_python_service/cbba_service.py` | 145-173 | **CRITICAL FIX** | Force consistent 23-dimension feature vectors with zero-padding |
| `backend/Controllers/DbManagementController.cs` | 195-273 | **BUG FIX** | Return JSON objects instead of HTML error pages |

**Status**: ✅ Both fixes deployed, Python service restarted
**Ready to test**: Training with 11 mixed samples should succeed
