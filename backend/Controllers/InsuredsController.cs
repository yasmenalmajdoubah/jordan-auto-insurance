using JordanAutoInsurance.Api.Data;
using JordanAutoInsurance.Api.Domain.Entities;
using JordanAutoInsurance.Api.Dtos;
using JordanAutoInsurance.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace JordanAutoInsurance.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class InsuredsController(AppDbContext db, AuditService audit) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? q)
    {
        var query = db.Insureds.AsQueryable();
        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(i => i.FullName.Contains(q) || i.NationalId.Contains(q) || i.Phone.Contains(q));
        return Ok(await query.OrderByDescending(i => i.Id).ToListAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var item = await db.Insureds
            .Include(i => i.Vehicles)
            .Include(i => i.Policies)
            .FirstOrDefaultAsync(i => i.Id == id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpGet("{id:int}/profile")]
    public async Task<IActionResult> Profile(int id)
    {
        var insured = await db.Insureds.FirstOrDefaultAsync(i => i.Id == id);
        if (insured is null) return NotFound();

        var policies = await db.Policies.Where(p => p.InsuredId == id).ToListAsync();
        var vehicles = await db.Vehicles.Where(v => v.OwnerInsuredId == id).ToListAsync();
        var vehicleIds = vehicles.Select(v => v.Id).ToList();
        var accidents = await db.Accidents.Where(a => vehicleIds.Contains(a.VehicleId)).ToListAsync();
        var accidentIds = accidents.Select(a => a.Id).ToList();
        var claims = await db.Claims.Where(c => accidentIds.Contains(c.AccidentId)).ToListAsync();
        var payments = await db.AccidentPayments.Where(p => accidentIds.Contains(p.AccidentId)).ToListAsync();

        return Ok(new { insured, vehicles, policies, accidents, claims, payments });
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Underwriter,Manager")]
    public async Task<IActionResult> Create([FromBody] InsuredDto dto)
    {
        var entity = new Insured
        {
            FullName = dto.FullName,
            NationalId = dto.NationalId,
            Phone = dto.Phone,
            SecondaryPhone = dto.SecondaryPhone,
            Email = dto.Email,
            Address = dto.Address,
            ClientType = dto.ClientType,
            Notes = dto.Notes
        };
        db.Insureds.Add(entity);
        await db.SaveChangesAsync();
        await audit.LogAsync("Create", nameof(Insured), entity.Id.ToString(), null, entity);
        return Ok(entity);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Underwriter,Manager")]
    public async Task<IActionResult> Update(int id, [FromBody] InsuredDto dto)
    {
        var entity = await db.Insureds.FindAsync(id);
        if (entity is null) return NotFound();
        var old = new { entity.FullName, entity.Phone, entity.Address };
        entity.FullName = dto.FullName;
        entity.NationalId = dto.NationalId;
        entity.Phone = dto.Phone;
        entity.SecondaryPhone = dto.SecondaryPhone;
        entity.Email = dto.Email;
        entity.Address = dto.Address;
        entity.ClientType = dto.ClientType;
        entity.Notes = dto.Notes;
        await db.SaveChangesAsync();
        await audit.LogAsync("Update", nameof(Insured), id.ToString(), old, entity);
        return Ok(entity);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await db.Insureds.FindAsync(id);
        if (entity is null) return NotFound();
        db.Insureds.Remove(entity);
        await db.SaveChangesAsync();
        await audit.LogAsync("Delete", nameof(Insured), id.ToString(), entity, null);
        return NoContent();
    }
}
