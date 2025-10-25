using System;
using System.Collections.Generic;
using System.Linq;
using GaleriePhotos.Services;
using GaleriePhotos.ViewModels;
using Xunit;

namespace GaleriePhotosTest.Services
{
    public class DateJumpHelperTests
    {
        [Fact]
        public void CalculateDateJumps_LessThan2Months_ReturnsEmptyList()
        {
            // Arrange
            var minDate = new DateTime(2024, 1, 1);
            var maxDate = new DateTime(2024, 2, 15);
            var photoDates = new List<DateTime>
            {
                new DateTime(2024, 1, 5),
                new DateTime(2024, 1, 15),
                new DateTime(2024, 2, 10)
            };

            // Act
            var result = DateJumpHelper.CalculateDateJumps(minDate, maxDate, photoDates);

            // Assert
            Assert.Empty(result);
        }

        [Fact]
        public void CalculateDateJumps_MoreThan24Months_ReturnsYears()
        {
            // Arrange
            var minDate = new DateTime(2022, 1, 1);
            var maxDate = new DateTime(2024, 6, 1);
            var photoDates = new List<DateTime>
            {
                new DateTime(2022, 3, 15),
                new DateTime(2022, 8, 20),
                new DateTime(2023, 2, 10),
                new DateTime(2023, 9, 5),
                new DateTime(2024, 4, 25)
            };

            // Act
            var result = DateJumpHelper.CalculateDateJumps(minDate, maxDate, photoDates);

            // Assert
            Assert.NotEmpty(result);
            Assert.All(result, jump => Assert.Equal(DateJumpType.Year, jump.Type));
            Assert.Equal(3, result.Count); // 2022, 2023, 2024
            Assert.Equal("2022", result[0].Label);
            Assert.Equal("2023", result[1].Label);
            Assert.Equal("2024", result[2].Label);
        }

        [Fact]
        public void CalculateDateJumps_Between2And24Months_ReturnsMonths()
        {
            // Arrange
            var minDate = new DateTime(2024, 1, 1);
            var maxDate = new DateTime(2024, 6, 30);
            var photoDates = new List<DateTime>
            {
                new DateTime(2024, 1, 15),
                new DateTime(2024, 2, 20),
                new DateTime(2024, 4, 10),
                new DateTime(2024, 6, 5)
            };

            // Act
            var result = DateJumpHelper.CalculateDateJumps(minDate, maxDate, photoDates);

            // Assert
            Assert.NotEmpty(result);
            Assert.All(result, jump => Assert.Equal(DateJumpType.Month, jump.Type));
            Assert.Equal(4, result.Count); // January, February, April, June
            Assert.Contains(result, j => j.Label.Contains("janvier"));
            Assert.Contains(result, j => j.Label.Contains("février"));
            Assert.Contains(result, j => j.Label.Contains("avril"));
            Assert.Contains(result, j => j.Label.Contains("juin"));
        }

        [Fact]
        public void CalculateDateJumps_NoDates_ReturnsEmptyList()
        {
            // Arrange
            var minDate = new DateTime(2024, 1, 1);
            var maxDate = new DateTime(2024, 12, 31);
            var photoDates = new List<DateTime>();

            // Act
            var result = DateJumpHelper.CalculateDateJumps(minDate, maxDate, photoDates);

            // Assert
            Assert.Empty(result);
        }

        [Fact]
        public void CalculateDateJumps_MinValueDates_ReturnsEmptyList()
        {
            // Arrange
            var minDate = DateTime.MinValue;
            var maxDate = DateTime.MinValue;
            var photoDates = new List<DateTime>();

            // Act
            var result = DateJumpHelper.CalculateDateJumps(minDate, maxDate, photoDates);

            // Assert
            Assert.Empty(result);
        }

        [Fact]
        public void CalculateDateJumps_DuplicateDates_ReturnsDistinctJumps()
        {
            // Arrange
            var minDate = new DateTime(2024, 1, 1);
            var maxDate = new DateTime(2024, 6, 30);
            var photoDates = new List<DateTime>
            {
                new DateTime(2024, 1, 15),
                new DateTime(2024, 1, 20), // Same month
                new DateTime(2024, 1, 25), // Same month
                new DateTime(2024, 3, 10),
                new DateTime(2024, 3, 15)  // Same month
            };

            // Act
            var result = DateJumpHelper.CalculateDateJumps(minDate, maxDate, photoDates);

            // Assert
            Assert.NotEmpty(result);
            Assert.Equal(2, result.Count); // Only January and March
        }

        [Fact]
        public void CalculateDateJumps_OrderedByDate()
        {
            // Arrange
            var minDate = new DateTime(2024, 1, 1);
            var maxDate = new DateTime(2024, 6, 30);
            var photoDates = new List<DateTime>
            {
                new DateTime(2024, 5, 15),
                new DateTime(2024, 1, 20),
                new DateTime(2024, 3, 10),
                new DateTime(2024, 2, 5)
            };

            // Act
            var result = DateJumpHelper.CalculateDateJumps(minDate, maxDate, photoDates);

            // Assert
            Assert.NotEmpty(result);
            // Verify dates are in order
            for (int i = 0; i < result.Count - 1; i++)
            {
                Assert.True(result[i].Date < result[i + 1].Date);
            }
        }
    }
}
