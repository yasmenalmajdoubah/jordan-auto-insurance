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
public class RulesController(AppDbContext db, AuditService audit) : ControllerBase
{
    [HttpGet("pricing")]
    public async Task<IActionResult> GetPricing() => Ok(await db.PricingRules.OrderBy(r => r.ParameterKey).ToListAsync());

    [HttpPost("pricing")]
    [Authorize(Roles = "Admin,Manager,Underwriter")]
    public async Task<IActionResult> UpsertPricing([FromBody] PricingRuleDto dto)
    {
        PricingRule entity;
        if (dto.Id is > 0)
        {
            entity = await db.PricingRules.FindAsync(dto.Id.Value) ?? throw new InvalidOperationException("Not found");
            var old = entity.Value;
            entity.DisplayNameAr = dto.DisplayNameAr;
            entity.ParameterType = dto.ParameterType;
            entity.Value = dto.Value;
            entity.Notes = dto.Notes;
            entity.IsActive = dto.IsActive;
            entity.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
            await audit.LogAsync("Update", nameof(PricingRule), entity.Id.ToString(), new { old }, new { entity.Value });
        }
        else
        {
            entity = new PricingRule
            {
                ParameterKey = dto.ParameterKey,
                DisplayNameAr = dto.DisplayNameAr,
                ParameterType = dto.ParameterType,
                Value = dto.Value,
                Notes = dto.Notes,
                IsActive = dto.IsActive
            };
            db.PricingRules.Add(entity);
            await db.SaveChangesAsync();
            await audit.LogAsync("Create", nameof(PricingRule), entity.Id.ToString(), null, entity);
        }
        return Ok(entity);
    }

    [HttpGet("depreciation")]
    public async Task<IActionResult> GetDepreciation() => Ok(await db.DepreciationRules.OrderBy(r => r.Id).ToListAsync());

    [HttpPost("depreciation")]
    [Authorize(Roles = "Admin,Manager,Underwriter")]
    public async Task<IActionResult> UpsertDepreciation([FromBody] DepreciationRuleDto dto)
    {
        DepreciationRule entity;
        if (dto.Id is > 0)
        {
            entity = await db.DepreciationRules.FindAsync(dto.Id.Value) ?? throw new InvalidOperationException("Not found");
            var old = entity.DepreciationPercent;
            entity.VehicleUsage = dto.VehicleUsage;
            entity.MinAgeYears = dto.MinAgeYears;
            entity.MaxAgeYears = dto.MaxAgeYears;
            entity.PartType = dto.PartType;
            entity.PolicyType = dto.PolicyType;
            entity.ClaimType = dto.ClaimType;
            entity.DepreciationPercent = dto.DepreciationPercent;
            entity.Notes = dto.Notes;
            entity.IsActive = dto.IsActive;
            entity.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync();
            await audit.LogAsync("Update", nameof(DepreciationRule), entity.Id.ToString(), new { old }, new { entity.DepreciationPercent });
        }
        else
        {
            entity = new DepreciationRule
            {
                VehicleUsage = dto.VehicleUsage,
                MinAgeYears = dto.MinAgeYears,
                MaxAgeYears = dto.MaxAgeYears,
                PartType = dto.PartType,
                PolicyType = dto.PolicyType,
                ClaimType = dto.ClaimType,
                DepreciationPercent = dto.DepreciationPercent,
                Notes = dto.Notes,
                IsActive = dto.IsActive
            };
            db.DepreciationRules.Add(entity);
            await db.SaveChangesAsync();
        }
        return Ok(entity);
    }
}

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class DocumentsController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> Get([FromQuery] int? accidentId, [FromQuery] int? claimId)
    {
        var q = db.Documents.AsQueryable();
        if (accidentId.HasValue) q = q.Where(d => d.AccidentId == accidentId);
        if (claimId.HasValue) q = q.Where(d => d.ClaimId == claimId);
        return Ok(await q.OrderByDescending(d => d.Id).ToListAsync());
    }

    [HttpGet("{id:int}/download")]
    public async Task<IActionResult> Download(int id)
    {
        var doc = await db.Documents.FindAsync(id);
        if (doc is null || !System.IO.File.Exists(doc.StoredPath)) return NotFound();
        var bytes = await System.IO.File.ReadAllBytesAsync(doc.StoredPath);
        return File(bytes, doc.ContentType, doc.FileName);
    }
}

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class AuditController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = "Admin,Manager")]
    public async Task<IActionResult> Get([FromQuery] int take = 100, [FromQuery] string? entityType = null, [FromQuery] string? q = null)
    {
        var query = db.AuditLogs.AsQueryable();
        if (!string.IsNullOrWhiteSpace(entityType))
            query = query.Where(a => a.EntityType == entityType);
        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(a =>
                a.UserName.Contains(q) ||
                a.Action.Contains(q) ||
                a.EntityType.Contains(q) ||
                (a.EntityId != null && a.EntityId.Contains(q)));
        return Ok(await query.OrderByDescending(a => a.Id).Take(Math.Clamp(take, 1, 500)).ToListAsync());
    }
}

