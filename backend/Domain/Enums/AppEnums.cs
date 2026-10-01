namespace JordanAutoInsurance.Api.Domain.Enums;

public enum ClientType
{
    Individual = 1,
    Company = 2
}

public enum VehicleUsageType
{
    Private = 1,
    Taxi = 2,
    Medium = 3,
    Cargo = 4,
    Other = 5
}

public enum VehicleCondition
{
    Excellent = 1,
    Good = 2,
    Fair = 3,
    Poor = 4
}

public enum InsuranceType
{
    ThirdParty = 1,
    Comprehensive = 2
}

public enum PolicyStatus
{
    Active = 1,
    Expired = 2,
    Cancelled = 3,
    Suspended = 4
}

public enum AccidentType
{
    KnownThirdParty = 1,
    UnknownHitAndRun = 2,
    SingleVehicle = 3,
    MultipleVehicles = 4,
    Other = 5
}

public enum AccidentStatus
{
    Open = 1,
    UnderReview = 2,
    Closed = 3,
    Rejected = 4
}

public enum LiabilityType
{
    AtFault = 1,
    NotAtFault = 2,
    Unknown = 3,
    Shared = 4
}

public enum ClaimantType
{
    Insured = 1,
    ThirdParty = 2
}

public enum ClaimStatus
{
    Draft = 1,
    Submitted = 2,
    UnderReview = 3,
    Approved = 4,
    Rejected = 5,
    Settled = 6,
    Closed = 7
}

public enum DamageAction
{
    Repair = 1,
    Replace = 2
}

public enum PaymentType
{
    Krooka = 1,
    AccidentFee = 2,
    RepairPayment = 3,
    SettlementPayment = 4,
    MedicalPayment = 5,
    Other = 6
}

public enum PaymentStatus
{
    Pending = 1,
    Paid = 2,
    Cancelled = 3
}

public enum RecoveryStatus
{
    Draft = 1,
    Submitted = 2,
    UnderReview = 3,
    Accepted = 4,
    PartiallyAccepted = 5,
    Rejected = 6,
    Paid = 7,
    Closed = 8
}

public enum DocumentType
{
    AccidentReport = 1,
    DriverLicense = 2,
    VehicleLicense = 3,
    InsurancePolicy = 4,
    VehiclePhoto = 5,
    DamageAssessment = 6,
    MedicalReport = 7,
    MedicalBill = 8,
    Settlement = 9,
    PaymentReceipt = 10,
    RecoveryDocument = 11,
    Other = 12
}

public enum PricingParameterType
{
    VehicleUsage = 1,
    InsuranceType = 2,
    PreviousClaims = 3,
    NoClaimsDiscount = 4,
    VehicleValueBand = 5,
    DriverAge = 6,
    BasePremium = 7,
    Other = 8
}

public enum SettlementStatus
{
    Draft = 1,
    Approved = 2,
    Paid = 3,
    Cancelled = 4
}
