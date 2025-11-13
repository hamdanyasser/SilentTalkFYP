using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SilentTalk.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCallSchedulingFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Make StartTime nullable for scheduled calls that haven't started
            migrationBuilder.AlterColumn<DateTime>(
                name: "StartTime",
                table: "Calls",
                type: "timestamp with time zone",
                nullable: true,
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone");

            // Add new scheduling columns
            migrationBuilder.AddColumn<DateTime>(
                name: "ScheduledStartTime",
                table: "Calls",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "DurationMinutes",
                table: "Calls",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Title",
                table: "Calls",
                type: "character varying(200)",
                maxLength: 200,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "Calls",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "InvitedUserIds",
                table: "Calls",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsScheduled",
                table: "Calls",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // Create index on ScheduledStartTime for efficient queries
            migrationBuilder.CreateIndex(
                name: "IX_Calls_ScheduledStartTime",
                table: "Calls",
                column: "ScheduledStartTime");

            // Create index on IsScheduled for filtering
            migrationBuilder.CreateIndex(
                name: "IX_Calls_IsScheduled",
                table: "Calls",
                column: "IsScheduled");

            // Create composite index on Status and ScheduledStartTime
            migrationBuilder.CreateIndex(
                name: "IX_Calls_Status_ScheduledStartTime",
                table: "Calls",
                columns: new[] { "Status", "ScheduledStartTime" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Drop indexes
            migrationBuilder.DropIndex(
                name: "IX_Calls_ScheduledStartTime",
                table: "Calls");

            migrationBuilder.DropIndex(
                name: "IX_Calls_IsScheduled",
                table: "Calls");

            migrationBuilder.DropIndex(
                name: "IX_Calls_Status_ScheduledStartTime",
                table: "Calls");

            // Drop columns
            migrationBuilder.DropColumn(
                name: "ScheduledStartTime",
                table: "Calls");

            migrationBuilder.DropColumn(
                name: "DurationMinutes",
                table: "Calls");

            migrationBuilder.DropColumn(
                name: "Title",
                table: "Calls");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "Calls");

            migrationBuilder.DropColumn(
                name: "InvitedUserIds",
                table: "Calls");

            migrationBuilder.DropColumn(
                name: "IsScheduled",
                table: "Calls");

            // Revert StartTime to non-nullable
            migrationBuilder.AlterColumn<DateTime>(
                name: "StartTime",
                table: "Calls",
                type: "timestamp with time zone",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                oldClrType: typeof(DateTime),
                oldType: "timestamp with time zone",
                oldNullable: true);
        }
    }
}
