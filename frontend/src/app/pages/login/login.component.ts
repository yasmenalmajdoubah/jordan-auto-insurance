import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="login-page">
      <form class="login-card" (ngSubmit)="submit()">
        <p class="brand">Jordan Auto Insurance</p>
        <h1>تسجيل الدخول</h1>
        <p class="hint">نظام إدارة تأمين المركبات</p>

        <label>
          اسم المستخدم
          <input name="userName" [(ngModel)]="userName" autocomplete="username" required />
        </label>

        <label>
          كلمة المرور
          <input name="password" type="password" [(ngModel)]="password" autocomplete="current-password" required />
        </label>

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }

        <button type="submit" [disabled]="loading()">دخول</button>
        <p class="demo">تجريبي: admin / Admin&#64;123</p>
      </form>
    </div>
  `,
  styles: [`
    .login-page {
      min-height: 100vh;
      display: grid;
      place-items: center;
      background:
        radial-gradient(circle at 20% 20%, #1f4b7a33, transparent 40%),
        radial-gradient(circle at 80% 0%, #0b7a5a22, transparent 35%),
        linear-gradient(160deg, #0f172a, #1e293b 55%, #0b3d2e);
      padding: 1.5rem;
    }
    .login-card {
      width: min(420px, 100%);
      background: #f8fafc;
      color: #0f172a;
      border-radius: 18px;
      padding: 2rem;
      display: grid;
      gap: 0.9rem;
      box-shadow: 0 20px 50px rgba(0,0,0,.35);
    }
    .brand { margin: 0; font-weight: 700; color: #0b7a5a; letter-spacing: .02em; }
    h1 { margin: 0; font-size: 1.6rem; }
    .hint { margin: 0 0 .5rem; color: #64748b; }
    label { display: grid; gap: .35rem; font-size: .92rem; }
    input {
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: .75rem .9rem;
      font: inherit;
    }
    button {
      margin-top: .4rem;
      border: 0;
      border-radius: 10px;
      padding: .85rem 1rem;
      background: #0b7a5a;
      color: white;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
    }
    button:disabled { opacity: .6; cursor: wait; }
    .error { color: #b91c1c; margin: 0; }
    .demo { margin: 0; color: #64748b; font-size: .85rem; text-align: center; }
  `]
})
export class LoginComponent {
  userName = 'admin';
  password = 'Admin@123';
  loading = signal(false);
  error = signal('');

  constructor(private auth: AuthService, private router: Router) {}

  submit(): void {
    this.loading.set(true);
    this.error.set('');
    this.auth.login(this.userName, this.password).subscribe({
      next: () => {
        this.loading.set(false);
        this.router.navigateByUrl('/');
      },
      error: () => {
        this.loading.set(false);
        this.error.set('فشل تسجيل الدخول. تحقق من البيانات.');
      }
    });
  }
}
