import { Routes } from '@angular/router';

export default [
  { path: '', loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage) },
  { path: 'register', loadComponent: () => import('./pages/register/register.page').then((m) => m.RegisterPage) },
] satisfies Routes;
