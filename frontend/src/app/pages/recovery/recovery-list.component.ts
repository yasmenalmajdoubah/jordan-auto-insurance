import { Component, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { RecoveryClaim } from '../../core/models/insurance.models';

@Component({
  selector: 'app-recovery-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      <div class="toolbar">
        <div>
          <h2>الاسترداد / Subrogation</h2>
          <p>مطالبات على شركات التأمين الأخرى بعد دفع المطالبة لمتضررينا</p>
        </div>
        <a class="btn" routerLink="/claims">من المطالبات</a>
      </div>

      @if (error()) { <p class="error">{{ error() }}</p> }

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>شركة التأمين الأخرى</th>
              <th>رقم الحادث</th>
              <th>المطالبة</th>
              <th>المبلغ المطالب</th>
              <th>المدفوع</th>
              <th>الحالة</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (r of items(); track r.id) {
              <tr>
                <td>{{ r.id }}</td>
                <td>{{ r.otherInsurerName }}</td>
                <td>{{ r.accidentNumber }}</td>
                <td>
                  <a [routerLink]="['/claims', r.claimId]">
                    {{ r.claim?.claimNumber || ('#' + r.claimId) }}
                  </a>
                </td>
                <td>{{ r.claimedAmount }}</td>
                <td>{{ r.paidAmount }}</td>
                <td><span class="badge">{{ statusLabel(r.status) }}</span></td>
                <td><a [routerLink]="['/recovery', r.id]">التفاصيل</a></td>
              </tr>
            } @empty {
              <tr><td colspan="8">لا يوجد مطالبات استرداد بعد — أنشئها من تفاصيل المطالبة</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .page { display: grid; gap: 1rem; }
    .toolbar { display: flex; justify-content: space-between; gap: 1rem; align-items: center; flex-wrap: wrap; }
    h2 { margin: 0; } p { margin: .25rem 0 0; color: #64748b; }
    .btn { border: 1px solid #cbd5e1; background: white; border-radius: 10px; padding: .65rem 1rem; text-decoration: none; color: inherit; }
    .table-wrap { background: white; border: 1px solid #e2e8f0; border-radius: 14px; overflow: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: .85rem 1rem; border-bottom: 1px solid #e2e8f0; text-align: right; white-space: nowrap; }
    th { background: #f8fafc; }
    a { color: #0b7a5a; text-decoration: none; }
    .badge { background: #e2e8f0; border-radius: 999px; padding: .15rem .55rem; font-size: .85rem; }
    .error { color: #b91c1c; }
  `]
})
export class RecoveryListComponent implements OnInit {
  items = signal<RecoveryClaim[]>([]);
  error = signal('');

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getRecoveries().subscribe({
      next: (d) => this.items.set(d),
      error: () => this.error.set('تعذر تحميل مطالبات الاسترداد')
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
