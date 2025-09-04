// backend/Models/BehavioralData.cs

using System.Collections.Generic;

namespace db_biometrics_mvp.Backend.Models
{
    public class BiometricEvent
    {
        public string Type { get; set; }
        public double Time { get; set; }
        public string Key { get; set; }
        public double? X { get; set; }
        public double? Y { get; set; }
        public string Button { get; set; }
        public bool? Pressed { get; set; }
    }

    public class DbActionEvent
    {
        public double Timestamp { get; set; }
        public string User { get; set; }
        public string SessionId { get; set; }
        public string EventType { get; set; }
        public int QuerySizeKb { get; set; }
        // Add more DB-specific context as needed
    }

    public class ContinuousBiometricPayload
    {
        public List<BiometricEvent> BiometricEvents { get; set; } = new List<BiometricEvent>();
        public List<DbActionEvent> DbEvents { get; set; } = new List<DbActionEvent>();
    }
}