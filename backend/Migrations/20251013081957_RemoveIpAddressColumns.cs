using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace db_biometrics_mvp.Backend.Migrations
{
    /// <inheritdoc />
    public partial class RemoveIpAddressColumns : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DeleteData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 4);

            migrationBuilder.DropColumn(
                name: "IpAddress",
                table: "DBAConsoles");

            migrationBuilder.DropColumn(
                name: "IpAddress",
                table: "CBBAs");

            migrationBuilder.DropColumn(
                name: "IpAddress",
                table: "CaptchaVerifications");

            migrationBuilder.DropColumn(
                name: "IpAddress",
                table: "AuditLogs");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "IsTwoFactorEnabled" },
                values: new object[] { new DateTime(2025, 10, 13, 8, 19, 52, 414, DateTimeKind.Utc).AddTicks(4238), false });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "Email", "IsTwoFactorEnabled" },
                values: new object[] { new DateTime(2025, 10, 13, 8, 19, 52, 414, DateTimeKind.Utc).AddTicks(4998), "37256v4t@psba.edu.sg", false });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "Email" },
                values: new object[] { new DateTime(2025, 10, 13, 8, 19, 52, 414, DateTimeKind.Utc).AddTicks(5000), "ktan8563@gmail.com" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "IpAddress",
                table: "DBAConsoles",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "IpAddress",
                table: "CBBAs",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "IpAddress",
                table: "CaptchaVerifications",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "IpAddress",
                table: "AuditLogs",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.UpdateData(
                table: "AuditLogs",
                keyColumn: "Id",
                keyValue: 1,
                column: "IpAddress",
                value: "127.0.0.1");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "IsTwoFactorEnabled" },
                values: new object[] { new DateTime(2025, 10, 12, 12, 47, 43, 849, DateTimeKind.Utc).AddTicks(2226), true });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "Email", "IsTwoFactorEnabled" },
                values: new object[] { new DateTime(2025, 10, 12, 12, 47, 43, 849, DateTimeKind.Utc).AddTicks(3321), "dba@system.com", true });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "Email" },
                values: new object[] { new DateTime(2025, 10, 12, 12, 47, 43, 849, DateTimeKind.Utc).AddTicks(3324), "test@system.com" });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "Id", "CreatedAt", "Email", "IsActive", "IsEmailVerified", "IsTwoFactorEnabled", "LastLoginAt", "PasswordHash", "Role", "Username" },
                values: new object[] { 4, new DateTime(2025, 10, 12, 12, 47, 43, 849, DateTimeKind.Utc).AddTicks(3326), "tank108@uni.coventry.ac.uk", true, false, false, null, "713bfda78870bf9d1b261f565286f85e97ee614efe5f0faf7c34e7ca4f65baca", "admin", "tank108" });
        }
    }
}
