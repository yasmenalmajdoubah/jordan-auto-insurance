import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <aside>
        <div class="aside-top">
          <div class="logo">
            <strong>JAI</strong>
            <span>تأمين المركبات</span>
          </div>
          <button type="button" class="menu-toggle" (click)="menuOpen.set(!menuOpen())" [attr.aria-expanded]="menuOpen()">
            {{ menuOpen() ? 'إغلاق' : 'القائمة' }}
          </button>
        </div>
        <nav [class.is-open]="menuOpen()">
          <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" (click)="closeMenu()">لوحة البداية</a>
          <a routerLink="/dashboard" routerLinkActive="active" (click)="closeMenu()">لوحة الإدارة</a>
          <a routerLink="/insureds" routerLinkActive="active" (click)="closeMenu()">المؤمن لهم</a>
          <a routerLink="/vehicles" routerLinkActive="active" (click)="closeMenu()">المركبات</a>
          <a routerLink="/policies" routerLinkActive="active" (click)="closeMenu()">وثائق التأمين</a>
          <a routerLink="/pricing" routerLinkActive="active" (click)="closeMenu()">قواعد التسعير</a>
          <a routerLink="/depreciation" routerLinkActive="active" (click)="closeMenu()">قواعد الاستهلاك</a>
          <a routerLink="/accidents" routerLinkActive="active" (click)="closeMenu()">الحوادث</a>
          <a routerLink="/claims" routerLinkActive="active" (click)="closeMenu()">المطالبات</a>
          <a routerLink="/recovery" routerLinkActive="active" (click)="closeMenu()">الاسترداد</a>
          <a routerLink="/users" routerLinkActive="active" (click)="closeMenu()">المستخدمون</a>
          <a routerLink="/audit" routerLinkActive="active" (click)="closeMenu()">سجل التدقيق</a>
        </nav>
        <button type="button" class="logout" [class.is-open]="menuOpen()" (click)="auth.logout()">خروج</button>
      </aside>
      <main>
        <header>
          <div>
            <h1>نظام تأمين المركبات</h1>
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
    .shell {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 240px minmax(0, 1fr);
      background: #f1f5f9;
      color: #0f172a;
      overflow-x: clip;
      width: 100%;
      max-width: 100%;
    }
    aside {
      background: #0f172a; color: #e2e8f0; padding: 1.25rem;
      display: flex; flex-direction: column; gap: 1rem;
      min-width: 0;
    }
    .aside-top { display: flex; align-items: center; justify-content: space-between; gap: .75rem; }
    .menu-toggle {
      display: none;
      border: 1px solid #334155; background: #1e293b; color: inherit;
      border-radius: 10px; padding: .55rem .8rem; cursor: pointer; font: inherit; white-space: nowrap;
    }
    .logo { display: grid; gap: .2rem; min-width: 0; }
    .logo strong { font-size: 1.4rem; color: #34d399; }
    nav { display: grid; gap: .35rem; flex: 1; min-width: 0; }
    nav a {
      color: inherit; text-decoration: none; padding: .7rem .8rem; border-radius: 10px;
    }
    nav a.active, nav a:hover { background: #1e293b; }
    .logout {
      border: 1px solid #334155; background: transparent; color: inherit; border-radius: 10px;
      padding: .7rem; cursor: pointer; font: inherit;
    }
    main { display: grid; grid-template-rows: auto 1fr; min-width: 0; max-width: 100%; }
    header {
      display: flex; justify-content: space-between; gap: 1rem; align-items: center;
      padding: 1.25rem 1.5rem; background: white; border-bottom: 1px solid #e2e8f0;
      min-width: 0;
    }
    header h1 { margin: 0; font-size: 1.2rem; overflow-wrap: anywhere; }
    .user { color: #0b7a5a; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 50%; }
    .content { padding: 1.5rem; min-width: 0; max-width: 100%; overflow-x: clip; }
    @media (max-width: 900px) {
      .shell { grid-template-columns: minmax(0, 1fr); }
      .menu-toggle { display: inline-flex; }
      nav, .logout { display: none; }
      nav.is-open, .logout.is-open { display: grid; width: 100%; }
      header { padding: 1rem; flex-wrap: wrap; }
      .user { max-width: 100%; white-space: normal; }
      .content { padding: 1rem; }
    }
  `]
})
export class ShellComponent {
  readonly menuOpen = signal(false);

  constructor(public auth: AuthService) {}

  closeMenu(): void {
    this.menuOpen.set(false);
  }
}
