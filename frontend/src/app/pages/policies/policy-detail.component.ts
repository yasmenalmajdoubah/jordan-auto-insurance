import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { CoverageCheckLog, CoverageResult, Policy } from '../../core/models/insurance.models';

@Component({
  selector: 'app-policy-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe],
  template: `
    <div class="page">
      <a routerLink="/policies" class="back">← رجوع</a>

      @if (error()) { <p class="error">{{ error() }}</p> }

      @if (policy(); as p) {
        <div class="head">
          <div>
            <h2>{{ p.policyNumber }}</h2>
            <p>{{ typeLabel(p.insuranceType) }} · {{ statusLabel(p.status) }}</p>
          </div>
          <a class="btn" [routerLink]="['/policies', p.id, 'edit']">تعديل</a>
        </div>

        <div class="cards">
          <section class="card">
            <h3>بيانات الوثيقة</h3>
            <p>المؤمن:
              <a [routerLink]="['/insureds', p.insuredId]">{{ p.insured?.fullName || ('#' + p.insuredId) }}</a>
            </p>
            <p>المركبة:
              <a [routerLink]="['/vehicles', p.vehicleId]">{{ p.vehicle?.plateNumber || ('#' + p.vehicleId) }}</a>
            </p>
            <p>الفترة: {{ p.startDate | date:'yyyy-MM-dd' }} → {{ p.endDate | date:'yyyy-MM-dd' }}</p>
            <p>قيمة التأمين: {{ p.insuredValue }} د.أ</p>
            <p>القسط: {{ p.premium }} د.أ</p>
            <p>الخصومات: {{ p.discounts }} · الإضافات: {{ p.additions }} · التحمل: {{ p.deductible }}</p>
            <p>صدرت بواسطة: {{ p.issuedBy }}</p>
            <p>التغطيات: {{ p.coverages || '-' }}</p>
            <p>الاستثناءات: {{ p.exclusions || '-' }}</p>
          </section>

          <section class="card">
            <h3>فحص التغطية (Coverage Check)</h3>
            <p class="hint">النظام لا يفترض التغطية تلقائيًا — أدخل تاريخ حادث محتمل للتحقق مع تسجيل السبب.</p>

            <label>تاريخ الحادث
              <input type="datetime-local" [(ngModel)]="accidentDate" name="accidentDate" />
            </label>
            <label>نوع الحادث
              <select [(ngModel)]="accidentType" name="accidentType">
                <option value="KnownThirdParty">طرف آخر معروف</option>
                <option value="UnknownHitAndRun">ضد مجهول / Hit and Run</option>
                <option value="SingleVehicle">مركبة واحدة</option>
                <option value="MultipleVehicles">عدة مركبات</option>
                <option value="Other">أخرى</option>
              </select>
            </label>

            <button type="button" class="btn primary" (click)="runCheck()" [disabled]="checking()">تنفيذ الفحص</button>

            @if (result(); as r) {
              <div class="result" [class.ok]="r.isCovered" [class.no]="!r.isCovered">
                <strong>{{ r.isCovered ? 'Covered' : 'Not Covered' }}</strong>
                <p>{{ r.reason }}</p>
                @if (r.details?.steps?.length) {
                  <ul>
                    @for (step of r.details.steps; track step) {
                      <li>{{ step }}</li>
                    }
                  </ul>
                }
              </div>
            }
          </section>

          <section class="card wide">
            <h3>سجل فحص التغطية (Audit Trail)</h3>
            @for (log of logs(); track log.id) {
              <div class="row">
                <div>
                  <strong [class.ok]="log.isCovered" [class.no]="!log.isCovered">
                    {{ log.isCovered ? 'Covered' : 'Not Covered' }}
                  </strong>
                  <span> — {{ log.reason }}</span>
                </div>
                <small>{{ log.checkedBy }} · {{ log.checkedAt | date:'yyyy-MM-dd HH:mm' }}</small>
              </div>
            } @empty {
              <p class="muted">لا يوجد فحوصات بعد</p>
            }
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { display: grid; gap: 1rem; }
    .back { color: #0b7a5a; text-decoration: none; width: fit-content; }
    .head { display: flex; justify-content: space-between; gap: 1rem; align-items: center; flex-wrap: wrap; }
    h2, h3 { margin: 0; } p { margin: .35rem 0 0; color: #64748b; }
    .hint { margin-bottom: .8rem !important; }
    .btn { border: 1px solid #cbd5e1; background: white; border-radius: 10px; padding: .65rem 1rem; text-decoration: none; color: inherit; cursor: pointer; width: fit-content; }
    .btn.primary { background: #0b7a5a; color: white; border-color: #0b7a5a; margin-top: .5rem; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 1rem; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1rem; display: grid; gap: .55rem; align-content: start; }
    .card.wide { grid-column: 1 / -1; }
    label { display: grid; gap: .35rem; font-size: .92rem; color: #0f172a; }
    input, select { border: 1px solid #cbd5e1; border-radius: 10px; padding: .65rem .8rem; font: inherit; }
    a { color: #0b7a5a; text-decoration: none; }
    .result { border-radius: 12px; padding: .9rem; margin-top: .4rem; }
    .result.ok, .ok { color: #065f46; }
    .result.no, .no { color: #991b1b; }
    .result.ok { background: #ecfdf5; }
    .result.no { background: #fef2f2; }
    .result ul { margin: .4rem 0 0; padding-inline-start: 1.1rem; color: #334155; }
    .row { display: flex; justify-content: space-between; gap: 1rem; border-top: 1px solid #f1f5f9; padding-top: .55rem; flex-wrap: wrap; }
    .muted { color: #94a3b8; margin: 0; }
    .error { color: #b91c1c; }
  `]
})
export class PolicyDetailComponent implements OnInit {
  policy = signal<Policy | null>(null);
  logs = signal<CoverageCheckLog[]>([]);
  result = signal<CoverageResult | null>(null);
  error = signal('');
  checking = signal(false);
  accidentDate = new Date().toISOString().slice(0, 16);
  accidentType = 'KnownThirdParty';

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getPolicy(id).subscribe({
      next: (p) => this.policy.set(p),
      error: () => this.error.set('تعذر تحميل الوثيقة')
    });
    this.loadLogs(id);
  }

  runCheck(): void {
    const p = this.policy();
    if (!p) return;
    this.checking.set(true);
    this.error.set('');
    this.api.checkPolicyCoverage(p.id, {
      accidentDate: new Date(this.accidentDate).toISOString(),
      vehicleId: p.vehicleId,
      accidentType: this.accidentType
    }).subscribe({
      next: (r) => {
        this.result.set(r);
        this.checking.set(false);
        this.loadLogs(p.id);
      },
      error: () => {
        this.checking.set(false);
        this.error.set('تعذر تنفيذ فحص التغطية');
      }
    });
  }

  loadLogs(id: number): void {
    this.api.getPolicyCoverageChecks(id).subscribe({
      next: (logs) => this.logs.set(logs),
      error: () => {}
    });
  }

  typeLabel(t: Policy['insuranceType']): string {
    return t === 'Comprehensive' || t === 2 ? 'شامل' : 'ضد الغير / إلزامي';
  }

  statusLabel(s: Policy['status']): string {
    const map: Record<string, string> = {
      Active: 'Active', Expired: 'Expired', Cancelled: 'Cancelled', Suspended: 'Suspended',
      '1': 'Active', '2': 'Expired', '3': 'Cancelled', '4': 'Suspended'
    };
    return map[String(s)] || String(s);
  }
}
