import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Insured } from '../../core/models/insurance.models';

@Component({
  selector: 'app-insureds-list',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="toolbar">
        <div>
          <h2>المؤمن لهم</h2>
          <p>إدارة بيانات العملاء وسجلاتهم</p>
        </div>
        <a class="btn primary" routerLink="/insureds/new">إضافة مؤمن</a>
      </div>

      <div class="search">
        <input [(ngModel)]="q" (keyup.enter)="load()" placeholder="بحث بالاسم / الرقم الوطني / الهاتف" />
        <button type="button" class="btn" (click)="load()">بحث</button>
      </div>

      @if (error()) {
        <p class="error">{{ error() }}</p>
      }

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>الاسم</th>
              <th>الرقم الوطني</th>
              <th>الهاتف</th>
              <th>النوع</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (item of items(); track item.id) {
              <tr>
                <td>{{ item.fullName }}</td>
                <td>{{ item.nationalId }}</td>
                <td>{{ item.phone }}</td>
                <td>{{ clientLabel(item.clientType) }}</td>
                <td class="actions">
                  <a [routerLink]="['/insureds', item.id]">الملف</a>
                  <a [routerLink]="['/insureds', item.id, 'edit']">تعديل</a>
                  <button type="button" class="link danger" (click)="remove(item)">حذف</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="5">لا يوجد بيانات بعد</td></tr>
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
    .search input { min-width: 0; width: 100%; flex: 1 1 220px; padding: .7rem .9rem; border: 1px solid #cbd5e1; border-radius: 10px; }
    .btn { border: 1px solid #cbd5e1; background: white; border-radius: 10px; padding: .7rem 1rem; text-decoration: none; color: inherit; cursor: pointer; }
    .btn.primary { background: #0b7a5a; color: white; border-color: #0b7a5a; }
    .table-wrap { background: white; border: 1px solid #e2e8f0; border-radius: 14px; overflow: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: .9rem 1rem; border-bottom: 1px solid #e2e8f0; text-align: right; white-space: nowrap; }
    th { background: #f8fafc; color: #475569; font-weight: 600; }
    .actions { display: flex; gap: .75rem; }
    .actions a, .link { color: #0b7a5a; background: none; border: 0; cursor: pointer; font: inherit; text-decoration: none; padding: 0; }
    .danger { color: #b91c1c !important; }
    .error { color: #b91c1c; }
  `]
})
export class InsuredsListComponent implements OnInit {
  q = '';
  items = signal<Insured[]>([]);
  error = signal('');

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.error.set('');
    this.api.getInsureds(this.q.trim() || undefined).subscribe({
      next: (data) => this.items.set(data),
      error: () => this.error.set('تعذر تحميل المؤمن لهم. تأكد أن الـ API شغال.')
    });
  }

  remove(item: Insured): void {
    if (!confirm(`حذف المؤمن ${item.fullName}؟`)) return;
    this.api.deleteInsured(item.id).subscribe({
      next: () => this.load(),
      error: () => this.error.set('تعذر الحذف. قد يكون مرتبطًا بمركبات أو وثائق.')
    });
  }

  clientLabel(type: Insured['clientType']): string {
    return type === 'Company' || type === 2 ? 'شركة' : 'فرد';
  }
}
