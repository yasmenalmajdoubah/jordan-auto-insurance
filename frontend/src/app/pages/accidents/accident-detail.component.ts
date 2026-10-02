import { Component, OnInit, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Accident, CoverageResult, DamageSummary } from '../../core/models/insurance.models';

@Component({
  selector: 'app-accident-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe, DecimalPipe],
  template: `
    <div class="page">
      <a routerLink="/accidents" class="back">← رجوع</a>
      @if (error()) { <p class="error">{{ error() }}</p> }
      @if (ok()) { <p class="ok">{{ ok() }}</p> }

      @if (accident(); as a) {
        <div class="head">
          <div>
            <h2>{{ a.accidentNumber }}</h2>
            <p>{{ a.location }} · {{ a.accidentDateTime | date:'yyyy-MM-dd HH:mm' }}</p>
          </div>
          <div class="head-actions">
            <a class="btn" [routerLink]="['/claims']" [queryParams]="{ accidentId: a.id }">المطالبات</a>
            <button type="button" class="btn" (click)="recheck()" [disabled]="busy()">إعادة فحص التغطية</button>
          </div>
        </div>

        <div class="cards">
          <section class="card">
            <h3>بيانات الحادث</h3>
            <p>الوثيقة: <a [routerLink]="['/policies', a.policyId]">{{ a.policy?.policyNumber || ('#' + a.policyId) }}</a></p>
            <p>المركبة: <a [routerLink]="['/vehicles', a.vehicleId]">{{ a.vehicle?.plateNumber || ('#' + a.vehicleId) }}</a></p>
            <p>السائق: {{ a.driverName }}</p>
            <p>النوع: {{ typeLabel(a.accidentType) }}</p>
            <p>المسؤولية: {{ liabilityLabel(a.liability) }}</p>
            <p>الوصف: {{ a.description }}</p>
          </section>

          <section class="card">
            <h3>نتيجة التغطية</h3>
            <div class="box" [class.ok]="a.isCovered === true" [class.no]="a.isCovered === false">
              <strong>{{ a.isCovered === true ? 'Covered' : a.isCovered === false ? 'Not Covered' : '-' }}</strong>
              <p>{{ a.coverageReason || '-' }}</p>
            </div>
            @if (latestCheck(); as c) {
              <div class="box" [class.ok]="c.isCovered" [class.no]="!c.isCovered">
                <strong>آخر فحص: {{ c.isCovered ? 'Covered' : 'Not Covered' }}</strong>
                <p>{{ c.reason }}</p>
              </div>
            }
          </section>

          <section class="card wide">
            <h3>تقييم الأضرار</h3>
            <div class="form-grid">
              <input [(ngModel)]="damage.partName" name="partName" placeholder="اسم القطعة" />
              <input [(ngModel)]="damage.partNumber" name="partNumber" placeholder="رقم القطعة" />
              <input [(ngModel)]="damage.damageType" name="damageType" placeholder="نوع الضرر" />
              <select [(ngModel)]="damage.action" name="action">
                <option value="Repair">إصلاح</option>
                <option value="Replace">تبديل</option>
              </select>
              <input type="number" [(ngModel)]="damage.partPrice" name="partPrice" placeholder="سعر القطعة" />
              <input type="number" [(ngModel)]="damage.laborCost" name="laborCost" placeholder="أجور العمل" />
              <input type="number" [(ngModel)]="damage.paintCost" name="paintCost" placeholder="أجور الدهان" />
              <input type="number" [(ngModel)]="damage.discount" name="discount" placeholder="الخصم" />
              <select [(ngModel)]="damage.partType" name="partType">
                <option value="Body">Body</option>
                <option value="Mechanical">Mechanical</option>
              </select>
              <button type="button" class="btn primary" (click)="addDamage()" [disabled]="busy()">إضافة ضرر</button>
            </div>

            @if (summary(); as s) {
              <p class="summary">الإجمالي النهائي: <strong>{{ s.total | number:'1.2-2' }} د.أ</strong>
                (قطع {{ s.parts | number:'1.2-2' }} · عمل {{ s.labor | number:'1.2-2' }} · دهان {{ s.paint | number:'1.2-2' }})
              </p>
            }

            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>القطعة</th>
                    <th>الإجراء</th>
                    <th>سعر</th>
                    <th>عمل</th>
                    <th>دهان</th>
                    <th>استهلاك %</th>
                    <th>النهائي</th>
                  </tr>
                </thead>
                <tbody>
                  @for (d of a.damageItems || []; track d.id) {
                    <tr>
                      <td>{{ d.partName }}</td>
                      <td>{{ d.action === 'Replace' || d.action === 2 ? 'تبديل' : 'إصلاح' }}</td>
                      <td>{{ d.partPrice }}</td>
                      <td>{{ d.laborCost }}</td>
                      <td>{{ d.paintCost }}</td>
                      <td>{{ d.depreciationPercent }}%</td>
                      <td>{{ d.finalAmount }}</td>
                    </tr>
                  } @empty {
                    <tr><td colspan="7">لا يوجد تقييم أضرار بعد</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </section>

          <section class="card wide">
            <h3>الدفعات المالية (كروكة / بدل حادث / إصلاح...)</h3>
            <div class="form-grid">
              <select [(ngModel)]="payment.paymentType" name="paymentType">
                <option value="Krooka">كروكة</option>
                <option value="AccidentFee">بدل حادث</option>
                <option value="RepairPayment">دفعة إصلاح</option>
                <option value="SettlementPayment">مخالصة</option>
                <option value="MedicalPayment">علاج</option>
                <option value="Other">أخرى</option>
              </select>
              <input type="number" [(ngModel)]="payment.amount" name="amount" placeholder="المبلغ" />
              <input [(ngModel)]="payment.paidBy" name="paidBy" placeholder="من دفع" />
              <input [(ngModel)]="payment.paidTo" name="paidTo" placeholder="لمن دفع" />
              <input type="date" [(ngModel)]="payment.paymentDate" name="paymentDate" />
              <input [(ngModel)]="payment.paymentMethod" name="paymentMethod" placeholder="طريقة الدفع" />
              <input [(ngModel)]="payment.receiptNumber" name="receiptNumber" placeholder="رقم الوصل" />
              <button type="button" class="btn primary" (click)="addPayment()" [disabled]="busy()">تسجيل دفعة</button>
            </div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr><th>النوع</th><th>المبلغ</th><th>من</th><th>إلى</th><th>التاريخ</th><th>الوصل</th></tr>
                </thead>
                <tbody>
                  @for (p of a.payments || []; track p.id) {
                    <tr>
                      <td>{{ paymentLabel(p.paymentType) }}</td>
                      <td>{{ p.amount }}</td>
                      <td>{{ p.paidBy }}</td>
                      <td>{{ p.paidTo }}</td>
                      <td>{{ p.paymentDate | date:'yyyy-MM-dd' }}</td>
                      <td>{{ p.receiptNumber || '-' }}</td>
                    </tr>
                  } @empty {
                    <tr><td colspan="6">لا يوجد دفعات</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </section>

          <section class="card wide">
            <h3>الإصابات / الوفاة</h3>
            <div class="form-grid">
              <input [(ngModel)]="injury.injuredName" name="injuredName" placeholder="اسم المصاب" />
              <input [(ngModel)]="injury.nationalId" name="nationalId" placeholder="الرقم الوطني" />
              <input [(ngModel)]="injury.relationToAccident" name="relationToAccident" placeholder="علاقته بالحادث" />
              <input [(ngModel)]="injury.injuryType" name="injuryType" placeholder="نوع الإصابة" />
              <input [(ngModel)]="injury.hospital" name="hospital" placeholder="المستشفى" />
              <input type="number" [(ngModel)]="injury.treatmentCost" name="treatmentCost" placeholder="تكاليف العلاج" />
              <input [(ngModel)]="injury.billsPaidBy" name="billsPaidBy" placeholder="من دفع الفواتير" />
              <input type="number" [(ngModel)]="injury.disabilityPercent" name="disabilityPercent" placeholder="نسبة العجز %" />
              <input type="number" [(ngModel)]="injury.downtimeDays" name="downtimeDays" placeholder="أيام التعطل" />
              <input type="number" [(ngModel)]="injury.compensationAmount" name="compensationAmount" placeholder="مبلغ التعويض" />
              <input type="number" [(ngModel)]="injury.paidAmount" name="paidAmount" placeholder="المدفوع" />
              <label class="check"><input type="checkbox" [(ngModel)]="injury.permanentDisability" name="permanentDisability" /> عجز دائم</label>
              <label class="check"><input type="checkbox" [(ngModel)]="injury.isFatal" name="isFatal" /> وفاة</label>
              <input [(ngModel)]="injury.beneficiaries" name="beneficiaries" placeholder="الورثة / المستفيدون" />
              <button type="button" class="btn primary" (click)="addInjury()" [disabled]="busy()">إضافة إصابة</button>
            </div>
            <div class="table-wrap">
              <table>
                <thead>
                  <tr><th>المصاب</th><th>الإصابة</th><th>العلاج</th><th>عجز %</th><th>تعويض</th><th>متبقي</th><th>وفاة</th></tr>
                </thead>
                <tbody>
                  @for (i of a.injuries || []; track i.id) {
                    <tr>
                      <td>{{ i.injuredName }}</td>
                      <td>{{ i.injuryType }}</td>
                      <td>{{ i.treatmentCost }}</td>
                      <td>{{ i.disabilityPercent }}</td>
                      <td>{{ i.compensationAmount }}</td>
                      <td>{{ i.remainingAmount }}</td>
                      <td>{{ i.isFatal ? 'نعم' : 'لا' }}</td>
                    </tr>
                  } @empty {
                    <tr><td colspan="7">لا يوجد إصابات</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </section>

          <section class="card wide">
            <h3>إنشاء مطالبة من الحادث</h3>
            <div class="form-grid">
              <select [(ngModel)]="claim.claimantType" name="claimantType">
                <option value="Insured">المؤمن</option>
                <option value="ThirdParty">طرف ثالث</option>
              </select>
              <input type="number" [(ngModel)]="claim.claimAmount" name="claimAmount" placeholder="مبلغ المطالبة" />
              <input [(ngModel)]="claim.notes" name="notes" placeholder="ملاحظات" />
              <button type="button" class="btn primary" (click)="createClaim()" [disabled]="busy()">إنشاء مطالبة</button>
            </div>
          </section>

          <section class="card wide">
            <h3>المستندات</h3>
            <div class="upload">
              <select [(ngModel)]="docType" name="docType">
                <option value="AccidentReport">تقرير الحادث</option>
                <option value="VehiclePhoto">صور المركبة</option>
                <option value="DamageAssessment">تقييم أضرار</option>
                <option value="MedicalReport">تقرير طبي</option>
                <option value="MedicalBill">فاتورة طبية</option>
                <option value="Settlement">مخالصة</option>
                <option value="Other">أخرى</option>
              </select>
              <input type="file" (change)="onFile($event)" />
              <button type="button" class="btn primary" (click)="upload()" [disabled]="!selectedFile || busy()">رفع</button>
            </div>
            <div class="table-wrap">
              <table>
                <thead><tr><th>النوع</th><th>الملف</th><th>بواسطة</th><th>التاريخ</th><th></th></tr></thead>
                <tbody>
                  @for (d of a.documents || []; track d.id) {
                    <tr>
                      <td>{{ d.documentType }}</td>
                      <td>{{ d.fileName }}</td>
                      <td>{{ d.uploadedBy }}</td>
                      <td>{{ d.uploadedAt | date:'yyyy-MM-dd HH:mm' }}</td>
                      <td><button type="button" class="link" (click)="download(d.id, d.fileName)">تحميل</button></td>
                    </tr>
                  } @empty {
                    <tr><td colspan="5">لا يوجد مستندات</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { display: grid; gap: 1rem; }
    .back { color: #0b7a5a; text-decoration: none; width: fit-content; }
    .head, .head-actions { display: flex; justify-content: space-between; gap: .75rem; align-items: center; flex-wrap: wrap; }
    h2, h3 { margin: 0; } p { margin: .3rem 0 0; color: #64748b; }
    .btn { border: 1px solid #cbd5e1; background: white; border-radius: 10px; padding: .6rem .9rem; cursor: pointer; text-decoration: none; color: inherit; width: fit-content; }
    .btn.primary { background: #0b7a5a; color: white; border-color: #0b7a5a; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1rem; display: grid; gap: .55rem; align-content: start; }
    .card.wide { grid-column: 1 / -1; }
    a { color: #0b7a5a; text-decoration: none; }
    .box { border-radius: 10px; padding: .75rem; }
    .box.ok, .ok { color: #065f46; } .box.no, .no { color: #991b1b; }
    .box.ok { background: #ecfdf5; } .box.no { background: #fef2f2; }
    .form-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: .55rem; align-items: center; }
    input, select { border: 1px solid #cbd5e1; border-radius: 8px; padding: .55rem .7rem; font: inherit; }
    .check { display: flex; align-items: center; gap: .4rem; color: #0f172a; }
    .table-wrap { overflow: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: .65rem .5rem; border-bottom: 1px solid #e2e8f0; text-align: right; white-space: nowrap; }
    .summary { color: #0f172a !important; }
    .upload { display: flex; gap: .55rem; flex-wrap: wrap; align-items: center; }
    .link { color: #0b7a5a; background: none; border: 0; cursor: pointer; font: inherit; padding: 0; }
    .error { color: #b91c1c; } .ok { color: #065f46; }
  `]
})
export class AccidentDetailComponent implements OnInit {
  accident = signal<Accident | null>(null);
  summary = signal<DamageSummary | null>(null);
  latestCheck = signal<CoverageResult | null>(null);
  error = signal('');
  ok = signal('');
  busy = signal(false);
  docType = 'VehiclePhoto';
  selectedFile: File | null = null;
  private id = 0;

