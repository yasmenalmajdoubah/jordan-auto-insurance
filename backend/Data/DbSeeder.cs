using JordanAutoInsurance.Api.Domain.Entities;
using JordanAutoInsurance.Api.Domain.Enums;

namespace JordanAutoInsurance.Api.Data;

public static class DbSeeder
{
    public static readonly string[] Roles =
    [
        "Admin", "Underwriter", "ClaimsOfficer", "AccidentOfficer",
        "Surveyor", "Finance", "Manager", "ReadOnly"
    ];

    public static async Task SeedAsync(AppDbContext db)
    {
        await db.Database.EnsureCreatedAsync();

        if (!db.Users.Any())
        {
            db.Users.Add(new AppUser
            {
                UserName = "admin",
                FullName = "مدير النظام",
                Email = "admin@insurance.jo",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
                Role = "Admin"
            });
        }

        if (!db.PricingRules.Any())
        {
            db.PricingRules.AddRange(
                new PricingRule { ParameterKey = "BASE_PREMIUM", DisplayNameAr = "القسط الأساسي", ParameterType = PricingParameterType.BasePremium, Value = 150 },
                new PricingRule { ParameterKey = "USAGE_PRIVATE", DisplayNameAr = "خصوصي", ParameterType = PricingParameterType.VehicleUsage, Value = 0 },
                new PricingRule { ParameterKey = "USAGE_TAXI", DisplayNameAr = "ركوب / تاكسي", ParameterType = PricingParameterType.VehicleUsage, Value = 25 },
                new PricingRule { ParameterKey = "USAGE_MEDIUM", DisplayNameAr = "متوسط", ParameterType = PricingParameterType.VehicleUsage, Value = 15 },
                new PricingRule { ParameterKey = "USAGE_CARGO", DisplayNameAr = "شحن", ParameterType = PricingParameterType.VehicleUsage, Value = 30 },
                new PricingRule { ParameterKey = "TYPE_THIRD_PARTY", DisplayNameAr = "ضد الغير", ParameterType = PricingParameterType.InsuranceType, Value = 0 },
                new PricingRule { ParameterKey = "TYPE_COMPREHENSIVE", DisplayNameAr = "شامل", ParameterType = PricingParameterType.InsuranceType, Value = 40 },
                new PricingRule { ParameterKey = "PREVIOUS_CLAIMS", DisplayNameAr = "وجود مطالبات سابقة", ParameterType = PricingParameterType.PreviousClaims, Value = 20 },
                new PricingRule { ParameterKey = "NO_CLAIMS_DISCOUNT", DisplayNameAr = "خصم عدم وجود مطالبات", ParameterType = PricingParameterType.NoClaimsDiscount, Value = -10 }
            );
        }

        if (!db.DepreciationRules.Any())
        {
            db.DepreciationRules.AddRange(
                new DepreciationRule { VehicleUsage = VehicleUsageType.Private, MinAgeYears = 0, MaxAgeYears = 2, PartType = "Body", DepreciationPercent = 5, Notes = "مركبة خصوصي حديثة" },
                new DepreciationRule { VehicleUsage = VehicleUsageType.Private, MinAgeYears = 3, MaxAgeYears = 5, PartType = "Body", DepreciationPercent = 15 },
                new DepreciationRule { VehicleUsage = VehicleUsageType.Private, MinAgeYears = 6, MaxAgeYears = 10, PartType = "Body", DepreciationPercent = 25 },
                new DepreciationRule { VehicleUsage = VehicleUsageType.Taxi, MinAgeYears = 0, MaxAgeYears = 5, PartType = "Body", DepreciationPercent = 20 },
                new DepreciationRule { VehicleUsage = VehicleUsageType.Cargo, MinAgeYears = 0, MaxAgeYears = 10, PartType = "Body", DepreciationPercent = 30 },
                new DepreciationRule { PartType = "Mechanical", MinAgeYears = 0, MaxAgeYears = 20, DepreciationPercent = 10, Notes = "قطع ميكانيكية عامة" }
            );
        }

        await db.SaveChangesAsync();
    }
}
