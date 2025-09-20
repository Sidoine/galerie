using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GaleriePhotos.Migrations
{
    /// <inheritdoc />
    public partial class FaceGallery : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM \"FaceNames\";");
            migrationBuilder.Sql("DELETE FROM \"Faces\";");
            migrationBuilder.AddColumn<int>(
                name: "GalleryId",
                table: "FaceNames",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_FaceNames_GalleryId",
                table: "FaceNames",
                column: "GalleryId");

            migrationBuilder.AddForeignKey(
                name: "FK_FaceNames_Galleries_GalleryId",
                table: "FaceNames",
                column: "GalleryId",
                principalTable: "Galleries",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_FaceNames_Galleries_GalleryId",
                table: "FaceNames");

            migrationBuilder.DropIndex(
                name: "IX_FaceNames_GalleryId",
                table: "FaceNames");

            migrationBuilder.DropColumn(
                name: "GalleryId",
                table: "FaceNames");
        }
    }
}
