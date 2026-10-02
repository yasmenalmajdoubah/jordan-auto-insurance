import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { CoverageResult, Policy, Vehicle } from '../../core/models/insurance.models';

@Component({
  selector: 'app-accident-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <a routerLink="/accidents" class="back">← رجوع للحوادث</a>
      <h2>تسجيل حادث</h2>
      <p class="hint">عند الحفظ يتم عمل Coverage Check تلقائيًا على الوثيقة.</p>

      <form class="card" (ngSubmit)="save()">
        <div class="grid">
          <label>الوثيقة
            <select [(ngModel)]="model.policyId" name="policyId" (ngModelChange)="onPolicyChange()" required>
              <option [ngValue]="0" disabled>اختر الوثيقة</option>
              @for (p of policies(); track p.id) {
                <option [ngValue]="p.id">{{ p.policyNumber }} — {{ typeLabel(p.insuranceType) }}</option>
              }
            </select>
          </label>
          <label>المركبة
            <select [(ngModel)]="model.vehicleId" name="vehicleId" required>
              <option [ngValue]="0" disabled>اختر المركبة</option>
              @for (v of vehicles(); track v.id) {
                <option [ngValue]="v.id">{{ v.plateNumber }} — {{ v.manufacturer }} {{ v.model }}</option>
              }
            </select>
          </label>
          <label>تاريخ ووقت الحادث
            <input type="datetime-local" [(ngModel)]="model.accidentDateTime" name="accidentDateTime" required />
          </label>
          <label>مكان الحادث
            <input [(ngModel)]="model.location" name="location" required />
          </label>
          <label>اسم السائق
            <input [(ngModel)]="model.driverName" name="driverName" required />
          </label>
          <label>الرقم الوطني للسائق
            <input [(ngModel)]="model.driverNationalId" name="driverNationalId" />
          </label>
          <label>نوع الحادث
            <select [(ngModel)]="model.accidentType" name="accidentType">
              <option value="KnownThirdParty">طرف آخر معروف</option>
              <option value="UnknownHitAndRun">ضد مجهول</option>
              <option value="SingleVehicle">مركبة واحدة</option>
              <option value="MultipleVehicles">عدة مركبات</option>
              <option value="Other">أخرى</option>
            </select>
          </label>
          <label>المسؤولية
            <select [(ngModel)]="model.liability" name="liability">
              <option value="AtFault">متسبب</option>
              <option value="NotAtFault">متضرر</option>
              <option value="Unknown">غير معروف</option>
              <option value="Shared">مشترك</option>
            </select>
          </label>
          <label>نسبة المسؤولية %
            <input type="number" [(ngModel)]="model.liabilityPercent" name="liabilityPercent" />
          </label>
          <label>حالة الحادث
            <select [(ngModel)]="model.status" name="status">
              <option value="Open">Open</option>
              <option value="UnderReview">UnderReview</option>
              <option value="Closed">Closed</option>
              <option value="Rejected">Rejected</option>
            </select>
          </label>
          <label>الطرف الآخر
            <input [(ngModel)]="model.otherPartyName" name="otherPartyName" />
          </label>
          <label>شركة تأمين الطرف الآخر
            <input [(ngModel)]="model.otherPartyInsurer" name="otherPartyInsurer" />
          </label>
          <label>رقم وثيقة الطرف الآخر
            <input [(ngModel)]="model.otherPartyPolicyNumber" name="otherPartyPolicyNumber" />
          </label>
          <label>لوحة الطرف الآخر
            <input [(ngModel)]="model.otherPartyPlateNumber" name="otherPartyPlateNumber" />
          </label>
          <label class="full">وصف الحادث
            <textarea [(ngModel)]="model.description" name="description" rows="3" required></textarea>
          </label>
        </div>

        @if (error()) { <p class="error">{{ error() }}</p> }
        @if (coverage(); as c) {
          <div class="coverage" [class.ok]="c.isCovered" [class.no]="!c.isCovered">
            <strong>{{ c.isCovered ? 'Covered' : 'Not Covered' }}</strong>
            <p>{{ c.reason }}</p>
          </div>
        }

        <div class="actions">
          <button class="btn primary" type="submit" [disabled]="saving()">حفظ الحادث</button>
          <a class="btn" routerLink="/accidents">إلغاء</a>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .page { display: grid; gap: 1rem; max-width: 980px; }
    .back { color: #0b7a5a; text-decoration: none; width: fit-content; }
    h2 { margin: 0; }
    .hint { margin: 0; color: #64748b; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.25rem; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    label { display: grid; gap: .35rem; font-size: .92rem; }
    .full { grid-column: 1 / -1; }
    input, select, textarea { border: 1px solid #cbd5e1; border-radius: 10px; padding: .7rem .85rem; font: inherit; }
    .actions { display: flex; gap: .75rem; margin-top: 1rem; }
    .btn { border: 1px solid #cbd5e1; background: white; border-radius: 10px; padding: .7rem 1rem; text-decoration: none; color: inherit; cursor: pointer; }
    .btn.primary { background: #0b7a5a; color: white; border-color: #0b7a5a; }
    .error { color: #b91c1c; }
    .coverage { border-radius: 10px; padding: .8rem; margin-top: .8rem; }
    .coverage.ok { background: #ecfdf5; color: #065f46; }
    .coverage.no { background: #fef2f2; color: #991b1b; }
    @media (max-width: 700px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class AccidentFormComponent implements OnInit {
  saving = signal(false);
  error = signal('');
  coverage = signal<CoverageResult | null>(null);
  policies = signal<Policy[]>([]);
  vehicles = signal<Vehicle[]>([]);
  allVehicles = signal<Vehicle[]>([]);

  model: any = {
    policyId: 0,
    vehicleId: 0,
    accidentDateTime: new Date().toISOString().slice(0, 16),
    location: '',
    driverName: '',
    driverNationalId: '',
    accidentType: 'KnownThirdParty',
    liability: 'Unknown',
    liabilityPercent: null,
    status: 'Open',
    otherPartyName: '',
    otherPartyInsurer: '',
    otherPartyPolicyNumber: '',
    otherPartyPlateNumber: '',
    description: ''
  };

  constructor(private api: ApiService, private router: Router) {}

  ngOnInit(): void {
    this.api.getPolicies().subscribe({ next: (d) => this.policies.set(d) });
    this.api.getVehicles().subscribe({
      next: (d) => {
        this.allVehicles.set(d);
        this.vehicles.set(d);
      }
    });
  }

  onPolicyChange(): void {
    const p = this.policies().find(x => x.id === Number(this.model.policyId));
    if (!p) return;
    this.model.vehicleId = p.vehicleId;
    this.vehicles.set(this.allVehicles().filter(v => v.id === p.vehicleId || v.ownerInsuredId === p.insuredId));
  }

  save(): void {
    if (!this.model.policyId || !this.model.vehicleId) {
      this.error.set('اختر الوثيقة والمركبة');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const body = {
      ...this.model,
      accidentDateTime: new Date(this.model.accidentDateTime).toISOString()
    };
    this.api.createAccident(body).subscribe({
      next: (res) => {
        this.saving.set(false);
        this.coverage.set(res.coverage);
        this.router.navigate(['/accidents', res.accident.id]);
      },
      error: () => {
        this.saving.set(false);
        this.error.set('تعذر حفظ الحادث');
      }
    });
  }

  typeLabel(t: Policy['insuranceType']): string {
    return t === 'Comprehensive' || t === 2 ? 'شامل' : 'ضد الغير';
  }
}
