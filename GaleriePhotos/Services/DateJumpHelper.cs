using GaleriePhotos.ViewModels;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;

namespace GaleriePhotos.Services
{
    public static class DateJumpHelper
    {
        /// <summary>
        /// Calculate date jumps based on the date range and available photo dates.
        /// Returns an empty list if difference < 2 months, years if > 24 months, otherwise months.
        /// </summary>
        public static List<DateJumpViewModel> CalculateDateJumps(
            DateTime minDate, 
            DateTime maxDate, 
            IEnumerable<DateTime> photoDates)
        {
            var result = new List<DateJumpViewModel>();
            
            if (minDate == DateTime.MinValue || maxDate == DateTime.MinValue)
            {
                return result;
            }

            // Calculate the difference in months
            int monthsDifference = ((maxDate.Year - minDate.Year) * 12) + maxDate.Month - minDate.Month;

            // If less than 2 months, return empty list
            if (monthsDifference < 2)
            {
                return result;
            }

            // Get distinct dates with photos
            var distinctDates = photoDates.Distinct().OrderBy(d => d).ToList();

            if (monthsDifference > 24)
            {
                // Return years
                var years = distinctDates
                    .Select(d => d.Year)
                    .Distinct()
                    .OrderBy(y => y);

                foreach (var year in years)
                {
                    result.Add(new DateJumpViewModel
                    {
                        Type = DateJumpType.Year,
                        Date = new DateTime(year, 1, 1),
                        Label = year.ToString()
                    });
                }
            }
            else
            {
                // Return months
                var months = distinctDates
                    .Select(d => new { d.Year, d.Month })
                    .Distinct()
                    .OrderBy(ym => ym.Year).ThenBy(ym => ym.Month);

                var culture = CultureInfo.GetCultureInfo("fr-FR");
                foreach (var month in months)
                {
                    var date = new DateTime(month.Year, month.Month, 1);
                    result.Add(new DateJumpViewModel
                    {
                        Type = DateJumpType.Month,
                        Date = date,
                        Label = date.ToString("MMMM yyyy", culture)
                    });
                }
            }

            return result;
        }
    }
}
