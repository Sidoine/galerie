using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GaleriePhotos.Migrations
{
    /// <inheritdoc />
    public partial class GalleryMemberAdministrator : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsAdministrator",
                table: "GalleryMembers",
                type: "boolean",
                nullable: false,
                defaultValue: false);

                
            // Migration rule: any user having the global Administrator claim becomes administrator of all galleries they belong to.
            migrationBuilder.Sql(@"UPDATE ""GalleryMembers"" gm
SET ""IsAdministrator"" = TRUE
FROM ""AspNetUserClaims"" c
WHERE c.""UserId"" = gm.""UserId""
    AND c.""ClaimType"" = 'Administrator'
    AND c.""ClaimValue"" = 'True';");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsAdministrator",
                table: "GalleryMembers");
        }
    }
}
