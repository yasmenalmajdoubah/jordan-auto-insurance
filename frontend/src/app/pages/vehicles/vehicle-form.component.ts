import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Insured, Vehicle } from '../../core/models/insurance.models';

@Component({
  selector: 'app-vehicle-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <a routerLink="/vehicles" class="back">← رجوع للمركبات</a>
      <h2>{{ isEdit ? 'تعديل مركبة' : 'إضافة مركبة' }}</h2>

      <form class="card" (ngSubmit)="save()">
        <div class="grid">
          <label>رقم اللوحة
            <input [(ngModel)]="model.plateNumber" name="plateNumber" required />
          </label>
          <label>نوع اللوحة
            <input [(ngModel)]="model.plateType" name="plateType" required />
          </label>
          <label>رقم الشاصي
            <input [(ngModel)]="model.chassisNumber" name="chassisNumber" required />
          </label>
          <label>رقم المحرك
            <input [(ngModel)]="model.engineNumber" name="engineNumber" required />
          </label>
          <label>الشركة المصنعة
            <input [(ngModel)]="model.manufacturer" name="manufacturer" required />
          </label>
          <label>الموديل
            <input [(ngModel)]="model.model" name="model" required />
          </label>
          <label>سنة الصنع
            <input type="number" [(ngModel)]="model.year" name="year" required />
          </label>
          <label>اللون
            <input [(ngModel)]="model.color" name="color" required />
          </label>
          <label>نوع الاستخدام
            <select [(ngModel)]="model.usageType" name="usageType">
              <option value="Private">خصوصي</option>
              <option value="Taxi">ركوب</option>
              <option value="Medium">متوسط</option>
              <option value="Cargo">شحن</option>
              <option value="Other">أخرى</option>
            </select>
          </label>
          <label>قيمة المركبة
            <input type="number" [(ngModel)]="model.vehicleValue" name="vehicleValue" required />
          </label>
          <label>حالة المركبة
            <select [(ngModel)]="model.condition" name="condition">
              <option value="Excellent">ممتازة</option>
              <option value="Good">جيدة</option>
              <option value="Fair">متوسطة</option>
              <option value="Poor">ضعيفة</option>
            </select>
          </label>
          <label>المالك (المؤمن)
            <select [(ngModel)]="model.ownerInsuredId" name="ownerInsuredId" required>
              <option [ngValue]="0" disabled>اختر المؤمن</option>
              @for (i of insureds(); track i.id) {
                <option [ngValue]="i.id">{{ i.fullName }} — {{ i.nationalId }}</option>
              }
            </select>
          </label>
          <label class="full">السائقون المصرح لهم
            <input [(ngModel)]="model.authorizedDrivers" name="authorizedDrivers" placeholder="أسماء مفصولة بفاصلة" />
          </label>
        </div>

        @if (error()) { <p class="error">{{ error() }}</p> }
        <div class="actions">
          <button class="btn primary" type="submit" [disabled]="saving()">حفظ</button>
          <a class="btn" routerLink="/vehicles">إلغاء</a>
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
    input, select { border: 1px solid #cbd5e1; border-radius: 10px; padding: .7rem .85rem; font: inherit; }
    .actions { display: flex; gap: .75rem; margin-top: 1rem; }
    .btn { border: 1px solid #cbd5e1; background: white; border-radius: 10px; padding: .7rem 1rem; text-decoration: none; color: inherit; cursor: pointer; }
    .btn.primary { background: #0b7a5a; color: white; border-color: #0b7a5a; }
    .error { color: #b91c1c; }
    @media (max-width: 700px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class VehicleFormComponent implements OnInit {
  isEdit = false;
  id = 0;
  saving = signal(false);
  error = signal('');
  insureds = signal<Insured[]>([]);
  model: Partial<Vehicle> = {
    plateNumber: '',
    plateType: 'خصوصي',
    chassisNumber: '',
    engineNumber: '',
    manufacturer: '',
    model: '',
    year: new Date().getFullYear(),
    color: '',
    usageType: 'Private',
    vehicleValue: 0,
    condition: 'Good',
    ownerInsuredId: 0,
    authorizedDrivers: ''
  };

  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.api.getInsureds().subscribe({
      next: (data) => this.insureds.set(data),
      error: () => this.error.set('تعذر تحميل قائمة المؤمن لهم')
    });

    const ownerId = Number(this.route.snapshot.queryParamMap.get('ownerId') || 0);
    if (ownerId) this.model.ownerInsuredId = ownerId;

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'new') {
      this.isEdit = true;
      this.id = Number(idParam);
      this.api.getVehicle(this.id).subscribe({
        next: (data) => {
          this.model = {
            ...data,
            usageType: this.normalizeUsage(data.usageType) as Vehicle['usageType'],
            condition: this.normalizeCondition(data.condition) as Vehicle['condition']
          };
        },
        error: () => this.error.set('تعذر تحميل بيانات المركبة')
      });
    }
  }

  save(): void {
    if (!this.model.ownerInsuredId) {
      this.error.set('يجب اختيار المالك');
      return;
    }
    this.saving.set(true);
    this.error.set('');
    const body = { ...this.model };
    const req = this.isEdit
      ? this.api.updateVehicle(this.id, body)
      : this.api.createVehicle(body);

    req.subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.router.navigate(['/vehicles', saved.id]);
      },
      error: () => {
        this.saving.set(false);
        this.error.set('تعذر الحفظ. تحقق من رقم الشاصي/اللوحة.');
      }
    });
  }

  private normalizeUsage(v: Vehicle['usageType']): string {
    const map: Record<string, string> = { '1': 'Private', '2': 'Taxi', '3': 'Medium', '4': 'Cargo', '5': 'Other' };
    return map[String(v)] || String(v);
  }

  private normalizeCondition(v: Vehicle['condition']): string {
    const map: Record<string, string> = { '1': 'Excellent', '2': 'Good', '3': 'Fair', '4': 'Poor' };
    return map[String(v)] || String(v);
  }
}
