using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GaleriePhotos.Migrations
{
    /// <inheritdoc />
    public partial class AddLastScannedDirectoryToGallery : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
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

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
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
        }
    }
}
