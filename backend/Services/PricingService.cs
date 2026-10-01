using JordanAutoInsurance.Api.Data;
using JordanAutoInsurance.Api.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace JordanAutoInsurance.Api.Services;

public record PremiumCalculationRequest(
    VehicleUsageType UsageType,
    InsuranceType InsuranceType,
    decimal VehicleValue,
    bool HasPreviousClaims,
    bool ApplyNoClaimsDiscount);

public record PremiumCalculationResult(
    decimal BasePremium,
    decimal UsageLoadingPercent,
    decimal TypeLoadingPercent,
    decimal ClaimsLoadingPercent,
    decimal DiscountPercent,
    decimal VehicleValueFactor,
    decimal FinalPremium,
    List<string> Breakdown);

public class PricingService(AppDbContext db)
{
    public async Task<PremiumCalculationResult> CalculateAsync(PremiumCalculationRequest request)
    {
        var rules = await db.PricingRules.Where(r => r.IsActive).ToListAsync();
        decimal Get(string key, decimal fallback = 0) =>
            rules.FirstOrDefault(r => r.ParameterKey == key)?.Value ?? fallback;

        var basePremium = Get("BASE_PREMIUM", 150);
        var usageKey = request.UsageType switch
        {
            VehicleUsageType.Private => "USAGE_PRIVATE",
            VehicleUsageType.Taxi => "USAGE_TAXI",
            VehicleUsageType.Medium => "USAGE_MEDIUM",
            VehicleUsageType.Cargo => "USAGE_CARGO",
            _ => "USAGE_PRIVATE"
        };
        var typeKey = request.InsuranceType == InsuranceType.Comprehensive
            ? "TYPE_COMPREHENSIVE"
            : "TYPE_THIRD_PARTY";

        var usagePct = Get(usageKey);
        var typePct = Get(typeKey);
        var claimsPct = request.HasPreviousClaims ? Get("PREVIOUS_CLAIMS") : 0;
        var discountPct = request.ApplyNoClaimsDiscount && !request.HasPreviousClaims
            ? Get("NO_CLAIMS_DISCOUNT")
            : 0;

        // Simple value factor: 0.1% of vehicle value added for comprehensive
        var valueFactor = request.InsuranceType == InsuranceType.Comprehensive
            ? Math.Round(request.VehicleValue * 0.001m, 2)
            : 0;

        var totalPct = usagePct + typePct + claimsPct + discountPct;
        var final = Math.Round(basePremium * (1 + totalPct / 100m) + valueFactor, 2);

        var breakdown = new List<string>
        {
            $"Base={basePremium}",
            $"Usage({usageKey})={usagePct}%",
            $"Type({typeKey})={typePct}%",
            $"ClaimsLoading={claimsPct}%",
            $"Discount={discountPct}%",
            $"ValueFactor={valueFactor}",
            $"Final={final}"
        };

        return new PremiumCalculationResult(basePremium, usagePct, typePct, claimsPct, discountPct, valueFactor, final, breakdown);
    }
}
