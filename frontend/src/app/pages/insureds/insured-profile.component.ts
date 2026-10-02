import { Component, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { InsuredProfile } from '../../core/models/insurance.models';

@Component({
  selector: 'app-insured-profile',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page">
      <a routerLink="/insureds" class="back">← رجوع</a>

      @if (error()) { <p class="error">{{ error() }}</p> }

      @if (profile(); as p) {
        <div class="head">
          <div>
            <h2>{{ p.insured.fullName }}</h2>
            <p>{{ p.insured.nationalId }} · {{ p.insured.phone }}</p>
          </div>
          <a class="btn" [routerLink]="['/insureds', p.insured.id, 'edit']">تعديل</a>
        </div>

        <div class="cards">
          <section class="card">
            <h3>بيانات التواصل</h3>
            <p>العنوان: {{ p.insured.address }}</p>
            <p>إيميل: {{ p.insured.email || '-' }}</p>
            <p>هاتف إضافي: {{ p.insured.secondaryPhone || '-' }}</p>
            <p>النوع: {{ p.insured.clientType === 'Company' || p.insured.clientType === 2 ? 'شركة' : 'فرد' }}</p>
            <p>ملاحظات: {{ p.insured.notes || '-' }}</p>
          </section>

          <section class="card">
            <div class="card-title">
              <h3>المركبات</h3>
              <a [routerLink]="['/vehicles/new']" [queryParams]="{ ownerId: p.insured.id }">إضافة مركبة</a>
            </div>
            @for (v of p.vehicles; track v.id) {
              <div class="row">
                <a [routerLink]="['/vehicles', v.id]">{{ v.plateNumber }} — {{ v.manufacturer }} {{ v.model }}</a>
                <span>{{ v.year }}</span>
              </div>
            } @empty {
              <p class="muted">لا يوجد مركبات</p>
            }
          </section>

          <section class="card">
            <h3>سجل الوثائق</h3>
            @for (pol of p.policies; track pol.id) {
              <div class="row"><span>{{ pol.policyNumber }}</span><span>{{ pol.status }}</span></div>
            } @empty { <p class="muted">لا يوجد وثائق بعد</p> }
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

          <section class="card">
            <h3>سجل الدفعات</h3>
            @for (pay of p.payments; track pay.id) {
              <div class="row"><span>{{ pay.paymentType }}</span><span>{{ pay.amount }} د.أ</span></div>
            } @empty { <p class="muted">لا يوجد دفعات بعد</p> }
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { display: grid; gap: 1rem; }
    .back { color: #0b7a5a; text-decoration: none; width: fit-content; }
    .head { display: flex; justify-content: space-between; gap: 1rem; align-items: center; flex-wrap: wrap; }
    h2, h3 { margin: 0; } p { margin: .3rem 0 0; color: #64748b; }
    .btn { border: 1px solid #cbd5e1; background: white; border-radius: 10px; padding: .65rem 1rem; text-decoration: none; color: inherit; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr)); gap: 1rem; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1rem; display: grid; gap: .55rem; }
    .card-title { display: flex; justify-content: space-between; align-items: center; gap: .5rem; }
    .card-title a { color: #0b7a5a; text-decoration: none; font-size: .9rem; }
    .row { display: flex; justify-content: space-between; gap: .75rem; border-top: 1px solid #f1f5f9; padding-top: .45rem; }
    .row a { color: #0b7a5a; text-decoration: none; }
    .muted { color: #94a3b8; margin: 0; }
    .error { color: #b91c1c; }
  `]
})
export class InsuredProfileComponent implements OnInit {
  profile = signal<InsuredProfile | null>(null);
  error = signal('');

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getInsuredProfile(id).subscribe({
      next: (data) => this.profile.set(data),
      error: () => this.error.set('تعذر تحميل ملف المؤمن')
    });
  }
}
