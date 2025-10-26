using System;

namespace GaleriePhotos.ViewModels
{
    public enum DateJumpType
    {
        Year,
        Month
    }

    public class DateJumpViewModel
    {
        public DateJumpType Type { get; set; }
        public DateTime Date { get; set; }
        public string Label { get; set; } = string.Empty;
    }
}
