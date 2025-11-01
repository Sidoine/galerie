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
            this IQueryable<Photo> query,
            string sortOrder,
            int offset,
            int count,
            DateTime? startDate = null)
        {
            // If startDate is provided, filter from that date
            // For negative offsets, we need to invert the filter direction
            if (startDate.HasValue)
            {
                // Specify kind as UTC to avoid DateTime comparison errors with PostgreSQL
                var dateWithKind = DateTime.SpecifyKind(startDate.Value, DateTimeKind.Utc);

                query = sortOrder == "asc"
                    ? query.Where(p => p.DateTime >= dateWithKind)
                    : query.Where(p => p.DateTime <= dateWithKind);
            }

            // Apply sorting
            var orderedQuery = sortOrder == "asc"
                ? query.OrderBy(p => p.DateTime)
                : query.OrderByDescending(p => p.DateTime);

            // Apply pagination
            return orderedQuery.Skip(offset).Take(count);
        }

        public static IQueryable<Photo> ApplyRights(
            this IQueryable<Photo> query,
            GalleryMember galleryMember)
        {
            if (galleryMember.IsAdministrator)
            {
                return query;
            }
            return query.Where(x => (x.Directory.Visibility & galleryMember.DirectoryVisibility) != 0);
        }
    }
}
