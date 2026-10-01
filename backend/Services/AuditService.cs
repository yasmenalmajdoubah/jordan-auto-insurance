using System.Text.Json;
using JordanAutoInsurance.Api.Data;
using JordanAutoInsurance.Api.Domain.Entities;

namespace JordanAutoInsurance.Api.Services;

public class AuditService(AppDbContext db, IHttpContextAccessor http)
{
    public async Task LogAsync(string action, string entityType, string? entityId, object? oldValue, object? newValue, string? userName = null)
    {
        var user = userName ?? http.HttpContext?.User?.Identity?.Name ?? "system";
        var ip = http.HttpContext?.Connection?.RemoteIpAddress?.ToString();
        db.AuditLogs.Add(new AuditLog
        {
            UserName = user,
            Action = action,
            EntityType = entityType,
            EntityId = entityId,
            OldValue = oldValue is null ? null : JsonSerializer.Serialize(oldValue),
            NewValue = newValue is null ? null : JsonSerializer.Serialize(newValue),
            IpAddress = ip
        });
        await db.SaveChangesAsync();
    }
}
