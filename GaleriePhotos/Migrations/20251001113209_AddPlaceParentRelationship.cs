using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace GaleriePhotos.Migrations
{
    /// <inheritdoc />
    public partial class AddPlaceParentRelationship : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "ParentId",
                table: "Places",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "Type",
                table: "Places",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.CreateIndex(
                name: "IX_Places_ParentId",
                table: "Places",
                column: "ParentId");

            migrationBuilder.CreateIndex(
                name: "IX_Places_Type",
                table: "Places",
                column: "Type");

            migrationBuilder.AddForeignKey(
                name: "FK_Places_Places_ParentId",
                table: "Places",
                column: "ParentId",
                principalTable: "Places",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Places_Places_ParentId",
                table: "Places");

            migrationBuilder.DropIndex(
                name: "IX_Places_ParentId",
                table: "Places");

            migrationBuilder.DropIndex(
                name: "IX_Places_Type",
                table: "Places");

            migrationBuilder.DropColumn(
                name: "ParentId",
                table: "Places");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "Places");
        }
    }
}
