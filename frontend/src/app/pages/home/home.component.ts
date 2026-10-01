import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  standalone: true,
  template: `
    <div class="home">
      <h2>تم تأسيس المشروع بنجاح</h2>
      <p>هذه المرحلة تشمل الأساس فقط. باقي الوحدات نضيفها خطوة خطوة بعد موافقتك.</p>
      <ul>
        <li>Backend: ASP.NET Core Web API</li>
        <li>Frontend: Angular 19 (RTL عربي)</li>
        <li>Database: SQLite محليًا (جاهز للتحويل إلى SQL Server لاحقًا)</li>
        <li>Auth: JWT + Roles</li>
        <li>Audit Log جاهز في الـ API</li>
        <li>حساب تجريبي: admin / Admin&#64;123</li>
      </ul>
      <p class="next">الخطوة التالية بعد موافقتك: <strong>المرحلة 1 — المؤمن + المركبات</strong></p>
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
    ul { line-height: 1.9; }
    .next { margin-bottom: 0; color: #0b7a5a; }
  `]
})
export class HomeComponent {}
