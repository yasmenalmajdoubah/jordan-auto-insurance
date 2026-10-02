import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { DepreciationRule } from '../../core/models/insurance.models';

@Component({
  selector: 'app-depreciation-rules',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="toolbar">
        <div>
          <h2>قواعد الاستهلاك (Depreciation Rules)</h2>
          <p>نسب الاستهلاك من جداول قابلة للتعديل — مش Hard-coded</p>
        </div>
      </div>

      @if (error()) { <p class="error">{{ error() }}</p> }
      @if (ok()) { <p class="ok">{{ ok() }}</p> }

      <section class="card">
        <h3>إضافة قاعدة</h3>
        <div class="grid">
          <label>نوع الاستخدام
            <select [(ngModel)]="draft.vehicleUsage" name="vehicleUsage">
              <option [ngValue]="null">الكل</option>
              <option value="Private">خصوصي</option>
              <option value="Taxi">ركوب</option>
              <option value="Medium">متوسط</option>
              <option value="Cargo">شحن</option>
            </select>
          </label>
          <label>نوع القطعة
            <input [(ngModel)]="draft.partType" name="partType" placeholder="Body / Mechanical" />
          </label>
          <label>من عمر (سنوات)
            <input type="number" [(ngModel)]="draft.minAgeYears" name="minAgeYears" />
          </label>
          <label>إلى عمر (سنوات)
            <input type="number" [(ngModel)]="draft.maxAgeYears" name="maxAgeYears" />
          </label>
          <label>نوع الوثيقة
            <select [(ngModel)]="draft.policyType" name="policyType">
              <option [ngValue]="null">الكل</option>
              <option value="ThirdParty">ضد الغير</option>
              <option value="Comprehensive">شامل</option>
            </select>
          </label>
          <label>نسبة الاستهلاك %
            <input type="number" [(ngModel)]="draft.depreciationPercent" name="depreciationPercent" />
          </label>
          <label class="full">ملاحظات
            <input [(ngModel)]="draft.notes" name="notes" />
          </label>
        </div>
        <button type="button" class="btn primary" (click)="add()">إضافة</button>
      </section>

      <section class="card">
        <h3>القواعد الحالية</h3>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>الاستخدام</th>
                <th>القطعة</th>
                <th>العمر</th>
                <th>نوع الوثيقة</th>
                <th>%</th>
                <th>نشط</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (rule of rules(); track rule.id) {
                <tr>
                  <td>{{ usageLabel(rule.vehicleUsage) }}</td>
                  <td>{{ rule.partType || 'الكل' }}</td>
                  <td>{{ rule.minAgeYears ?? '-' }} → {{ rule.maxAgeYears ?? '-' }}</td>
                  <td>{{ policyLabel(rule.policyType) }}</td>
                  <td><input type="number" [(ngModel)]="rule.depreciationPercent" [name]="'p'+rule.id" /></td>
                  <td><input type="checkbox" [(ngModel)]="rule.isActive" [name]="'a'+rule.id" /></td>
                  <td><button type="button" class="btn" (click)="save(rule)">حفظ</button></td>
                </tr>
              } @empty {
                <tr><td colspan="7">لا يوجد قواعد</td></tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page { display: grid; gap: 1rem; }
    .toolbar h2 { margin: 0; } .toolbar p { margin: .25rem 0 0; color: #64748b; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1rem; display: grid; gap: .8rem; }
    h3 { margin: 0; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: .8rem; }
    .full { grid-column: 1 / -1; }
    label { display: grid; gap: .3rem; font-size: .9rem; }
    input, select { border: 1px solid #cbd5e1; border-radius: 8px; padding: .5rem .65rem; font: inherit; }
    .btn { border: 1px solid #cbd5e1; background: white; border-radius: 10px; padding: .55rem .9rem; cursor: pointer; width: fit-content; }
    .btn.primary { background: #0b7a5a; color: white; border-color: #0b7a5a; }
    .table-wrap { overflow: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: .65rem .5rem; border-bottom: 1px solid #e2e8f0; text-align: right; }
    td input[type="number"] { width: 80px; }
    .error { color: #b91c1c; } .ok { color: #065f46; }
    @media (max-width: 900px) { .grid { grid-template-columns: 1fr 1fr; } }
  `]
})
export class DepreciationRulesComponent implements OnInit {
  rules = signal<DepreciationRule[]>([]);
  error = signal('');
  ok = signal('');
  draft: any = {
    vehicleUsage: 'Private',
    partType: 'Body',
    minAgeYears: 0,
    maxAgeYears: 5,
    policyType: null,
    depreciationPercent: 10,
    notes: '',
    isActive: true
  };

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.api.getDepreciationRules().subscribe({
      next: (d) => this.rules.set(d),
      error: () => this.error.set('تعذر تحميل قواعد الاستهلاك')
    });
  }

  add(): void {
    this.api.saveDepreciationRule({ ...this.draft, id: undefined }).subscribe({
      next: () => {
        this.ok.set('تمت إضافة القاعدة');
        this.load();
      },
      error: () => this.error.set('تعذر الإضافة')
    });
  }

  save(rule: DepreciationRule): void {
    this.api.saveDepreciationRule(rule).subscribe({
      next: () => {
        this.ok.set('تم الحفظ');
        this.load();
      },
      error: () => this.error.set('تعذر الحفظ')
    });
  }

  usageLabel(v: any): string {
    if (v == null || v === '') return 'الكل';
    const map: Record<string, string> = {
      Private: 'خصوصي', Taxi: 'ركوب', Medium: 'متوسط', Cargo: 'شحن',
      '1': 'خصوصي', '2': 'ركوب', '3': 'متوسط', '4': 'شحن'
    };
    return map[String(v)] || String(v);
  }

  policyLabel(v: any): string {
    if (v == null || v === '') return 'الكل';
    return v === 'Comprehensive' || v === 2 ? 'شامل' : 'ضد الغير';
  }
}
