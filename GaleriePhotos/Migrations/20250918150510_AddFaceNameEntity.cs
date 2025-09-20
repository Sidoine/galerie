using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GaleriePhotos.Migrations
{
    /// <inheritdoc />
    public partial class AddFaceNameEntity : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Faces_Name",
                table: "Faces");

            migrationBuilder.DropColumn(
                name: "Name",
                table: "Faces");

            migrationBuilder.AddColumn<int>(
                name: "FaceNameId",
                table: "Faces",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "FaceNames",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_FaceNames", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Faces_FaceNameId",
                table: "Faces",
                column: "FaceNameId");

            migrationBuilder.CreateIndex(
                name: "IX_FaceNames_Name",
                table: "FaceNames",
                column: "Name",
                unique: true);

            migrationBuilder.AddForeignKey(
                name: "FK_Faces_FaceNames_FaceNameId",
                table: "Faces",
                column: "FaceNameId",
                principalTable: "FaceNames",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Faces_FaceNames_FaceNameId",
                table: "Faces");

            migrationBuilder.DropTable(
                name: "FaceNames");

            migrationBuilder.DropIndex(
                name: "IX_Faces_FaceNameId",
                table: "Faces");

            migrationBuilder.DropColumn(
                name: "FaceNameId",
                table: "Faces");

            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "Faces",
                type: "text",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Faces_Name",
                table: "Faces",
                column: "Name");
        }
    }
}
