import { Component, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { Accident, CoverageResult } from '../../core/models/insurance.models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-accident-detail',
  standalone: true,
  imports: [RouterLink, FormsModule, DatePipe],
  template: `
    <div class="page">
      <a routerLink="/accidents" class="back">← رجوع</a>
      @if (error()) { <p class="error">{{ error() }}</p> }

      @if (accident(); as a) {
        <div class="head">
          <div>
            <h2>{{ a.accidentNumber }}</h2>
            <p>{{ a.location }} · {{ a.accidentDateTime | date:'yyyy-MM-dd HH:mm' }}</p>
          </div>
          <button type="button" class="btn" (click)="recheck()" [disabled]="busy()">إعادة فحص التغطية</button>
        </div>

        <div class="cards">
          <section class="card">
            <h3>بيانات الحادث</h3>
            <p>الوثيقة:
              <a [routerLink]="['/policies', a.policyId]">{{ a.policy?.policyNumber || ('#' + a.policyId) }}</a>
            </p>
            <p>المركبة:
              <a [routerLink]="['/vehicles', a.vehicleId]">{{ a.vehicle?.plateNumber || ('#' + a.vehicleId) }}</a>
            </p>
            <p>السائق: {{ a.driverName }} ({{ a.driverNationalId || '-' }})</p>
            <p>النوع: {{ typeLabel(a.accidentType) }}</p>
            <p>المسؤولية: {{ liabilityLabel(a.liability) }} {{ a.liabilityPercent != null ? '(' + a.liabilityPercent + '%)' : '' }}</p>
            <p>الحالة: {{ statusLabel(a.status) }}</p>
            <p>الوصف: {{ a.description }}</p>
          </section>

          <section class="card">
            <h3>الطرف الآخر</h3>
            <p>الاسم: {{ a.otherPartyName || '-' }}</p>
            <p>شركة التأمين: {{ a.otherPartyInsurer || '-' }}</p>
            <p>رقم الوثيقة: {{ a.otherPartyPolicyNumber || '-' }}</p>
            <p>اللوحة: {{ a.otherPartyPlateNumber || '-' }}</p>
          </section>

          <section class="card">
            <h3>نتيجة التغطية</h3>
            <div class="coverage" [class.ok]="a.isCovered === true" [class.no]="a.isCovered === false">
              <strong>{{ a.isCovered === true ? 'Covered' : a.isCovered === false ? 'Not Covered' : 'غير محدد' }}</strong>
              <p>{{ a.coverageReason || '-' }}</p>
            </div>
            @if (latestCheck(); as c) {
              <div class="coverage" [class.ok]="c.isCovered" [class.no]="!c.isCovered">
                <strong>آخر فحص: {{ c.isCovered ? 'Covered' : 'Not Covered' }}</strong>
                <p>{{ c.reason }}</p>
              </div>
            }
          </section>

          <section class="card wide">
            <h3>المستندات الإلكترونية</h3>
            <div class="upload">
              <select [(ngModel)]="docType" name="docType">
                <option value="AccidentReport">تقرير الحادث</option>
                <option value="DriverLicense">رخصة السائق</option>
                <option value="VehicleLicense">رخصة المركبة</option>
                <option value="InsurancePolicy">وثيقة التأمين</option>
                <option value="VehiclePhoto">صور المركبة</option>
                <option value="DamageAssessment">تقييم أضرار</option>
                <option value="Other">أخرى</option>
              </select>
              <input type="file" (change)="onFile($event)" />
              <button type="button" class="btn primary" (click)="upload()" [disabled]="!selectedFile || busy()">رفع</button>
            </div>

            <div class="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>النوع</th>
                    <th>الملف</th>
                    <th>بواسطة</th>
                    <th>التاريخ</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  @for (d of a.documents || []; track d.id) {
                    <tr>
                      <td>{{ docLabel(d.documentType) }}</td>
                      <td>{{ d.fileName }}</td>
                      <td>{{ d.uploadedBy }}</td>
                      <td>{{ d.uploadedAt | date:'yyyy-MM-dd HH:mm' }}</td>
                      <td>
                        <button type="button" class="link" (click)="download(d.id, d.fileName)">تحميل</button>
                      </td>
                    </tr>
                  } @empty {
                    <tr><td colspan="5">لا يوجد مستندات بعد</td></tr>
                  }
                </tbody>
              </table>
            </div>
          </section>

          <section class="card wide">
            <h3>سجل فحص التغطية</h3>
            @for (log of a.coverageChecks || []; track log.id) {
              <div class="row">
                <div>
                  <strong [class.ok]="log.isCovered" [class.no]="!log.isCovered">
                    {{ log.isCovered ? 'Covered' : 'Not Covered' }}
                  </strong>
                  — {{ log.reason }}
                </div>
                <small>{{ log.checkedBy }} · {{ log.checkedAt | date:'yyyy-MM-dd HH:mm' }}</small>
              </div>
            } @empty {
              <p class="muted">لا يوجد سجل بعد</p>
            }
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { display: grid; gap: 1rem; }
    .back { color: #0b7a5a; text-decoration: none; width: fit-content; }
    .head { display: flex; justify-content: space-between; gap: 1rem; align-items: center; flex-wrap: wrap; }
    h2, h3 { margin: 0; } p { margin: .35rem 0 0; color: #64748b; }
    .btn { border: 1px solid #cbd5e1; background: white; border-radius: 10px; padding: .65rem 1rem; cursor: pointer; width: fit-content; }
    .btn.primary { background: #0b7a5a; color: white; border-color: #0b7a5a; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem; }
    .card { background: white; border: 1px solid #e2e8f0; border-radius: 14px; padding: 1rem; display: grid; gap: .5rem; align-content: start; }
    .card.wide { grid-column: 1 / -1; }
    a { color: #0b7a5a; text-decoration: none; }
    .link { color: #0b7a5a; background: none; border: 0; cursor: pointer; font: inherit; padding: 0; }
    .coverage { border-radius: 10px; padding: .8rem; }
    .coverage.ok, .ok { color: #065f46; }
    .coverage.no, .no { color: #991b1b; }
    .coverage.ok { background: #ecfdf5; }
    .coverage.no { background: #fef2f2; }
    .upload { display: flex; gap: .6rem; flex-wrap: wrap; align-items: center; margin-bottom: .6rem; }
    select, input[type="file"] { border: 1px solid #cbd5e1; border-radius: 10px; padding: .55rem .7rem; font: inherit; }
    .table-wrap { overflow: auto; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: .7rem .6rem; border-bottom: 1px solid #e2e8f0; text-align: right; }
    .row { display: flex; justify-content: space-between; gap: 1rem; border-top: 1px solid #f1f5f9; padding-top: .5rem; flex-wrap: wrap; }
    .muted { color: #94a3b8; margin: 0; }
    .error { color: #b91c1c; }
  `]
})
export class AccidentDetailComponent implements OnInit {
  accident = signal<Accident | null>(null);
  latestCheck = signal<CoverageResult | null>(null);
  error = signal('');
  busy = signal(false);
  docType = 'VehiclePhoto';
  selectedFile: File | null = null;
  private id = 0;

