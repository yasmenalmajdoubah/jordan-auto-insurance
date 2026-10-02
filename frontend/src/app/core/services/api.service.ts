import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  Accident,
  AccidentDocument,
  CoverageCheckLog,
  CoverageResult,
  CreateAccidentResponse,
  DocumentType,
  Insured,
  InsuredProfile,
  Policy,
  PremiumCalculationResult,
  PricingRule,
  Vehicle,
  VehicleProfile
} from '../models/insurance.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  readonly base = 'http://localhost:5213/api';

  constructor(private http: HttpClient) {}

  getInsureds(q?: string) {
    let params = new HttpParams();
    if (q) params = params.set('q', q);
    return this.http.get<Insured[]>(`${this.base}/insureds`, { params });
  }

  getInsured(id: number) {
    return this.http.get<Insured>(`${this.base}/insureds/${id}`);
  }

  getInsuredProfile(id: number) {
    return this.http.get<InsuredProfile>(`${this.base}/insureds/${id}/profile`);
  }

  createInsured(body: Partial<Insured>) {
    return this.http.post<Insured>(`${this.base}/insureds`, body);
  }

  updateInsured(id: number, body: Partial<Insured>) {
    return this.http.put<Insured>(`${this.base}/insureds/${id}`, body);
  }

  deleteInsured(id: number) {
    return this.http.delete(`${this.base}/insureds/${id}`);
  }

  getVehicles(q?: string) {
    let params = new HttpParams();
    if (q) params = params.set('q', q);
    return this.http.get<Vehicle[]>(`${this.base}/vehicles`, { params });
  }

  getVehicle(id: number) {
    return this.http.get<Vehicle>(`${this.base}/vehicles/${id}`);
  }

  getVehicleProfile(id: number) {
    return this.http.get<VehicleProfile>(`${this.base}/vehicles/${id}/profile`);
  }

  createVehicle(body: Partial<Vehicle>) {
    return this.http.post<Vehicle>(`${this.base}/vehicles`, body);
  }

  updateVehicle(id: number, body: Partial<Vehicle>) {
    return this.http.put<Vehicle>(`${this.base}/vehicles/${id}`, body);
  }

  deleteVehicle(id: number) {
    return this.http.delete(`${this.base}/vehicles/${id}`);
  }

  getPolicies(opts?: { status?: string; q?: string }) {
    let params = new HttpParams();
    if (opts?.status) params = params.set('status', opts.status);
    if (opts?.q) params = params.set('q', opts.q);
    return this.http.get<Policy[]>(`${this.base}/policies`, { params });
  }

  getPolicy(id: number) {
    return this.http.get<Policy>(`${this.base}/policies/${id}`);
  }

  createPolicy(body: Partial<Policy>) {
    return this.http.post<Policy>(`${this.base}/policies`, body);
  }

  updatePolicy(id: number, body: Partial<Policy>) {
    return this.http.put<Policy>(`${this.base}/policies/${id}`, body);
  }

  checkPolicyCoverage(id: number, body: { accidentDate: string; vehicleId?: number | null; accidentType: string }) {
    return this.http.post<CoverageResult>(`${this.base}/policies/${id}/coverage-check`, body);
  }

  getPolicyCoverageChecks(id: number) {
    return this.http.get<CoverageCheckLog[]>(`${this.base}/policies/${id}/coverage-checks`);
  }

  getPricingRules() {
    return this.http.get<PricingRule[]>(`${this.base}/rules/pricing`);
  }

  savePricingRule(body: Partial<PricingRule>) {
    return this.http.post<PricingRule>(`${this.base}/rules/pricing`, body);
  }

  calculatePremium(body: {
    usageType: string;
    insuranceType: string;
    vehicleValue: number;
    hasPreviousClaims: boolean;
    applyNoClaimsDiscount: boolean;
  }) {
    return this.http.post<PremiumCalculationResult>(`${this.base}/policies/calculate-premium`, body);
  }

  getAccidents(opts?: { status?: string; q?: string }) {
    let params = new HttpParams();
    if (opts?.status) params = params.set('status', opts.status);
    if (opts?.q) params = params.set('q', opts.q);
    return this.http.get<Accident[]>(`${this.base}/accidents`, { params });
  }

  getAccident(id: number) {
    return this.http.get<Accident>(`${this.base}/accidents/${id}`);
  }

  createAccident(body: any) {
    return this.http.post<CreateAccidentResponse>(`${this.base}/accidents`, body);
  }

  updateAccident(id: number, body: any) {
    return this.http.put<Accident>(`${this.base}/accidents/${id}`, body);
  }

  recheckAccidentCoverage(id: number) {
    return this.http.post<CoverageResult>(`${this.base}/accidents/${id}/coverage-check`, {});
  }

  uploadAccidentDocument(accidentId: number, file: File, documentType: DocumentType | string) {
    const form = new FormData();
    form.append('file', file);
    form.append('documentType', String(documentType));
    return this.http.post<AccidentDocument>(`${this.base}/accidents/${accidentId}/documents`, form);
  }

  downloadDocument(id: number) {
    return this.http.get(`${this.base}/documents/${id}/download`, { responseType: 'blob' });
  }

  documentDownloadUrl(id: number) {
    return `${this.base}/documents/${id}/download`;
  }
}
