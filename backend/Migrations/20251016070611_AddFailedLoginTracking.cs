using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace db_biometrics_mvp.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddFailedLoginTracking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "FailedLoginAttempts",
                table: "Users",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<bool>(
                name: "IsLocked",
                table: "Users",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "LockoutEnd",
                table: "Users",
                type: "datetime2",
                nullable: true);

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                columns: new[] { "CreatedAt", "FailedLoginAttempts", "IsLocked", "LockoutEnd" },
                values: new object[] { new DateTime(2025, 10, 16, 7, 6, 6, 93, DateTimeKind.Utc).AddTicks(5811), 0, false, null });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2,
                columns: new[] { "CreatedAt", "FailedLoginAttempts", "IsLocked", "LockoutEnd" },
                values: new object[] { new DateTime(2025, 10, 16, 7, 6, 6, 93, DateTimeKind.Utc).AddTicks(6792), 0, false, null });

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3,
                columns: new[] { "CreatedAt", "FailedLoginAttempts", "IsLocked", "LockoutEnd" },
                values: new object[] { new DateTime(2025, 10, 16, 7, 6, 6, 93, DateTimeKind.Utc).AddTicks(6795), 0, false, null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FailedLoginAttempts",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "IsLocked",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "LockoutEnd",
                table: "Users");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2025, 10, 13, 8, 52, 5, 759, DateTimeKind.Utc).AddTicks(2783));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2025, 10, 13, 8, 52, 5, 759, DateTimeKind.Utc).AddTicks(3882));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3,
                column: "CreatedAt",
                value: new DateTime(2025, 10, 13, 8, 52, 5, 759, DateTimeKind.Utc).AddTicks(3885));
        }
    }
}
