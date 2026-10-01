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
  policies: any[];
  accidents: any[];
  claims: any[];
}
