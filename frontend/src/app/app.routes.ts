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
      { path: 'vehicles/:id', component: VehicleProfileComponent }
    ]
  },
  { path: '**', redirectTo: '' }
];
