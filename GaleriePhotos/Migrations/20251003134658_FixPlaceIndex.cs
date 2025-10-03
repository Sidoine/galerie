using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GaleriePhotos.Migrations
{
    /// <inheritdoc />
    public partial class FixPlaceIndex : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Places_GalleryId_Name",
                table: "Places");

            migrationBuilder.DropIndex(
                name: "IX_Places_OsmPlaceId",
                table: "Places");

            migrationBuilder.DropIndex(
                name: "IX_Places_OsmType_OsmId",
                table: "Places");

            migrationBuilder.CreateIndex(
                name: "IX_Places_GalleryId_Name",
                table: "Places",
                columns: new[] { "GalleryId", "Name" });

            migrationBuilder.CreateIndex(
                name: "IX_Places_GalleryId_OsmPlaceId",
                table: "Places",
                columns: new[] { "GalleryId", "OsmPlaceId" });

            migrationBuilder.CreateIndex(
                name: "IX_Places_GalleryId_OsmType_OsmId",
                table: "Places",
                columns: new[] { "GalleryId", "OsmType", "OsmId" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Places_GalleryId_Name",
                table: "Places");

            migrationBuilder.DropIndex(
                name: "IX_Places_GalleryId_OsmPlaceId",
                table: "Places");

            migrationBuilder.DropIndex(
                name: "IX_Places_GalleryId_OsmType_OsmId",
                table: "Places");

            migrationBuilder.CreateIndex(
                name: "IX_Places_GalleryId_Name",
                table: "Places",
                columns: new[] { "GalleryId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Places_OsmPlaceId",
                table: "Places",
                column: "OsmPlaceId");

            migrationBuilder.CreateIndex(
                name: "IX_Places_OsmType_OsmId",
                table: "Places",
                columns: new[] { "OsmType", "OsmId" });
        }
    }
}
