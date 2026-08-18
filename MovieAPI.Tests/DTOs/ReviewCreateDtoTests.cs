using System.ComponentModel.DataAnnotations;
using MovieApi.DTOs;

namespace MovieAPI.Tests.DTOs;

public class ReviewCreateDtoTests
{
    [Theory]
    [InlineData(0)]
    [InlineData(6)]
    public void RatingOutsideOneToFive_IsInvalid(int rating)
    {
        var dto = CreateValidDto();
        dto.Rating = rating;

        Assert.False(IsValid(dto));
    }

    [Theory]
    [InlineData("")]
    [InlineData("A")]
    public void MissingOrTooShortReviewer_IsInvalid(string reviewerName)
    {
        var dto = CreateValidDto();
        dto.ReviewerName = reviewerName;

        Assert.False(IsValid(dto));
    }

    [Theory]
    [InlineData("")]
    [InlineData("Too short")]
    public void MissingOrTooShortComment_IsInvalid(string comment)
    {
        var dto = CreateValidDto();
        dto.Comment = comment;

        Assert.False(IsValid(dto));
    }

    [Theory]
    [InlineData(1)]
    [InlineData(5)]
    public void ValidRatingAndFields_AreAccepted(int rating)
    {
        var dto = CreateValidDto();
        dto.Rating = rating;

        Assert.True(IsValid(dto));
    }

    private static ReviewCreateDto CreateValidDto() => new()
    {
        ReviewerName = "Archive Visitor",
        Comment = "A thoughtful review comment.",
        Rating = 4
    };

    private static bool IsValid(ReviewCreateDto dto)
    {
        var results = new List<ValidationResult>();
        return Validator.TryValidateObject(dto, new ValidationContext(dto), results, true);
    }
}
