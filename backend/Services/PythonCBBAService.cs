// backend/Services/PythonCBBAService.cs

using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using db_biometrics_mvp.Backend.Models;
using System.Collections.Generic;

namespace db_biometrics_mvp.Backend.Services
{
    public class PythonCBBAService
    {
        private readonly HttpClient _httpClient;
        private readonly string _cbbaServiceUrl;

        public PythonCBBAService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _cbbaServiceUrl = configuration["PythonCBBAService:Url"];
            if (string.IsNullOrEmpty(_cbbaServiceUrl))
            {
                throw new ArgumentNullException("PythonCBBAService:Url is not configured in appsettings.json");
            }
        }

        public async Task<CBBAPredictionResult> GetAnomalyPrediction(ContinuousBiometricPayload payload)
        {
            var jsonPayload = JsonConvert.SerializeObject(payload);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            try
            {
                var response = await _httpClient.PostAsync($"{_cbbaServiceUrl}/predict_anomaly", content);
                response.EnsureSuccessStatusCode(); // Throws an exception if the HTTP response status is an error code

                var responseString = await response.Content.ReadAsStringAsync();
                return JsonConvert.DeserializeObject<CBBAPredictionResult>(responseString);
            }
            catch (HttpRequestException e)
            {
                Console.WriteLine($"Error communicating with Python CBBA service: {e.Message}");
                return new CBBAPredictionResult { IsAnomaly = false, AnomalyScore = 1.0, Error = e.Message };
            }
        }
    }

    public class CBBAPredictionResult
    {
        [JsonProperty("anomaly_score")]
        public double AnomalyScore { get; set; }

        [JsonProperty("prediction")]
        public int Prediction { get; set; } // 1 for inlier, -1 for outlier

        [JsonProperty("is_anomaly")]
        public bool IsAnomaly { get; set; }

        [JsonProperty("features")]
        public Dictionary<string, double> Features { get; set; }

        public string Error { get; set; }
    }
}