import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Policy } from '../../core/models/insurance.models';

@Component({
  selector: 'app-policies-list',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  template: `
    <div class="page">
      <div class="toolbar">
        <div>
          <h2>وثائق التأمين</h2>
          <p>إدارة الوثائق وفحص التغطية</p>
        </div>
        <a class="btn primary" routerLink="/policies/new">إصدار وثيقة</a>
      </div>

      <div class="search">
        <input [(ngModel)]="q" (keyup.enter)="load()" placeholder="بحث برقم الوثيقة / المؤمن / اللوحة" />
        <select [(ngModel)]="status">
          <option value="">كل الحالات</option>
          <option value="Active">Active</option>
          <option value="Expired">Expired</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Suspended">Suspended</option>
        </select>
        <button type="button" class="btn" (click)="load()">بحث</button>
      </div>

      @if (error()) { <p class="error">{{ error() }}</p> }

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>رقم الوثيقة</th>
              <th>النوع</th>
              <th>المؤمن</th>
              <th>المركبة</th>
              <th>الفترة</th>
              <th>الحالة</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (item of items(); track item.id) {
              <tr>
                <td>{{ item.policyNumber }}</td>
                <td>{{ typeLabel(item.insuranceType) }}</td>
                <td>{{ item.insured?.fullName || ('#' + item.insuredId) }}</td>
                <td>{{ item.vehicle?.plateNumber || ('#' + item.vehicleId) }}</td>
                <td>{{ item.startDate | date:'yyyy-MM-dd' }} → {{ item.endDate | date:'yyyy-MM-dd' }}</td>
                <td><span class="badge" [class]="statusClass(item.status)">{{ statusLabel(item.status) }}</span></td>
                <td class="actions">
                  <a [routerLink]="['/policies', item.id]">التفاصيل</a>
                  <a [routerLink]="['/policies', item.id, 'edit']">تعديل</a>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7">لا يوجد وثائق بعد</td></tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .page { display: grid; gap: 1rem; }
    .toolbar, .search { display: flex; justify-content: space-between; gap: 1rem; align-items: center; flex-wrap: wrap; }
    h2 { margin: 0; } p { margin: .25rem 0 0; color: #64748b; }
    .search input, .search select { padding: .7rem .9rem; border: 1px solid #cbd5e1; border-radius: 10px; }
    .search input { min-width: 260px; flex: 1; }
    .btn { border: 1px solid #cbd5e1; background: white; border-radius: 10px; padding: .7rem 1rem; text-decoration: none; color: inherit; cursor: pointer; }
    .btn.primary { background: #0b7a5a; color: white; border-color: #0b7a5a; }
    .table-wrap { background: white; border: 1px solid #e2e8f0; border-radius: 14px; overflow: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: .9rem 1rem; border-bottom: 1px solid #e2e8f0; text-align: right; white-space: nowrap; }
    th { background: #f8fafc; color: #475569; font-weight: 600; }
    .actions { display: flex; gap: .75rem; }
    .actions a { color: #0b7a5a; text-decoration: none; }
    .badge { padding: .2rem .55rem; border-radius: 999px; font-size: .85rem; background: #e2e8f0; }
    .badge.active { background: #d1fae5; color: #065f46; }
    .badge.expired { background: #fee2e2; color: #991b1b; }
    .badge.other { background: #fef3c7; color: #92400e; }
    .error { color: #b91c1c; }
  `]
})
export class PoliciesListComponent implements OnInit {
  q = '';
  status = '';
  items = signal<Policy[]>([]);
  error = signal('');

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.error.set('');
    this.api.getPolicies({
      q: this.q.trim() || undefined,
      status: this.status || undefined
    }).subscribe({
      next: (data) => this.items.set(data),
      error: () => this.error.set('تعذر تحميل الوثائق. تأكد أن الـ API شغال.')
    });
  }

  typeLabel(t: Policy['insuranceType']): string {
    return t === 'Comprehensive' || t === 2 ? 'شامل' : 'ضد الغير';
  }

  statusLabel(s: Policy['status']): string {
    const map: Record<string, string> = {
      Active: 'Active', Expired: 'Expired', Cancelled: 'Cancelled', Suspended: 'Suspended',
      '1': 'Active', '2': 'Expired', '3': 'Cancelled', '4': 'Suspended'
    };
    return map[String(s)] || String(s);
  }

  statusClass(s: Policy['status']): string {
    const label = this.statusLabel(s);
    if (label === 'Active') return 'active';
    if (label === 'Expired') return 'expired';
    return 'other';
  }
}
