using Microsoft.EntityFrameworkCore.Migrations;

namespace GaleriePhotos.Migrations
{
    public partial class Video : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "Video",
                table: "Photos",
                nullable: false,
                defaultValue: false);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Video",
                table: "Photos");
        }
    }
}
