using System.Text.Json;
using System.Text.Json.Serialization;

namespace db_biometrics_mvp.Backend.Services
{
    public interface IRecaptchaService
    {
        Task<bool> VerifyTokenAsync(string token);
    }

    public class RecaptchaService : IRecaptchaService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<RecaptchaService> _logger;

        public RecaptchaService(HttpClient httpClient, IConfiguration configuration, ILogger<RecaptchaService> logger)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<bool> VerifyTokenAsync(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
            {
                _logger.LogWarning("reCAPTCHA token is null or empty");
                return false;
            }

            try
            {
                var secretKey = _configuration["ReCaptcha:SecretKey"];
                if (string.IsNullOrWhiteSpace(secretKey))
                {
                    _logger.LogError("reCAPTCHA secret key is not configured");
                    return false;
                }

                var requestUri = "https://www.google.com/recaptcha/api/siteverify";
                var requestContent = new FormUrlEncodedContent(new[]
                {
                    new KeyValuePair<string, string>("secret", secretKey),
                    new KeyValuePair<string, string>("response", token)
                });

                var response = await _httpClient.PostAsync(requestUri, requestContent);
                var responseContent = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogError("reCAPTCHA verification request failed with status code: {StatusCode}", response.StatusCode);
                    return false;
                }

                var options = new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                };
                
                var recaptchaResponse = JsonSerializer.Deserialize<RecaptchaResponse>(responseContent, options);
                
                if (recaptchaResponse == null)
                {
                    _logger.LogError("Failed to deserialize reCAPTCHA response");
                    return false;
                }

                if (!recaptchaResponse.Success)
                {
                    var errors = recaptchaResponse.ErrorCodes ?? Array.Empty<string>();
                    _logger.LogWarning("reCAPTCHA verification failed. Errors: {Errors}. Response: {Response}", 
                        string.Join(", ", errors), responseContent);
                }
                else
                {
                    _logger.LogInformation("reCAPTCHA verification successful");
                }

                return recaptchaResponse.Success;
            }
            catch (HttpRequestException ex)
            {
                _logger.LogError(ex, "HTTP request exception during reCAPTCHA verification");
                return false;
            }
            catch (TaskCanceledException ex)
            {
                _logger.LogError(ex, "Timeout during reCAPTCHA verification");
                return false;
            }
            catch (JsonException ex)
            {
                _logger.LogError(ex, "JSON deserialization error during reCAPTCHA verification");
                return false;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error during reCAPTCHA verification");
                return false;
            }
        }
    }

    public class RecaptchaResponse
    {
        [JsonPropertyName("success")]
        public bool Success { get; set; }
        
        [JsonPropertyName("error-codes")]
        public string[]? ErrorCodes { get; set; }
        
        [JsonPropertyName("challenge_ts")]
        public string? ChallengeTs { get; set; }
        
        [JsonPropertyName("hostname")]
        public string? Hostname { get; set; }
        
        [JsonPropertyName("score")]
        public double? Score { get; set; }
        
        [JsonPropertyName("action")]
        public string? Action { get; set; }
    }
}