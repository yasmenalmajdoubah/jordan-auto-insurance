import { Component, OnInit, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { VehicleProfile } from '../../core/models/insurance.models';

@Component({
  selector: 'app-vehicle-profile',
  standalone: true,
  imports: [RouterLink, DecimalPipe],
  template: `
    <div class="page">
      <a routerLink="/vehicles" class="back">← رجوع</a>

      @if (error()) { <p class="error">{{ error() }}</p> }

      @if (profile(); as p) {
        <div class="head">
          <div>
            <h2>{{ p.vehicle.plateNumber }}</h2>
            <p>{{ p.vehicle.manufacturer }} {{ p.vehicle.model }} · {{ p.vehicle.year }} · {{ p.vehicle.color }}</p>
          </div>
          <a class="btn" [routerLink]="['/vehicles', p.vehicle.id, 'edit']">تعديل</a>
        </div>

        <div class="cards">
          <section class="card">
            <h3>بيانات المركبة</h3>
            <p>نوع اللوحة: {{ p.vehicle.plateType }}</p>
            <p>الشاصي: {{ p.vehicle.chassisNumber }}</p>
            <p>المحرك: {{ p.vehicle.engineNumber }}</p>
            <p>الاستخدام: {{ usageLabel(p.vehicle.usageType) }}</p>
            <p>القيمة: {{ p.vehicle.vehicleValue | number:'1.0-2' }} د.أ</p>
            <p>الحالة: {{ conditionLabel(p.vehicle.condition) }}</p>
            <p>المالك:
              <a [routerLink]="['/insureds', p.vehicle.ownerInsuredId]">
                {{ p.vehicle.owner?.fullName || ('#' + p.vehicle.ownerInsuredId) }}
              </a>
            </p>
            <p>السائقون المصرح لهم: {{ p.vehicle.authorizedDrivers || '-' }}</p>
          </section>

          <section class="card">
            <h3>سجل التأمين</h3>
            @for (pol of p.policies; track pol.id) {
              <div class="row"><span>{{ pol.policyNumber }}</span><span>{{ pol.status }}</span></div>
            } @empty { <p class="muted">لا يوجد وثائق بعد (المرحلة 2)</p> }
          </section>

          <section class="card">
            <h3>سجل الحوادث</h3>
            @for (a of p.accidents; track a.id) {
              <div class="row"><span>{{ a.accidentNumber }}</span><span>{{ a.status }}</span></div>
            } @empty { <p class="muted">لا يوجد حوادث بعد</p> }
          </section>

          <section class="card">
            <h3>سجل المطالبات</h3>
            @for (c of p.claims; track c.id) {
              <div class="row"><span>{{ c.claimNumber }}</span><span>{{ c.status }}</span></div>
            } @empty { <p class="muted">لا يوجد مطالبات بعد</p> }
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { display: grid; gap: 1rem; }
    .back { color: #0b7a5a; text-decoration: none; width: fit-content; }
    .head { display: flex; justify-content: space-between; gap: 1rem; align-items: center; }
    h2, h3 { margin: 0; } p { margin: .3rem 0 0; color: #64748b; }
    .btn { border: 1px solid #cbd5e1; background: white; border-radius: 10px; padding: .65rem 1rem; text-decoration: none; color: inherit; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1rem; display: grid; gap: .55rem; }
    .row { display: flex; justify-content: space-between; gap: .75rem; border-top: 1px solid #f1f5f9; padding-top: .45rem; }
    a { color: #0b7a5a; text-decoration: none; }
    .muted { color: #94a3b8; margin: 0; }
    .error { color: #b91c1c; }
  `]
})
export class VehicleProfileComponent implements OnInit {
  profile = signal<VehicleProfile | null>(null);
  error = signal('');

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getVehicleProfile(id).subscribe({
      next: (data) => this.profile.set(data),
      error: () => this.error.set('تعذر تحميل ملف المركبة')
    });
  }

  usageLabel(usage: any): string {
    const map: Record<string, string> = {
      Private: 'خصوصي', Taxi: 'ركوب', Medium: 'متوسط', Cargo: 'شحن', Other: 'أخرى',
      '1': 'خصوصي', '2': 'ركوب', '3': 'متوسط', '4': 'شحن', '5': 'أخرى'
    };
    return map[String(usage)] || String(usage);
  }

  conditionLabel(c: any): string {
    const map: Record<string, string> = {
      Excellent: 'ممتازة', Good: 'جيدة', Fair: 'متوسطة', Poor: 'ضعيفة',
      '1': 'ممتازة', '2': 'جيدة', '3': 'متوسطة', '4': 'ضعيفة'
    };
    return map[String(c)] || String(c);
  }
}
