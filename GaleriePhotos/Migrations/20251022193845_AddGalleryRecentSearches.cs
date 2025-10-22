using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GaleriePhotos.Migrations
{
    /// <inheritdoc />
    public partial class AddGalleryRecentSearches : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "GalleryRecentSearches",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Query = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    GalleryId = table.Column<int>(type: "integer", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GalleryRecentSearches", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GalleryRecentSearches_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GalleryRecentSearches_Galleries_GalleryId",
                        column: x => x.GalleryId,
                        principalTable: "Galleries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_GalleryRecentSearches_GalleryId_UserId_CreatedAtUtc",
                table: "GalleryRecentSearches",
                columns: new[] { "GalleryId", "UserId", "CreatedAtUtc" });

            migrationBuilder.CreateIndex(
                name: "IX_GalleryRecentSearches_GalleryId_UserId_Query",
                table: "GalleryRecentSearches",
                columns: new[] { "GalleryId", "UserId", "Query" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_GalleryRecentSearches_UserId",
                table: "GalleryRecentSearches",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "GalleryRecentSearches");
        }
    }
}
