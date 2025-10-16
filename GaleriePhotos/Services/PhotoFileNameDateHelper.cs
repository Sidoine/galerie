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
        private static readonly Regex FileNameDateCandidateRegex = new Regex(@"(?<!\d)\d{4}[-_.]?\d{2}[-_.]?\d{2}(?:[-_. Tt]?\d{2}[:\-_.]?\d{2}(?:[:\-_.]?\d{2})?)?(?!\d)", RegexOptions.Compiled | RegexOptions.CultureInvariant);

        /// <summary>
        /// Attempts to infer the capture date from the file name using common date patterns.
        /// </summary>
        public static DateTime? DeduceCaptureDateFromFileName(string fileName)
        {
            if (string.IsNullOrWhiteSpace(fileName))
            {
                return null;
            }

            var baseName = Path.GetFileNameWithoutExtension(fileName);
            if (string.IsNullOrWhiteSpace(baseName))
            {
                return null;
            }

            foreach (var source in EnumerateDateCandidateSources(baseName))
            {
                var matches = FileNameDateCandidateRegex
                    .Matches(source)
                    .Cast<Match>()
                    .OrderByDescending(m => m.Value.Count(char.IsDigit));

                foreach (var match in matches)
                {
                    var inferredDate = BuildDateFromDigits(match.Value);
                    if (inferredDate.HasValue)
                    {
                        return inferredDate.Value;
                    }
                }
            }

            return null;
        }

        private static IEnumerable<string> EnumerateDateCandidateSources(string baseName)
        {
            var seen = new HashSet<string>(StringComparer.Ordinal);

            if (!string.IsNullOrWhiteSpace(baseName) && seen.Add(baseName))
            {
                yield return baseName;
            }

            var cleaned = Regex.Replace(baseName, @"[A-Za-z]+", " ");
            cleaned = Regex.Replace(cleaned, @"\s+", " ").Trim();
            if (!string.IsNullOrWhiteSpace(cleaned) && seen.Add(cleaned))
            {
                yield return cleaned;
            }

            var digitsOnly = new string(baseName.Where(char.IsDigit).ToArray());
            if (!string.IsNullOrWhiteSpace(digitsOnly) && seen.Add(digitsOnly))
            {
                yield return digitsOnly;
            }

            var digitsGrouped = string.Join(" ", Regex.Matches(baseName, @"\d+").Cast<Match>().Select(m => m.Value));
            if (!string.IsNullOrWhiteSpace(digitsGrouped) && seen.Add(digitsGrouped))
            {
                yield return digitsGrouped;
            }
        }

        private static DateTime? BuildDateFromDigits(string candidate)
        {
            var digits = new string(candidate.Where(char.IsDigit).ToArray());
            if (digits.Length < 8)
            {
                return null;
            }

            if (digits.Length > 14)
            {
                digits = digits.Substring(0, 14);
            }

            if (digits.Length != 8 && digits.Length != 10 && digits.Length != 12 && digits.Length != 14)
            {
                return null;
            }

            try
            {
                var year = int.Parse(digits.Substring(0, 4), CultureInfo.InvariantCulture);
                var month = int.Parse(digits.Substring(4, 2), CultureInfo.InvariantCulture);
                var day = int.Parse(digits.Substring(6, 2), CultureInfo.InvariantCulture);

                var hour = 0;
                var minute = 0;
                var second = 0;

                if (digits.Length >= 10)
                {
                    hour = int.Parse(digits.Substring(8, 2), CultureInfo.InvariantCulture);
                }

                if (digits.Length >= 12)
                {
                    minute = int.Parse(digits.Substring(10, 2), CultureInfo.InvariantCulture);
                }

                if (digits.Length >= 14)
                {
                    second = int.Parse(digits.Substring(12, 2), CultureInfo.InvariantCulture);
                }

                return new DateTime(year, month, day, hour, minute, second, DateTimeKind.Utc);
            }
            catch
            {
                return null;
            }
        }
    }
}
