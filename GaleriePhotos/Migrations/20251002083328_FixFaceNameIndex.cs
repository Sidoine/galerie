using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GaleriePhotos.Migrations
{
    /// <inheritdoc />
    public partial class FixFaceNameIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_FaceNames_GalleryId",
                table: "FaceNames");

            migrationBuilder.DropIndex(
                name: "IX_FaceNames_Name",
                table: "FaceNames");

            migrationBuilder.CreateIndex(
                name: "IX_FaceNames_GalleryId_Name",
                table: "FaceNames",
                columns: new[] { "GalleryId", "Name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_FaceNames_GalleryId_Name",
                table: "FaceNames");

            migrationBuilder.CreateIndex(
                name: "IX_FaceNames_GalleryId",
                table: "FaceNames",
                column: "GalleryId");

            migrationBuilder.CreateIndex(
                name: "IX_FaceNames_Name",
                table: "FaceNames",
                column: "Name",
                unique: true);
        }
    }
}
