using JordanAutoInsurance.Api.Domain.Enums;

namespace JordanAutoInsurance.Api.Dtos;

public record InsuredDto(int? Id, string FullName, string NationalId, string Phone, string? SecondaryPhone, string? Email, string Address, ClientType ClientType, string? Notes);
public record VehicleDto(int? Id, string PlateNumber, string PlateType, string ChassisNumber, string EngineNumber, string Manufacturer, string Model, int Year, string Color, VehicleUsageType UsageType, decimal VehicleValue, VehicleCondition Condition, int OwnerInsuredId, string? AuthorizedDrivers);
public record PolicyDto(int? Id, string? PolicyNumber, int InsuredId, int VehicleId, InsuranceType InsuranceType, DateTime StartDate, DateTime EndDate, decimal InsuredValue, decimal Premium, decimal Discounts, decimal Additions, decimal Deductible, string? Coverages, string? Exclusions, PolicyStatus Status, string IssuedBy);
public record PricingRuleDto(int? Id, string ParameterKey, string DisplayNameAr, PricingParameterType ParameterType, decimal Value, string? Notes, bool IsActive);
public record DepreciationRuleDto(int? Id, VehicleUsageType? VehicleUsage, int? MinAgeYears, int? MaxAgeYears, string? PartType, InsuranceType? PolicyType, string? ClaimType, decimal DepreciationPercent, string? Notes, bool IsActive);
public record AccidentDto(
    int? Id, DateTime AccidentDateTime, string Location, int PolicyId, int VehicleId,
    string DriverName, string? DriverNationalId, string? OtherPartyName, string? OtherPartyInsurer,
    string? OtherPartyPolicyNumber, string? OtherPartyPlateNumber, string Description,
    decimal? LiabilityPercent, LiabilityType Liability, AccidentType AccidentType, AccidentStatus Status);
public record DamageItemDto(int? Id, int AccidentId, string PartName, string? PartNumber, string DamageType, DamageAction Action, decimal PartPrice, decimal LaborCost, decimal PaintCost, decimal Discount, string PartType = "Body");
public record PaymentDto(int? Id, int AccidentId, PaymentType PaymentType, decimal Amount, string PaidBy, string PaidTo, DateTime PaymentDate, string PaymentMethod, string? ReceiptNumber, PaymentStatus Status, string? Notes);
public record InjuryDto(
    int? Id, int AccidentId, string InjuredName, string? NationalId, string RelationToAccident, string InjuryType,
    string? Hospital, string? MedicalReport, decimal TreatmentCost, string? BillsPaidBy, decimal DisabilityPercent,
    int DowntimeDays, DateTime? InjuryDate, DateTime? RecoveryDate, bool PermanentDisability, bool IsFatal,
    string? DeathCertificateRef, string? Beneficiaries, decimal AdditionalExpenses, decimal CompensationAmount, decimal PaidAmount);
public record ClaimDto(int? Id, int AccidentId, ClaimantType ClaimantType, ClaimStatus Status, decimal ClaimAmount, string? Notes);
public record SettlementDto(int? Id, int ClaimId, decimal ClaimAmount, decimal Deductible, decimal OtherAdjustments, SettlementStatus Status);
public record RecoveryDto(int? Id, int ClaimId, string OtherInsurerName, string? OtherPolicyNumber, string AccidentNumber, decimal ClaimedAmount, decimal PaidAmount, RecoveryStatus Status, string? SettlementRef, string? Notes);
