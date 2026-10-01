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
public class VehiclesController(AppDbContext db, AuditService audit) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? q)
    {
        var query = db.Vehicles.Include(v => v.Owner).AsQueryable();
        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(v => v.PlateNumber.Contains(q) || v.ChassisNumber.Contains(q) || v.Model.Contains(q));
        return Ok(await query.OrderByDescending(v => v.Id).ToListAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var item = await db.Vehicles.Include(v => v.Owner).FirstOrDefaultAsync(v => v.Id == id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpGet("{id:int}/profile")]
    public async Task<IActionResult> Profile(int id)
    {
        var vehicle = await db.Vehicles.Include(v => v.Owner).FirstOrDefaultAsync(v => v.Id == id);
        if (vehicle is null) return NotFound();
        var policies = await db.Policies.Where(p => p.VehicleId == id).ToListAsync();
        var accidents = await db.Accidents.Where(a => a.VehicleId == id).ToListAsync();
        var accidentIds = accidents.Select(a => a.Id).ToList();
        var claims = await db.Claims.Where(c => accidentIds.Contains(c.AccidentId)).ToListAsync();
        return Ok(new { vehicle, policies, accidents, claims });
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Underwriter,Manager")]
    public async Task<IActionResult> Create([FromBody] VehicleDto dto)
    {
        var entity = Map(dto);
        db.Vehicles.Add(entity);
        await db.SaveChangesAsync();
        await audit.LogAsync("Create", nameof(Vehicle), entity.Id.ToString(), null, entity);
        return Ok(entity);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Underwriter,Manager")]
    public async Task<IActionResult> Update(int id, [FromBody] VehicleDto dto)
    {
        var entity = await db.Vehicles.FindAsync(id);
        if (entity is null) return NotFound();
        var old = entity.PlateNumber;
        Apply(entity, dto);
        await db.SaveChangesAsync();
        await audit.LogAsync("Update", nameof(Vehicle), id.ToString(), new { Plate = old }, entity);
        return Ok(entity);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var entity = await db.Vehicles.FindAsync(id);
        if (entity is null) return NotFound();
        db.Vehicles.Remove(entity);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static Vehicle Map(VehicleDto dto)
    {
        var v = new Vehicle();
        Apply(v, dto);
        return v;
    }

    private static void Apply(Vehicle entity, VehicleDto dto)
    {
        entity.PlateNumber = dto.PlateNumber;
        entity.PlateType = dto.PlateType;
        entity.ChassisNumber = dto.ChassisNumber;
        entity.EngineNumber = dto.EngineNumber;
        entity.Manufacturer = dto.Manufacturer;
        entity.Model = dto.Model;
        entity.Year = dto.Year;
        entity.Color = dto.Color;
        entity.UsageType = dto.UsageType;
        entity.VehicleValue = dto.VehicleValue;
        entity.Condition = dto.Condition;
        entity.OwnerInsuredId = dto.OwnerInsuredId;
        entity.AuthorizedDrivers = dto.AuthorizedDrivers;
    }
}
