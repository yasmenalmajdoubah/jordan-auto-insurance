import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Insured } from '../../core/models/insurance.models';

@Component({
  selector: 'app-insured-form',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <a routerLink="/insureds" class="back">← رجوع للمؤمن لهم</a>
      <h2>{{ isEdit ? 'تعديل مؤمن' : 'إضافة مؤمن' }}</h2>

      <form class="card" (ngSubmit)="save()">
        <div class="grid">
          <label>الاسم الكامل
            <input [(ngModel)]="model.fullName" name="fullName" required />
          </label>
          <label>الرقم الوطني
            <input [(ngModel)]="model.nationalId" name="nationalId" required />
          </label>
          <label>رقم الهاتف
            <input [(ngModel)]="model.phone" name="phone" required />
          </label>
          <label>هاتف إضافي
            <input [(ngModel)]="model.secondaryPhone" name="secondaryPhone" />
          </label>
          <label>البريد الإلكتروني
            <input [(ngModel)]="model.email" name="email" type="email" />
          </label>
          <label>نوع العميل
            <select [(ngModel)]="model.clientType" name="clientType">
              <option value="Individual">فرد</option>
              <option value="Company">شركة</option>
            </select>
          </label>
          <label class="full">العنوان
            <input [(ngModel)]="model.address" name="address" required />
          </label>
          <label class="full">ملاحظات
            <textarea [(ngModel)]="model.notes" name="notes" rows="3"></textarea>
          </label>
        </div>

        @if (error()) { <p class="error">{{ error() }}</p> }
        <div class="actions">
          <button class="btn primary" type="submit" [disabled]="saving()">حفظ</button>
          <a class="btn" routerLink="/insureds">إلغاء</a>
        </div>
      </form>
    </div>
  `,
  styles: [`
    .page { display: grid; gap: 1rem; max-width: 900px; }
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
export class InsuredFormComponent implements OnInit {
  isEdit = false;
  id = 0;
  saving = signal(false);
  error = signal('');
  model: Partial<Insured> = {
    fullName: '',
    nationalId: '',
    phone: '',
    secondaryPhone: '',
    email: '',
    address: '',
    clientType: 'Individual',
    notes: ''
  };

  constructor(private api: ApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && idParam !== 'new') {
      this.isEdit = true;
      this.id = Number(idParam);
      this.api.getInsured(this.id).subscribe({
        next: (data) => {
          this.model = {
            ...data,
            clientType: data.clientType === 2 || data.clientType === 'Company' ? 'Company' : 'Individual'
          };
        },
        error: () => this.error.set('تعذر تحميل بيانات المؤمن')
      });
    }
  }

  save(): void {
    this.saving.set(true);
    this.error.set('');
    const body = { ...this.model };
    const req = this.isEdit
      ? this.api.updateInsured(this.id, body)
      : this.api.createInsured(body);

    req.subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.router.navigate(['/insureds', saved.id]);
      },
      error: () => {
        this.saving.set(false);
        this.error.set('تعذر الحفظ. تحقق من الرقم الوطني وعدم التكرار.');
      }
    });
  }
}
