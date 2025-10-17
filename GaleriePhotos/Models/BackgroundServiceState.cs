using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace GaleriePhotos.Models
{
    public class BackgroundServiceState
    {
        [Key]
        [MaxLength(128)]
        public required string Id { get; set; }

        [Column(TypeName = "jsonb")]
        public required string State { get; set; }
    }
}
