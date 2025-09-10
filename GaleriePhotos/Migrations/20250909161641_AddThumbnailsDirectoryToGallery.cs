using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GaleriePhotos.Migrations
{
    /// <inheritdoc />
    public partial class AddThumbnailsDirectoryToGallery : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ThumbnailsDirectory",
                table: "Galleries",
                type: "text",
                nullable: true);

            migrationBuilder.Sql(@"
                UPDATE ""Galleries"" SET ""ThumbnailsDirectory"" = '/thumbs';
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ThumbnailsDirectory",
                table: "Galleries");
        }
    }
}
