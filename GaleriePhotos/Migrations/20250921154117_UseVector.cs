using Microsoft.EntityFrameworkCore.Migrations;
using Pgvector;

#nullable disable

namespace GaleriePhotos.Migrations
{
    /// <inheritdoc />
    public partial class UseVector : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("DELETE FROM \"Faces\";");
            migrationBuilder.Sql("UPDATE \"Photos\" SET \"FaceDetectionStatus\"=0;");
            migrationBuilder.DropColumn("Embedding", "Faces");
            migrationBuilder.AddColumn<Vector>(
                name: "Embedding",
                table: "Faces",
                type: "vector(512)",
                nullable: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "Embedding",
                table: "Faces",
                type: "text",
                nullable: false,
                oldClrType: typeof(Vector),
                oldType: "vector(512)");
        }
    }
}
