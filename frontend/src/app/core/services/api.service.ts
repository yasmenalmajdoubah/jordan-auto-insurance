import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Insured, InsuredProfile, Vehicle, VehicleProfile } from '../models/insurance.models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly base = 'http://localhost:5213/api';

  constructor(private http: HttpClient) {}

  // Insureds
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

  // Vehicles
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
}
