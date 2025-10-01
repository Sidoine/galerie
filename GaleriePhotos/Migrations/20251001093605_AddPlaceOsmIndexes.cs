using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GaleriePhotos.Migrations
{
    /// <inheritdoc />
    public partial class AddPlaceOsmIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Places_OsmPlaceId",
                table: "Places",
                column: "OsmPlaceId");

            migrationBuilder.CreateIndex(
                name: "IX_Places_OsmType_OsmId",
                table: "Places",
                columns: new[] { "OsmType", "OsmId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Places_OsmPlaceId",
                table: "Places");

            migrationBuilder.DropIndex(
                name: "IX_Places_OsmType_OsmId",
                table: "Places");
        }
    }
}
