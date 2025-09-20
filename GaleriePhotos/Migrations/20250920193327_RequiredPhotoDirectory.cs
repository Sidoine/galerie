using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GaleriePhotos.Migrations
{
    /// <inheritdoc />
    public partial class RequiredPhotoDirectory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM \"FaceNames\";");
            migrationBuilder.Sql("DELETE FROM \"Faces\";");
            migrationBuilder.Sql("DELETE FROM \"Photos\";");
            migrationBuilder.Sql("UPDATE \"PhotoDirectories\" SET \"CoverPhotoId\"=NULL;");

            migrationBuilder.DropForeignKey(
                name: "FK_Photos_Galleries_GalleryId",
                table: "Photos");

            migrationBuilder.AlterColumn<int>(
                name: "GalleryId",
                table: "Photos",
                type: "integer",
                nullable: true,
                oldClrType: typeof(int),
                oldType: "integer");

            migrationBuilder.AddColumn<int>(
                name: "DirectoryId",
                table: "Photos",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "PhotoDirectoryType",
                table: "PhotoDirectories",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Photos_DirectoryId",
                table: "Photos",
                column: "DirectoryId");

            migrationBuilder.AddForeignKey(
                name: "FK_Photos_Galleries_GalleryId",
                table: "Photos",
                column: "GalleryId",
                principalTable: "Galleries",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_Photos_PhotoDirectories_DirectoryId",
                table: "Photos",
                column: "DirectoryId",
                principalTable: "PhotoDirectories",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Photos_Galleries_GalleryId",
                table: "Photos");

            migrationBuilder.DropForeignKey(
                name: "FK_Photos_PhotoDirectories_DirectoryId",
                table: "Photos");

            migrationBuilder.DropIndex(
                name: "IX_Photos_DirectoryId",
                table: "Photos");

            migrationBuilder.DropColumn(
                name: "DirectoryId",
                table: "Photos");

            migrationBuilder.DropColumn(
                name: "PhotoDirectoryType",
                table: "PhotoDirectories");

            migrationBuilder.AlterColumn<int>(
                name: "GalleryId",
                table: "Photos",
                type: "integer",
                nullable: false,
                defaultValue: 0,
                oldClrType: typeof(int),
                oldType: "integer",
                oldNullable: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Photos_Galleries_GalleryId",
                table: "Photos",
                column: "GalleryId",
                principalTable: "Galleries",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }
    }
}
