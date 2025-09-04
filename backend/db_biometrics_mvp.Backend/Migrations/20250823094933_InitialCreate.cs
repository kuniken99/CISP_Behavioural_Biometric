using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

#pragma warning disable CA1814 // Prefer jagged arrays over multidimensional

namespace db_biometrics_mvp.Backend.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Alerts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Type = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Severity = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Alerts", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "AuditLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Username = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Action = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Details = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IpAddress = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SessionId = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AuditLogs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "DbConfigurations",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    MaxConnections = table.Column<int>(type: "int", nullable: false),
                    QueryTimeoutSeconds = table.Column<int>(type: "int", nullable: false),
                    BackupSchedule = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EnableAuditing = table.Column<bool>(type: "bit", nullable: false),
                    LogLevel = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DbConfigurations", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Username = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PasswordHash = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "WebsiteContents",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Content = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WebsiteContents", x => x.Id);
                });

            migrationBuilder.InsertData(
                table: "Alerts",
                columns: new[] { "Id", "Message", "Severity", "Status", "Timestamp", "Type" },
                values: new object[,]
                {
                    { 1, "Failed login attempt for 'baduser'", "Medium", "Active", new DateTime(2025, 8, 23, 16, 55, 0, 0, DateTimeKind.Utc), "Security" },
                    { 2, "High CPU usage detected on primary DB server", "Low", "Active", new DateTime(2025, 8, 23, 16, 40, 0, 0, DateTimeKind.Utc), "Performance" }
                });

            migrationBuilder.InsertData(
                table: "AuditLogs",
                columns: new[] { "Id", "Action", "Details", "IpAddress", "SessionId", "Timestamp", "Username" },
                values: new object[] { 1, "DB_INIT", "Initial database migration completed.", "127.0.0.1", null, new DateTime(2025, 8, 23, 17, 0, 0, 0, DateTimeKind.Utc), "system" });

            migrationBuilder.InsertData(
                table: "DbConfigurations",
                columns: new[] { "Id", "BackupSchedule", "EnableAuditing", "LogLevel", "MaxConnections", "QueryTimeoutSeconds" },
                values: new object[] { 1, "Daily 02:00 AM", true, "INFO", 100, 30 });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "IsActive", "PasswordHash", "Role", "Username" },
                values: new object[,]
                {
                    { 1, true, "713bfda78870bf9d1b261f565286f85e97ee614efe5f0faf7c34e7ca4f65baca", "admin", "admin" },
                    { 2, true, "9af50a3ade35be3c6d8ef3ecf3cbedf85c141d0e550c9f1a3fa3e67b6ab55804", "dba", "dbauser" },
                    { 3, true, "9af50a3ade35be3c6d8ef3ecf3cbedf85c141d0e550c9f1a3fa3e67b6ab55804", "user", "testuser" }
                });

            migrationBuilder.InsertData(
                table: "WebsiteContents",
                columns: new[] { "Id", "Content" },
                values: new object[] { 1, "# Welcome to DBA Admin Console\n\nThis is a placeholder for website content." });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Alerts");

            migrationBuilder.DropTable(
                name: "AuditLogs");

            migrationBuilder.DropTable(
                name: "DbConfigurations");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "WebsiteContents");
        }
    }
}
