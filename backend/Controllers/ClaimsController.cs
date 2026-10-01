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
public class ClaimsController(AppDbContext db, AuditService audit, PdfService pdf) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await db.Claims.Include(c => c.Accident).Include(c => c.Settlement).Include(c => c.RecoveryClaim)
            .OrderByDescending(c => c.Id).ToListAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var item = await db.Claims.Include(c => c.Accident).Include(c => c.Settlement).Include(c => c.RecoveryClaim)
            .FirstOrDefaultAsync(c => c.Id == id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,ClaimsOfficer,Manager")]
    public async Task<IActionResult> Create([FromBody] ClaimDto dto)
    {
        var accident = await db.Accidents.FindAsync(dto.AccidentId);
        if (accident is null) return NotFound(new { message = "Accident not found" });

        var claim = new Claim
        {
            ClaimNumber = $"CLM-{DateTime.UtcNow:yyyy}-{await db.Claims.CountAsync() + 1:D6}",
            AccidentId = dto.AccidentId,
            ClaimantType = dto.ClaimantType,
            Status = dto.Status,
            ClaimAmount = dto.ClaimAmount,
            Notes = dto.Notes
        };
        db.Claims.Add(claim);
        await db.SaveChangesAsync();
        await audit.LogAsync("Create", nameof(Claim), claim.Id.ToString(), null, claim);
        return Ok(claim);
    }

    [HttpPost("{id:int}/settlement")]
    [Authorize(Roles = "Admin,ClaimsOfficer,Finance,Manager")]
    public async Task<IActionResult> CreateSettlement(int id, [FromBody] SettlementDto dto)
    {
        var claim = await db.Claims.FindAsync(id);
        if (claim is null) return NotFound();
        if (await db.Settlements.AnyAsync(s => s.ClaimId == id))
            return BadRequest(new { message = "Settlement already exists" });

        var final = dto.ClaimAmount - dto.Deductible + dto.OtherAdjustments;
        var settlement = new Settlement
        {
            ClaimId = id,
            ClaimAmount = dto.ClaimAmount,
            Deductible = dto.Deductible,
            OtherAdjustments = dto.OtherAdjustments,
            FinalAmount = final,
            Status = dto.Status
        };
        db.Settlements.Add(settlement);
        claim.Status = ClaimStatus.Settled;
        await db.SaveChangesAsync();
        await audit.LogAsync("Create", nameof(Settlement), settlement.Id.ToString(), null, settlement);
        return Ok(settlement);
    }

    [HttpPost("settlements/{settlementId:int}/approve")]
    [Authorize(Roles = "Admin,Manager,Finance")]
    public async Task<IActionResult> ApproveSettlement(int settlementId)
    {
        var settlement = await db.Settlements.FindAsync(settlementId);
        if (settlement is null) return NotFound();
        var old = settlement.Status;
        settlement.Status = SettlementStatus.Approved;
        settlement.ApprovedBy = User.Identity?.Name;
        settlement.ApprovedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        await audit.LogAsync("Approve", nameof(Settlement), settlementId.ToString(), new { old }, new { settlement.Status, settlement.FinalAmount });
        return Ok(settlement);
    }

    [HttpGet("settlements/{settlementId:int}/pdf")]
    public async Task<IActionResult> SettlementPdf(int settlementId)
    {
        var bytes = await pdf.GenerateSettlementPdfAsync(settlementId);
        return File(bytes, "application/pdf", $"settlement-{settlementId}.pdf");
    }

    [HttpPost("{id:int}/recovery")]
    [Authorize(Roles = "Admin,ClaimsOfficer,Manager")]
    public async Task<IActionResult> CreateRecovery(int id, [FromBody] RecoveryDto dto)
    {
        var claim = await db.Claims.Include(c => c.Accident).FirstOrDefaultAsync(c => c.Id == id);
        if (claim is null) return NotFound();
        if (await db.RecoveryClaims.AnyAsync(r => r.ClaimId == id))
            return BadRequest(new { message = "Recovery already exists" });

        var recovery = new RecoveryClaim
        {
            ClaimId = id,
            OtherInsurerName = dto.OtherInsurerName,
            OtherPolicyNumber = dto.OtherPolicyNumber,
            AccidentNumber = string.IsNullOrWhiteSpace(dto.AccidentNumber)
                ? claim.Accident?.AccidentNumber ?? ""
                : dto.AccidentNumber,
            ClaimedAmount = dto.ClaimedAmount,
            PaidAmount = dto.PaidAmount,
            Status = RecoveryStatus.Draft,
            SettlementRef = dto.SettlementRef,
            Notes = dto.Notes
        };
        db.RecoveryClaims.Add(recovery);
        await db.SaveChangesAsync();
        return Ok(recovery);
    }

    [HttpPut("recoveries/{recoveryId:int}/status")]
    [Authorize(Roles = "Admin,ClaimsOfficer,Manager")]
    public async Task<IActionResult> UpdateRecoveryStatus(int recoveryId, [FromBody] RecoveryStatus status)
    {
        var recovery = await db.RecoveryClaims.FindAsync(recoveryId);
        if (recovery is null) return NotFound();
        var old = recovery.Status;
        recovery.Status = status;
        if (status == RecoveryStatus.Submitted) recovery.SubmittedAt = DateTime.UtcNow;
        await db.SaveChangesAsync();
        await audit.LogAsync("StatusChange", nameof(RecoveryClaim), recoveryId.ToString(), new { old }, new { status });
        return Ok(recovery);
    }

    [HttpGet("recoveries/{recoveryId:int}/pdf")]
    public async Task<IActionResult> RecoveryPdf(int recoveryId)
    {
        var bytes = await pdf.GenerateRecoveryPdfAsync(recoveryId);
        return File(bytes, "application/pdf", $"recovery-{recoveryId}.pdf");
    }
}
