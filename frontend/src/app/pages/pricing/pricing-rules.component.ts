import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { PremiumCalculationResult, PricingRule } from '../../core/models/insurance.models';

@Component({
  selector: 'app-pricing-rules',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="toolbar">
        <div>
          <h2>قواعد التسعير (Insurance Pricing Rules)</h2>
          <p>النسب قابلة للتعديل من الإدارة بدون تغيير الكود</p>
        </div>
      </div>

      @if (error()) { <p class="error">{{ error() }}</p> }
      @if (ok()) { <p class="ok">{{ ok() }}</p> }

      <div class="layout">
        <section class="card">
          <h3>جدول القواعد</h3>
          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>المفتاح</th>
                  <th>الاسم</th>
                  <th>القيمة %</th>
                  <th>نشط</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (rule of rules(); track rule.id) {
                  <tr>
                    <td>{{ rule.parameterKey }}</td>
                    <td>
                      <input [(ngModel)]="rule.displayNameAr" [name]="'n'+rule.id" />
                    </td>
                    <td>
                      <input type="number" [(ngModel)]="rule.value" [name]="'v'+rule.id" />
                    </td>
                    <td>
                      <input type="checkbox" [(ngModel)]="rule.isActive" [name]="'a'+rule.id" />
                    </td>
                    <td><button type="button" class="btn" (click)="save(rule)">حفظ</button></td>
                  </tr>
                } @empty {
                  <tr><td colspan="5">لا يوجد قواعد</td></tr>
                }
              </tbody>
            </table>
          </div>
        </section>

        <section class="card">
          <h3>حاسبة القسط</h3>
          <label>نوع الاستخدام
            <select [(ngModel)]="calc.usageType" name="usageType">
              <option value="Private">خصوصي</option>
              <option value="Taxi">ركوب</option>
              <option value="Medium">متوسط</option>
              <option value="Cargo">شحن</option>
            </select>
          </label>
          <label>نوع التأمين
            <select [(ngModel)]="calc.insuranceType" name="insuranceType">
              <option value="ThirdParty">ضد الغير</option>
              <option value="Comprehensive">شامل</option>
            </select>
          </label>
          <label>قيمة المركبة
            <input type="number" [(ngModel)]="calc.vehicleValue" name="vehicleValue" />
          </label>
          <label class="check">
            <input type="checkbox" [(ngModel)]="calc.hasPreviousClaims" name="hasPreviousClaims" />
            وجود مطالبات سابقة
          </label>
          <label class="check">
            <input type="checkbox" [(ngModel)]="calc.applyNoClaimsDiscount" name="applyNoClaimsDiscount" />
            تطبيق خصم عدم وجود مطالبات
          </label>
          <button type="button" class="btn primary" (click)="calculate()">احسب القسط</button>

          @if (result(); as r) {
            <div class="result">
              <p><strong>القسط النهائي:</strong> {{ r.finalPremium }} د.أ</p>
              <ul>
                @for (line of r.breakdown; track line) {
                  <li>{{ line }}</li>
                }
              </ul>
            </div>
          }
        </section>
      </div>
    </div>
  `,
  styles: [`
    .page { display: grid; gap: 1rem; }
    .toolbar h2 { margin: 0; } .toolbar p { margin: .25rem 0 0; color: #64748b; }
    .layout { display: grid; grid-template-columns: 1.4fr 1fr; gap: 1rem; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1rem; display: grid; gap: .7rem; align-content: start; }
    h3 { margin: 0; }
    .table-wrap { overflow: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: .65rem .5rem; border-bottom: 1px solid #e2e8f0; text-align: right; }
    input[type="number"], input:not([type]), select {
      border: 1px solid #cbd5e1; border-radius: 8px; padding: .45rem .6rem; font: inherit; width: 100%;
    }
    td input[type="number"] { width: 90px; }
    label { display: grid; gap: .3rem; font-size: .92rem; }
    .check { display: flex; align-items: center; gap: .5rem; }
    .btn { border: 1px solid #cbd5e1; background: white; border-radius: 10px; padding: .55rem .9rem; cursor: pointer; width: fit-content; }
    .btn.primary { background: #0b7a5a; color: white; border-color: #0b7a5a; }
    .result { background: #f8fafc; border-radius: 10px; padding: .8rem; }
    .error { color: #b91c1c; } .ok { color: #065f46; }
    @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }
  `]
})
export class PricingRulesComponent implements OnInit {
  rules = signal<PricingRule[]>([]);
  result = signal<PremiumCalculationResult | null>(null);
  error = signal('');
  ok = signal('');
  calc = {
    usageType: 'Private',
    insuranceType: 'ThirdParty',
    vehicleValue: 10000,
    hasPreviousClaims: false,
    applyNoClaimsDiscount: true
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.api.getPricingRules().subscribe({
      next: (data) => this.rules.set(data),
      error: () => this.error.set('تعذر تحميل قواعد التسعير')
    });
  }

  save(rule: PricingRule): void {
    this.error.set('');
    this.ok.set('');
    this.api.savePricingRule(rule).subscribe({
      next: () => {
        this.ok.set(`تم حفظ ${rule.displayNameAr}`);
        this.load();
      },
      error: () => this.error.set('تعذر حفظ القاعدة')
    });
  }

  calculate(): void {
    this.api.calculatePremium(this.calc).subscribe({
      next: (r) => this.result.set(r),
      error: () => this.error.set('تعذر حساب القسط')
    });
  }
}