  damage: any = {
    partName: '', partNumber: '', damageType: 'خدش/كسر', action: 'Replace',
    partPrice: 0, laborCost: 0, paintCost: 0, discount: 0, partType: 'Body'
  };
  payment: any = {
    paymentType: 'Krooka', amount: 0, paidBy: '', paidTo: '',
    paymentDate: new Date().toISOString().slice(0, 10), paymentMethod: 'نقدي',
    receiptNumber: '', status: 'Paid', notes: ''
  };
  injury: any = {
    injuredName: '', nationalId: '', relationToAccident: 'راكب', injuryType: '',
    hospital: '', treatmentCost: 0, billsPaidBy: '', disabilityPercent: 0, downtimeDays: 0,
    compensationAmount: 0, paidAmount: 0, permanentDisability: false, isFatal: false,
    beneficiaries: '', additionalExpenses: 0
  };
  claim: any = { claimantType: 'Insured', claimAmount: 0, notes: '', status: 'Draft' };

  constructor(private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.api.getAccident(this.id).subscribe({
      next: (a) => {
        this.accident.set(a);
        if ((a.damageItems?.length || 0) > 0 && this.claim.claimAmount === 0) {
          // leave claim amount user-controlled
        }
      },
      error: () => this.error.set('تعذر تحميل الحادث')
    });
    this.api.getDamageSummary(this.id).subscribe({
      next: (s) => {
        this.summary.set(s);
        if (!this.claim.claimAmount) this.claim.claimAmount = s.total;
      },
      error: () => {}
    });
  }

