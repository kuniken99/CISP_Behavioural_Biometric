// backend/Models/BehavioralData.cs

using System.Collections.Generic;

namespace db_biometrics_mvp.Backend.Models
{
    public class BiometricEvent
    {
        public string Type { get; set; } = string.Empty;
        public double Time { get; set; }
        public string Key { get; set; } = string.Empty;
        public double? X { get; set; }
        public double? Y { get; set; }
        public string Button { get; set; } = string.Empty;
        public bool? Pressed { get; set; }
    }

    public class DbActionEvent
    {
        public double Timestamp { get; set; }
        public string User { get; set; } = string.Empty;
        public string SessionId { get; set; } = string.Empty;
        public string EventType { get; set; } = string.Empty;
        public int QuerySizeKb { get; set; }
        // Add more DB-specific context as needed
    }

    public class ContinuousBiometricPayload
    {
        public List<BiometricEvent> BiometricEvents { get; set; } = new List<BiometricEvent>();
        public List<DbActionEvent> DbEvents { get; set; } = new List<DbActionEvent>();
    }
}