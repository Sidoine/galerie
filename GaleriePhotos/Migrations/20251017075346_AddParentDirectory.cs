using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GaleriePhotos.Migrations
{
    /// <inheritdoc />
    public partial class AddParentDirectory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ParentDirectoryId",
                table: "PhotoDirectories",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_PhotoDirectories_ParentDirectoryId",
                table: "PhotoDirectories",
                column: "ParentDirectoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_PhotoDirectories_PhotoDirectories_ParentDirectoryId",
                table: "PhotoDirectories",
                column: "ParentDirectoryId",
                principalTable: "PhotoDirectories",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PhotoDirectories_PhotoDirectories_ParentDirectoryId",
                table: "PhotoDirectories");

            migrationBuilder.DropIndex(
                name: "IX_PhotoDirectories_ParentDirectoryId",
                table: "PhotoDirectories");

            migrationBuilder.DropColumn(
                name: "ParentDirectoryId",
                table: "PhotoDirectories");
        }
    }
}
