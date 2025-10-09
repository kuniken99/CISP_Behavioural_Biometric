// backend/Models/DbConfiguration.cs
namespace db_biometrics_mvp.Backend.Models
{
    public class DbConfiguration
    {
        public int Id { get; set; } = 1; // Singleton ID
        public int MaxConnections { get; set; } = 100;
        public int QueryTimeoutSeconds { get; set; } = 30;
        public string BackupSchedule { get; set; } = "Daily 02:00 AM";
        public bool EnableAuditing { get; set; } = true;
        public string LogLevel { get; set; } = "INFO";
    }

    public class WebsiteContent
    {
        public int Id { get; set; } = 1; // Singleton ID
        public string Content { get; set; } = "# Welcome to DBA Admin Console\n\nThis is a placeholder for website content.";
    }
}