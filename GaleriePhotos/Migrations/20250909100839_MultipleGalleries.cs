using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace GaleriePhotos.Migrations
{
    /// <inheritdoc />
    public partial class MultipleGalleries : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "GalleryId",
                table: "Photos",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "GalleryId",
                table: "PhotoDirectories",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateTable(
                name: "Galleries",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(type: "text", nullable: false),
                    RootDirectory = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Galleries", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "GalleryMembers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GalleryId = table.Column<int>(type: "integer", nullable: false),
                    UserId = table.Column<string>(type: "text", nullable: false),
                    DirectoryVisibility = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GalleryMembers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GalleryMembers_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_GalleryMembers_Galleries_GalleryId",
                        column: x => x.GalleryId,
                        principalTable: "Galleries",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            // Data migration: Create default gallery
            migrationBuilder.Sql(@"
                INSERT INTO ""Galleries"" (""Name"", ""RootDirectory"") VALUES ('Default Gallery', '');
            ");

            // Data migration: Update existing Photos and PhotoDirectories to reference default gallery
            migrationBuilder.Sql(@"
                UPDATE ""Photos"" SET ""GalleryId"" = (SELECT ""Id"" FROM ""Galleries"" WHERE ""Name"" = 'Default Gallery');
            ");

            migrationBuilder.Sql(@"
                UPDATE ""PhotoDirectories"" SET ""GalleryId"" = (SELECT ""Id"" FROM ""Galleries"" WHERE ""Name"" = 'Default Gallery');
            ");

            // Data migration: Create GalleryMembers for existing users based on their claims
            migrationBuilder.Sql(@"
                INSERT INTO ""GalleryMembers"" (""GalleryId"", ""UserId"", ""DirectoryVisibility"")
                SELECT 
                    g.""Id"",
                    u.""Id"",
                    CASE 
                        WHEN ac.""ClaimValue"" = 'SidoineEtMylene' THEN 3
                        WHEN ac.""ClaimValue"" = 'Sidoine' THEN 2
                        WHEN ac.""ClaimValue"" = 'Mylene' THEN 1
                        ELSE 0
                    END
                FROM ""AspNetUsers"" u
                CROSS JOIN ""Galleries"" g
                LEFT JOIN ""AspNetUserClaims"" ac ON u.""Id"" = ac.""UserId"" AND ac.""ClaimType"" = 'Visibility'
                WHERE g.""Name"" = 'Default Gallery';
            ");

            migrationBuilder.CreateIndex(
                name: "IX_Photos_GalleryId",
                table: "Photos",
                column: "GalleryId");

            migrationBuilder.CreateIndex(
                name: "IX_PhotoDirectories_GalleryId",
                table: "PhotoDirectories",
                column: "GalleryId");

            migrationBuilder.CreateIndex(
                name: "IX_GalleryMembers_GalleryId",
                table: "GalleryMembers",
                column: "GalleryId");

            migrationBuilder.CreateIndex(
                name: "IX_GalleryMembers_UserId",
                table: "GalleryMembers",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_PhotoDirectories_Galleries_GalleryId",
                table: "PhotoDirectories",
                column: "GalleryId",
                principalTable: "Galleries",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Photos_Galleries_GalleryId",
                table: "Photos",
                column: "GalleryId",
                principalTable: "Galleries",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_PhotoDirectories_Galleries_GalleryId",
                table: "PhotoDirectories");

            migrationBuilder.DropForeignKey(
                name: "FK_Photos_Galleries_GalleryId",
                table: "Photos");

            migrationBuilder.DropTable(
                name: "GalleryMembers");

            migrationBuilder.DropTable(
                name: "Galleries");

            migrationBuilder.DropIndex(
                name: "IX_Photos_GalleryId",
                table: "Photos");

            migrationBuilder.DropIndex(
                name: "IX_PhotoDirectories_GalleryId",
                table: "PhotoDirectories");

            migrationBuilder.DropColumn(
                name: "GalleryId",
                table: "Photos");

            migrationBuilder.DropColumn(
                name: "GalleryId",
                table: "PhotoDirectories");
        }
    }
}
