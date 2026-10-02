using System.Text.Json;
using JordanAutoInsurance.Api.Data;
using JordanAutoInsurance.Api.Domain.Entities;
using JordanAutoInsurance.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace JordanAutoInsurance.Api.Services;

public record CoverageResult(bool IsCovered, string Reason, object Details);

public record PolicyCoveragePreviewRequest(
    DateTime AccidentDate,
    int? VehicleId = null,
    AccidentType AccidentType = AccidentType.KnownThirdParty);

public class CoverageService(AppDbContext db, AuditService audit)
{
    public async Task<CoverageResult> CheckPolicyPreviewAsync(int policyId, PolicyCoveragePreviewRequest request, string checkedBy)
    {
        var policy = await db.Policies
            .Include(p => p.Vehicle)
            .Include(p => p.Insured)
            .FirstOrDefaultAsync(p => p.Id == policyId)
            ?? throw new InvalidOperationException("Policy not found");

        var vehicleId = request.VehicleId ?? policy.VehicleId;
        var (covered, reason, steps) = Evaluate(policy, request.AccidentDate, vehicleId, request.AccidentType);

        var details = new
        {
            Steps = steps,
            PolicyNumber = policy.PolicyNumber,
            AccidentDate = request.AccidentDate,
            VehicleId = vehicleId,
            AccidentType = request.AccidentType.ToString(),
            Mode = "Preview"
        };

        db.CoverageCheckLogs.Add(new CoverageCheckLog
        {
            AccidentId = null,
            PolicyId = policy.Id,
            IsCovered = covered,
            Reason = reason,
            CheckedBy = checkedBy,
            DetailsJson = JsonSerializer.Serialize(details)
        });
        await db.SaveChangesAsync();

        await audit.LogAsync("CoverageCheckPreview", nameof(Policy), policy.Id.ToString(), null,
            new { covered, reason, request.AccidentDate, vehicleId }, checkedBy);

        return new CoverageResult(covered, reason, details);
    }

    public async Task<CoverageResult> CheckAsync(int accidentId, string checkedBy)
    {
        var accident = await db.Accidents
            .Include(a => a.Policy)!.ThenInclude(p => p!.Vehicle)
            .Include(a => a.Vehicle)
            .FirstOrDefaultAsync(a => a.Id == accidentId)
            ?? throw new InvalidOperationException("Accident not found");

        var policy = accident.Policy ?? throw new InvalidOperationException("Policy not found");
        var (covered, reason, steps) = Evaluate(policy, accident.AccidentDateTime, accident.VehicleId, accident.AccidentType);

        var details = new { Steps = steps, PolicyNumber = policy.PolicyNumber, AccidentNumber = accident.AccidentNumber, Mode = "Accident" };
        db.CoverageCheckLogs.Add(new CoverageCheckLog
        {
            AccidentId = accident.Id,
            PolicyId = policy.Id,
            IsCovered = covered,
            Reason = reason,
            CheckedBy = checkedBy,
            DetailsJson = JsonSerializer.Serialize(details)
        });

        accident.IsCovered = covered;
        accident.CoverageReason = reason;
        await db.SaveChangesAsync();

        await audit.LogAsync("CoverageCheck", nameof(Accident), accident.Id.ToString(), null,
            new { covered, reason }, checkedBy);

        return new CoverageResult(covered, reason, details);
    }

    private static (bool Covered, string Reason, List<string> Steps) Evaluate(
        Policy policy,
        DateTime accidentDate,
        int vehicleId,
        AccidentType accidentType)
    {
        var steps = new List<string>
        {
            $"AccidentDate={accidentDate:O}",
            $"PolicyStatus={policy.Status}",
            $"PolicyPeriod={policy.StartDate:yyyy-MM-dd}->{policy.EndDate:yyyy-MM-dd}"
        };

        if (policy.Status != PolicyStatus.Active)
        {
            steps.Add("Result=NotCovered:PolicyNotActive");
            return (false, $"حالة الوثيقة ليست Active (الحالة الحالية: {policy.Status}).", steps);
        }

        steps.Add("IsPolicyActive=true");

        if (accidentDate.Date < policy.StartDate.Date || accidentDate.Date > policy.EndDate.Date)
        {
            steps.Add("Result=NotCovered:OutsideCoveredPeriod");
            return (false, "تاريخ الحادث خارج فترة التغطية التأمينية.", steps);
        }

        steps.Add("IsAccidentCoveredPeriod=true");

        if (vehicleId != policy.VehicleId)
        {
            steps.Add($"Result=NotCovered:VehicleMismatch AccidentVehicle={vehicleId}; PolicyVehicle={policy.VehicleId}");
            return (false, "المركبة المرتبطة بالحادث غير مغطاة بهذه الوثيقة.", steps);
        }

        steps.Add("IsVehicleCovered=true");

        if (!string.IsNullOrWhiteSpace(policy.Exclusions) &&
            policy.Exclusions.Contains("مجهول", StringComparison.OrdinalIgnoreCase) &&
            accidentType == AccidentType.UnknownHitAndRun)
        {
            steps.Add("Result=NotCovered:ExclusionUnknownHitAndRun");
            return (false, "الحادث ضد مجهول مستثنى حسب شروط الوثيقة.", steps);
        }

        steps.Add("AnyExclusion=false");
        steps.Add("Result=Covered");
        return (true, "الوثيقة تغطي الحادث ضمن الفترة والشروط.", steps);
    }
}
