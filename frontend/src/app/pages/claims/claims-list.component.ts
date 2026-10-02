import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { ClaimRecord } from '../../core/models/insurance.models';

@Component({
  selector: 'app-claims-list',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      <div class="toolbar">
        <div>
          <h2>المطالبات والمخالصات</h2>
          <p>إدارة المطالبات وتسوية المبالغ وتوليد PDF</p>
        </div>
      </div>
      @if (error()) { <p class="error">{{ error() }}</p> }
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>رقم المطالبة</th>
              <th>الحادث</th>
              <th>النوع</th>
              <th>المبلغ</th>
              <th>الحالة</th>
              <th>المخالصة</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (c of items(); track c.id) {
              <tr>
                <td>{{ c.claimNumber }}</td>
                <td>
                  <a [routerLink]="['/accidents', c.accidentId]">
                    {{ c.accident?.accidentNumber || ('#' + c.accidentId) }}
                  </a>
                </td>
                <td>{{ claimantLabel(c.claimantType) }}</td>
                <td>{{ c.claimAmount }}</td>
                <td>{{ statusLabel(c.status) }}</td>
                <td>{{ c.settlement ? (c.settlement.finalAmount + ' د.أ') : '-' }}</td>
                <td><a [routerLink]="['/claims', c.id]">التفاصيل</a></td>
              </tr>
            } @empty {
              <tr><td colspan="7">لا يوجد مطالبات بعد — أنشئها من صفحة الحادث</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .page { display: grid; gap: 1rem; }
    .toolbar h2 { margin: 0; } .toolbar p { margin: .25rem 0 0; color: #64748b; }
    .table-wrap { background: white; border: 1px solid #e2e8f0; border-radius: 14px; overflow: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: .9rem 1rem; border-bottom: 1px solid #e2e8f0; text-align: right; }
    th { background: #f8fafc; }
    a { color: #0b7a5a; text-decoration: none; }
    .error { color: #b91c1c; }
  `]
})
export class ClaimsListComponent implements OnInit {
  items = signal<ClaimRecord[]>([]);
  error = signal('');

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const accidentId = Number(this.route.snapshot.queryParamMap.get('accidentId') || 0);
    this.api.getClaims().subscribe({
      next: (data) => this.items.set(accidentId ? data.filter(c => c.accidentId === accidentId) : data),
      error: () => this.error.set('تعذر تحميل المطالبات')
    });
  }

  claimantLabel(t: any): string {
    return t === 'ThirdParty' || t === 2 ? 'طرف ثالث' : 'المؤمن';
  }

  statusLabel(s: any): string {
    const map: Record<string, string> = {
      Draft: 'Draft', Submitted: 'Submitted', UnderReview: 'UnderReview', Approved: 'Approved',
      Rejected: 'Rejected', Settled: 'Settled', Closed: 'Closed',
      '1': 'Draft', '2': 'Submitted', '3': 'UnderReview', '4': 'Approved', '5': 'Rejected', '6': 'Settled', '7': 'Closed'
    };
    return map[String(s)] || String(s);
  }
}
