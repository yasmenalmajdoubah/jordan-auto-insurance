using JordanAutoInsurance.Api.Data;
using JordanAutoInsurance.Api.Domain.Entities;
using JordanAutoInsurance.Api.Domain.Enums;
using JordanAutoInsurance.Api.Dtos;
using JordanAutoInsurance.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace JordanAutoInsurance.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class PoliciesController(AppDbContext db, AuditService audit, PricingService pricing, CoverageService coverage) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] PolicyStatus? status, [FromQuery] string? q)
    {
        var query = db.Policies.Include(p => p.Insured).Include(p => p.Vehicle).AsQueryable();
        if (status.HasValue) query = query.Where(p => p.Status == status);
        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(p =>
                p.PolicyNumber.Contains(q) ||
                (p.Insured != null && p.Insured.FullName.Contains(q)) ||
                (p.Vehicle != null && p.Vehicle.PlateNumber.Contains(q)));
        return Ok(await query.OrderByDescending(p => p.Id).ToListAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var item = await db.Policies.Include(p => p.Insured).Include(p => p.Vehicle)
            .FirstOrDefaultAsync(p => p.Id == id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpGet("{id:int}/coverage-checks")]
    public async Task<IActionResult> CoverageHistory(int id)
    {
        if (!await db.Policies.AnyAsync(p => p.Id == id)) return NotFound();
        var logs = await db.CoverageCheckLogs
            .Where(c => c.PolicyId == id)
            .OrderByDescending(c => c.Id)
            .Take(50)
            .ToListAsync();
        return Ok(logs);
    }

    [HttpPost("{id:int}/coverage-check")]
    [Authorize(Roles = "Admin,Underwriter,ClaimsOfficer,AccidentOfficer,Manager")]
    public async Task<IActionResult> CoverageCheck(int id, [FromBody] PolicyCoveragePreviewRequest request)
    {
        try
        {
            var result = await coverage.CheckPolicyPreviewAsync(id, request, User.Identity?.Name ?? "system");
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { message = ex.Message });
        }
    }

    [HttpPost("calculate-premium")]
    public async Task<IActionResult> CalculatePremium([FromBody] PremiumCalculationRequest request)
        => Ok(await pricing.CalculateAsync(request));

    [HttpPost]
    [Authorize(Roles = "Admin,Underwriter,Manager")]
    public async Task<IActionResult> Create([FromBody] PolicyDto dto)
    {
        if (!await db.Insureds.AnyAsync(i => i.Id == dto.InsuredId))
            return BadRequest(new { message = "المؤمن غير موجود" });
        if (!await db.Vehicles.AnyAsync(v => v.Id == dto.VehicleId))
            return BadRequest(new { message = "المركبة غير موجودة" });

        var number = string.IsNullOrWhiteSpace(dto.PolicyNumber)
            ? $"POL-{DateTime.UtcNow:yyyy}-{await db.Policies.CountAsync() + 1:D6}"
            : dto.PolicyNumber!;

        var entity = new Policy
        {
            PolicyNumber = number,
            InsuredId = dto.InsuredId,
            VehicleId = dto.VehicleId,
            InsuranceType = dto.InsuranceType,
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            InsuredValue = dto.InsuredValue,
            Premium = dto.Premium,
            Discounts = dto.Discounts,
            Additions = dto.Additions,
            Deductible = dto.Deductible,
            Coverages = dto.Coverages,
            Exclusions = dto.Exclusions,
            Status = dto.Status,
            IssuedBy = string.IsNullOrWhiteSpace(dto.IssuedBy) ? (User.Identity?.Name ?? "system") : dto.IssuedBy,
            IssueDate = DateTime.UtcNow
        };
        db.Policies.Add(entity);
        await db.SaveChangesAsync();
        await audit.LogAsync("Create", nameof(Policy), entity.Id.ToString(), null, entity);
        return Ok(entity);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Underwriter,Manager")]
    public async Task<IActionResult> Update(int id, [FromBody] PolicyDto dto)
    {
        var entity = await db.Policies.FindAsync(id);
        if (entity is null) return NotFound();
        var old = new { entity.Status, entity.StartDate, entity.EndDate, entity.Premium };
        entity.InsuredId = dto.InsuredId;
        entity.VehicleId = dto.VehicleId;
        entity.InsuranceType = dto.InsuranceType;
        entity.StartDate = dto.StartDate;
        entity.EndDate = dto.EndDate;
        entity.InsuredValue = dto.InsuredValue;
        entity.Premium = dto.Premium;
        entity.Discounts = dto.Discounts;
        entity.Additions = dto.Additions;
        entity.Deductible = dto.Deductible;
        entity.Coverages = dto.Coverages;
        entity.Exclusions = dto.Exclusions;
        entity.Status = dto.Status;
        await db.SaveChangesAsync();
        await audit.LogAsync("Update", nameof(Policy), id.ToString(), old, new { entity.Status, entity.StartDate, entity.EndDate, entity.Premium });
        return Ok(entity);
    }
}
