using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace db_biometrics_mvp.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddTwoFactorNavigation : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TwoFactorAuths_UserId",
                table: "TwoFactorAuths");

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
                column: "CreatedAt",
                value: new DateTime(2025, 10, 11, 8, 50, 49, 337, DateTimeKind.Utc).AddTicks(3805));

            migrationBuilder.CreateIndex(
                name: "IX_TwoFactorAuths_UserId",
                table: "TwoFactorAuths",
                column: "UserId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_TwoFactorAuths_UserId",
                table: "TwoFactorAuths");

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 1,
                column: "CreatedAt",
                value: new DateTime(2025, 10, 11, 8, 29, 2, 698, DateTimeKind.Utc).AddTicks(7330));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 2,
                column: "CreatedAt",
                value: new DateTime(2025, 10, 11, 8, 29, 2, 698, DateTimeKind.Utc).AddTicks(8126));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 3,
                column: "CreatedAt",
                value: new DateTime(2025, 10, 11, 8, 29, 2, 698, DateTimeKind.Utc).AddTicks(8128));

            migrationBuilder.UpdateData(
                table: "Users",
                keyColumn: "Id",
                keyValue: 4,
                column: "CreatedAt",
                value: new DateTime(2025, 10, 11, 8, 29, 2, 698, DateTimeKind.Utc).AddTicks(8129));

            migrationBuilder.CreateIndex(
                name: "IX_TwoFactorAuths_UserId",
                table: "TwoFactorAuths",
                column: "UserId");
        }
    }
}
