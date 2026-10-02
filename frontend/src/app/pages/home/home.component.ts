import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="home">
      <h2>المرحلة 3 و 4 جاهزتين محليًا</h2>
      <p>راجعي الشاشات، وبعدين نرفع المراحل 2 و 3 و 4 معًا لما تقولي.</p>
      <div class="actions">
        <a routerLink="/pricing">قواعد التسعير</a>
        <a routerLink="/accidents">الحوادث</a>
        <a routerLink="/policies">الوثائق</a>
      </div>
      <ul>
        <li>تعديل نسب التسعير من الشاشة + حاسبة القسط</li>
        <li>تسجيل حادث مع Coverage Check تلقائي</li>
        <li>أنواع الحوادث: معروف / مجهول / مركبة واحدة...</li>
        <li>رفع مستندات إلكترونية داخل ملف الحادث</li>
      </ul>
      <p class="next">بعد مراجعتك: ارفعي 2+3+4، وبعدين نكمل المرحلة 5</p>
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
    .actions { display: flex; gap: .75rem; margin: 1rem 0; flex-wrap: wrap; }
    .actions a {
      background: #0b7a5a; color: white; text-decoration: none;
      padding: .7rem 1rem; border-radius: 10px;
    }
    ul { line-height: 1.9; }
    .next { margin-bottom: 0; color: #0b7a5a; }
  `]
})
export class HomeComponent {}
