import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ClaimRecord, Settlement } from '../../core/models/insurance.models';

@Component({
  selector: 'app-claim-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe],
  template: `
    <div class="page">
      <a routerLink="/claims" class="back">← رجوع للمطالبات</a>
      @if (error()) { <p class="error">{{ error() }}</p> }
      @if (ok()) { <p class="ok">{{ ok() }}</p> }

      @if (claim(); as c) {
        <div class="head">
          <div>
            <h2>{{ c.claimNumber }}</h2>
            <p>
              حادث
              <a [routerLink]="['/accidents', c.accidentId]">{{ c.accident?.accidentNumber || ('#' + c.accidentId) }}</a>
              · {{ statusLabel(c.status) }}
            </p>
          </div>
        </div>

        <div class="cards">
          <section class="card">
            <h3>بيانات المطالبة</h3>
            <p>النوع: {{ c.claimantType === 'ThirdParty' || c.claimantType === 2 ? 'طرف ثالث' : 'المؤمن' }}</p>
            <p>المبلغ: {{ c.claimAmount }} د.أ</p>
            <p>ملاحظات: {{ c.notes || '-' }}</p>
            <p>تاريخ الإنشاء: {{ c.createdAt | date:'yyyy-MM-dd HH:mm' }}</p>
          </section>

          <section class="card">
            <h3>المخالصة (Settlement)</h3>
            @if (c.settlement; as s) {
              <p>مبلغ المطالبة: {{ s.claimAmount }}</p>
              <p>التحمل: {{ s.deductible }}</p>
              <p>تعديلات أخرى: {{ s.otherAdjustments }}</p>
              <p><strong>النهائي: {{ s.finalAmount }} د.أ</strong></p>
              <p>الحالة: {{ settlementStatus(s.status) }}</p>
              <p>اعتماد: {{ s.approvedBy || '-' }} {{ s.approvedAt ? ('· ' + (s.approvedAt | date:'yyyy-MM-dd')) : '' }}</p>
              <div class="actions">
                <button type="button" class="btn" (click)="approve(s)" [disabled]="busy()">اعتماد</button>
                <button type="button" class="btn primary" (click)="pdf(s)" [disabled]="busy()">تحميل PDF</button>
              </div>
            } @else {
              <div class="form">
                <label>مبلغ المطالبة
                  <input type="number" [(ngModel)]="settlement.claimAmount" name="claimAmount" />
                </label>
                <label>التحمل
                  <input type="number" [(ngModel)]="settlement.deductible" name="deductible" />
                </label>
                <label>تعديلات أخرى
                  <input type="number" [(ngModel)]="settlement.otherAdjustments" name="otherAdjustments" />
                </label>
                <p>المتوقع النهائي: {{ previewFinal() }} د.أ</p>
                <button type="button" class="btn primary" (click)="createSettlement()" [disabled]="busy()">إنشاء مخالصة</button>
              </div>
            }
          </section>

          <section class="card">
            <h3>الاسترداد على شركة أخرى (Recovery)</h3>
            @if (c.recoveryClaim; as r) {
              <p>الشركة: {{ r.otherInsurerName }}</p>
              <p>المبلغ: {{ r.claimedAmount }} د.أ</p>
              <p>الحالة: {{ r.status }}</p>
              <a class="btn" [routerLink]="['/recovery', r.id]">فتح ملف الاسترداد</a>
            } @else {
              <div class="form">
                <label>شركة التأمين الأخرى
                  <input [(ngModel)]="recovery.otherInsurerName" name="otherInsurerName" />
                </label>
                <label>رقم وثيقتهم
                  <input [(ngModel)]="recovery.otherPolicyNumber" name="otherPolicyNumber" />
                </label>
                <label>قيمة المطالبة
                  <input type="number" [(ngModel)]="recovery.claimedAmount" name="claimedAmount" />
                </label>
                <label>ملاحظات
                  <input [(ngModel)]="recovery.notes" name="recoveryNotes" />
                </label>
                <button type="button" class="btn primary" (click)="createRecovery()" [disabled]="busy()">إنشاء مطالبة استرداد</button>
              </div>
            }
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { display: grid; gap: 1rem; }
    .back { color: #0b7a5a; text-decoration: none; width: fit-content; }
    .head h2 { margin: 0; } .head p { margin: .3rem 0 0; color: #64748b; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 1rem; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1rem; display: grid; gap: .55rem; }
    h3 { margin: 0; }
    a { color: #0b7a5a; text-decoration: none; }
    .form { display: grid; gap: .7rem; }
    label { display: grid; gap: .3rem; }
    input { border: 1px solid #cbd5e1; border-radius: 8px; padding: .55rem .7rem; font: inherit; }
    .actions { display: flex; gap: .55rem; flex-wrap: wrap; }
    .btn { border: 1px solid #cbd5e1; background: white; border-radius: 10px; padding: .6rem .9rem; cursor: pointer; width: fit-content; }
    .btn.primary { background: #0b7a5a; color: white; border-color: #0b7a5a; }
    .error { color: #b91c1c; } .ok { color: #065f46; }
  `]
})
export class ClaimDetailComponent implements OnInit {
  claim = signal<ClaimRecord | null>(null);
  error = signal('');
  ok = signal('');
  busy = signal(false);
  private id = 0;
  settlement = { claimAmount: 0, deductible: 0, otherAdjustments: 0, status: 'Draft' };
  recovery = {
    otherInsurerName: '',
    otherPolicyNumber: '',
    accidentNumber: '',
    claimedAmount: 0,
    paidAmount: 0,
    settlementRef: '',
    notes: ''
  };

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.api.getClaim(this.id).subscribe({
      next: (c) => {
        this.claim.set(c);
        this.settlement.claimAmount = c.claimAmount;
        this.recovery.claimedAmount = c.claimAmount;
        this.recovery.accidentNumber = c.accident?.accidentNumber || '';
      },
      error: () => this.error.set('تعذر تحميل المطالبة')
    });
  }

  previewFinal(): number {
    return Number(this.settlement.claimAmount || 0) - Number(this.settlement.deductible || 0) + Number(this.settlement.otherAdjustments || 0);
  }

  createSettlement(): void {
    this.busy.set(true);
    this.api.createSettlement(this.id, this.settlement).subscribe({
      next: () => { this.busy.set(false); this.ok.set('تم إنشاء المخالصة'); this.load(); },
      error: (err) => {
        this.busy.set(false);
        this.error.set(err?.error?.message || 'تعذر إنشاء المخالصة');
      }
    });
  }

  createRecovery(): void {
    if (!this.recovery.otherInsurerName) {
      this.error.set('أدخل اسم شركة التأمين الأخرى');
      return;
    }
    this.busy.set(true);
    this.api.createRecovery(this.id, this.recovery).subscribe({
      next: (r) => {
        this.busy.set(false);
        this.ok.set('تم إنشاء مطالبة الاسترداد');
        this.load();
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(err?.error?.message || 'تعذر إنشاء الاسترداد');
      }
    });
  }

  approve(s: Settlement): void {
    this.busy.set(true);
    this.api.approveSettlement(s.id).subscribe({
      next: () => { this.busy.set(false); this.ok.set('تم اعتماد المخالصة'); this.load(); },
      error: () => { this.busy.set(false); this.error.set('تعذر الاعتماد'); }
    });
  }

  pdf(s: Settlement): void {
    this.busy.set(true);
    this.api.downloadSettlementPdf(s.id).subscribe({
      next: (blob) => {
        this.busy.set(false);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `settlement-${s.id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => { this.busy.set(false); this.error.set('تعذر تحميل PDF'); }
    });
  }

  statusLabel(s: any): string {
    const map: Record<string, string> = {
      Draft: 'Draft', Submitted: 'Submitted', UnderReview: 'UnderReview', Approved: 'Approved',
      Rejected: 'Rejected', Settled: 'Settled', Closed: 'Closed',
      '1': 'Draft', '2': 'Submitted', '3': 'UnderReview', '4': 'Approved', '5': 'Rejected', '6': 'Settled', '7': 'Closed'
    };
    return map[String(s)] || String(s);
  }

  settlementStatus(s: any): string {
    const map: Record<string, string> = {
      Draft: 'Draft', Approved: 'Approved', Paid: 'Paid', Cancelled: 'Cancelled',
      '1': 'Draft', '2': 'Approved', '3': 'Paid', '4': 'Cancelled'
    };
    return map[String(s)] || String(s);
  }
}
