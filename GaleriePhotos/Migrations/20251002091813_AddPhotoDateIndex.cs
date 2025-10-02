using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GaleriePhotos.Migrations
{
    /// <inheritdoc />
    public partial class AddPhotoDateIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Photos_DateTime",
                table: "Photos",
                column: "DateTime");

            migrationBuilder.CreateIndex(
                name: "IX_Photos_DateTime_PlaceId",
                table: "Photos",
                columns: new[] { "DateTime", "PlaceId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Photos_DateTime",
                table: "Photos");

            migrationBuilder.DropIndex(
                name: "IX_Photos_DateTime_PlaceId",
                table: "Photos");
        }
    }
}
