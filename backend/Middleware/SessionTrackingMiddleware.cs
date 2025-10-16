using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Concurrent;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace db_biometrics_mvp.Backend.Middleware
{
    /// <summary>
    /// Middleware to track active user sessions and enforce timeout policies
    /// </summary>
    public class SessionTrackingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<SessionTrackingMiddleware> _logger;
        
        // Store session activity: UserId -> Last Activity Time
        private static readonly ConcurrentDictionary<string, DateTime> _activeSessions = new();
        
        // Session timeout: 15 minutes
        private static readonly TimeSpan SessionTimeout = TimeSpan.FromMinutes(15);

        public SessionTrackingMiddleware(RequestDelegate next, ILogger<SessionTrackingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            // Only track authenticated requests
            if (context.User?.Identity?.IsAuthenticated == true)
            {
                var userId = context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                var username = context.User.FindFirst(ClaimTypes.Name)?.Value;

                if (!string.IsNullOrEmpty(userId))
                {
                    var now = DateTime.UtcNow;

                    // Check if session exists and is still valid
                    if (_activeSessions.TryGetValue(userId, out var lastActivity))
                    {
                        var timeSinceLastActivity = now - lastActivity;
                        
                        if (timeSinceLastActivity > SessionTimeout)
                        {
                            // Session has expired
                            _logger.LogWarning("Session expired for user {Username} (ID: {UserId}). Last activity: {LastActivity}", 
                                username, userId, lastActivity);
                            
                            // Remove expired session
                            _activeSessions.TryRemove(userId, out _);
                            
                            // Return 401 Unauthorized
                            context.Response.StatusCode = 401;
                            context.Response.ContentType = "application/json";
                            await context.Response.WriteAsync("{\"message\":\"Session expired due to inactivity\",\"sessionExpired\":true}");
                            return;
                        }
                    }

                    // Update last activity time
                    _activeSessions.AddOrUpdate(userId, now, (key, oldValue) => now);
                    
                    _logger.LogDebug("Session activity tracked for user {Username} (ID: {UserId})", username, userId);
                }
            }

            await _next(context);
        }

        /// <summary>
        /// Remove a session when user logs out
        /// </summary>
        public static void RemoveSession(string userId)
        {
            _activeSessions.TryRemove(userId, out _);
        }

        /// <summary>
        /// Get all active sessions (for monitoring/admin purposes)
        /// </summary>
        public static int GetActiveSessionCount()
        {
            // Clean up expired sessions first
            var now = DateTime.UtcNow;
            var expiredSessions = _activeSessions
                .Where(s => now - s.Value > SessionTimeout)
                .Select(s => s.Key)
                .ToList();

            foreach (var sessionId in expiredSessions)
            {
                _activeSessions.TryRemove(sessionId, out _);
            }

            return _activeSessions.Count;
        }

        /// <summary>
        /// Get session info for a specific user
        /// </summary>
        public static DateTime? GetLastActivity(string userId)
        {
            return _activeSessions.TryGetValue(userId, out var lastActivity) ? lastActivity : null;
        }
    }
}
