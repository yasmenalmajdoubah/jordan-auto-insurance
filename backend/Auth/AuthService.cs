using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using JordanAutoInsurance.Api.Data;
using JordanAutoInsurance.Api.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

namespace JordanAutoInsurance.Api.Auth;

public record LoginRequest(string UserName, string Password);
public record LoginResponse(string Token, string UserName, string FullName, string Role, DateTime ExpiresAt);
public record RegisterUserRequest(string UserName, string FullName, string Email, string Password, string Role);

public class AuthService(AppDbContext db, IConfiguration config)
{
    public async Task<LoginResponse?> LoginAsync(LoginRequest request)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.UserName == request.UserName && u.IsActive);
        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return null;

        var expires = DateTime.UtcNow.AddHours(12);
        var token = CreateToken(user, expires);
        return new LoginResponse(token, user.UserName, user.FullName, user.Role, expires);
    }

    public async Task<AppUser> RegisterAsync(RegisterUserRequest request)
    {
        if (!DbSeeder.Roles.Contains(request.Role))
            throw new InvalidOperationException("Invalid role");

        if (await db.Users.AnyAsync(u => u.UserName == request.UserName))
            throw new InvalidOperationException("Username already exists");

        var user = new AppUser
        {
            UserName = request.UserName,
            FullName = request.FullName,
            Email = request.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = request.Role
        };
        db.Users.Add(user);
        await db.SaveChangesAsync();
        return user;
    }

    private string CreateToken(AppUser user, DateTime expires)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new System.Security.Claims.Claim(ClaimTypes.Name, user.UserName),
            new System.Security.Claims.Claim(ClaimTypes.Role, user.Role),
            new System.Security.Claims.Claim("fullName", user.FullName),
            new System.Security.Claims.Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: config["Jwt:Issuer"],
            audience: config["Jwt:Audience"],
            claims: claims,
            expires: expires,
            signingCredentials: creds);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
