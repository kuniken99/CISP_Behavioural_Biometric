// backend/Controllers/BiometricController.cs

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using db_biometrics_mvp.Backend.Models;
using db_biometrics_mvp.Backend.Services;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Authorization; // Add for authorization
using db_biometrics_mvp.Backend.Data; // For AuditLogging
using Newtonsoft.Json;
using Newtonsoft.Json.Linq; // For JArray handling
using Microsoft.EntityFrameworkCore;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace db_biometrics_mvp.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize] // All authenticated users are subject to CBBA
    public class BiometricController : ControllerBase
    {
        private readonly PythonCBBAService _cbbaService;
        private readonly ILogger<BiometricController> _logger;
        private readonly AppDbContext _context; // For auditing
        private readonly IAutoTrainingService _autoTrainingService;

        // In a real application, these would be stored persistently per user/session
        // For MVP, using static dictionaries to hold data temporarily per active session
        private static Dictionary<string, List<BiometricEvent>> _sessionBiometricData = new Dictionary<string, List<BiometricEvent>>();
        private static Dictionary<string, List<DbActionEvent>> _sessionDbEventData = new Dictionary<string, List<DbActionEvent>>();

        public BiometricController(PythonCBBAService cbbaService, ILogger<BiometricController> logger, AppDbContext context, IAutoTrainingService autoTrainingService)
        {
            _cbbaService = cbbaService;
            _logger = logger;
            _context = context;
            _autoTrainingService = autoTrainingService;
        }

        // Endpoint to receive continuous biometric data from the frontend
        [HttpPost("collect-biometrics")]
        public IActionResult CollectBiometrics([FromBody] List<BiometricEvent> biometricEvents, [FromQuery] string sessionId)
        {
            var username = User.Identity?.Name ?? "Unknown"; // Get username from JWT

            if (string.IsNullOrEmpty(sessionId))
            {
                return BadRequest("Session ID is required.");
            }

            if (!_sessionBiometricData.ContainsKey(sessionId))
            {
                _sessionBiometricData[sessionId] = new List<BiometricEvent>();
                _sessionDbEventData[sessionId] = new List<DbActionEvent>();
                _logger.LogInformation($"New CBBA session started: {sessionId} for user {username}");
            }

            _sessionBiometricData[sessionId].AddRange(biometricEvents);
            _logger.LogDebug($"Session {sessionId} for {username}: Received {biometricEvents.Count} biometric events. Total: {_sessionBiometricData[sessionId].Count}");

            // Simulate a privileged DB action for this session to add context
            // In a real app, this would be actual DB operations logged by other controllers
            var simulatedDbEvent = new DbActionEvent
            {
                Timestamp = DateTimeOffset.Now.ToUnixTimeSeconds(),
                User = username,
                SessionId = sessionId,
                EventType = "SIMULATED_QUERY",
                QuerySizeKb = 10 + new Random().Next(0, 50)
            };

            // Introduce a *simulated* malicious event rarely to test CBBA
            if (new Random().NextDouble() < 0.05) // 5% chance to simulate an anomaly
            {
                simulatedDbEvent.EventType = "BULK_DATA_EXPORT";
                simulatedDbEvent.QuerySizeKb = 2000 + new Random().Next(0, 3000);
                _logger.LogWarning($"Session {sessionId}: Simulating a BULK_DATA_EXPORT anomaly for user {username}!");
            }

            _sessionDbEventData[sessionId].Add(simulatedDbEvent);

            // This old collect-biometrics endpoint is deprecated
            // The new CBBA system uses /api/biometric/assess endpoint
            // For backward compatibility, return OK with simulated score
            _logger.LogInformation($"Session {sessionId} for {username}: Legacy endpoint called. Use /api/biometric/assess instead.");

            // Clear processed data for the window, keep session alive
            _sessionBiometricData[sessionId].Clear(); 
            _sessionDbEventData[sessionId].Clear(); 
            
            return Ok(new { message = "Legacy endpoint. Use /api/biometric/assess for CBBA.", score = 0.0 });
        }

        /// <summary>
        /// Train user's CBBA profile with baseline behavioral data
        /// POST /api/biometric/train
        /// </summary>
        [HttpPost("train")]
        [RequestSizeLimit(524288000)] // 500MB limit for large training datasets
        [RequestFormLimits(MultipartBodyLengthLimit = 524288000)]
        public async Task<IActionResult> TrainProfile([FromBody] CBBATrainingRequest request)
        {
            try
            {
                var username = User.Identity?.Name ?? "Unknown";
                // Use username as user_id for Python service (matches trained model)
                var userIdentifier = username;

                _logger.LogInformation($"Training CBBA profile for user {username}");

                // Call Python service to train profile
                var result = await _cbbaService.TrainUserProfile(userIdentifier, request.TrainingData);

                if (result.Success)
                {
                    // Get actual numeric user ID for database
                    var userId = GetUserIdFromClaims();
                    
                    // Store encrypted profile in database
                    var profile = await _context.BiometricProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
                    
                    if (profile == null)
                    {
                        profile = new BiometricProfile
                        {
                            UserId = userId,
                            EncryptedProfile = result.EncryptedProfile,
                            IsTrained = true,
                            TrainedAt = DateTime.UtcNow,
                            LastUpdated = DateTime.UtcNow,
                            SampleCount = result.SamplesTrained
                        };
                        await _context.BiometricProfiles.AddAsync(profile);
                    }
                    else
                    {
                        profile.EncryptedProfile = result.EncryptedProfile;
                        profile.IsTrained = true;
                        profile.TrainedAt = DateTime.UtcNow;
                        profile.LastUpdated = DateTime.UtcNow;
                        profile.SampleCount = result.SamplesTrained;
                    }

                    await _context.SaveChangesAsync();

                    // Log audit
                    await _context.AuditLogs.AddAsync(new AuditLog
                    {
                        Username = username,
                        Action = "CBBA_PROFILE_TRAINED",
                        Details = $"Profile trained with {result.SamplesTrained} samples",
                        SessionId = HttpContext.Connection?.Id ?? "training-session"
                    });
                    await _context.SaveChangesAsync();

                    return Ok(new { 
                        success = true,
                        message = "Profile trained successfully",
                        samplesTrained = result.SamplesTrained,
                        featureDimension = result.FeatureDimension
                    });
                }
                else
                {
                    return BadRequest(new { success = false, error = result.Error });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error training CBBA profile: {ex.Message}");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        /// <summary>
        /// Assess real-time risk score for current behavioral data
        /// POST /api/biometric/assess
        /// </summary>
        [HttpPost("assess")]
        public async Task<IActionResult> AssessRisk([FromBody] CBBARiskRequest request)
        {
            try
            {
                var username = User.Identity?.Name ?? "Unknown";
                // Use username as user_id for Python service (matches trained model)
                var userIdentifier = username;

                // Convert JsonElement to JArray for Python service
                JArray keystrokeData = new JArray();
                JArray mouseData = new JArray();
                
                if (request.KeystrokeData.HasValue && request.KeystrokeData.Value.ValueKind == JsonValueKind.Array)
                {
                    var jsonString = request.KeystrokeData.Value.GetRawText();
                    keystrokeData = JArray.Parse(jsonString);
                }
                
                if (request.MouseData.HasValue && request.MouseData.Value.ValueKind == JsonValueKind.Array)
                {
                    var jsonString = request.MouseData.Value.GetRawText();
                    mouseData = JArray.Parse(jsonString);
                }

                // Call Python service to assess risk
                var result = await _cbbaService.AssessRisk(userIdentifier, keystrokeData, mouseData);

                if (result.Success)
                {
                    // Store risk state in session to persist across page refreshes
                    HttpContext.Session.SetInt32("RiskScore", (int)result.RiskScore);
                    HttpContext.Session.SetString("RiskLevel", result.RiskLevel);
                    HttpContext.Session.SetString("Action", result.Action);
                    HttpContext.Session.SetString("Username", username);
                    
                    // Set flag if authentication is required (50-79%)
                    if (result.RiskScore >= 50 && result.RiskScore < 80)
                    {
                        HttpContext.Session.SetString("RequiresAuth", "true");
                        HttpContext.Session.SetString("AuthCompleted", "false");
                    }
                    // Set lock flag for high risk (80%+)
                    else if (result.RiskScore >= 80 || result.Action == "lock")
                    {
                        HttpContext.Session.SetString("IsLocked", "true");
                        HttpContext.Session.SetString("LockStartTime", DateTime.UtcNow.ToString("o"));
                        HttpContext.Session.SetString("LockDuration", "15"); // 15 minutes
                    }

                    // Log high-risk assessments
                    if (result.RiskScore >= 70)
                    {
                        _logger.LogWarning($"High risk detected for user {username}: {result.RiskScore}% - Action: {result.Action}");

                        await _context.AuditLogs.AddAsync(new AuditLog
                        {
                            Username = username,
                            Action = "CBBA_HIGH_RISK_DETECTED",
                            Details = $"Risk Score: {result.RiskScore}%, Level: {result.RiskLevel}, Action: {result.Action}",
                            SessionId = HttpContext.Session.Id
                        });
                        await _context.SaveChangesAsync();

                        // Create alert for critical risk
                        if (result.RiskScore >= 95)
                        {
                            await _context.Alerts.AddAsync(new Alert
                            {
                                Type = "Security",
                                Message = $"Critical CBBA risk detected for user {username}. Risk Score: {result.RiskScore}%",
                                Severity = "Critical",
                                Status = "Active"
                            });
                            await _context.SaveChangesAsync();
                        }
                    }

                    return Ok(new
                    {
                        success = true,
                        riskScore = result.RiskScore,
                        riskLevel = result.RiskLevel,
                        status = result.Status,
                        action = result.Action,
                        isTrained = result.IsTrained,
                        details = result.Details
                    });
                }
                else
                {
                    return Ok(new 
                    { 
                        success = false, 
                        error = result.Error,
                        riskScore = 50.0,
                        riskLevel = "unknown",
                        action = "monitor"
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error assessing CBBA risk: {ex.Message}");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        /// <summary>
        /// Get user's CBBA profile status
        /// GET /api/biometric/status
        /// </summary>
        [HttpGet("status")]
        public async Task<IActionResult> GetProfileStatus()
        {
            try
            {
                var username = User.Identity?.Name ?? "Unknown";
                var userId = GetUserIdFromClaims();
                // Use username as user_id for Python service (matches trained model)
                var userIdentifier = username;

                // Get status from Python service
                var result = await _cbbaService.GetUserStatus(userIdentifier);

                // Get profile from database
                var profile = await _context.BiometricProfiles.FirstOrDefaultAsync(p => p.UserId == userId);

                return Ok(new
                {
                    success = true,
                    userId = userId,
                    username = username,
                    isTrained = profile?.IsTrained ?? false,
                    trainedAt = profile?.TrainedAt,
                    lastUpdated = profile?.LastUpdated,
                    sampleCount = profile?.SampleCount ?? 0,
                    pythonServiceStatus = result.Success ? "connected" : "disconnected"
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting CBBA status: {ex.Message}");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        /// <summary>
        /// Update user's profile with new legitimate behavioral data
        /// POST /api/biometric/update-profile
        /// </summary>
        [HttpPost("update-profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] CBBARiskRequest request)
        {
            try
            {
                var username = User.Identity?.Name ?? "Unknown";
                var userId = GetUserIdFromClaims();
                // Use username as user_id for Python service (matches trained model)
                var userIdentifier = username;

                // Convert JsonElement to JArray for Python service
                JArray keystrokeData = new JArray();
                JArray mouseData = new JArray();
                
                if (request.KeystrokeData.HasValue && request.KeystrokeData.Value.ValueKind == JsonValueKind.Array)
                {
                    var jsonString = request.KeystrokeData.Value.GetRawText();
                    keystrokeData = JArray.Parse(jsonString);
                }
                
                if (request.MouseData.HasValue && request.MouseData.Value.ValueKind == JsonValueKind.Array)
                {
                    var jsonString = request.MouseData.Value.GetRawText();
                    mouseData = JArray.Parse(jsonString);
                }

                // Call Python service to update profile
                var result = await _cbbaService.UpdateProfile(userIdentifier, keystrokeData, mouseData);

                if (result.Success)
                {
                    // Update encrypted profile in database
                    var profile = await _context.BiometricProfiles.FirstOrDefaultAsync(p => p.UserId == userId);
                    
                    if (profile != null)
                    {
                        profile.EncryptedProfile = result.EncryptedProfile;
                        profile.LastUpdated = DateTime.UtcNow;
                        await _context.SaveChangesAsync();
                    }

                    return Ok(new { success = true, message = "Profile updated successfully" });
                }
                else
                {
                    return BadRequest(new { success = false, error = result.Error });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error updating CBBA profile: {ex.Message}");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        /// <summary>
        /// Check if Python CBBA service is healthy
        /// GET /api/biometric/health
        /// </summary>
        [HttpGet("health")]
        [AllowAnonymous]
        public async Task<IActionResult> CheckHealth()
        {
            var isHealthy = await _cbbaService.IsHealthy();
            return Ok(new { healthy = isHealthy, service = "CBBA Python Service" });
        }

        /// <summary>
        /// Get current session risk state (for page refresh persistence)
        /// GET /api/biometric/session-risk-state
        /// </summary>
        [HttpGet("session-risk-state")]
        public IActionResult GetSessionRiskState()
        {
            try
            {
                var riskScore = HttpContext.Session.GetInt32("RiskScore");
                var riskLevel = HttpContext.Session.GetString("RiskLevel");
                var action = HttpContext.Session.GetString("Action");
                var requiresAuth = HttpContext.Session.GetString("RequiresAuth");
                var authCompleted = HttpContext.Session.GetString("AuthCompleted");
                var isLocked = HttpContext.Session.GetString("IsLocked");
                var lockStartTime = HttpContext.Session.GetString("LockStartTime");
                var lockDuration = HttpContext.Session.GetString("LockDuration");

                if (riskScore.HasValue)
                {
                    return Ok(new
                    {
                        success = true,
                        riskScore = riskScore.Value,
                        riskLevel = riskLevel ?? "unknown",
                        action = action ?? "monitor",
                        requiresAuth = requiresAuth == "true",
                        authCompleted = authCompleted == "true",
                        isLocked = isLocked == "true",
                        lockStartTime = lockStartTime,
                        lockDuration = int.TryParse(lockDuration, out int duration) ? duration : 15
                    });
                }
                else
                {
                    return Ok(new
                    {
                        success = false,
                        message = "No risk state found in session"
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting session risk state: {ex.Message}");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        /// <summary>
        /// Clear authentication requirement after successful verification
        /// POST /api/biometric/clear-auth-requirement
        /// </summary>
        [HttpPost("clear-auth-requirement")]
        public IActionResult ClearAuthRequirement()
        {
            try
            {
                HttpContext.Session.SetString("RequiresAuth", "false");
                HttpContext.Session.SetString("AuthCompleted", "true");
                _logger.LogInformation($"Auth requirement cleared for session {HttpContext.Session.Id}");
                
                return Ok(new { success = true, message = "Auth requirement cleared" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error clearing auth requirement: {ex.Message}");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        /// <summary>
        /// Clear session lock after timeout expires
        /// POST /api/biometric/clear-lock
        /// </summary>
        [HttpPost("clear-lock")]
        public IActionResult ClearLock()
        {
            try
            {
                HttpContext.Session.SetString("IsLocked", "false");
                HttpContext.Session.Remove("LockStartTime");
                HttpContext.Session.Remove("LockDuration");
                HttpContext.Session.Remove("RiskScore");
                HttpContext.Session.Remove("RiskLevel");
                HttpContext.Session.Remove("Action");
                _logger.LogInformation($"Session lock cleared for session {HttpContext.Session.Id}");
                
                return Ok(new { success = true, message = "Lock cleared" });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error clearing lock: {ex.Message}");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        /// <summary>
        /// Start automatic training after registration
        /// POST /api/biometric/start-auto-training
        /// </summary>
        [HttpPost("start-auto-training")]
        public async Task<IActionResult> StartAutoTraining([FromBody] AutoTrainingRequest request)
        {
            try
            {
                var username = User.Identity?.Name ?? "Unknown";
                var userId = GetUserIdFromClaims().ToString();
                
                int numSamples = request?.NumSamples ?? 1000;
                
                _logger.LogInformation($"Starting auto-training for {username} with {numSamples} samples");
                
                var success = await _autoTrainingService.StartAutoTraining(username, userId, numSamples);
                
                return Ok(new { 
                    success = success,
                    message = success ? "Auto-training started" : "Failed to start auto-training",
                    numSamples = numSamples
                });
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error starting auto-training: {ex.Message}");
                return StatusCode(500, new { success = false, error = ex.Message });
            }
        }

        /// <summary>
        /// Get training progress
        /// GET /api/biometric/training-progress
        /// </summary>
        [HttpGet("training-progress")]
        public IActionResult GetTrainingProgress()
        {
            try
            {
                var username = User.Identity?.Name ?? "Unknown";
                var progress = _autoTrainingService.GetTrainingProgress(username);
                
                return Ok(progress);
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error getting training progress: {ex.Message}");
                return StatusCode(500, new { 
                    isTraining = false,
                    error = ex.Message 
                });
            }
        }

        private int GetUserIdFromClaims()
        {
            var userIdClaim = User.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.NameIdentifier);
            if (userIdClaim != null && int.TryParse(userIdClaim.Value, out int userId))
            {
                return userId;
            }
            return 0;
        }
    }

    // Request Models
    public class AutoTrainingRequest
    {
        public int NumSamples { get; set; } = 1000;
    }
    public class CBBATrainingRequest
    {
        public List<BehavioralSession> TrainingData { get; set; } = new List<BehavioralSession>();
    }

    public class CBBARiskRequest
    {
        [JsonPropertyName("keystrokeData")]
        public JsonElement? KeystrokeData { get; set; }
        
        [JsonPropertyName("mouseData")]
        public JsonElement? MouseData { get; set; }
    }
}