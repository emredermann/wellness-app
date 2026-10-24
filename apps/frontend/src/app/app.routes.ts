import { Routes } from '@angular/router';
import { authGuard, guestGuard } from './core/auth/auth.guard';
import { ShellComponent } from './layout/shell/shell.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'app/today' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/auth/pages/login/login.page').then((m) => m.LoginPage),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./features/auth/pages/register/register.page').then((m) => m.RegisterPage),
  },
  {
    path: 'app',
    component: ShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'today' },
      { path: 'today', loadChildren: () => import('./features/today/today.routes') },
      { path: 'map', loadChildren: () => import('./features/events/events.routes') },
      { path: 'recipes', loadChildren: () => import('./features/nutrition/nutrition.routes') },
      { path: 'profile', loadChildren: () => import('./features/profile/profile.routes') },
      { path: 'cycle', redirectTo: 'profile', pathMatch: 'full' },
      { path: 'sessions', loadChildren: () => import('./features/sessions/sessions.routes') },
    ],
  },
  { path: '**', redirectTo: 'app/today' },
];
