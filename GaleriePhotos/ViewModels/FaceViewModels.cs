using System;

namespace GaleriePhotos.ViewModels
{
    public class FaceViewModel
    {
        public int Id { get; set; }
        public int PhotoId { get; set; }
        public float X { get; set; }
        public float Y { get; set; }
        public float Width { get; set; }
        public float Height { get; set; }
        public string? Name { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? NamedAt { get; set; }
    }

    public class FaceAssignNameViewModel
    {
        public string Name { get; set; } = string.Empty;
    }

    public class SimilarFacesRequestViewModel
    {
        public string Name { get; set; } = string.Empty;
        public int Limit { get; set; } = 10;
    }

    public class UnnamedFacesSampleRequestViewModel
    {
        public int Count { get; set; } = 20;
    }

    public class FaceNameSuggestionRequestViewModel
    {
        public float Threshold { get; set; } = 0.7f; // défaut
    }

    public class FaceNameSuggestionResponseViewModel
    {
        public string? Name { get; set; }
    }
}