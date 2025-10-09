using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace db_biometrics_mvp.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddCBBASystemTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "BiometricProfiles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    CreatedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LastUpdated = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ProfileVersion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MouseProfile = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    KeystrokeProfile = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TypingRhythm = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    AverageTypingSpeed = table.Column<double>(type: "float", nullable: false),
                    AverageMouseVelocity = table.Column<double>(type: "float", nullable: false),
                    PreferredClickPatterns = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SessionCount = table.Column<int>(type: "int", nullable: false),
                    ProfileAccuracy = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    ModelParameters = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastTrainingDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DeviceContext = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ThresholdScore = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    AdaptationRate = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BiometricProfiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BiometricProfiles_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CaptchaVerifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    SessionId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CompletedTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CaptchaType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ChallengeData = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ExpectedAnswer = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UserAnswer = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsCorrect = table.Column<bool>(type: "bit", nullable: false),
                    AttemptNumber = table.Column<int>(type: "int", nullable: false),
                    ExpiryTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IpAddress = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UserAgent = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SolveTime = table.Column<TimeSpan>(type: "time", nullable: false),
                    Difficulty = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CaptchaVerifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CaptchaVerifications_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "CBBAs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    SessionId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    StartTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    EndTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    BiometricData = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RiskScore = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    AuthenticationStatus = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModelVersion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Confidence = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    IsAnomaly = table.Column<bool>(type: "bit", nullable: false),
                    AnomalyDetails = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ProcessedTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    DeviceFingerprint = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IpAddress = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EventCount = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CBBAs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CBBAs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DBAConsoles",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    SessionId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LoginTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    LogoutTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    IpAddress = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UserAgent = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DatabaseName = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ConnectionString = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    QueryCount = table.Column<int>(type: "int", nullable: false),
                    LastActivity = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DBAConsoles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DBAConsoles_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "KeyStrokes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    SessionId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false),
                    Key = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    EventType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DwellTime = table.Column<int>(type: "int", nullable: false),
                    FlightTime = table.Column<int>(type: "int", nullable: false),
                    TypingSpeed = table.Column<double>(type: "float", nullable: false),
                    IsShiftPressed = table.Column<bool>(type: "bit", nullable: false),
                    IsCtrlPressed = table.Column<bool>(type: "bit", nullable: false),
                    IsAltPressed = table.Column<bool>(type: "bit", nullable: false),
                    KeyCode = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    TimestampMs = table.Column<long>(type: "bigint", nullable: false),
                    Rhythm = table.Column<double>(type: "float", nullable: false),
                    Context = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Pressure = table.Column<int>(type: "int", nullable: false),
                    IsBackspace = table.Column<bool>(type: "bit", nullable: false),
                    SequenceNumber = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_KeyStrokes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_KeyStrokes_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "MouseMovements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    SessionId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false),
                    X = table.Column<double>(type: "float", nullable: false),
                    Y = table.Column<double>(type: "float", nullable: false),
                    EventType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Button = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Velocity = table.Column<double>(type: "float", nullable: false),
                    Acceleration = table.Column<double>(type: "float", nullable: false),
                    Direction = table.Column<double>(type: "float", nullable: false),
                    Pressure = table.Column<double>(type: "float", nullable: false),
                    ClickDuration = table.Column<int>(type: "int", nullable: false),
                    DistanceFromPrevious = table.Column<double>(type: "float", nullable: false),
                    TimestampMs = table.Column<long>(type: "bigint", nullable: false),
                    ScreenResolution = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsDrag = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_MouseMovements", x => x.Id);
                    table.ForeignKey(
                        name: "FK_MouseMovements_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PrivilegedAdministrators",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    AdminLevel = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PermissionLevel = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    GrantedDate = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ExpiryDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    GrantedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Permissions = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    LastAccess = table.Column<DateTime>(type: "datetime2", nullable: false),
                    AccessScope = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RequiresTwoFactor = table.Column<bool>(type: "bit", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PrivilegedAdministrators", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PrivilegedAdministrators_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "RiskScores",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    SessionId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CalculatedTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CurrentScore = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PreviousScore = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BaselineScore = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    RiskLevel = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CalculationMethod = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ModelVersion = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FactorsConsidered = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BiometricScore = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    BehavioralScore = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    ContextualScore = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    HistoricalScore = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    IsAnomaly = table.Column<bool>(type: "bit", nullable: false),
                    AnomalyReasons = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ExpiryTime = table.Column<DateTime>(type: "datetime2", nullable: false),
                    IsActive = table.Column<bool>(type: "bit", nullable: false),
                    Recommendations = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Confidence = table.Column<decimal>(type: "decimal(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RiskScores", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RiskScores_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "SecurityLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Timestamp = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: true),
                    EventType = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Severity = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Source = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IpAddress = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    UserAgent = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    SessionId = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Details = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Action = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    IsResolved = table.Column<bool>(type: "bit", nullable: false),
                    ResolvedTime = table.Column<DateTime>(type: "datetime2", nullable: true),
                    ResolvedBy = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    ResolutionNotes = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RiskScore = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Category = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RequiresInvestigation = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SecurityLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SecurityLogs_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_BiometricProfiles_UserId",
                table: "BiometricProfiles",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_CaptchaVerifications_UserId",
                table: "CaptchaVerifications",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_CBBAs_UserId",
                table: "CBBAs",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_DBAConsoles_UserId",
                table: "DBAConsoles",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_KeyStrokes_UserId",
                table: "KeyStrokes",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_MouseMovements_UserId",
                table: "MouseMovements",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PrivilegedAdministrators_UserId",
                table: "PrivilegedAdministrators",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_RiskScores_UserId",
                table: "RiskScores",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_SecurityLogs_UserId",
                table: "SecurityLogs",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BiometricProfiles");

            migrationBuilder.DropTable(
                name: "CaptchaVerifications");

            migrationBuilder.DropTable(
                name: "CBBAs");

            migrationBuilder.DropTable(
                name: "DBAConsoles");

            migrationBuilder.DropTable(
                name: "KeyStrokes");

            migrationBuilder.DropTable(
                name: "MouseMovements");

            migrationBuilder.DropTable(
                name: "PrivilegedAdministrators");

            migrationBuilder.DropTable(
                name: "RiskScores");

            migrationBuilder.DropTable(
                name: "SecurityLogs");
        }
    }
}
