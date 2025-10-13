using System;

namespace GaleriePhotos.ViewModels
{
    public class DirectoryPathDateSuggestionViewModel
    {
        public DateTime? SuggestedDate { get; set; }
        public string DirectoryPath { get; set; }
        
        public DirectoryPathDateSuggestionViewModel(string directoryPath, DateTime? suggestedDate)
        {
            DirectoryPath = directoryPath;
            SuggestedDate = suggestedDate;
        }
    }
}