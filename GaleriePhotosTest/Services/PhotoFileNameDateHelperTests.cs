using System;
using GaleriePhotos.Services;
using Xunit;

namespace GaleriePhotosTest.Services
{
    public class PhotoFileNameDateHelperTests
    {
        [Theory]
        [InlineData("2021-07-15_photo.jpg", 2021, 7, 15)]
        [InlineData("2021_07_05-something.png", 2021, 7, 5)]
        [InlineData("20210715another.png", 2021, 7, 15)]
        [InlineData("1900-01-01_test.jpg", 1900, 1, 1)]
        [InlineData("2026-12-31.doc", 2026, 12, 31)]
        [InlineData("2021-1-1.jpeg", 2021, 1, 1)]
        public void DeduceCaptureDateFromFileName_ValidDates_ReturnsDate(string fileName, int year, int month, int day)
        {
            var result = PhotoFileNameDateHelper.DeduceCaptureDateFromFileName(fileName);
            Assert.NotNull(result);
            Assert.Equal(DateTimeKind.Utc, result.Value.Kind);
            Assert.Equal(new DateTime(year, month, day, 0, 0, 0, DateTimeKind.Utc), result.Value);
        }

        [Theory]
        [InlineData("1899-12-31.txt")]
        [InlineData("2027-01-01.txt")]
        [InlineData("2021-02-30.jpg")]
        [InlineData("foobar.jpg")]
        [InlineData("foo2021-07-15.jpg")]
        public void DeduceCaptureDateFromFileName_InvalidDates_ReturnsNull(string fileName)
        {
            var result = PhotoFileNameDateHelper.DeduceCaptureDateFromFileName(fileName);
            Assert.Null(result);
        }
    }
}
