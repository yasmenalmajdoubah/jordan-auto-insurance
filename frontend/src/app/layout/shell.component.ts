import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <aside>
        <div class="logo">
          <strong>JAI</strong>
          <span>تأمين المركبات</span>
        </div>
        <nav>
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }">لوحة البداية</a>
          <a routerLink="/insureds" routerLinkActive="active">المؤمن لهم</a>
          <a routerLink="/vehicles" routerLinkActive="active">المركبات</a>
          <a routerLink="/policies" routerLinkActive="active">وثائق التأمين</a>
          <a routerLink="/pricing" routerLinkActive="active">قواعد التسعير</a>
          <a routerLink="/accidents" routerLinkActive="active">الحوادث</a>
        </nav>
        <button type="button" class="logout" (click)="auth.logout()">خروج</button>
      </aside>
      <main>
        <header>
          <div>
            <h1>نظام تأمين المركبات</h1>
            <p>المرحلة 3 و 4 — التسعير والحوادث</p>
          </div>
          @if (auth.currentUser(); as u) {
            <div class="user">{{ u.fullName }} · {{ u.role }}</div>
          }
        </header>
        <section class="content">
          <router-outlet />
        </section>
      </main>
    </div>
  `,
  styles: [`
    .shell { min-height: 100vh; display: grid; grid-template-columns: 240px 1fr; background: #f1f5f9; color: #0f172a; }
    aside {
      background: #0f172a; color: #e2e8f0; padding: 1.25rem; display: flex; flex-direction: column; gap: 1rem;
    }
    .logo { display: grid; gap: .2rem; }
    .logo strong { font-size: 1.4rem; color: #34d399; }
    nav { display: grid; gap: .35rem; flex: 1; }
    nav a {
      color: inherit; text-decoration: none; padding: .7rem .8rem; border-radius: 10px;
    }
    nav a.active, nav a:hover { background: #1e293b; }
    .logout {
      border: 1px solid #334155; background: transparent; color: inherit; border-radius: 10px;
      padding: .7rem; cursor: pointer; font: inherit;
    }
    main { display: grid; grid-template-rows: auto 1fr; }
    header {
      display: flex; justify-content: space-between; gap: 1rem; align-items: center;
      padding: 1.25rem 1.5rem; background: white; border-bottom: 1px solid #e2e8f0;
    }
    header h1 { margin: 0; font-size: 1.2rem; }
    header p { margin: .2rem 0 0; color: #64748b; }
    .user { color: #0b7a5a; font-weight: 600; }
    .content { padding: 1.5rem; }
    @media (max-width: 800px) {
      .shell { grid-template-columns: 1fr; }
      aside { flex-direction: row; align-items: center; flex-wrap: wrap; }
      nav { display: flex; }
    }
  `]
})
export class ShellComponent {
  constructor(public auth: AuthService) {}
}
