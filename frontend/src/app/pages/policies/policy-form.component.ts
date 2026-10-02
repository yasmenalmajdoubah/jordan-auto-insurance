import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Insured, Policy, Vehicle } from '../../core/models/insurance.models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-policy-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <a routerLink="/policies" class="back">← رجوع للوثائق</a>
      <h2>{{ isEdit ? 'تعديل وثيقة' : 'إصدار وثيقة تأمين' }}</h2>

      <form class="card" (ngSubmit)="save()">
        <div class="grid">
          <label>المؤمن له
            <select [(ngModel)]="model.insuredId" name="insuredId" (ngModelChange)="onInsuredChange()" required>
              <option [ngValue]="0" disabled>اختر المؤمن</option>
              @for (i of insureds(); track i.id) {
                <option [ngValue]="i.id">{{ i.fullName }} — {{ i.nationalId }}</option>
              }
            </select>
          </label>
          <label>المركبة
            <select [(ngModel)]="model.vehicleId" name="vehicleId" required>
              <option [ngValue]="0" disabled>اختر المركبة</option>
              @for (v of filteredVehicles(); track v.id) {
                <option [ngValue]="v.id">{{ v.plateNumber }} — {{ v.manufacturer }} {{ v.model }}</option>
              }
            </select>
          </label>
          <label>نوع التأمين
            <select [(ngModel)]="model.insuranceType" name="insuranceType">
              <option value="ThirdParty">ضد الغير / إلزامي</option>
              <option value="Comprehensive">شامل</option>
            </select>
          </label>
          <label>حالة الوثيقة
            <select [(ngModel)]="model.status" name="status">
              <option value="Active">Active</option>
              <option value="Expired">Expired</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Suspended">Suspended</option>
            </select>
          </label>
          <label>تاريخ البداية
            <input type="date" [(ngModel)]="model.startDate" name="startDate" required />
          </label>
          <label>تاريخ النهاية
            <input type="date" [(ngModel)]="model.endDate" name="endDate" required />
          </label>
          <label>قيمة التأمين
            <input type="number" [(ngModel)]="model.insuredValue" name="insuredValue" />
          </label>
          <label>القسط
            <input type="number" [(ngModel)]="model.premium" name="premium" />
          </label>
          <label>الخصومات
            <input type="number" [(ngModel)]="model.discounts" name="discounts" />
          </label>
          <label>الإضافات
            <input type="number" [(ngModel)]="model.additions" name="additions" />
          </label>
          <label>التحمل (Deductible)
            <input type="number" [(ngModel)]="model.deductible" name="deductible" />
          </label>
          <label>الموظف المصدر
            <input [(ngModel)]="model.issuedBy" name="issuedBy" />
          </label>
          <label class="full">التغطيات
            <textarea [(ngModel)]="model.coverages" name="coverages" rows="2"
              placeholder="مثال: مسؤولية تجاه الغير، أضرار المركبة..."></textarea>
          </label>
          <label class="full">الاستثناءات
            <textarea [(ngModel)]="model.exclusions" name="exclusions" rows="2"
              placeholder="مثال: حوادث ضد مجهول غير مغطاة"></textarea>
          </label>
        </div>

        @if (error()) { <p class="error">{{ error() }}</p> }
        <div class="actions">
          <button class="btn primary" type="submit" [disabled]="saving()">حفظ</button>
          <a class="btn" routerLink="/policies">إلغاء</a>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .page { display: grid; gap: 1rem; max-width: 960px; }
    .back { color: #0b7a5a; text-decoration: none; width: fit-content; }
    h2 { margin: 0; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1.25rem; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    label { display: grid; gap: .35rem; font-size: .92rem; }
    .full { grid-column: 1 / -1; }
    input, select, textarea { border: 1px solid #cbd5e1; border-radius: 10px; padding: .7rem .85rem; font: inherit; }
    .actions { display: flex; gap: .75rem; margin-top: 1rem; }
    .btn { border: 1px solid #cbd5e1; background: white; border-radius: 10px; padding: .7rem 1rem; text-decoration: none; color: inherit; cursor: pointer; }
    .btn.primary { background: #0b7a5a; color: white; border-color: #0b7a5a; }
    .error { color: #b91c1c; }
    @media (max-width: 700px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class PolicyFormComponent implements OnInit {
  isEdit = false;
  id = 0;
  saving = signal(false);
  error = signal('');
  insureds = signal<Insured[]>([]);
  vehicles = signal<Vehicle[]>([]);
  filteredVehicles = signal<Vehicle[]>([]);

  model: any = {
    insuredId: 0,
    vehicleId: 0,
    insuranceType: 'ThirdParty',
    status: 'Active',
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().slice(0, 10),
    insuredValue: 0,
    premium: 0,
    discounts: 0,
    additions: 0,
    deductible: 0,
    coverages: 'مسؤولية تجاه الغير وفق نطاق الوثيقة',
    exclusions: '',
    issuedBy: ''
  };

  constructor(private api: ApiService, private auth: AuthService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.model.issuedBy = this.auth.currentUser()?.userName || 'admin';

    this.api.getInsureds().subscribe({ next: (d) => this.insureds.set(d) });
    this.api.getVehicles().subscribe({
      next: (d) => {
        this.vehicles.set(d);
        this.onInsuredChange();
      }
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'new') {
      this.isEdit = true;
      this.id = Number(idParam);
      this.api.getPolicy(this.id).subscribe({
        next: (p) => {
          this.model = {
            ...p,
            insuranceType: p.insuranceType === 2 || p.insuranceType === 'Comprehensive' ? 'Comprehensive' : 'ThirdParty',
            status: this.normalizeStatus(p.status),
            startDate: p.startDate?.slice(0, 10),
            endDate: p.endDate?.slice(0, 10)
          };
          this.onInsuredChange();
        },
        error: () => this.error.set('تعذر تحميل الوثيقة')
      });
    }
  }

  onInsuredChange(): void {
    const id = Number(this.model.insuredId || 0);
    const list = this.vehicles().filter(v => !id || v.ownerInsuredId === id);
    this.filteredVehicles.set(list.length ? list : this.vehicles());
  }

  save(): void {
    if (!this.model.insuredId || !this.model.vehicleId) {
      this.error.set('يجب اختيار المؤمن والمركبة');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const body = { ...this.model };
    const req = this.isEdit ? this.api.updatePolicy(this.id, body) : this.api.createPolicy(body);
    req.subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.router.navigate(['/policies', saved.id]);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message || 'تعذر حفظ الوثيقة');
      }
    });
  }

  private normalizeStatus(s: Policy['status']): string {
    const map: Record<string, string> = {
      '1': 'Active', '2': 'Expired', '3': 'Cancelled', '4': 'Suspended'
    };
    return map[String(s)] || String(s);
  }
}
