using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Pgvector;

namespace GaleriePhotos.Models
{
    public class Face
    {
        public int Id { get; set; }
        
        [Required]
        public int PhotoId { get; set; }
        
        [Required]
        [Column(TypeName = "vector(512)")]
        public required Vector Embedding { get; set; }
        
        [Required]
        public float X { get; set; }
        
        [Required]
        public float Y { get; set; }
        
        [Required]
        public float Width { get; set; }
        
        [Required]
        public float Height { get; set; }
        
        public int? FaceNameId { get; set; }
        
        public int? AutoNamedFromFaceId { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? NamedAt { get; set; }
        
        // Navigation properties
        public required Photo Photo { get; set; }
        public FaceName? FaceName { get; set; }
        public Face? AutoNamedFromFace { get; set; }
    }
}