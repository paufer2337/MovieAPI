using System.Text;
using Microsoft.Extensions.Options;

namespace MovieApi.Options;

public sealed class JwtOptionsValidator : IValidateOptions<JwtOptions>
{
    public ValidateOptionsResult Validate(string? name, JwtOptions options)
    {
        var errors = new List<string>();

        AddRequiredError(options.Issuer, "Jwt:Issuer", errors);
        AddRequiredError(options.Audience, "Jwt:Audience", errors);
        AddRequiredError(options.Key, "Jwt:Key", errors);
        AddRequiredError(options.AdminUsername, "Jwt:AdminUsername", errors);
        AddRequiredError(options.AdminPassword, "Jwt:AdminPassword", errors);

        if (!string.IsNullOrWhiteSpace(options.Key) &&
            Encoding.UTF8.GetByteCount(options.Key) < 32)
        {
            errors.Add("Jwt:Key must contain at least 32 UTF-8 bytes.");
        }

        if (options.AccessTokenMinutes is < 1 or > 120)
        {
            errors.Add("Jwt:AccessTokenMinutes must be between 1 and 120.");
        }

        return errors.Count == 0
            ? ValidateOptionsResult.Success
            : ValidateOptionsResult.Fail(errors.Select(error =>
                $"{error} Use user-secrets or Jwt__... environment variables for secrets."));
    }

    private static void AddRequiredError(
        string value,
        string configurationKey,
        List<string> errors)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            errors.Add($"{configurationKey} is required.");
        }
    }
}
