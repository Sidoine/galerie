using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GaleriePhotos.Migrations
{
    /// <inheritdoc />
    public partial class AddIndexes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Photos_DirectoryId_FileName",
                table: "Photos",
                columns: new[] { "DirectoryId", "FileName" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PhotoDirectories_GalleryId_Path",
                table: "PhotoDirectories",
                columns: new[] { "GalleryId", "Path" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_Faces_Embedding",
                table: "Faces",
                column: "Embedding")
                .Annotation("Npgsql:IndexMethod", "ivfflat")
                .Annotation("Npgsql:IndexOperators", new[] { "vector_l2_ops" });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Photos_DirectoryId_FileName",
                table: "Photos");

            migrationBuilder.DropIndex(
                name: "IX_PhotoDirectories_GalleryId_Path",
                table: "PhotoDirectories");

            migrationBuilder.DropIndex(
                name: "IX_Faces_Embedding",
                table: "Faces");
        }
    }
}
