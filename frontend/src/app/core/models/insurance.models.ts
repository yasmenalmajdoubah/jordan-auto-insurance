export type ClientType = 'Individual' | 'Company' | 1 | 2;
export type VehicleUsageType = 'Private' | 'Taxi' | 'Medium' | 'Cargo' | 'Other' | number;
export type VehicleCondition = 'Excellent' | 'Good' | 'Fair' | 'Poor' | number;

export interface Insured {
  id: number;
  fullName: string;
  nationalId: string;
  phone: string;
  secondaryPhone?: string | null;
  email?: string | null;
  address: string;
  clientType: ClientType;
  notes?: string | null;
  createdAt?: string;
}

export interface Vehicle {
  id: number;
  plateNumber: string;
  plateType: string;
  chassisNumber: string;
  engineNumber: string;
  manufacturer: string;
  model: string;
  year: number;
  color: string;
  usageType: VehicleUsageType;
  vehicleValue: number;
  condition: VehicleCondition;
  ownerInsuredId: number;
  authorizedDrivers?: string | null;
  owner?: Insured | null;
  createdAt?: string;
}

export interface InsuredProfile {
  insured: Insured;
  vehicles: Vehicle[];
  policies: any[];
  accidents: any[];
  claims: any[];
  payments: any[];
}

export interface VehicleProfile {
  vehicle: Vehicle;
  policies: Policy[];
  accidents: any[];
  claims: any[];
}

export type InsuranceType = 'ThirdParty' | 'Comprehensive' | 1 | 2;
export type PolicyStatus = 'Active' | 'Expired' | 'Cancelled' | 'Suspended' | number;
export type AccidentType = 'KnownThirdParty' | 'UnknownHitAndRun' | 'SingleVehicle' | 'MultipleVehicles' | 'Other' | number;

export interface Policy {
  id: number;
  policyNumber: string;
  insuredId: number;
  vehicleId: number;
  insuranceType: InsuranceType;
  startDate: string;
  endDate: string;
  insuredValue: number;
  premium: number;
  discounts: number;
  additions: number;
  deductible: number;
  coverages?: string | null;
  exclusions?: string | null;
  status: PolicyStatus;
  issueDate?: string;
  issuedBy: string;
  insured?: Insured | null;
  vehicle?: Vehicle | null;
}

export interface CoverageCheckLog {
  id: number;
  accidentId?: number | null;
  policyId: number;
  isCovered: boolean;
  reason: string;
  checkedBy: string;
  checkedAt: string;
  detailsJson?: string | null;
}

export interface CoverageResult {
  isCovered: boolean;
  reason: string;
  details: {
    steps?: string[];
    policyNumber?: string;
    accidentDate?: string;
    vehicleId?: number;
    accidentType?: string;
    mode?: string;
    accidentNumber?: string;
  };
}

export interface PricingRule {
  id: number;
  parameterKey: string;
  displayNameAr: string;
  parameterType: string | number;
  value: number;
  notes?: string | null;
  isActive: boolean;
  updatedAt?: string;
}

export interface PremiumCalculationResult {
  basePremium: number;
  usageLoadingPercent: number;
  typeLoadingPercent: number;
  claimsLoadingPercent: number;
  discountPercent: number;
  vehicleValueFactor: number;
  finalPremium: number;
  breakdown: string[];
}

export type AccidentStatus = 'Open' | 'UnderReview' | 'Closed' | 'Rejected' | number;
export type LiabilityType = 'AtFault' | 'NotAtFault' | 'Unknown' | 'Shared' | number;
export type DocumentType =
  | 'AccidentReport' | 'DriverLicense' | 'VehicleLicense' | 'InsurancePolicy'
  | 'VehiclePhoto' | 'DamageAssessment' | 'MedicalReport' | 'MedicalBill'
  | 'Settlement' | 'PaymentReceipt' | 'RecoveryDocument' | 'Other' | number;

export interface AccidentDocument {
  id: number;
  accidentId?: number | null;
  documentType: DocumentType;
  fileName: string;
  contentType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  version: number;
}