  recheck(): void {
    this.busy.set(true);
    this.api.recheckAccidentCoverage(this.id).subscribe({
      next: (c) => { this.latestCheck.set(c); this.busy.set(false); this.load(); },
      error: () => { this.busy.set(false); this.error.set('تعذر إعادة الفحص'); }
    });
  }

  addDamage(): void {
    if (!this.damage.partName) { this.error.set('أدخل اسم القطعة'); return; }
    this.busy.set(true);
    this.api.addDamage(this.id, this.damage).subscribe({
      next: () => { this.busy.set(false); this.ok.set('تمت إضافة الضرر'); this.load(); },
      error: () => { this.busy.set(false); this.error.set('تعذر إضافة الضرر'); }
    });
  }

  addPayment(): void {
    this.busy.set(true);
    const body = { ...this.payment, paymentDate: new Date(this.payment.paymentDate).toISOString() };
    this.api.addPayment(this.id, body).subscribe({
      next: () => { this.busy.set(false); this.ok.set('تم تسجيل الدفعة'); this.load(); },
      error: () => { this.busy.set(false); this.error.set('تعذر تسجيل الدفعة'); }
    });
  }

  addInjury(): void {
    if (!this.injury.injuredName) { this.error.set('أدخل اسم المصاب'); return; }
    this.busy.set(true);
    this.api.addInjury(this.id, this.injury).subscribe({
      next: () => { this.busy.set(false); this.ok.set('تمت إضافة الإصابة'); this.load(); },
      error: () => { this.busy.set(false); this.error.set('تعذر إضافة الإصابة'); }
    });
  }