[ApiController]
[Authorize]
[Route("api/[controller]")]
public class DashboardController(AppDbContext db) : ControllerBase
{
    [HttpGet("summary")]
    public async Task<IActionResult> Summary()
    {
        var now = DateTime.UtcNow;
        var policies = await db.Policies.ToListAsync();
        var accidents = await db.Accidents.ToListAsync();
        var claims = await db.Claims.Include(c => c.Settlement).Include(c => c.RecoveryClaim).ToListAsync();

        var paid = claims.Where(c => c.Settlement != null).Sum(c => c.Settlement!.FinalAmount);
        var outstanding = claims.Where(c => c.Status != ClaimStatus.Closed && c.Status != ClaimStatus.Settled)
            .Sum(c => c.ClaimAmount);
        var recovery = claims.Where(c => c.RecoveryClaim != null).Sum(c => c.RecoveryClaim!.ClaimedAmount);
        var pendingRecovery = claims.Where(c => c.RecoveryClaim != null &&
            c.RecoveryClaim.Status is RecoveryStatus.Draft or RecoveryStatus.Submitted or RecoveryStatus.UnderReview)
            .Sum(c => c.RecoveryClaim!.ClaimedAmount);

        var vehicleIds = accidents.Select(a => a.VehicleId).Distinct().ToList();
        var vehicles = await db.Vehicles.Where(v => vehicleIds.Contains(v.Id)).ToListAsync();
        var vehicleMap = vehicles.ToDictionary(v => v.Id, v => v.UsageType.ToString());

        return Ok(new
        {
            activePolicies = policies.Count(p => p.Status == PolicyStatus.Active),
            expiredPolicies = policies.Count(p => p.Status == PolicyStatus.Expired || p.EndDate < now),
            newPolicies = policies.Count(p => p.IssueDate >= now.AddDays(-30)),
            accidentsToday = accidents.Count(a => a.AccidentDateTime.Date == now.Date),
            openAccidents = accidents.Count(a => a.Status is AccidentStatus.Open or AccidentStatus.UnderReview),
            openClaims = claims.Count(c => c.Status is ClaimStatus.Draft or ClaimStatus.Submitted or ClaimStatus.UnderReview),
            pendingClaims = claims.Count(c => c.Status == ClaimStatus.UnderReview),
            approvedClaims = claims.Count(c => c.Status == ClaimStatus.Approved),
            rejectedClaims = claims.Count(c => c.Status == ClaimStatus.Rejected),
            settledClaims = claims.Count(c => c.Status == ClaimStatus.Settled),
            totalPaidClaims = paid,
            outstandingClaims = outstanding,
            recoveryAmount = recovery,
            pendingRecovery,
            recoveryPaid = claims.Where(c => c.RecoveryClaim != null).Sum(c => c.RecoveryClaim!.PaidAmount),
            claimsByMonth = Enumerable.Range(0, 6).Select(i =>
            {
                var month = now.AddMonths(-i);
                return new
                {
                    month = month.ToString("yyyy-MM"),
                    count = claims.Count(c => c.CreatedAt.Year == month.Year && c.CreatedAt.Month == month.Month)
                };
            }).Reverse(),
            accidentsByMonth = Enumerable.Range(0, 6).Select(i =>
            {
                var month = now.AddMonths(-i);
                return new
                {
                    month = month.ToString("yyyy-MM"),
                    count = accidents.Count(a => a.AccidentDateTime.Year == month.Year && a.AccidentDateTime.Month == month.Month)
                };
            }).Reverse(),
            accidentsByVehicleUsage = accidents
                .GroupBy(a => vehicleMap.GetValueOrDefault(a.VehicleId, "Unknown"))
                .Select(g => new { usage = g.Key, count = g.Count() }),
            claimsByInsuranceType = policies
                .GroupBy(p => p.InsuranceType.ToString())
                .Select(g => new { type = g.Key, count = g.Count() }),
            claimsByStatus = claims
                .GroupBy(c => c.Status.ToString())
                .Select(g => new { status = g.Key, count = g.Count() }),
            comprehensiveVsThirdParty = new
            {
                comprehensive = policies.Count(p => p.InsuranceType == InsuranceType.Comprehensive),
                thirdParty = policies.Count(p => p.InsuranceType == InsuranceType.ThirdParty)
            },
            recoveryByStatus = claims
                .Where(c => c.RecoveryClaim != null)
                .GroupBy(c => c.RecoveryClaim!.Status.ToString())
                .Select(g => new { status = g.Key, count = g.Count(), amount = g.Sum(x => x.RecoveryClaim!.ClaimedAmount) })
        });
    }
}
