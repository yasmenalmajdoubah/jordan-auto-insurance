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
public class AccidentsController(
    AppDbContext db,
    AuditService audit,
    CoverageService coverage,
    DepreciationService depreciation,
    DocumentService documents) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] AccidentStatus? status, [FromQuery] string? q)
    {
        var query = db.Accidents.Include(a => a.Policy).Include(a => a.Vehicle).AsQueryable();
        if (status.HasValue) query = query.Where(a => a.Status == status);
        if (!string.IsNullOrWhiteSpace(q))
            query = query.Where(a =>
                a.AccidentNumber.Contains(q) ||
                a.Location.Contains(q) ||
                a.DriverName.Contains(q) ||
                (a.Vehicle != null && a.Vehicle.PlateNumber.Contains(q)));
        return Ok(await query.OrderByDescending(a => a.Id).ToListAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> Get(int id)
    {
        var item = await db.Accidents
            .Include(a => a.Policy)
            .Include(a => a.Vehicle)
            .Include(a => a.DamageItems)
            .Include(a => a.Payments)
            .Include(a => a.Injuries)
            .Include(a => a.Documents)
            .Include(a => a.CoverageChecks)
            .Include(a => a.Claims)
            .FirstOrDefaultAsync(a => a.Id == id);
        return item is null ? NotFound() : Ok(item);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,AccidentOfficer,ClaimsOfficer,Manager")]
    public async Task<IActionResult> Create([FromBody] AccidentDto dto)
    {
        var number = $"ACC-{DateTime.UtcNow:yyyy}-{await db.Accidents.CountAsync() + 1:D6}";
        var entity = new Accident
        {
            AccidentNumber = number,
            AccidentDateTime = dto.AccidentDateTime,
            Location = dto.Location,
            PolicyId = dto.PolicyId,
            VehicleId = dto.VehicleId,
            DriverName = dto.DriverName,
            DriverNationalId = dto.DriverNationalId,
            OtherPartyName = dto.OtherPartyName,
            OtherPartyInsurer = dto.OtherPartyInsurer,
            OtherPartyPolicyNumber = dto.OtherPartyPolicyNumber,
            OtherPartyPlateNumber = dto.OtherPartyPlateNumber,
            Description = dto.Description,
            LiabilityPercent = dto.LiabilityPercent,
            Liability = dto.Liability,
            AccidentType = dto.AccidentType,
            Status = dto.Status,
            CreatedBy = User.Identity?.Name ?? "system"
        };
        db.Accidents.Add(entity);
        await db.SaveChangesAsync();

        var check = await coverage.CheckAsync(entity.Id, User.Identity?.Name ?? "system");
        await audit.LogAsync("Create", nameof(Accident), entity.Id.ToString(), null, entity);
        return Ok(new { accident = entity, coverage = check });
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,AccidentOfficer,ClaimsOfficer,Manager")]
    public async Task<IActionResult> Update(int id, [FromBody] AccidentDto dto)
    {
        var entity = await db.Accidents.FindAsync(id);
        if (entity is null) return NotFound();
        var old = new { entity.Status, entity.Liability, entity.Location };
        entity.AccidentDateTime = dto.AccidentDateTime;
        entity.Location = dto.Location;
        entity.DriverName = dto.DriverName;
        entity.DriverNationalId = dto.DriverNationalId;
        entity.OtherPartyName = dto.OtherPartyName;
        entity.OtherPartyInsurer = dto.OtherPartyInsurer;
        entity.OtherPartyPolicyNumber = dto.OtherPartyPolicyNumber;
        entity.OtherPartyPlateNumber = dto.OtherPartyPlateNumber;
        entity.Description = dto.Description;
        entity.LiabilityPercent = dto.LiabilityPercent;
        entity.Liability = dto.Liability;
        entity.AccidentType = dto.AccidentType;
        entity.Status = dto.Status;
        await db.SaveChangesAsync();
        await audit.LogAsync("Update", nameof(Accident), id.ToString(), old, new { entity.Status, entity.Liability, entity.Location });
        return Ok(entity);
    }

    [HttpPost("{id:int}/coverage-check")]
    [Authorize(Roles = "Admin,AccidentOfficer,ClaimsOfficer,Manager,Underwriter")]
    public async Task<IActionResult> CoverageCheck(int id)
        => Ok(await coverage.CheckAsync(id, User.Identity?.Name ?? "system"));

    [HttpPost("{id:int}/damage")]
    [Authorize(Roles = "Admin,Surveyor,ClaimsOfficer,Manager")]
    public async Task<IActionResult> AddDamage(int id, [FromBody] DamageItemDto dto)
    {
        var accident = await db.Accidents.Include(a => a.Vehicle).Include(a => a.Policy)
            .FirstOrDefaultAsync(a => a.Id == id);
        if (accident is null) return NotFound();

        var age = DateTime.UtcNow.Year - (accident.Vehicle?.Year ?? DateTime.UtcNow.Year);
        var percent = await depreciation.ResolvePercentAsync(
            accident.Vehicle?.UsageType ?? VehicleUsageType.Private,
            age,
            dto.PartType,
            accident.Policy?.InsuranceType);

        var final = depreciation.ComputeFinal(dto.PartPrice, dto.LaborCost, dto.PaintCost, dto.Discount, percent);
        var item = new DamageItem
        {
            AccidentId = id,
            PartName = dto.PartName,
            PartNumber = dto.PartNumber,
            DamageType = dto.DamageType,
            Action = dto.Action,
            PartPrice = dto.PartPrice,
            LaborCost = dto.LaborCost,
            PaintCost = dto.PaintCost,
            Discount = dto.Discount,
            DepreciationPercent = percent,
            FinalAmount = final
        };
        db.DamageItems.Add(item);
        await db.SaveChangesAsync();
        return Ok(item);
    }

    [HttpGet("{id:int}/damage-summary")]
    public async Task<IActionResult> DamageSummary(int id)
    {
        var items = await db.DamageItems.Where(d => d.AccidentId == id).ToListAsync();
        return Ok(new
        {
            items,
            total = items.Sum(i => i.FinalAmount),
            parts = items.Sum(i => i.PartPrice),
            labor = items.Sum(i => i.LaborCost),
            paint = items.Sum(i => i.PaintCost)
        });
    }

    [HttpPost("{id:int}/payments")]
    [Authorize(Roles = "Admin,Finance,ClaimsOfficer,Manager")]
    public async Task<IActionResult> AddPayment(int id, [FromBody] PaymentDto dto)
    {
        if (!await db.Accidents.AnyAsync(a => a.Id == id)) return NotFound();
        var payment = new AccidentPayment
        {
            AccidentId = id,
            PaymentType = dto.PaymentType,
            Amount = dto.Amount,
            PaidBy = dto.PaidBy,
            PaidTo = dto.PaidTo,
            PaymentDate = dto.PaymentDate,
            PaymentMethod = dto.PaymentMethod,
            ReceiptNumber = dto.ReceiptNumber,
            Status = dto.Status,
            Notes = dto.Notes
        };
        db.AccidentPayments.Add(payment);
        await db.SaveChangesAsync();
        await audit.LogAsync("Create", nameof(AccidentPayment), payment.Id.ToString(), null, payment);
        return Ok(payment);
    }

    [HttpPost("{id:int}/injuries")]
    [Authorize(Roles = "Admin,ClaimsOfficer,Manager")]
    public async Task<IActionResult> AddInjury(int id, [FromBody] InjuryDto dto)
    {
        if (!await db.Accidents.AnyAsync(a => a.Id == id)) return NotFound();
        var injury = new InjuryClaim
        {
            AccidentId = id,
            InjuredName = dto.InjuredName,
            NationalId = dto.NationalId,
            RelationToAccident = dto.RelationToAccident,
            InjuryType = dto.InjuryType,
            Hospital = dto.Hospital,
            MedicalReport = dto.MedicalReport,
            TreatmentCost = dto.TreatmentCost,
            BillsPaidBy = dto.BillsPaidBy,
            DisabilityPercent = dto.DisabilityPercent,
            DowntimeDays = dto.DowntimeDays,
            InjuryDate = dto.InjuryDate,
            RecoveryDate = dto.RecoveryDate,
            PermanentDisability = dto.PermanentDisability,
            IsFatal = dto.IsFatal,
            DeathCertificateRef = dto.DeathCertificateRef,
            Beneficiaries = dto.Beneficiaries,
            AdditionalExpenses = dto.AdditionalExpenses,
            CompensationAmount = dto.CompensationAmount,
            PaidAmount = dto.PaidAmount,
            RemainingAmount = dto.CompensationAmount - dto.PaidAmount
        };
        db.InjuryClaims.Add(injury);
        await db.SaveChangesAsync();
        return Ok(injury);
    }

    [HttpPost("{id:int}/documents")]
    [Authorize(Roles = "Admin,AccidentOfficer,ClaimsOfficer,Surveyor,Manager")]
    public async Task<IActionResult> UploadDocument(int id, IFormFile file, [FromForm] DocumentType documentType)
    {
        if (!await db.Accidents.AnyAsync(a => a.Id == id)) return NotFound();
        if (file.Length == 0) return BadRequest(new { message = "Empty file" });
        var doc = await documents.SaveAsync(file, documentType, User.Identity?.Name ?? "system", accidentId: id);
        return Ok(doc);
    }
}