  createClaim(): void {
    this.busy.set(true);
    this.api.createClaim({ ...this.claim, accidentId: this.id }).subscribe({
      next: (c) => {
        this.busy.set(false);
        this.ok.set(`تم إنشاء المطالبة ${c.claimNumber}`);
      },
      error: () => { this.busy.set(false); this.error.set('تعذر إنشاء المطالبة'); }
    });
  }

  onFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0] || null;
  }

  upload(): void {
    if (!this.selectedFile) return;
    this.busy.set(true);
    this.api.uploadAccidentDocument(this.id, this.selectedFile, this.docType).subscribe({
      next: () => { this.busy.set(false); this.selectedFile = null; this.load(); },
      error: () => { this.busy.set(false); this.error.set('تعذر رفع المستند'); }
    });
  }

  download(id: number, fileName: string): void {
    this.api.downloadDocument(id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = fileName; a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.error.set('تعذر تحميل المستند')
    });
  }

  typeLabel(t: any): string {
    const map: Record<string, string> = {
      KnownThirdParty: 'طرف آخر معروف', UnknownHitAndRun: 'ضد مجهول', SingleVehicle: 'مركبة واحدة',
      MultipleVehicles: 'عدة مركبات', Other: 'أخرى', '1': 'طرف آخر معروف', '2': 'ضد مجهول', '3': 'مركبة واحدة', '4': 'عدة مركبات', '5': 'أخرى'
    };
    return map[String(t)] || String(t);
  }

  liabilityLabel(t: any): string {
    const map: Record<string, string> = {
      AtFault: 'متسبب', NotAtFault: 'متضرر', Unknown: 'غير معروف', Shared: 'مشترك',
      '1': 'متسبب', '2': 'متضرر', '3': 'غير معروف', '4': 'مشترك'
    };
    return map[String(t)] || String(t);
  }

  paymentLabel(t: any): string {
    const map: Record<string, string> = {
      Krooka: 'كروكة', AccidentFee: 'بدل حادث', RepairPayment: 'إصلاح', SettlementPayment: 'مخالصة',
      MedicalPayment: 'علاج', Other: 'أخرى', '1': 'كروكة', '2': 'بدل حادث', '3': 'إصلاح', '4': 'مخالصة', '5': 'علاج', '6': 'أخرى'
    };
    return map[String(t)] || String(t);
  }
}
