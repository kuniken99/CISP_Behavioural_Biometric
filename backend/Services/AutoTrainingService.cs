using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using db_biometrics_mvp.Backend.Data;
using db_biometrics_mvp.Backend.Models;
using Microsoft.EntityFrameworkCore;
using System.Threading;
using System.Linq;
using Newtonsoft.Json.Linq;

namespace db_biometrics_mvp.Backend.Services
{
    public interface IAutoTrainingService
    {
        Task<bool> StartAutoTraining(string username, string userId, int numSamples = 1000);
        TrainingProgress GetTrainingProgress(string username);
    }

    public class TrainingProgress
    {
        public bool IsTraining { get; set; }
        public int TotalSamples { get; set; }
        public int CompletedSamples { get; set; }
        public int PercentComplete { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? Error { get; set; }
    }

    public class AutoTrainingService : IAutoTrainingService
    {
        private readonly ILogger<AutoTrainingService> _logger;
        private readonly IConfiguration _configuration;
        private readonly PythonCBBAService _cbbaService;
        private readonly AppDbContext _context;
        
        // Track training progress per user
        private static Dictionary<string, TrainingProgress> _trainingProgress = new Dictionary<string, TrainingProgress>();

        public AutoTrainingService(
            ILogger<AutoTrainingService> logger, 
            IConfiguration configuration,
            PythonCBBAService cbbaService,
            AppDbContext context)
        {
            _logger = logger;
            _configuration = configuration;
            _cbbaService = cbbaService;
            _context = context;
        }

        public TrainingProgress GetTrainingProgress(string username)
        {
            if (_trainingProgress.ContainsKey(username))
            {
                return _trainingProgress[username];
            }
            
            return new TrainingProgress
            {
                IsTraining = false,
                TotalSamples = 0,
                CompletedSamples = 0,
                PercentComplete = 0,
                Status = "Not started"
            };
        }

        public async Task<bool> StartAutoTraining(string username, string userId, int numSamples = 1000)
        {
            try
            {
                _logger.LogInformation($"Starting auto-training for user {username} with {numSamples} samples");

                // Initialize progress tracking
                _trainingProgress[username] = new TrainingProgress
                {
                    IsTraining = true,
                    TotalSamples = numSamples,
                    CompletedSamples = 0,
                    PercentComplete = 0,
                    Status = "Generating training data..."
                };

                // Run training in background
                _ = Task.Run(async () => await ExecuteTraining(username, userId, numSamples));

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError($"Error starting auto-training for {username}: {ex.Message}");
                if (_trainingProgress.ContainsKey(username))
                {
                    _trainingProgress[username].IsTraining = false;
                    _trainingProgress[username].Error = ex.Message;
                    _trainingProgress[username].Status = "Failed";
                }
                return false;
            }
        }

