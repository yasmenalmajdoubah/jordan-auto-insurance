import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Accident } from '../../core/models/insurance.models';

@Component({
  selector: 'app-accidents-list',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe],
  template: `
    <div class="page">
      <div class="toolbar">
        <div>
          <h2>الحوادث</h2>
          <p>تسجيل الحوادث وفحص التغطية والمستندات</p>
        </div>
        <a class="btn primary" routerLink="/accidents/new">تسجيل حادث</a>
      </div>

      <div class="search">
        <input [(ngModel)]="q" (keyup.enter)="load()" placeholder="بحث برقم الحادث / الموقع / السائق / اللوحة" />
        <select [(ngModel)]="status">
          <option value="">كل الحالات</option>
          <option value="Open">Open</option>
          <option value="UnderReview">UnderReview</option>
          <option value="Closed">Closed</option>
          <option value="Rejected">Rejected</option>
        </select>
        <button type="button" class="btn" (click)="load()">بحث</button>
      </div>

      @if (error()) { <p class="error">{{ error() }}</p> }

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>رقم الحادث</th>
              <th>التاريخ</th>
              <th>الموقع</th>
              <th>الوثيقة</th>
              <th>التغطية</th>
              <th>الحالة</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (item of items(); track item.id) {
              <tr>
                <td>{{ item.accidentNumber }}</td>
                <td>{{ item.accidentDateTime | date:'yyyy-MM-dd HH:mm' }}</td>
                <td>{{ item.location }}</td>
                <td>{{ item.policy?.policyNumber || ('#' + item.policyId) }}</td>
                <td>
                  <span class="badge" [class.ok]="item.isCovered === true" [class.no]="item.isCovered === false">
                    {{ item.isCovered === true ? 'Covered' : item.isCovered === false ? 'Not Covered' : '-' }}
                  </span>
                </td>
                <td>{{ statusLabel(item.status) }}</td>
                <td><a [routerLink]="['/accidents', item.id]">التفاصيل</a></td>
              </tr>
            } @empty {
              <tr><td colspan="7">لا يوجد حوادث بعد</td></tr>
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
    .search input { min-width: 0; width: 100%; flex: 1 1 220px; }
    .btn { border: 1px solid #cbd5e1; background: white; border-radius: 10px; padding: .7rem 1rem; text-decoration: none; color: inherit; cursor: pointer; }
    .btn.primary { background: #0b7a5a; color: white; border-color: #0b7a5a; }
    .table-wrap { background: white; border: 1px solid #e2e8f0; border-radius: 14px; overflow: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: .9rem 1rem; border-bottom: 1px solid #e2e8f0; text-align: right; white-space: nowrap; }
    th { background: #f8fafc; color: #475569; }
    a { color: #0b7a5a; text-decoration: none; }
    .badge { padding: .2rem .55rem; border-radius: 999px; background: #e2e8f0; font-size: .85rem; }
    .badge.ok { background: #d1fae5; color: #065f46; }
    .badge.no { background: #fee2e2; color: #991b1b; }
    .error { color: #b91c1c; }
  `]
})
export class AccidentsListComponent implements OnInit {
  q = '';
  status = '';
  items = signal<Accident[]>([]);
  error = signal('');

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.error.set('');
    this.api.getAccidents({ q: this.q.trim() || undefined, status: this.status || undefined }).subscribe({
      next: (data) => this.items.set(data),
      error: () => this.error.set('تعذر تحميل الحوادث')
    });
  }

  statusLabel(s: Accident['status']): string {
    const map: Record<string, string> = {
      Open: 'Open', UnderReview: 'UnderReview', Closed: 'Closed', Rejected: 'Rejected',
      '1': 'Open', '2': 'UnderReview', '3': 'Closed', '4': 'Rejected'
    };
    return map[String(s)] || String(s);
  }
}
