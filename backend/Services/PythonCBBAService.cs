// backend/Services/PythonCBBAService.cs

using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using db_biometrics_mvp.Backend.Models;
using System.Collections.Generic;
using System.Linq;

namespace db_biometrics_mvp.Backend.Services
{
    public class PythonCBBAService
    {
        private readonly HttpClient _httpClient;
        private readonly string _cbbaServiceUrl;

        public PythonCBBAService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _cbbaServiceUrl = configuration["PythonCBBAService:Url"] ?? "http://127.0.0.1:5001";
        }

        /// <summary>
        /// Train user's biometric profile with baseline behavioral data
        /// </summary>
        public async Task<CBBATrainingResult> TrainUserProfile(string userIdentifier, List<BehavioralSession> trainingData)
        {
            var payload = new
            {
                user_id = userIdentifier,  // Support both string (username) and int user IDs
                training_data = trainingData.Select(s => new
                {
                    keystroke_data = s.KeystrokeData,
                    mouse_data = s.MouseData
                }).ToList()
            };

            var jsonPayload = JsonConvert.SerializeObject(payload);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            try
            {
                var response = await _httpClient.PostAsync($"{_cbbaServiceUrl}/api/cbba/train", content);
                var responseString = await response.Content.ReadAsStringAsync();
                
                if (response.IsSuccessStatusCode)
                {
                    return JsonConvert.DeserializeObject<CBBATrainingResult>(responseString) ?? 
                        new CBBATrainingResult { Success = false, Error = "Failed to deserialize response" };
                }
                else
                {
                    return new CBBATrainingResult { Success = false, Error = $"HTTP {response.StatusCode}: {responseString}" };
                }
            }
            catch (Exception e)
            {
                Console.WriteLine($"Error training CBBA profile: {e.Message}");
                return new CBBATrainingResult { Success = false, Error = e.Message };
            }
        }

        /// <summary>
        /// Assess real-time risk score for current behavioral data
        /// </summary>
        public async Task<CBBARiskAssessment> AssessRisk(string userIdentifier, List<object> keystrokeData, List<object> mouseData)
        {
            var payload = new
            {
                user_id = userIdentifier,  // Support both string (username) and int user IDs
                keystroke_data = keystrokeData,
                mouse_data = mouseData
            };

            var jsonPayload = JsonConvert.SerializeObject(payload);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            try
            {
                var response = await _httpClient.PostAsync($"{_cbbaServiceUrl}/api/cbba/assess", content);
                var responseString = await response.Content.ReadAsStringAsync();
                
                if (response.IsSuccessStatusCode)
                {
                    return JsonConvert.DeserializeObject<CBBARiskAssessment>(responseString) ?? 
                        new CBBARiskAssessment 
                        { 
                            Success = false, 
                            RiskScore = 50.0,
                            RiskLevel = "unknown",
                            Action = "monitor",
                            Error = "Failed to deserialize response" 
                        };
                }
                else
                {
                    return new CBBARiskAssessment 
                    { 
                        Success = false, 
                        RiskScore = 50.0,
                        RiskLevel = "unknown",
                        Action = "monitor",
                        Error = $"HTTP {response.StatusCode}: {responseString}" 
                    };
                }
            }
            catch (Exception e)
            {
                Console.WriteLine($"Error assessing CBBA risk: {e.Message}");
                return new CBBARiskAssessment 
                { 
                    Success = false, 
                    RiskScore = 50.0,
                    RiskLevel = "unknown",
                    Action = "monitor",
                    Error = e.Message 
                };
            }
        }

        /// <summary>
        /// Update user's profile with new legitimate behavioral data
        /// </summary>
        public async Task<CBBAUpdateResult> UpdateProfile(string userIdentifier, List<object> keystrokeData, List<object> mouseData)
        {
            var payload = new
            {
                user_id = userIdentifier,  // Support both string (username) and int user IDs
                keystroke_data = keystrokeData,
                mouse_data = mouseData
            };

            var jsonPayload = JsonConvert.SerializeObject(payload);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            try
            {
                var response = await _httpClient.PostAsync($"{_cbbaServiceUrl}/api/cbba/update", content);
                var responseString = await response.Content.ReadAsStringAsync();
                
                if (response.IsSuccessStatusCode)
                {
                    return JsonConvert.DeserializeObject<CBBAUpdateResult>(responseString) ?? 
                        new CBBAUpdateResult { Success = false, Error = "Failed to deserialize response" };
                }
                else
                {
                    return new CBBAUpdateResult { Success = false, Error = $"HTTP {response.StatusCode}: {responseString}" };
                }
            }
            catch (Exception e)
            {
                Console.WriteLine($"Error updating CBBA profile: {e.Message}");
                return new CBBAUpdateResult { Success = false, Error = e.Message };
            }
        }

