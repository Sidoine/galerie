using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GaleriePhotos.Migrations
{
    /// <inheritdoc />
    public partial class AddPlaceOpenStreetMapIdentifiers : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<long>(
                name: "OsmId",
                table: "Places",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<long>(
                name: "OsmPlaceId",
                table: "Places",
                type: "bigint",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OsmType",
                table: "Places",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OsmId",
                table: "Places");

            migrationBuilder.DropColumn(
                name: "OsmPlaceId",
                table: "Places");

            migrationBuilder.DropColumn(
                name: "OsmType",
                table: "Places");
        }
    }
}
