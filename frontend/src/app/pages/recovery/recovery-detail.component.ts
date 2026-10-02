import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { RecoveryClaim } from '../../core/models/insurance.models';

@Component({
  selector: 'app-recovery-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe],
  template: `
    <div class="page">
      <a routerLink="/recovery" class="back">← رجوع</a>
      @if (error()) { <p class="error">{{ error() }}</p> }
      @if (ok()) { <p class="ok">{{ ok() }}</p> }

      @if (item(); as r) {
        <div class="head">
          <div>
            <h2>مطالبة استرداد #{{ r.id }}</h2>
            <p>{{ r.otherInsurerName }} · {{ statusLabel(r.status) }}</p>
          </div>
          <button type="button" class="btn primary" (click)="pdf()" [disabled]="busy()">تحميل PDF / للطباعة</button>
        </div>

        <div class="cards">
          <section class="card">
            <h3>بيانات المطالبة</h3>
            <p>شركة التأمين الأخرى: {{ r.otherInsurerName }}</p>
            <p>رقم وثيقتهم: {{ r.otherPolicyNumber || '-' }}</p>
            <p>رقم الحادث: {{ r.accidentNumber }}</p>
            <p>المطالبة الأصلية:
              <a [routerLink]="['/claims', r.claimId]">{{ r.claim?.claimNumber || ('#' + r.claimId) }}</a>
            </p>
            <p>قيمة المطالبة: {{ r.claimedAmount }} د.أ</p>
            <p>المبلغ المدفوع: {{ r.paidAmount }} د.أ</p>
            <p>مرجع المخالصة: {{ r.settlementRef || '-' }}</p>
            <p>ملاحظات: {{ r.notes || '-' }}</p>
            <p>تاريخ الإنشاء: {{ r.createdAt | date:'yyyy-MM-dd HH:mm' }}</p>
            <p>تاريخ الإرسال: {{ r.submittedAt ? (r.submittedAt | date:'yyyy-MM-dd HH:mm') : '-' }}</p>
          </section>

          <section class="card">
            <h3>تحديث الحالة</h3>
            <p class="hint">Draft → Submitted → Under Review → Accepted / Partially / Rejected → Paid → Closed</p>
            <label>الحالة
              <select [(ngModel)]="status" name="status">
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="UnderReview">Under Review</option>
                <option value="Accepted">Accepted</option>
                <option value="PartiallyAccepted">Partially Accepted</option>
                <option value="Rejected">Rejected</option>
                <option value="Paid">Paid</option>
                <option value="Closed">Closed</option>
              </select>
            </label>
            <label>المبلغ المدفوع من الشركة الأخرى
              <input type="number" [(ngModel)]="paidAmount" name="paidAmount" />
            </label>
            <label>ملاحظات
              <textarea [(ngModel)]="notes" name="notes" rows="3"></textarea>
            </label>
            <button type="button" class="btn primary" (click)="saveStatus()" [disabled]="busy()">حفظ الحالة</button>
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { display: grid; gap: 1rem; }
    .back { color: #0b7a5a; text-decoration: none; width: fit-content; }
    .head { display: flex; justify-content: space-between; gap: 1rem; align-items: center; flex-wrap: wrap; }
    h2, h3 { margin: 0; } p { margin: .3rem 0 0; color: #64748b; }
    .hint { margin-bottom: .6rem !important; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1rem; display: grid; gap: .6rem; align-content: start; }
    label { display: grid; gap: .3rem; color: #0f172a; font-size: .92rem; }
    input, select, textarea { border: 1px solid #cbd5e1; border-radius: 8px; padding: .55rem .7rem; font: inherit; }
    .btn { border: 1px solid #cbd5e1; background: white; border-radius: 10px; padding: .6rem .9rem; cursor: pointer; width: fit-content; }
    .btn.primary { background: #0b7a5a; color: white; border-color: #0b7a5a; }
    a { color: #0b7a5a; text-decoration: none; }
    .error { color: #b91c1c; } .ok { color: #065f46; }
  `]
})
export class RecoveryDetailComponent implements OnInit {
  item = signal<RecoveryClaim | null>(null);
  error = signal('');
  ok = signal('');
  busy = signal(false);
  status = 'Draft';
  paidAmount = 0;
  notes = '';
  private id = 0;

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.api.getRecovery(this.id).subscribe({
      next: (r) => {
        this.item.set(r);
        this.status = this.statusLabel(r.status);
        this.paidAmount = r.paidAmount;
        this.notes = r.notes || '';
      },
      error: () => this.error.set('تعذر تحميل مطالبة الاسترداد')
    });
  }

  saveStatus(): void {
    this.busy.set(true);
    this.api.updateRecoveryStatus(this.id, {
      status: this.status,
      paidAmount: this.paidAmount,
      notes: this.notes
    }).subscribe({
      next: () => { this.busy.set(false); this.ok.set('تم تحديث الحالة'); this.load(); },
      error: () => { this.busy.set(false); this.error.set('تعذر تحديث الحالة'); }
    });
  }

  pdf(): void {
    this.busy.set(true);
    this.api.downloadRecoveryPdf(this.id).subscribe({
      next: (blob) => {
        this.busy.set(false);
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recovery-${this.id}.pdf`;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => { this.busy.set(false); this.error.set('تعذر تحميل PDF'); }
    });
  }

  statusLabel(s: any): string {
    const map: Record<string, string> = {
      Draft: 'Draft', Submitted: 'Submitted', UnderReview: 'UnderReview', Accepted: 'Accepted',
      PartiallyAccepted: 'PartiallyAccepted', Rejected: 'Rejected', Paid: 'Paid', Closed: 'Closed',
      '1': 'Draft', '2': 'Submitted', '3': 'UnderReview', '4': 'Accepted',
      '5': 'PartiallyAccepted', '6': 'Rejected', '7': 'Paid', '8': 'Closed'
    };
    return map[String(s)] || String(s);
  }
}
