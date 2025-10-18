using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GaleriePhotos.Migrations
{
    /// <inheritdoc />
    public partial class AddAutoNamedFromFaceId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AutoNamedFromFaceId",
                table: "Faces",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Faces_AutoNamedFromFaceId",
                table: "Faces",
                column: "AutoNamedFromFaceId");

            migrationBuilder.AddForeignKey(
                name: "FK_Faces_Faces_AutoNamedFromFaceId",
                table: "Faces",
                column: "AutoNamedFromFaceId",
                principalTable: "Faces",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Faces_Faces_AutoNamedFromFaceId",
                table: "Faces");

            migrationBuilder.DropIndex(
                name: "IX_Faces_AutoNamedFromFaceId",
                table: "Faces");

            migrationBuilder.DropColumn(
                name: "AutoNamedFromFaceId",
                table: "Faces");
        }
    }
}
