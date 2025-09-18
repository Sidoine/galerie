using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace GaleriePhotos.Models
{
    public class FaceName
    {
        public int Id { get; set; }
        
        [Required]
        public string Name { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties
        public ICollection<Face> Faces { get; set; } = new List<Face>();
    }
}