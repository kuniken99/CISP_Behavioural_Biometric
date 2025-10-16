using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;

namespace db_biometrics_mvp.Backend.Services
{
    public class SessionManagementService
    {
        private readonly Dictionary<string, DateTime> _lastActivity;
        private readonly TimeSpan _sessionTimeout;

        public SessionManagementService(IConfiguration configuration)
        {
            _lastActivity = new Dictionary<string, DateTime>();
            _sessionTimeout = TimeSpan.FromMinutes(15); // 15-minute timeout
        }

        public void UpdateLastActivity(string sessionId)
        {
            _lastActivity[sessionId] = DateTime.UtcNow;
        }

        public bool IsSessionExpired(string sessionId)
        {
            if (!_lastActivity.TryGetValue(sessionId, out DateTime lastActivity))
            {
                return true;
            }

            return DateTime.UtcNow - lastActivity > _sessionTimeout;
        }

        public void RemoveSession(string sessionId)
        {
            _lastActivity.Remove(sessionId);
        }

        public void CleanupExpiredSessions()
        {
            var expiredSessions = new List<string>();
            var now = DateTime.UtcNow;

            foreach (var session in _lastActivity)
            {
                if (now - session.Value > _sessionTimeout)
                {
                    expiredSessions.Add(session.Key);
                }
            }

            foreach (var sessionId in expiredSessions)
            {
                _lastActivity.Remove(sessionId);
            }
        }
    }
}