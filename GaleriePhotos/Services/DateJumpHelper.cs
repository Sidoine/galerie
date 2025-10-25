using GaleriePhotos.Models;
using GaleriePhotos.ViewModels;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;

namespace GaleriePhotos.Services
{
    public static class DateJumpHelper
    {
        /// <summary>
        /// Calculate date jumps based on the date range and available photo dates from a query.
        /// Returns an empty list if difference < 2 months, years if > 24 months, otherwise months.
        /// This method executes the query in SQL for efficiency.
        /// </summary>
        public static async Task<List<DateJumpViewModel>> CalculateDateJumpsAsync(
            DateTime minDate, 
            DateTime maxDate, 
            IQueryable<Photo> photoQuery)
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

            var culture = CultureInfo.GetCultureInfo("fr-FR");

            if (monthsDifference > 24)
            {
                // Return years - group by year in SQL
                var years = await photoQuery
                    .Select(p => p.DateTime.Year)
                    .Distinct()
                    .OrderBy(y => y)
                    .ToListAsync();

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
                // Return months - group by year and month in SQL
                var months = await photoQuery
                    .Select(p => new { p.DateTime.Year, p.DateTime.Month })
                    .Distinct()
                    .OrderBy(ym => ym.Year).ThenBy(ym => ym.Month)
                    .ToListAsync();

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
