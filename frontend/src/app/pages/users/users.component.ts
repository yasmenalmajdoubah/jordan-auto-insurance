import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AppUser } from '../../core/models/insurance.models';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="page">
      <div class="toolbar">
        <div>
          <h2>المستخدمون والصلاحيات</h2>
          <p>Roles: Admin, Underwriter, ClaimsOfficer, AccidentOfficer, Surveyor, Finance, Manager, ReadOnly</p>
        </div>
      </div>

      @if (error()) { <p class="error">{{ error() }}</p> }
      @if (ok()) { <p class="ok">{{ ok() }}</p> }

      <section class="card">
        <h3>إضافة مستخدم</h3>
        <div class="grid">
          <input [(ngModel)]="draft.userName" name="userName" placeholder="اسم المستخدم" />
          <input [(ngModel)]="draft.fullName" name="fullName" placeholder="الاسم الكامل" />
          <input [(ngModel)]="draft.email" name="email" placeholder="البريد" />
          <input [(ngModel)]="draft.password" name="password" type="password" placeholder="كلمة المرور" />
          <select [(ngModel)]="draft.role" name="role">
            @for (r of roles(); track r) {
              <option [value]="r">{{ r }}</option>
            }
          </select>
          <button type="button" class="btn primary" (click)="create()" [disabled]="busy()">إضافة</button>
        </div>
      </section>

      <section class="card">
        <h3>المستخدمون الحاليون</h3>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>المستخدم</th>
                <th>الاسم</th>
                <th>الإيميل</th>
                <th>الدور</th>
                <th>نشط</th>
                <th>كلمة مرور جديدة</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (u of users(); track u.id) {
                <tr>
                  <td>{{ u.userName }}</td>
                  <td><input [(ngModel)]="u.fullName" [name]="'fn'+u.id" /></td>
                  <td><input [(ngModel)]="u.email" [name]="'em'+u.id" /></td>
                  <td>
                    <select [(ngModel)]="u.role" [name]="'role'+u.id">
                      @for (r of roles(); track r) {
                        <option [value]="r">{{ r }}</option>
                      }
                    </select>
                  </td>
                  <td><input type="checkbox" [(ngModel)]="u.isActive" [name]="'act'+u.id" /></td>
                  <td><input type="password" [(ngModel)]="passwords[u.id]" [name]="'pw'+u.id" placeholder="اختياري" /></td>
                  <td><button type="button" class="btn" (click)="save(u)" [disabled]="busy()">حفظ</button></td>
                </tr>
              } @empty {
                <tr><td colspan="7">لا يوجد مستخدمون</td></tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </div>
  `,
  styles: [`
    .page { display: grid; gap: 1rem; }
    .toolbar h2 { margin: 0; } .toolbar p { margin: .25rem 0 0; color: #64748b; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1rem; display: grid; gap: .8rem; }
    h3 { margin: 0; }
    .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: .55rem; align-items: center; }
    input, select { border: 1px solid #cbd5e1; border-radius: 8px; padding: .55rem .7rem; font: inherit; width: 100%; }
    .btn { border: 1px solid #cbd5e1; background: white; border-radius: 10px; padding: .55rem .9rem; cursor: pointer; width: fit-content; }
    .btn.primary { background: #0b7a5a; color: white; border-color: #0b7a5a; }
    .table-wrap { overflow: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: .65rem .5rem; border-bottom: 1px solid #e2e8f0; text-align: right; }
    .error { color: #b91c1c; } .ok { color: #065f46; }
  `]
})
export class UsersComponent implements OnInit {
  users = signal<AppUser[]>([]);
  roles = signal<string[]>([]);
  error = signal('');
  ok = signal('');
  busy = signal(false);
  passwords: Record<number, string> = {};
  draft = { userName: '', fullName: '', email: '', password: '', role: 'ReadOnly' };

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.api.getRoles().subscribe({ next: (r) => this.roles.set(r) });
    this.load();
  }

  load(): void {
    this.api.getUsers().subscribe({
      next: (u) => this.users.set(u),
      error: () => this.error.set('تعذر تحميل المستخدمين (يلزم Admin/Manager)')
    });
  }

  create(): void {
    if (!this.draft.userName || !this.draft.password) {
      this.error.set('اسم المستخدم وكلمة المرور مطلوبان');
      return;
    }
    this.busy.set(true);
    this.api.registerUser(this.draft).subscribe({
      next: () => {
        this.busy.set(false);
        this.ok.set('تم إنشاء المستخدم');
        this.draft = { userName: '', fullName: '', email: '', password: '', role: 'ReadOnly' };
        this.load();
      },
      error: (err) => {
        this.busy.set(false);
        this.error.set(err?.error?.message || 'تعذر الإنشاء (يلزم Admin)');
      }
    });
  }

  save(u: AppUser): void {
    this.busy.set(true);
    this.api.updateUser(u.id, {
      fullName: u.fullName,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      newPassword: this.passwords[u.id] || undefined
    }).subscribe({
      next: () => {
        this.busy.set(false);
        this.ok.set(`تم حفظ ${u.userName}`);
        this.passwords[u.id] = '';
        this.load();
      },
      error: () => {
        this.busy.set(false);
        this.error.set('تعذر الحفظ (يلزم Admin)');
      }
    });
  }
}
