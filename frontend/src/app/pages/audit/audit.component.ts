import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuditLogEntry } from '../../core/models/insurance.models';

@Component({
  selector: 'app-audit',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <div class="page">
      <div class="toolbar">
        <div>
          <h2>سجل التدقيق (Audit Log)</h2>
          <p>كل تغيير مهم: مستخدم، إجراء، وقت، قيم قديمة/جديدة</p>
        </div>
        <button type="button" class="btn" (click)="load()">تحديث</button>
      </div>

      <div class="search">
        <input [(ngModel)]="q" name="q" (keyup.enter)="load()" placeholder="بحث بمستخدم / إجراء / كيان" />
        <select [(ngModel)]="entityType" name="entityType">
          <option value="">كل الكيانات</option>
          <option value="Insured">Insured</option>
          <option value="Vehicle">Vehicle</option>
          <option value="Policy">Policy</option>
          <option value="Accident">Accident</option>
          <option value="Claim">Claim</option>
          <option value="Settlement">Settlement</option>
          <option value="RecoveryClaim">RecoveryClaim</option>
          <option value="PricingRule">PricingRule</option>
          <option value="CoverageCheck">CoverageCheck / Preview</option>
        </select>
        <button type="button" class="btn" (click)="load()">بحث</button>
      </div>

      @if (error()) { <p class="error">{{ error() }}</p> }

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>الوقت</th>
              <th>المستخدم</th>
              <th>الإجراء</th>
              <th>الكيان</th>
              <th>المعرف</th>
              <th>IP</th>
              <th>التفاصيل</th>
            </tr>
          </thead>
          <tbody>
            @for (a of items(); track a.id) {
              <tr>
                <td>{{ a.createdAt | date:'yyyy-MM-dd HH:mm:ss' }}</td>
                <td>{{ a.userName }}</td>
                <td>{{ a.action }}</td>
                <td>{{ a.entityType }}</td>
                <td>{{ a.entityId || '-' }}</td>
                <td>{{ a.ipAddress || '-' }}</td>
                <td class="details">
                  @if (a.oldValue) { <div><small>قديمة:</small> {{ short(a.oldValue) }}</div> }
                  @if (a.newValue) { <div><small>جديدة:</small> {{ short(a.newValue) }}</div> }
                  @if (!a.oldValue && !a.newValue) { <span>-</span> }
                </td>
              </tr>
            } @empty {
              <tr><td colspan="7">لا يوجد سجلات</td></tr>
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
    .search input, .search select { border: 1px solid #cbd5e1; border-radius: 10px; padding: .65rem .85rem; font: inherit; }
    .search input { min-width: 0; width: 100%; flex: 1 1 200px; }
    .btn { border: 1px solid #cbd5e1; background: white; border-radius: 10px; padding: .65rem 1rem; cursor: pointer; }
    .table-wrap { background: white; border: 1px solid #e2e8f0; border-radius: 14px; overflow: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: .75rem .8rem; border-bottom: 1px solid #e2e8f0; text-align: right; vertical-align: top; }
    th { background: #f8fafc; white-space: nowrap; }
    .details { max-width: 360px; font-size: .85rem; color: #475569; word-break: break-word; }
    .details small { color: #94a3b8; }
    .error { color: #b91c1c; }
  `]
})
export class AuditComponent implements OnInit {
  items = signal<AuditLogEntry[]>([]);
  error = signal('');
  q = '';
  entityType = '';

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.error.set('');
    this.api.getAuditLogs({
      take: 200,
      q: this.q.trim() || undefined,
      entityType: this.entityType || undefined
    }).subscribe({
      next: (d) => this.items.set(d),
      error: () => this.error.set('تعذر تحميل سجل التدقيق (يلزم Admin/Manager)')
    });
  }

  short(value: string): string {
    return value.length > 180 ? value.slice(0, 180) + '…' : value;
  }
}
