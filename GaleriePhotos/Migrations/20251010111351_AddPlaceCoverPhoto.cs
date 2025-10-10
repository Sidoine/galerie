using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GaleriePhotos.Migrations
{
    /// <inheritdoc />
    public partial class AddPlaceCoverPhoto : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CoverPhotoId",
                table: "Places",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Places_CoverPhotoId",
                table: "Places",
                column: "CoverPhotoId");

            migrationBuilder.AddForeignKey(
                name: "FK_Places_Photos_CoverPhotoId",
                table: "Places",
                column: "CoverPhotoId",
                principalTable: "Photos",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Places_Photos_CoverPhotoId",
                table: "Places");

            migrationBuilder.DropIndex(
                name: "IX_Places_CoverPhotoId",
                table: "Places");

            migrationBuilder.DropColumn(
                name: "CoverPhotoId",
                table: "Places");
        }
    }
}
