using System;
using System.Collections.Generic;
using System.Globalization;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;

namespace GaleriePhotos.Services
{
    internal static class PhotoFileNameDateHelper
    {
        private static readonly Regex DateWithSeparatorsRegex = new(@"^(\d{4})[-_](\d{1,2})[-_](\d{1,2})", RegexOptions.Compiled);
        private static readonly Regex DateWithoutSeparatorsRegex = new(@"^(\d{4})(\d{2})(\d{2})", RegexOptions.Compiled);

        /// <summary>
        /// Attempts to infer the capture date from the file name using common date patterns.
        /// </summary>
        public static DateTime? DeduceCaptureDateFromFileName(string fileName)
        {
            var match = DateWithSeparatorsRegex.Match(fileName);
            if (match.Success)
            {
                try
                {
                    var year = int.Parse(match.Groups[1].Value, CultureInfo.InvariantCulture);
                    var month = int.Parse(match.Groups[2].Value, CultureInfo.InvariantCulture);
                    var day = int.Parse(match.Groups[3].Value, CultureInfo.InvariantCulture);

                    if (year >= 1900 && year <= DateTime.UtcNow.Year + 1)
                    {
                        return new DateTime(year, month, day, 0, 0, 0, DateTimeKind.Utc);
                    }
                }
                catch
                {
                    // Ignore parsing errors
                }
            }

            match = DateWithoutSeparatorsRegex.Match(fileName);
            if (match.Success)
            {
                try
                {
                    var year = int.Parse(match.Groups[1].Value, CultureInfo.InvariantCulture);
                    var month = int.Parse(match.Groups[2].Value, CultureInfo.InvariantCulture);
                    var day = int.Parse(match.Groups[3].Value, CultureInfo.InvariantCulture);

                    if (year >= 1900 && year <= DateTime.UtcNow.Year + 1)
                    {
                        return new DateTime(year, month, day, 0, 0, 0, DateTimeKind.Utc);
                    }
                }
                catch
                {
                    // Ignore parsing errors
                }
            }

            return null;
        }
    }
}
