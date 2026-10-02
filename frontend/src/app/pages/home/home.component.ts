import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="home">
      <h2>مرحبًا بك</h2>
      <p>نظام إدارة تأمين المركبات — اختر من القائمة أو الروابط السريعة.</p>
      <div class="actions">
        <a routerLink="/dashboard">لوحة الإدارة</a>
        <a routerLink="/insureds">المؤمن لهم</a>
        <a routerLink="/accidents">الحوادث</a>
        <a routerLink="/claims">المطالبات</a>
      </div>
    </div>
  `,
  styles: [`
    .home {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 1.5rem;
      max-width: 760px;
    }
    h2 { margin-top: 0; }
    .actions { display: flex; gap: .75rem; margin: 1rem 0 0; flex-wrap: wrap; }
    .actions a {
      background: #0b7a5a; color: white; text-decoration: none;
      padding: .7rem 1rem; border-radius: 10px;
    }
  `]
})
export class HomeComponent {}
