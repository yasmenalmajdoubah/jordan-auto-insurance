using JordanAutoInsurance.Api.Domain.Enums;

namespace JordanAutoInsurance.Api.Domain.Entities;

public class AppUser
{
    public int Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Role { get; set; } = "ReadOnly";
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class AuditLog
{
    public long Id { get; set; }
    public string UserName { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string EntityType { get; set; } = string.Empty;
    public string? EntityId { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string? IpAddress { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Insured
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string NationalId { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string? SecondaryPhone { get; set; }
    public string? Email { get; set; }
    public string Address { get; set; } = string.Empty;
    public ClientType ClientType { get; set; } = ClientType.Individual;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<Vehicle> Vehicles { get; set; } = new List<Vehicle>();
    public ICollection<Policy> Policies { get; set; } = new List<Policy>();
}

public class Vehicle
{
    public int Id { get; set; }
    public string PlateNumber { get; set; } = string.Empty;
    public string PlateType { get; set; } = "خصوصي";
    public string ChassisNumber { get; set; } = string.Empty;
    public string EngineNumber { get; set; } = string.Empty;
    public string Manufacturer { get; set; } = string.Empty;
    public string Model { get; set; } = string.Empty;
    public int Year { get; set; }
    public string Color { get; set; } = string.Empty;
    public VehicleUsageType UsageType { get; set; } = VehicleUsageType.Private;
    public decimal VehicleValue { get; set; }
    public VehicleCondition Condition { get; set; } = VehicleCondition.Good;
    public int OwnerInsuredId { get; set; }
    public Insured? Owner { get; set; }
    public string? AuthorizedDrivers { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<Policy> Policies { get; set; } = new List<Policy>();
    public ICollection<Accident> Accidents { get; set; } = new List<Accident>();
}

public class Policy
{
    public int Id { get; set; }
    public string PolicyNumber { get; set; } = string.Empty;
    public int InsuredId { get; set; }
    public Insured? Insured { get; set; }
    public int VehicleId { get; set; }
    public Vehicle? Vehicle { get; set; }
    public InsuranceType InsuranceType { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public decimal InsuredValue { get; set; }
    public decimal Premium { get; set; }
    public decimal Discounts { get; set; }
    public decimal Additions { get; set; }
    public decimal Deductible { get; set; }
    public string? Coverages { get; set; }
    public string? Exclusions { get; set; }
    public PolicyStatus Status { get; set; } = PolicyStatus.Active;
    public DateTime IssueDate { get; set; } = DateTime.UtcNow;
    public string IssuedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class PricingRule
{
    public int Id { get; set; }
    public string ParameterKey { get; set; } = string.Empty;
    public string DisplayNameAr { get; set; } = string.Empty;
    public PricingParameterType ParameterType { get; set; }
    public decimal Value { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class DepreciationRule
{
    public int Id { get; set; }
    public VehicleUsageType? VehicleUsage { get; set; }
    public int? MinAgeYears { get; set; }
    public int? MaxAgeYears { get; set; }
    public string? PartType { get; set; }
    public InsuranceType? PolicyType { get; set; }
    public string? ClaimType { get; set; }
    public decimal DepreciationPercent { get; set; }
    public string? Notes { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class Accident
{
    public int Id { get; set; }
    public string AccidentNumber { get; set; } = string.Empty;
    public DateTime AccidentDateTime { get; set; }
    public string Location { get; set; } = string.Empty;
    public int PolicyId { get; set; }
    public Policy? Policy { get; set; }
    public int VehicleId { get; set; }
    public Vehicle? Vehicle { get; set; }
    public string DriverName { get; set; } = string.Empty;
    public string? DriverNationalId { get; set; }
    public string? OtherPartyName { get; set; }
    public string? OtherPartyInsurer { get; set; }
    public string? OtherPartyPolicyNumber { get; set; }
    public string? OtherPartyPlateNumber { get; set; }
    public string Description { get; set; } = string.Empty;
    public decimal? LiabilityPercent { get; set; }
    public LiabilityType Liability { get; set; } = LiabilityType.Unknown;
    public AccidentType AccidentType { get; set; } = AccidentType.KnownThirdParty;
    public AccidentStatus Status { get; set; } = AccidentStatus.Open;
    public bool? IsCovered { get; set; }
    public string? CoverageReason { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public string CreatedBy { get; set; } = string.Empty;
    public ICollection<CoverageCheckLog> CoverageChecks { get; set; } = new List<CoverageCheckLog>();
    public ICollection<DamageItem> DamageItems { get; set; } = new List<DamageItem>();
    public ICollection<AccidentPayment> Payments { get; set; } = new List<AccidentPayment>();
    public ICollection<InjuryClaim> Injuries { get; set; } = new List<InjuryClaim>();
    public ICollection<DocumentFile> Documents { get; set; } = new List<DocumentFile>();
    public ICollection<Claim> Claims { get; set; } = new List<Claim>();
}

public class CoverageCheckLog
{
    public long Id { get; set; }
    public int AccidentId { get; set; }
    public Accident? Accident { get; set; }
    public int PolicyId { get; set; }
    public bool IsCovered { get; set; }
    public string Reason { get; set; } = string.Empty;
    public string CheckedBy { get; set; } = string.Empty;
    public DateTime CheckedAt { get; set; } = DateTime.UtcNow;
    public string? DetailsJson { get; set; }
}

public class DamageItem
{
    public int Id { get; set; }
    public int AccidentId { get; set; }
    public Accident? Accident { get; set; }
    public string PartName { get; set; } = string.Empty;
    public string? PartNumber { get; set; }
    public string DamageType { get; set; } = string.Empty;
    public DamageAction Action { get; set; } = DamageAction.Repair;
    public decimal PartPrice { get; set; }
    public decimal LaborCost { get; set; }
    public decimal PaintCost { get; set; }
    public decimal Discount { get; set; }
    public decimal DepreciationPercent { get; set; }
    public decimal FinalAmount { get; set; }
}

public class AccidentPayment
{
    public int Id { get; set; }
    public int AccidentId { get; set; }
    public Accident? Accident { get; set; }
    public PaymentType PaymentType { get; set; }
    public decimal Amount { get; set; }
    public string PaidBy { get; set; } = string.Empty;
    public string PaidTo { get; set; } = string.Empty;
    public DateTime PaymentDate { get; set; }
    public string PaymentMethod { get; set; } = "نقدي";
    public string? ReceiptNumber { get; set; }
    public string? ProofPath { get; set; }
    public PaymentStatus Status { get; set; } = PaymentStatus.Paid;
    public string? Notes { get; set; }
}

public class InjuryClaim
{
    public int Id { get; set; }
    public int AccidentId { get; set; }
    public Accident? Accident { get; set; }
    public string InjuredName { get; set; } = string.Empty;
    public string? NationalId { get; set; }
    public string RelationToAccident { get; set; } = string.Empty;
    public string InjuryType { get; set; } = string.Empty;
    public string? Hospital { get; set; }
    public string? MedicalReport { get; set; }
    public decimal TreatmentCost { get; set; }
    public string? BillsPaidBy { get; set; }
    public decimal DisabilityPercent { get; set; }
    public int DowntimeDays { get; set; }
    public DateTime? InjuryDate { get; set; }
    public DateTime? RecoveryDate { get; set; }
    public bool PermanentDisability { get; set; }
    public bool IsFatal { get; set; }
    public string? DeathCertificateRef { get; set; }
    public string? Beneficiaries { get; set; }
    public decimal AdditionalExpenses { get; set; }
    public decimal CompensationAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal RemainingAmount { get; set; }
}

public class Claim
{
    public int Id { get; set; }
    public string ClaimNumber { get; set; } = string.Empty;
    public int AccidentId { get; set; }
    public Accident? Accident { get; set; }
    public ClaimantType ClaimantType { get; set; }
    public ClaimStatus Status { get; set; } = ClaimStatus.Draft;
    public decimal ClaimAmount { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public Settlement? Settlement { get; set; }
    public RecoveryClaim? RecoveryClaim { get; set; }
}

public class Settlement
{
    public int Id { get; set; }
    public int ClaimId { get; set; }
    public Claim? Claim { get; set; }
    public decimal ClaimAmount { get; set; }
    public decimal Deductible { get; set; }
    public decimal OtherAdjustments { get; set; }
    public decimal FinalAmount { get; set; }
    public SettlementStatus Status { get; set; } = SettlementStatus.Draft;
    public string? ApprovedBy { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class RecoveryClaim
{
    public int Id { get; set; }
    public int ClaimId { get; set; }
    public Claim? Claim { get; set; }
    public string OtherInsurerName { get; set; } = string.Empty;
    public string? OtherPolicyNumber { get; set; }
    public string AccidentNumber { get; set; } = string.Empty;
    public decimal ClaimedAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public RecoveryStatus Status { get; set; } = RecoveryStatus.Draft;
    public string? SettlementRef { get; set; }
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? SubmittedAt { get; set; }
}

public class DocumentFile
{
    public int Id { get; set; }
    public int? AccidentId { get; set; }
    public Accident? Accident { get; set; }
    public int? ClaimId { get; set; }
    public DocumentType DocumentType { get; set; }
    public string FileName { get; set; } = string.Empty;
    public string StoredPath { get; set; } = string.Empty;
    public string ContentType { get; set; } = "application/octet-stream";
    public long FileSize { get; set; }
    public string UploadedBy { get; set; } = string.Empty;
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public int Version { get; set; } = 1;
}