        /// <summary>
        /// Get user's biometric profile status
        /// </summary>
        public async Task<CBBAStatusResult> GetUserStatus(string userIdentifier)
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_cbbaServiceUrl}/api/cbba/status/{userIdentifier}");
                var responseString = await response.Content.ReadAsStringAsync();
                
                if (response.IsSuccessStatusCode)
                {
                    return JsonConvert.DeserializeObject<CBBAStatusResult>(responseString) ?? 
                        new CBBAStatusResult { Success = false, Error = "Failed to deserialize response" };
                }
                else
                {
                    return new CBBAStatusResult { Success = false, Error = $"HTTP {response.StatusCode}: {responseString}" };
                }
            }
            catch (Exception e)
            {
                Console.WriteLine($"Error getting CBBA status: {e.Message}");
                return new CBBAStatusResult { Success = false, Error = e.Message };
            }
        }

        /// <summary>
        /// Check if Python service is healthy
        /// </summary>
        public async Task<bool> IsHealthy()
        {
            try
            {
                var response = await _httpClient.GetAsync($"{_cbbaServiceUrl}/health");
                return response.IsSuccessStatusCode;
            }
            catch
            {
                return false;
            }
        }
    }

    // Request/Response Models
    public class BehavioralSession
    {
        public List<object> KeystrokeData { get; set; } = new List<object>();
        public List<object> MouseData { get; set; } = new List<object>();
    }

    public class CBBATrainingResult
    {
        [JsonProperty("success")]
        public bool Success { get; set; }

        [JsonProperty("user_id")]
        public object UserId { get; set; } = 0; // Can be int or string

        [JsonProperty("samples_trained")]
        public int SamplesTrained { get; set; }

        [JsonProperty("feature_dimension")]
        public int FeatureDimension { get; set; }

        [JsonProperty("encrypted_profile")]
        public string EncryptedProfile { get; set; } = string.Empty;

        [JsonProperty("model_info")]
        public Dictionary<string, object> ModelInfo { get; set; } = new Dictionary<string, object>();

        [JsonProperty("timestamp")]
        public string Timestamp { get; set; } = string.Empty;

        [JsonProperty("error")]
        public string Error { get; set; } = string.Empty;
    }

    public class CBBARiskAssessment
    {
        [JsonProperty("success")]
        public bool Success { get; set; }

        [JsonProperty("mode")]
        public string Mode { get; set; } = "assessment";

        [JsonProperty("risk_score")]
        public double RiskScore { get; set; }

        [JsonProperty("risk_level")]
        public string RiskLevel { get; set; } = "unknown";

        [JsonProperty("status")]
        public string Status { get; set; } = "unknown";

        [JsonProperty("action")]
        public string Action { get; set; } = "none";

        [JsonProperty("details")]
        public Dictionary<string, object> Details { get; set; } = new Dictionary<string, object>();

        [JsonProperty("timestamp")]
        public string Timestamp { get; set; } = string.Empty;

        [JsonProperty("is_trained")]
        public bool IsTrained { get; set; }

        [JsonProperty("error")]
        public string Error { get; set; } = string.Empty;
    }

    public class CBBAUpdateResult
    {
        [JsonProperty("success")]
        public bool Success { get; set; }

        [JsonProperty("user_id")]
        public object UserId { get; set; } = 0; // Can be int or string

        [JsonProperty("encrypted_profile")]
        public string EncryptedProfile { get; set; } = string.Empty;

        [JsonProperty("timestamp")]
        public string Timestamp { get; set; } = string.Empty;

        [JsonProperty("error")]
        public string Error { get; set; } = string.Empty;
    }

    public class CBBAStatusResult
    {
        [JsonProperty("success")]
        public bool Success { get; set; }

        [JsonProperty("user_id")]
        public object UserId { get; set; } = 0; // Can be int or string

        [JsonProperty("model_info")]
        public Dictionary<string, object> ModelInfo { get; set; } = new Dictionary<string, object>();

        [JsonProperty("timestamp")]
        public string Timestamp { get; set; } = string.Empty;

        [JsonProperty("error")]
        public string Error { get; set; } = string.Empty;
    }
}