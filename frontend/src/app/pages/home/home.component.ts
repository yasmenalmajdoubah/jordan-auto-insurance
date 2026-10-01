import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="home">
      <h2>المرحلة 1 جاهزة محليًا</h2>
      <p>تقدر تدير المؤمن لهم والمركبات، وتفتح ملف كل واحد مع سجلاته.</p>
      <div class="actions">
        <a routerLink="/insureds">المؤمن لهم</a>
        <a routerLink="/vehicles">المركبات</a>
      </div>
      <ul>
        <li>إضافة / تعديل / حذف مؤمن</li>
        <li>ملف المؤمن: مركبات + وثائق + حوادث + مطالبات + دفعات</li>
        <li>إضافة / تعديل / حذف مركبة</li>
        <li>Vehicle Profile: تأمين + حوادث + مطالبات</li>
      </ul>
      <p class="next">الخطوة التالية بعد موافقتك: <strong>المرحلة 2 — وثيقة التأمين + Coverage Check</strong></p>
    </div>
  `,
  styles: [`
    .home {
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 16px;
      padding: 1.5rem;
      max-width: 720px;
    }
    h2 { margin-top: 0; }
    .actions { display: flex; gap: .75rem; margin: 1rem 0; }
    .actions a {
      background: #0b7a5a; color: white; text-decoration: none;
      padding: .7rem 1rem; border-radius: 10px;
    }
    ul { line-height: 1.9; }
    .next { margin-bottom: 0; color: #0b7a5a; }
  `]
})
export class HomeComponent {}
