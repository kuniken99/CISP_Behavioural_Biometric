using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace db_biometrics_mvp.Backend.Migrations
{
    /// <inheritdoc />
    public partial class UpdateTank108EmailVerified : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2025, 10, 11, 9, 34, 56, 996, DateTimeKind.Utc).AddTicks(3171));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2025, 10, 11, 9, 34, 56, 996, DateTimeKind.Utc).AddTicks(4070));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3,
                column: "CreatedAt",
                value: new DateTime(2025, 10, 11, 9, 34, 56, 996, DateTimeKind.Utc).AddTicks(4073));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "CreatedAt", "IsTwoFactorEnabled" },
                values: new object[] { new DateTime(2025, 10, 11, 9, 34, 56, 996, DateTimeKind.Utc).AddTicks(4074), false });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2025, 10, 11, 8, 50, 49, 337, DateTimeKind.Utc).AddTicks(2611));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2025, 10, 11, 8, 50, 49, 337, DateTimeKind.Utc).AddTicks(3800));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3,
                column: "CreatedAt",
                value: new DateTime(2025, 10, 11, 8, 50, 49, 337, DateTimeKind.Utc).AddTicks(3804));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 4,
                columns: new[] { "CreatedAt", "IsTwoFactorEnabled" },
                values: new object[] { new DateTime(2025, 10, 11, 8, 50, 49, 337, DateTimeKind.Utc).AddTicks(3805), true });
        }
    }
}
