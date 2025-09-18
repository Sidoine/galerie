using System;
using System.ComponentModel.DataAnnotations;
using Pgvector;

namespace GaleriePhotos.Models
{
    public class Face
    {
        public int Id { get; set; }
        
        [Required]
        public int PhotoId { get; set; }
        
        [Required]
        public required Vector Embedding { get; set; }
        
        [Required]
        public float X { get; set; }
        
        [Required]
        public float Y { get; set; }
        
        [Required]
        public float Width { get; set; }
        
        [Required]
        public float Height { get; set; }
        
        public string? Name { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? NamedAt { get; set; }
        
        // Navigation properties
        public required Photo Photo { get; set; }
    }
}