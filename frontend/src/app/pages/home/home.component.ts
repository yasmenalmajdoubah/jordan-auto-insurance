import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="home">
      <h2>المرحلة 5 و 6 جاهزتين محليًا</h2>
      <p>تقييم الأضرار، قواعد الاستهلاك، الدفعات، الإصابات، المخالصة وPDF.</p>
      <div class="actions">
        <a routerLink="/depreciation">قواعد الاستهلاك</a>
        <a routerLink="/accidents">الحوادث</a>
        <a routerLink="/claims">المطالبات</a>
      </div>
      <ul>
        <li>إضافة قطع الأضرار مع استهلاك تلقائي من القواعد</li>
        <li>تسجيل دفعات (كروكة / بدل حادث / إصلاح)</li>
        <li>إصابات ونسب عجز ووفاة</li>
        <li>إنشاء مطالبة + مخالصة + اعتماد + PDF</li>
      </ul>
      <p class="next">ما تم رفع 5 و 6 بعد — قولي ارفع لما تراجعي</p>
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
