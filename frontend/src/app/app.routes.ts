import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { ShellComponent } from './layout/shell.component';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { InsuredsListComponent } from './pages/insureds/insureds-list.component';
import { InsuredFormComponent } from './pages/insureds/insured-form.component';
import { InsuredProfileComponent } from './pages/insureds/insured-profile.component';
import { VehiclesListComponent } from './pages/vehicles/vehicles-list.component';
import { VehicleFormComponent } from './pages/vehicles/vehicle-form.component';
import { VehicleProfileComponent } from './pages/vehicles/vehicle-profile.component';
import { PoliciesListComponent } from './pages/policies/policies-list.component';
import { PolicyFormComponent } from './pages/policies/policy-form.component';
import { PolicyDetailComponent } from './pages/policies/policy-detail.component';
import { PricingRulesComponent } from './pages/pricing/pricing-rules.component';
import { AccidentsListComponent } from './pages/accidents/accidents-list.component';
import { AccidentFormComponent } from './pages/accidents/accident-form.component';
import { AccidentDetailComponent } from './pages/accidents/accident-detail.component';
import { DepreciationRulesComponent } from './pages/depreciation/depreciation-rules.component';
import { ClaimsListComponent } from './pages/claims/claims-list.component';
import { ClaimDetailComponent } from './pages/claims/claim-detail.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  {
    path: '',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: HomeComponent },
      { path: 'insureds', component: InsuredsListComponent },
      { path: 'insureds/new', component: InsuredFormComponent },
      { path: 'insureds/:id/edit', component: InsuredFormComponent },
      { path: 'insureds/:id', component: InsuredProfileComponent },
      { path: 'vehicles', component: VehiclesListComponent },
      { path: 'vehicles/new', component: VehicleFormComponent },
      { path: 'vehicles/:id/edit', component: VehicleFormComponent },
      { path: 'vehicles/:id', component: VehicleProfileComponent },
      { path: 'policies', component: PoliciesListComponent },
      { path: 'policies/new', component: PolicyFormComponent },
      { path: 'policies/:id/edit', component: PolicyFormComponent },
      { path: 'policies/:id', component: PolicyDetailComponent },
      { path: 'pricing', component: PricingRulesComponent },
      { path: 'depreciation', component: DepreciationRulesComponent },
      { path: 'accidents', component: AccidentsListComponent },
      { path: 'accidents/new', component: AccidentFormComponent },
      { path: 'accidents/:id', component: AccidentDetailComponent },
      { path: 'claims', component: ClaimsListComponent },
      { path: 'claims/:id', component: ClaimDetailComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
