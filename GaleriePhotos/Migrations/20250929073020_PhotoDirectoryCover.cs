using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GaleriePhotos.Migrations
{
    /// <inheritdoc />
    public partial class PhotoDirectoryCover : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_PhotoDirectories_CoverPhotoId",
                table: "PhotoDirectories",
                column: "CoverPhotoId");

            migrationBuilder.AddForeignKey(
                name: "FK_PhotoDirectories_Photos_CoverPhotoId",
                table: "PhotoDirectories",
                column: "CoverPhotoId",
                principalTable: "Photos",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PhotoDirectories_Photos_CoverPhotoId",
                table: "PhotoDirectories");

            migrationBuilder.DropIndex(
                name: "IX_PhotoDirectories_CoverPhotoId",
                table: "PhotoDirectories");
        }
    }
}
