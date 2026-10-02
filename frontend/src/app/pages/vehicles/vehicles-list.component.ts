import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Vehicle } from '../../core/models/insurance.models';

@Component({
  selector: 'app-vehicles-list',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="toolbar">
        <div>
          <h2>المركبات</h2>
          <p>ملفات المركبات وسجلاتها</p>
        </div>
        <a class="btn primary" routerLink="/vehicles/new">إضافة مركبة</a>
      </div>

      <div class="search">
        <input [(ngModel)]="q" (keyup.enter)="load()" placeholder="بحث باللوحة / الشاصي / الموديل" />
        <button type="button" class="btn" (click)="load()">بحث</button>
      </div>

      @if (error()) { <p class="error">{{ error() }}</p> }

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>اللوحة</th>
              <th>المركبة</th>
              <th>السنة</th>
              <th>الاستخدام</th>
              <th>المالك</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (item of items(); track item.id) {
              <tr>
                <td>{{ item.plateNumber }}</td>
                <td>{{ item.manufacturer }} {{ item.model }}</td>
                <td>{{ item.year }}</td>
                <td>{{ usageLabel(item.usageType) }}</td>
                <td>{{ item.owner?.fullName || ('#' + item.ownerInsuredId) }}</td>
                <td class="actions">
                  <a [routerLink]="['/vehicles', item.id]">الملف</a>
                  <a [routerLink]="['/vehicles', item.id, 'edit']">تعديل</a>
                  <button type="button" class="link danger" (click)="remove(item)">حذف</button>
                </td>
              </tr>
            } @empty {
              <tr><td colspan="6">لا يوجد مركبات بعد</td></tr>
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
export class VehiclesListComponent implements OnInit {
  q = '';
  items = signal<Vehicle[]>([]);
  error = signal('');

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.error.set('');
    this.api.getVehicles(this.q.trim() || undefined).subscribe({
      next: (data) => this.items.set(data),
      error: () => this.error.set('تعذر تحميل المركبات. تأكد أن الـ API شغال.')
    });
  }

  remove(item: Vehicle): void {
    if (!confirm(`حذف المركبة ${item.plateNumber}؟`)) return;
    this.api.deleteVehicle(item.id).subscribe({
      next: () => this.load(),
      error: () => this.error.set('تعذر الحذف. قد تكون مرتبطة بوثائق أو حوادث.')
    });
  }

  usageLabel(usage: Vehicle['usageType']): string {
    const map: Record<string, string> = {
      Private: 'خصوصي', Taxi: 'ركوب', Medium: 'متوسط', Cargo: 'شحن', Other: 'أخرى',
      '1': 'خصوصي', '2': 'ركوب', '3': 'متوسط', '4': 'شحن', '5': 'أخرى'
    };
    return map[String(usage)] || String(usage);
  }
}
