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
}

export interface CreateAccidentResponse {
  accident: Accident;
  coverage: CoverageResult;
}

