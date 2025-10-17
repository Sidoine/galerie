using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GaleriePhotos.Migrations
{
    /// <inheritdoc />
    public partial class AddBackgroundServiceState : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Galleries_PhotoDirectories_LastScannedDirectoryId",
                table: "Galleries");

            migrationBuilder.DropIndex(
                name: "IX_Galleries_LastScannedDirectoryId",
                table: "Galleries");

            migrationBuilder.DropColumn(
                name: "LastScannedDirectoryId",
                table: "Galleries");

            migrationBuilder.CreateTable(
                name: "BackgroundServiceStates",
                columns: table => new
                {
                    Id = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                    State = table.Column<string>(type: "jsonb", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BackgroundServiceStates", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BackgroundServiceStates");

            migrationBuilder.AddColumn<int>(
                name: "LastScannedDirectoryId",
                table: "Galleries",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Galleries_LastScannedDirectoryId",
                table: "Galleries",
                column: "LastScannedDirectoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_Galleries_PhotoDirectories_LastScannedDirectoryId",
                table: "Galleries",
                column: "LastScannedDirectoryId",
                principalTable: "PhotoDirectories",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }
    }
}