  constructor(private api: ApiService, private route: ActivatedRoute, public auth: AuthService) {}

  ngOnInit(): void {
    this.id = Number(this.route.snapshot.paramMap.get('id'));
    this.load();
  }

  load(): void {
    this.api.getAccident(this.id).subscribe({
      next: (a) => this.accident.set(a),
      error: () => this.error.set('تعذر تحميل الحادث')
    });
  }

  recheck(): void {
    this.busy.set(true);
    this.api.recheckAccidentCoverage(this.id).subscribe({
      next: (c) => {
        this.latestCheck.set(c);
        this.busy.set(false);
        this.load();
      },
      error: () => {
        this.busy.set(false);
        this.error.set('تعذر إعادة فحص التغطية');
      }
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
      next: () => {
        this.busy.set(false);
        this.selectedFile = null;
        this.load();
      },
      error: () => {
        this.busy.set(false);
        this.error.set('تعذر رفع المستند');
      }
    });
  }

  downloadUrl(id: number): string {
    return this.api.documentDownloadUrl(id);
  }

  download(id: number, fileName: string): void {
    this.api.downloadDocument(id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      },
      error: () => this.error.set('تعذر تحميل المستند')
    });
  }

  typeLabel(t: any): string {
    const map: Record<string, string> = {
      KnownThirdParty: 'طرف آخر معروف', UnknownHitAndRun: 'ضد مجهول',
      SingleVehicle: 'مركبة واحدة', MultipleVehicles: 'عدة مركبات', Other: 'أخرى',
      '1': 'طرف آخر معروف', '2': 'ضد مجهول', '3': 'مركبة واحدة', '4': 'عدة مركبات', '5': 'أخرى'
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

  statusLabel(s: any): string {
    const map: Record<string, string> = {
      Open: 'Open', UnderReview: 'UnderReview', Closed: 'Closed', Rejected: 'Rejected',
      '1': 'Open', '2': 'UnderReview', '3': 'Closed', '4': 'Rejected'
    };
    return map[String(s)] || String(s);
  }

  docLabel(t: any): string {
    const map: Record<string, string> = {
      AccidentReport: 'تقرير الحادث', DriverLicense: 'رخصة السائق', VehicleLicense: 'رخصة المركبة',
      InsurancePolicy: 'وثيقة التأمين', VehiclePhoto: 'صور المركبة', DamageAssessment: 'تقييم أضرار',
      Other: 'أخرى', '1': 'تقرير الحادث', '2': 'رخصة السائق', '3': 'رخصة المركبة',
      '4': 'وثيقة التأمين', '5': 'صور المركبة', '6': 'تقييم أضرار', '12': 'أخرى'
    };
    return map[String(t)] || String(t);
  }
}
