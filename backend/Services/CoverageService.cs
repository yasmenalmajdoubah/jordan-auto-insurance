using System.Text.Json;
using JordanAutoInsurance.Api.Data;
using JordanAutoInsurance.Api.Domain.Entities;
using JordanAutoInsurance.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace JordanAutoInsurance.Api.Services;

public record CoverageResult(bool IsCovered, string Reason, object Details);

public class CoverageService(AppDbContext db, AuditService audit)
{
    public async Task<CoverageResult> CheckAsync(int accidentId, string checkedBy)
    {
        var accident = await db.Accidents
            .Include(a => a.Policy)!.ThenInclude(p => p!.Vehicle)
            .Include(a => a.Vehicle)
            .FirstOrDefaultAsync(a => a.Id == accidentId)
            ?? throw new InvalidOperationException("Accident not found");

        var policy = accident.Policy ?? throw new InvalidOperationException("Policy not found");
        var steps = new List<string>();
        var covered = true;
        var reason = "الوثيقة تغطي الحادث ضمن الفترة والشروط.";

        if (policy.Status != PolicyStatus.Active)
        {
            covered = false;
            reason = $"حالة الوثيقة ليست Active (الحالة الحالية: {policy.Status}).";
            steps.Add($"PolicyStatus={policy.Status}");
        }
        else if (accident.AccidentDateTime.Date < policy.StartDate.Date || accident.AccidentDateTime.Date > policy.EndDate.Date)
        {
            covered = false;
            reason = "تاريخ الحادث خارج فترة التغطية التأمينية.";
            steps.Add($"AccidentDate={accident.AccidentDateTime:O}; Policy={policy.StartDate:d}->{policy.EndDate:d}");
        }
        else if (accident.VehicleId != policy.VehicleId)
        {
            covered = false;
            reason = "المركبة المرتبطة بالحادث غير مغطاة بهذه الوثيقة.";
            steps.Add($"AccidentVehicle={accident.VehicleId}; PolicyVehicle={policy.VehicleId}");
        }
        else
        {
            steps.Add("PolicyActive=true");
            steps.Add("VehicleCovered=true");
            steps.Add("WithinPeriod=true");

            if (!string.IsNullOrWhiteSpace(policy.Exclusions) &&
                policy.Exclusions.Contains("مجهول", StringComparison.OrdinalIgnoreCase) &&
                accident.AccidentType == AccidentType.UnknownHitAndRun)
            {
                covered = false;
                reason = "الحادث ضد مجهول مستثنى حسب شروط الوثيقة.";
                steps.Add("Exclusion=UnknownHitAndRun");
            }
            else
            {
                steps.Add("NoBlockingExclusion=true");
            }
        }

        var details = new { Steps = steps, PolicyNumber = policy.PolicyNumber, AccidentNumber = accident.AccidentNumber };
        var log = new CoverageCheckLog
        {
            AccidentId = accident.Id,
            PolicyId = policy.Id,
            IsCovered = covered,
            Reason = reason,
            CheckedBy = checkedBy,
            DetailsJson = JsonSerializer.Serialize(details)
        };
        db.CoverageCheckLogs.Add(log);

        accident.IsCovered = covered;
        accident.CoverageReason = reason;
        await db.SaveChangesAsync();

        await audit.LogAsync("CoverageCheck", nameof(Accident), accident.Id.ToString(), null,
            new { covered, reason }, checkedBy);

        return new CoverageResult(covered, reason, details);
    }
}
