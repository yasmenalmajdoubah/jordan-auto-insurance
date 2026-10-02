import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { DashboardSummary } from '../../core/models/insurance.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  template: `
    <div class="page">
      <div class="toolbar">
        <div>
          <h2>لوحة الإدارة</h2>
          <p>مؤشرات الوثائق والمطالبات والحوادث والاسترداد</p>
        </div>
        <button type="button" class="btn" (click)="load()">تحديث</button>
      </div>

      @if (error()) { <p class="error">{{ error() }}</p> }

      @if (data(); as d) {
        <div class="kpis">
          <div class="kpi"><span>وثائق نشطة</span><strong>{{ d.activePolicies }}</strong></div>
          <div class="kpi"><span>وثائق منتهية</span><strong>{{ d.expiredPolicies }}</strong></div>
          <div class="kpi"><span>وثائق جديدة (30 يوم)</span><strong>{{ d.newPolicies }}</strong></div>
          <div class="kpi"><span>حوادث اليوم</span><strong>{{ d.accidentsToday }}</strong></div>
          <div class="kpi"><span>حوادث مفتوحة</span><strong>{{ d.openAccidents }}</strong></div>
          <div class="kpi"><span>مطالبات مفتوحة</span><strong>{{ d.openClaims }}</strong></div>
          <div class="kpi"><span>قيد المراجعة</span><strong>{{ d.pendingClaims }}</strong></div>
          <div class="kpi"><span>معتمدة</span><strong>{{ d.approvedClaims }}</strong></div>
          <div class="kpi"><span>مرفوضة</span><strong>{{ d.rejectedClaims }}</strong></div>
          <div class="kpi"><span>مسددة</span><strong>{{ d.settledClaims }}</strong></div>
          <div class="kpi"><span>إجمالي المدفوع</span><strong>{{ d.totalPaidClaims | number:'1.0-2' }}</strong></div>
          <div class="kpi"><span>مطالبات قائمة</span><strong>{{ d.outstandingClaims | number:'1.0-2' }}</strong></div>
          <div class="kpi"><span>قيمة الاسترداد</span><strong>{{ d.recoveryAmount | number:'1.0-2' }}</strong></div>
          <div class="kpi"><span>استرداد معلّق</span><strong>{{ d.pendingRecovery | number:'1.0-2' }}</strong></div>
          <div class="kpi"><span>استرداد محصّل</span><strong>{{ d.recoveryPaid | number:'1.0-2' }}</strong></div>
        </div>

        <div class="charts">
          <section class="card">
            <h3>المطالبات حسب الشهر</h3>
            @for (m of d.claimsByMonth; track m.month) {
              <div class="bar-row">
                <span>{{ m.month }}</span>
                <div class="bar"><i [style.width.%]="barWidth(m.count, maxClaims())"></i></div>
                <strong>{{ m.count }}</strong>
              </div>
            }
          </section>

          <section class="card">
            <h3>الحوادث حسب الشهر</h3>
            @for (m of d.accidentsByMonth; track m.month) {
              <div class="bar-row">
                <span>{{ m.month }}</span>
                <div class="bar"><i [style.width.%]="barWidth(m.count, maxAccidents())"></i></div>
                <strong>{{ m.count }}</strong>
              </div>
            }
          </section>

          <section class="card">
            <h3>الحوادث حسب نوع الاستخدام</h3>
            @for (u of d.accidentsByVehicleUsage; track u.usage) {
              <div class="bar-row">
                <span>{{ usageLabel(u.usage) }}</span>
                <div class="bar alt"><i [style.width.%]="barWidth(u.count, maxUsage())"></i></div>
                <strong>{{ u.count }}</strong>
              </div>
            } @empty {
              <p class="muted">لا بيانات بعد</p>
            }
          </section>

          <section class="card">
            <h3>شامل vs ضد الغير</h3>
            <div class="bar-row">
              <span>شامل</span>
              <div class="bar"><i [style.width.%]="barWidth(d.comprehensiveVsThirdParty.comprehensive, typeTotal())"></i></div>
              <strong>{{ d.comprehensiveVsThirdParty.comprehensive }}</strong>
            </div>
            <div class="bar-row">
              <span>ضد الغير</span>
              <div class="bar alt"><i [style.width.%]="barWidth(d.comprehensiveVsThirdParty.thirdParty, typeTotal())"></i></div>
              <strong>{{ d.comprehensiveVsThirdParty.thirdParty }}</strong>
            </div>
          </section>

          <section class="card">
            <h3>المطالبات حسب الحالة</h3>
            @for (s of d.claimsByStatus; track s.status) {
              <div class="bar-row">
                <span>{{ s.status }}</span>
                <div class="bar"><i [style.width.%]="barWidth(s.count, maxStatus())"></i></div>
                <strong>{{ s.count }}</strong>
              </div>
            } @empty {
              <p class="muted">لا بيانات بعد</p>
            }
          </section>

          <section class="card">
            <h3>إحصاءات الاسترداد</h3>
            @for (r of d.recoveryByStatus; track r.status) {
              <div class="bar-row">
                <span>{{ r.status }}</span>
                <div class="bar alt"><i [style.width.%]="barWidth(r.count, maxRecovery())"></i></div>
                <strong>{{ r.count }} / {{ r.amount | number:'1.0-0' }}</strong>
              </div>
            } @empty {
              <p class="muted">لا يوجد استرداد بعد</p>
            }
            <a routerLink="/recovery">فتح صفحة الاسترداد</a>
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { display: grid; gap: 1rem; }
    .toolbar { display: flex; justify-content: space-between; gap: 1rem; align-items: center; }
    h2, h3 { margin: 0; } p { margin: .25rem 0 0; color: #64748b; }
    .btn { border: 1px solid #cbd5e1; background: white; border-radius: 10px; padding: .6rem .9rem; cursor: pointer; }
    .kpis { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: .75rem; }
    .kpi {
      background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: .9rem;
      display: grid; gap: .35rem;
    }
    .kpi span { color: #64748b; font-size: .85rem; }
    .kpi strong { font-size: 1.25rem; color: #0f172a; }
    .charts { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1rem; }
    .card {
      background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1rem;
      display: grid; gap: .65rem; align-content: start;
    }
    .bar-row { display: grid; grid-template-columns: 90px 1fr 70px; gap: .55rem; align-items: center; }
    .bar { background: #f1f5f9; border-radius: 999px; height: 10px; overflow: hidden; }
    .bar i { display: block; height: 100%; background: #0b7a5a; border-radius: 999px; }
    .bar.alt i { background: #1d4ed8; }
    .muted { color: #94a3b8; margin: 0; }
    a { color: #0b7a5a; text-decoration: none; }
    .error { color: #b91c1c; }
  `]
})
export class DashboardComponent implements OnInit {
  data = signal<DashboardSummary | null>(null);
  error = signal('');

  constructor(private api: ApiService) {}

  ngOnInit(): void { this.load(); }

  load(): void {
    this.error.set('');
    this.api.getDashboardSummary().subscribe({
      next: (d) => this.data.set(d),
      error: () => this.error.set('تعذر تحميل لوحة الإدارة')
    });
  }

  barWidth(value: number, max: number): number {
    if (!max) return 0;
    return Math.max(6, Math.round((value / max) * 100));
  }

  maxClaims(): number {
    return Math.max(1, ...(this.data()?.claimsByMonth.map(x => x.count) || [1]));
  }

  maxAccidents(): number {
    return Math.max(1, ...(this.data()?.accidentsByMonth.map(x => x.count) || [1]));
  }

  maxUsage(): number {
    return Math.max(1, ...(this.data()?.accidentsByVehicleUsage.map(x => x.count) || [1]));
  }

  maxStatus(): number {
    return Math.max(1, ...(this.data()?.claimsByStatus.map(x => x.count) || [1]));
  }

  maxRecovery(): number {
    return Math.max(1, ...(this.data()?.recoveryByStatus.map(x => x.count) || [1]));
  }

  typeTotal(): number {
    const d = this.data();
    if (!d) return 1;
    return Math.max(1, d.comprehensiveVsThirdParty.comprehensive + d.comprehensiveVsThirdParty.thirdParty);
  }

  usageLabel(u: string): string {
    const map: Record<string, string> = {
      Private: 'خصوصي', Taxi: 'ركوب', Medium: 'متوسط', Cargo: 'شحن', Other: 'أخرى', Unknown: 'غير معروف'
    };
    return map[u] || u;
  }
}
