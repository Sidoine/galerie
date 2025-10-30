using GaleriePhotos.Models;
using GaleriePhotos.Services;
using System;
using System.Collections.Generic;
using System.Linq;
using Xunit;

#pragma warning disable CS8625 // Cannot convert null literal to non-nullable reference type

namespace GaleriePhotosTest.Services
{
    public class PhotoQueryHelperTests
    {
        private static List<Photo> CreateTestPhotos()
        {
            // Create photos spanning Jan to April 2024
            var photos = new List<Photo>();
            var baseDate = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc);

            for (int i = 0; i < 120; i++)
            {
                photos.Add(new Photo($"Photo {i + 1}.jpg")
                {
                    Id = i + 1,
                    DateTime = baseDate.AddDays(i),
                    DirectoryId = 1,
                    // Set to null for test data as Directory navigation property is not needed for PhotoQueryHelper tests
                    Directory = null!
                });
            }

            return photos;
        }

        [Fact]
        public void ApplySortingAndOffset_WithStartDateAndPositiveOffset_FiltersCorrectly_Desc()
        {
            // Arrange
            var photos = CreateTestPhotos();
            var query = photos.AsQueryable();
            var marchFirst = new DateTime(2024, 3, 1, 0, 0, 0, DateTimeKind.Utc);

            // Act
            var result = PhotoQueryHelper.ApplySortingAndOffset(query, "desc", 0, 10, marchFirst).ToList();

            // Assert
            Assert.Equal(10, result.Count);
            // For desc order with positive offset, photos should be <= March 1
            Assert.All(result, p => Assert.True(p.DateTime <= marchFirst));
            // Photos should be in descending order
            for (int i = 0; i < result.Count - 1; i++)
            {
                Assert.True(result[i].DateTime >= result[i + 1].DateTime);
            }
            // First photo should be March 1 (the newest photo <= March 1)
            Assert.Equal(marchFirst, result[0].DateTime);
        }

        [Fact]
        public void ApplySortingAndOffset_WithStartDateAndPositiveOffset_FiltersCorrectly_Asc()
        {
            // Arrange
            var photos = CreateTestPhotos();
            var query = photos.AsQueryable();
            var marchFirst = new DateTime(2024, 3, 1, 0, 0, 0, DateTimeKind.Utc);

            // Act
            var result = PhotoQueryHelper.ApplySortingAndOffset(query, "asc", 0, 10, marchFirst).ToList();

            // Assert
            Assert.Equal(10, result.Count);
            // For asc order with positive offset, photos should be >= March 1
            Assert.All(result, p => Assert.True(p.DateTime >= marchFirst));
            // Photos should be in ascending order
            for (int i = 0; i < result.Count - 1; i++)
            {
                Assert.True(result[i].DateTime <= result[i + 1].DateTime);
            }
            // First photo should be March 1 (the oldest photo >= March 1)
            Assert.Equal(marchFirst, result[0].DateTime);
        }

        [Fact]
        public void ApplySortingAndOffset_WithoutStartDate_WorksCorrectly()
        {
            // Arrange
            var photos = CreateTestPhotos();
            var query = photos.AsQueryable();

            // Act
            var resultDesc = PhotoQueryHelper.ApplySortingAndOffset(query, "desc", 0, 10, null).ToList();
            var resultAsc = PhotoQueryHelper.ApplySortingAndOffset(query, "asc", 0, 10, null).ToList();

            // Assert
            Assert.Equal(10, resultDesc.Count);
            Assert.Equal(10, resultAsc.Count);

            // Desc: newest photos first
            for (int i = 0; i < resultDesc.Count - 1; i++)
            {
                Assert.True(resultDesc[i].DateTime >= resultDesc[i + 1].DateTime);
            }

            // Asc: oldest photos first
            for (int i = 0; i < resultAsc.Count - 1; i++)
            {
                Assert.True(resultAsc[i].DateTime <= resultAsc[i + 1].DateTime);
            }
        }
    }
}
