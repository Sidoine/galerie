using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GaleriePhotos.Migrations
{
    /// <inheritdoc />
    public partial class AddPhotoCollections : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PhotoCollections",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GalleryId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PhotoCollections", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PhotoCollections_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PhotoCollections_Galleries_GalleryId",
                        column: x => x.GalleryId,
                        principalTable: "Galleries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PhotoCollectionPhotos",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PhotoCollectionId = table.Column<int>(type: "integer", nullable: false),
                    PhotoId = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PhotoCollectionPhotos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PhotoCollectionPhotos_PhotoCollections_PhotoCollectionId",
                        column: x => x.PhotoCollectionId,
                        principalTable: "PhotoCollections",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PhotoCollectionPhotos_Photos_PhotoId",
                        column: x => x.PhotoId,
                        principalTable: "Photos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PhotoCollectionPhotos_PhotoCollectionId_PhotoId",
                table: "PhotoCollectionPhotos",
                columns: new[] { "PhotoCollectionId", "PhotoId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PhotoCollectionPhotos_PhotoId",
                table: "PhotoCollectionPhotos",
                column: "PhotoId");

            migrationBuilder.CreateIndex(
                name: "IX_PhotoCollections_GalleryId_UserId_Name",
                table: "PhotoCollections",
                columns: new[] { "GalleryId", "UserId", "Name" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PhotoCollections_UserId",
                table: "PhotoCollections",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PhotoCollectionPhotos");

            migrationBuilder.DropTable(
                name: "PhotoCollections");
        }
    }
}
