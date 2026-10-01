using JordanAutoInsurance.Api.Data;
using JordanAutoInsurance.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace JordanAutoInsurance.Api.Services;

public class DepreciationService(AppDbContext db)
{
    public async Task<decimal> ResolvePercentAsync(
        VehicleUsageType usage,
        int vehicleAgeYears,
        string partType,
        InsuranceType? policyType = null)
    {
        var rules = await db.DepreciationRules
            .Where(r => r.IsActive)
            .OrderByDescending(r => r.Id)
            .ToListAsync();

        var match = rules.FirstOrDefault(r =>
            (r.VehicleUsage == null || r.VehicleUsage == usage) &&
            (r.PartType == null || string.Equals(r.PartType, partType, StringComparison.OrdinalIgnoreCase)) &&
            (r.PolicyType == null || r.PolicyType == policyType) &&
            (r.MinAgeYears == null || vehicleAgeYears >= r.MinAgeYears) &&
            (r.MaxAgeYears == null || vehicleAgeYears <= r.MaxAgeYears));

        return match?.DepreciationPercent ?? 0;
    }

    public decimal ComputeFinal(
        decimal partPrice,
        decimal labor,
        decimal paint,
        decimal discount,
        decimal depreciationPercent)
    {
        var subtotal = partPrice + labor + paint - discount;
        var depreciation = Math.Round(partPrice * (depreciationPercent / 100m), 2);
        return Math.Max(0, Math.Round(subtotal - depreciation, 2));
    }
}