export interface Accident {
  id: number;
  accidentNumber: string;
  accidentDateTime: string;
  location: string;
  policyId: number;
  vehicleId: number;
  driverName: string;
  driverNationalId?: string | null;
  otherPartyName?: string | null;
  otherPartyInsurer?: string | null;
  otherPartyPolicyNumber?: string | null;
  otherPartyPlateNumber?: string | null;
  description: string;
  liabilityPercent?: number | null;
  liability: LiabilityType;
  accidentType: AccidentType;
  status: AccidentStatus;
  isCovered?: boolean | null;
  coverageReason?: string | null;
  createdAt?: string;
  createdBy?: string;
  policy?: Policy | null;
  vehicle?: Vehicle | null;
  documents?: AccidentDocument[];
  coverageChecks?: CoverageCheckLog[];
  damageItems?: DamageItem[];
  payments?: AccidentPayment[];
  injuries?: InjuryClaim[];
  claims?: ClaimRecord[];
}

export interface CreateAccidentResponse {
  accident: Accident;
  coverage: CoverageResult;
}

export interface DamageItem {
  id: number;
  accidentId: number;
  partName: string;
  partNumber?: string | null;
  damageType: string;
  action: 'Repair' | 'Replace' | number;
  partPrice: number;
  laborCost: number;
  paintCost: number;
  discount: number;
  depreciationPercent: number;
  finalAmount: number;
}

export interface DamageSummary {
  items: DamageItem[];
  total: number;
  parts: number;
  labor: number;
  paint: number;
}

export interface DepreciationRule {
  id: number;
  vehicleUsage?: string | number | null;
  minAgeYears?: number | null;
  maxAgeYears?: number | null;
  partType?: string | null;
  policyType?: string | number | null;
  claimType?: string | null;
  depreciationPercent: number;
  notes?: string | null;
  isActive: boolean;
  updatedAt?: string;
}

export interface AccidentPayment {
  id: number;
  accidentId: number;
  paymentType: string | number;
  amount: number;
  paidBy: string;
  paidTo: string;
  paymentDate: string;
  paymentMethod: string;
  receiptNumber?: string | null;
  status: string | number;
  notes?: string | null;
}

export interface InjuryClaim {
  id: number;
  accidentId: number;
  injuredName: string;
  nationalId?: string | null;
  relationToAccident: string;
  injuryType: string;
  hospital?: string | null;
  medicalReport?: string | null;
  treatmentCost: number;
  billsPaidBy?: string | null;
  disabilityPercent: number;
  downtimeDays: number;
  injuryDate?: string | null;
  recoveryDate?: string | null;
  permanentDisability: boolean;
  isFatal: boolean;
  deathCertificateRef?: string | null;
  beneficiaries?: string | null;
  additionalExpenses: number;
  compensationAmount: number;
  paidAmount: number;
  remainingAmount: number;
}

export interface Settlement {
  id: number;
  claimId: number;
  claimAmount: number;
  deductible: number;
  otherAdjustments: number;
  finalAmount: number;
  status: string | number;
  approvedBy?: string | null;
  approvedAt?: string | null;
}

export interface ClaimRecord {
  id: number;
  claimNumber: string;
  accidentId: number;
  claimantType: string | number;
  status: string | number;
  claimAmount: number;
  notes?: string | null;
  createdAt?: string;
  accident?: Accident | null;
  settlement?: Settlement | null;
  recoveryClaim?: RecoveryClaim | null;
}

export interface RecoveryClaim {
  id: number;
  claimId: number;
  otherInsurerName: string;
  otherPolicyNumber?: string | null;
  accidentNumber: string;
  claimedAmount: number;
  paidAmount: number;
  status: string | number;
  settlementRef?: string | null;
  notes?: string | null;
  createdAt?: string;
  submittedAt?: string | null;
  claim?: ClaimRecord | null;
}

export interface DashboardSummary {
  activePolicies: number;
  expiredPolicies: number;
  newPolicies: number;
  accidentsToday: number;
  openAccidents: number;
  openClaims: number;
  pendingClaims: number;
  approvedClaims: number;
  rejectedClaims: number;
  settledClaims: number;
  totalPaidClaims: number;
  outstandingClaims: number;
  recoveryAmount: number;
  pendingRecovery: number;
  recoveryPaid: number;
  claimsByMonth: { month: string; count: number }[];
  accidentsByMonth: { month: string; count: number }[];
  accidentsByVehicleUsage: { usage: string; count: number }[];
  claimsByInsuranceType: { type: string; count: number }[];
  claimsByStatus: { status: string; count: number }[];
  comprehensiveVsThirdParty: { comprehensive: number; thirdParty: number };
  recoveryByStatus: { status: string; count: number; amount: number }[];
}

export interface AppUser {
  id: number;
  userName: string;
  fullName: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt?: string;
}

export interface AuditLogEntry {
  id: number;
  userName: string;
  action: string;
  entityType: string;
  entityId?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  ipAddress?: string | null;
  createdAt: string;
}

