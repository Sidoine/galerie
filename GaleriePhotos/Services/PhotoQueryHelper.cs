using GaleriePhotos.Models;
using System;
using System.Linq;

namespace GaleriePhotos.Services
{
    public static class PhotoQueryHelper
    {
        /// <summary>
        /// Apply sorting and offset logic to a photo query, including support for negative offsets
        /// </summary>
        public static IQueryable<Photo> ApplySortingAndOffset(
            IQueryable<Photo> query,
            string sortOrder,
            int offset,
            int count,
            DateTime? startDate = null)
        {
            // If startDate is provided, filter from that date
            if (startDate.HasValue)
            {
                // Specify kind as UTC to avoid DateTime comparison errors with PostgreSQL
                var dateWithKind = DateTime.SpecifyKind(startDate.Value, DateTimeKind.Utc);
                query = sortOrder == "asc"
                    ? query.Where(p => p.DateTime >= dateWithKind)
                    : query.Where(p => p.DateTime <= dateWithKind);
            }

            // Handle negative offsets by reversing sort order
            bool reverseSort = offset < 0;
            int absOffset = Math.Abs(offset);

            // Apply sorting
            var orderedQuery = (sortOrder == "asc" && !reverseSort) || (sortOrder == "desc" && reverseSort)
                ? query.OrderBy(p => p.DateTime)
                : query.OrderByDescending(p => p.DateTime);

            // Apply pagination
            return orderedQuery.Skip(absOffset).Take(count);
        }

        /// <summary>
        /// Check if results need to be reversed after query execution (for negative offset)
        /// </summary>
        public static bool ShouldReverseResults(int offset)
        {
            return offset < 0;
        }
    }
}