        private async Task ExecuteTraining(string username, string userId, int numSamples)
        {
            try
            {
                // Generate training data
                _logger.LogInformation($"Generating {numSamples} training samples for {username}");
                
                var trainingData = new List<object>();
                var sessionTypes = new[] { "normal", "fast_typing", "slow_typing", "mixed_speed", "erratic_mouse", "fast_interaction" };

                for (int i = 0; i < numSamples; i++)
                {
                    var sessionType = sessionTypes[i % sessionTypes.Length];
                    var session = GenerateTrainingSession(sessionType);
                    trainingData.Add(session);

                    // Update progress every 10 samples
                    if (i % 10 == 0 || i == numSamples - 1)
                    {
                        _trainingProgress[username].CompletedSamples = i + 1;
                        _trainingProgress[username].PercentComplete = (int)((i + 1) * 100.0 / numSamples);
                        _trainingProgress[username].Status = $"Generating samples ({i + 1}/{numSamples})...";
                        _logger.LogDebug($"Training progress for {username}: {i + 1}/{numSamples}");
                    }

                    // Small delay to allow other operations
                    if (i % 50 == 0)
                    {
                        await Task.Delay(10);
                    }
                }

                // Train the model
                _trainingProgress[username].Status = "Training ML models...";
                _trainingProgress[username].PercentComplete = 95;

                // Convert training data to proper format
                var behavioralSessions = new List<BehavioralSession>();
                foreach (var session in trainingData)
                {
                    var sessionObj = (dynamic)session;
                    behavioralSessions.Add(new BehavioralSession
                    {
                        KeystrokeData = Newtonsoft.Json.Linq.JArray.FromObject(sessionObj.keystroke_data),
                        MouseData = Newtonsoft.Json.Linq.JArray.FromObject(sessionObj.mouse_data)
                    });
                }

                var result = await _cbbaService.TrainUserProfile(username, behavioralSessions);

                if (result.Success)
                {
                    // Store encrypted profile in database
                    var user = await _context.Users.FirstOrDefaultAsync(u => u.Username == username);
                    if (user != null)
                    {
                        var profile = await _context.BiometricProfiles.FirstOrDefaultAsync(p => p.UserId == user.Id);
                        
                        if (profile == null)
                        {
                            profile = new BiometricProfile
                            {
                                UserId = user.Id,
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
                            Action = "AUTO_TRAINING_COMPLETED",
                            Details = $"Profile auto-trained with {result.SamplesTrained} samples after registration",
                            SessionId = "auto-training"
                        });
                        await _context.SaveChangesAsync();
                    }

                    _trainingProgress[username].IsTraining = false;
                    _trainingProgress[username].PercentComplete = 100;
                    _trainingProgress[username].Status = "Training complete!";
                    _logger.LogInformation($"Auto-training completed successfully for {username}");
                }
                else
                {
                    throw new Exception(result.Error ?? "Training failed");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError($"Auto-training failed for {username}: {ex.Message}");
                _trainingProgress[username].IsTraining = false;
                _trainingProgress[username].Error = ex.Message;
                _trainingProgress[username].Status = "Training failed";
            }
        }

        private object GenerateTrainingSession(string sessionType)
        {
            // Generate keystroke and mouse data based on session type
            object keystrokeData;
            object mouseData;

            switch (sessionType)
            {
                case "fast_typing":
                    keystrokeData = GenerateKeystrokeData(30000, "fast");
                    mouseData = GenerateMouseData(30000, "smooth");
                    break;
                case "slow_typing":
                    keystrokeData = GenerateKeystrokeData(30000, "slow");
                    mouseData = GenerateMouseData(30000, "smooth");
                    break;
                case "mixed_speed":
                    var normalKeys = GenerateKeystrokeData(15000, "normal");
                    var fastKeys = GenerateKeystrokeData(15000, "fast");
                    keystrokeData = CombineKeystrokeData(normalKeys, fastKeys);
                    mouseData = GenerateMouseData(30000, "normal");
                    break;
                case "erratic_mouse":
                    keystrokeData = GenerateKeystrokeData(30000, "normal");
                    mouseData = GenerateMouseData(30000, "erratic");
                    break;
                case "fast_interaction":
                    keystrokeData = GenerateKeystrokeData(30000, "fast");
                    mouseData = GenerateMouseData(30000, "fast");
                    break;
                default: // normal
                    keystrokeData = GenerateKeystrokeData(30000, "normal");
                    mouseData = GenerateMouseData(30000, "normal");
                    break;
            }

            return new
            {
                keystroke_data = keystrokeData,
                mouse_data = mouseData
            };
        }

        private List<object> GenerateKeystrokeData(int durationMs, string speed)
        {
            var keystrokes = new List<object>();
            var random = new Random(Guid.NewGuid().GetHashCode()); // Better seed for more randomness
            int currentTime = 0;

            int avgInterval, stdDev;
            switch (speed)
            {
                case "fast":
                    avgInterval = 100;
                    stdDev = 80; // INCREASED from 60 for even more variation
                    break;
                case "slow":
                    avgInterval = 450;
                    stdDev = 220; // INCREASED from 180 for even more variation
                    break;
                default:
                    avgInterval = 250;
                    stdDev = 150; // INCREASED from 120 for even more variation
                    break;
            }

            var keys = "abcdefghijklmnopqrstuvwxyz .,!?1234567890".ToCharArray();

            while (currentTime < durationMs)
            {
                // Occasional pauses (INCREASED to 0.12 for even more pauses)
                if (random.NextDouble() < 0.12)
                {
                    currentTime += random.Next(500, 4000); // INCREASED max pause to 4 seconds
                    continue;
                }

                var key = keys[random.Next(keys.Length)].ToString();
                var burstMultiplier = random.NextDouble() < 0.20 ? random.NextDouble() * 0.35 + 0.45 : 1.0; // INCREASED burst variation

                // Occasional typo (INCREASED to 0.08 for more typos)
                if (random.NextDouble() < 0.08)
                {
                    var wrongKey = keys[random.Next(keys.Length)].ToString();
                    keystrokes.Add(new { key = wrongKey, timestamp = currentTime, @event = "keydown" });
                    var dwellTime = random.Next(60, 140); // Wider range
                    keystrokes.Add(new { key = wrongKey, timestamp = currentTime + dwellTime, @event = "keyup" });
                    currentTime += dwellTime + random.Next(80, 180) + random.Next(100, 350); // More variation

                    keystrokes.Add(new { key = "Backspace", timestamp = currentTime, @event = "keydown" });
                    dwellTime = random.Next(70, 120); // Wider range
                    keystrokes.Add(new { key = "Backspace", timestamp = currentTime + dwellTime, @event = "keyup" });
                    currentTime += dwellTime + random.Next(100, 250); // More variation
                }

                keystrokes.Add(new { key = key, timestamp = currentTime, @event = "keydown" });
                
                // WIDER dwell time ranges for maximum diversity
                var dwell = speed == "fast" ? random.Next(15, 200) :  // INCREASED range
                           speed == "slow" ? random.Next(60, 450) :   // INCREASED range
                           random.Next(30, 280);                       // INCREASED range
                
                keystrokes.Add(new { key = key, timestamp = currentTime + dwell, @event = "keyup" });

                var flight = (int)(NextGaussian(random, avgInterval, stdDev) * burstMultiplier);
                flight = Math.Max(5, Math.Min(flight, 2000)); // INCREASED max to 2 seconds for more variation
                
                currentTime += dwell + flight;
            }

            return keystrokes;
        }

        private List<object> GenerateMouseData(int durationMs, string pattern)
        {
            var mouseData = new List<object>();
            var random = new Random(Guid.NewGuid().GetHashCode()); // Better seed
            int currentTime = 0;
            int x = random.Next(400, 600);
            int y = random.Next(300, 500);

            while (currentTime < durationMs)
            {
                // INCREASED pause probability to 0.20 for more variation
                if (random.NextDouble() < 0.20)
                {
                    currentTime += random.Next(200, 2000); // INCREASED max pause to 2 seconds
                    continue;
                }

                int dx, dy, interval;
                switch (pattern)
                {
                    case "smooth":
                        dx = random.Next(-18, 18); // INCREASED from -15, 15
                        dy = random.Next(-18, 18);
                        interval = random.Next(20, 100); // WIDER range
                        break;
                    case "erratic":
                        dx = random.Next(-120, 120); // INCREASED from -100, 100
                        dy = random.Next(-120, 120);
                        interval = random.Next(60, 220); // WIDER range
                        break;
                    case "fast":
                        dx = random.Next(-70, 70); // INCREASED
                        dy = random.Next(-70, 70);
                        interval = random.Next(15, 90); // WIDER
                        break;
                    default:
                        dx = random.Next(-50, 50); // INCREASED
                        dy = random.Next(-50, 50);
                        interval = random.Next(40, 160); // WIDER
                        break;
                }

                // Add overshoot simulation (INCREASED to 0.18)
                if (random.NextDouble() < 0.18)
                {
                    dx = (int)(dx * (random.NextDouble() * 1.8 + 1.5)); // MORE overshoot
                    dy = (int)(dy * (random.NextDouble() * 1.8 + 1.5));
                }

                // Micro-corrections (INCREASED to 0.28)
                if (random.NextDouble() < 0.28)
                {
                    dx += random.Next(-7, 7); // MORE jitter
                    dy += random.Next(-7, 7);
                }

                x = Math.Max(0, Math.Min(1920, x + dx));
                y = Math.Max(0, Math.Min(1080, y + dy));

                mouseData.Add(new { x, y, timestamp = currentTime, @event = "mousemove" });

                // Increased click probability to 0.12
                if (random.NextDouble() < 0.12)
                {
                    var clickX = x + random.Next(-5, 5); // MORE jitter
                    var clickY = y + random.Next(-5, 5);
                    mouseData.Add(new { x = clickX, y = clickY, timestamp = currentTime + 10, @event = "click", button = 0 });
                }

                currentTime += interval;
            }

            return mouseData;
        }

        private List<object> CombineKeystrokeData(List<object> data1, List<object> data2)
        {
            var combined = new List<object>(data1);
            combined.AddRange(data2);
            return combined;
        }

        private double NextGaussian(Random random, double mean, double stdDev)
        {
            double u1 = 1.0 - random.NextDouble();
            double u2 = 1.0 - random.NextDouble();
            double randStdNormal = Math.Sqrt(-2.0 * Math.Log(u1)) * Math.Sin(2.0 * Math.PI * u2);
            return mean + stdDev * randStdNormal;
        }
    }
}
