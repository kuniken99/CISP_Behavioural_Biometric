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

        // In a real application, these would be stored persistently per user/session
        // For MVP, using static dictionaries to hold data temporarily per active session
        private static Dictionary<string, List<BiometricEvent>> _sessionBiometricData = new Dictionary<string, List<BiometricEvent>>();
        private static Dictionary<string, List<DbActionEvent>> _sessionDbEventData = new Dictionary<string, List<DbActionEvent>>();

        public BiometricController(PythonCBBAService cbbaService, ILogger<BiometricController> logger, AppDbContext context)
        {
            _cbbaService = cbbaService;
            _logger = logger;
            _context = context;
        }

        // Endpoint to receive continuous biometric data from the frontend
        [HttpPost("collect-biometrics")]
        public async Task<IActionResult> CollectBiometrics([FromBody] List<BiometricEvent> biometricEvents, [FromQuery] string sessionId)
        {
            var username = User.Identity?.Name ?? "Unknown"; // Get username from JWT
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "N/A";

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

            var payload = new ContinuousBiometricPayload
            {
                BiometricEvents = _sessionBiometricData[sessionId],
                DbEvents = _sessionDbEventData[sessionId]
            };

            var predictionResult = await _cbbaService.GetAnomalyPrediction(payload);

            if (predictionResult.IsAnomaly)
            {
                _logger.LogCritical($"!!! ANOMALY DETECTED for Session {sessionId} (User: {username}) !!! Score: {predictionResult.AnomalyScore}. Features: {string.Join(", ", predictionResult.Features.Select(f => $"{f.Key}={f.Value:F2}"))}");

                // Log the anomaly to AuditLogs and Alerts
                await _context.AuditLogs.AddAsync(new AuditLog {
                    Username = username,
                    Action = "CBBA_ANOMALY_DETECTED",
                    Details = $"Anomaly Score: {predictionResult.AnomalyScore:F4}, Features: {JsonConvert.SerializeObject(predictionResult.Features)}",
                    IpAddress = ipAddress,
                    SessionId = sessionId
                });
                 await _context.Alerts.AddAsync(new Alert {
                    Type = "Security",
                    Message = $"CBBA Anomaly for user {username} (Session: {sessionId}). Score: {predictionResult.AnomalyScore:F4}",
                    Severity = "Critical",
                    Status = "Active"
                });
                await _context.SaveChangesAsync();

                // Clear session data to simulate termination
                _sessionBiometricData.Remove(sessionId);
                _sessionDbEventData.Remove(sessionId);

                return StatusCode(403, new { message = "Anomaly detected. Session terminated.", score = predictionResult.AnomalyScore });
            }
            else
            {
                _logger.LogInformation($"Session {sessionId} for {username}: Normal behavior. Score: {predictionResult.AnomalyScore:F4}");

                // Clear processed data for the window, keep session alive
                _sessionBiometricData[sessionId].Clear(); 
                _sessionDbEventData[sessionId].Clear(); 
                return Ok(new { message = "Behavior is normal.", score = predictionResult.AnomalyScore });
            }
        }
    }
}