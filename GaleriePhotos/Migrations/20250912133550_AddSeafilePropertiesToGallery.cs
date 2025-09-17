using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GaleriePhotos.Migrations
{
    /// <inheritdoc />
    public partial class AddSeafilePropertiesToGallery : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "DataProvider",
                table: "Galleries",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "SeafileApiKey",
                table: "Galleries",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SeafileServerUrl",
                table: "Galleries",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DataProvider",
                table: "Galleries");

            migrationBuilder.DropColumn(
                name: "SeafileApiKey",
                table: "Galleries");

            migrationBuilder.DropColumn(
                name: "SeafileServerUrl",
                table: "Galleries");
        }
    }
}
