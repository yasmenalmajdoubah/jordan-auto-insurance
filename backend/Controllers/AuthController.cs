using JordanAutoInsurance.Api.Auth;
using JordanAutoInsurance.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace JordanAutoInsurance.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController(AuthService auth, AppDbContext db) : ControllerBase
{
    [HttpPost("login")]
    [AllowAnonymous]
    public async Task<ActionResult<LoginResponse>> Login([FromBody] LoginRequest request)
    {
        var result = await auth.LoginAsync(request);
        return result is null ? Unauthorized(new { message = "بيانات الدخول غير صحيحة" }) : Ok(result);
    }

    [HttpPost("register")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Register([FromBody] RegisterUserRequest request)
    {
        try
        {
            var user = await auth.RegisterAsync(request);
            return Ok(new { user.Id, user.UserName, user.FullName, user.Role });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("roles")]
    [Authorize]
    public IActionResult Roles() => Ok(DbSeeder.Roles);

    [HttpGet("users")]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Users() =>
        Ok(await db.Users.Select(u => new { u.Id, u.UserName, u.FullName, u.Email, u.Role, u.IsActive, u.CreatedAt }).ToListAsync());

    [HttpPut("users/{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateUser(int id, [FromBody] UpdateUserRequest request)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();
        if (!DbSeeder.Roles.Contains(request.Role))
            return BadRequest(new { message = "Invalid role" });

        var old = new { user.FullName, user.Email, user.Role, user.IsActive };
        user.FullName = request.FullName;
        user.Email = request.Email;
        user.Role = request.Role;
        user.IsActive = request.IsActive;
        if (!string.IsNullOrWhiteSpace(request.NewPassword))
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);

        await db.SaveChangesAsync();
        return Ok(new { user.Id, user.UserName, user.FullName, user.Email, user.Role, user.IsActive });
    }

    [HttpGet("me")]
    [Authorize]
    public IActionResult Me() => Ok(new
    {
        UserName = User.Identity?.Name,
        Role = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value,
        FullName = User.FindFirst("fullName")?.Value
    });
}

public record UpdateUserRequest(string FullName, string Email, string Role, bool IsActive, string? NewPassword = null);
