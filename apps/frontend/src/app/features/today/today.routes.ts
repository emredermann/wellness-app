import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () =>
      import('./pages/today-dashboard/today-dashboard.component').then((m) => m.TodayDashboardComponent),
  },
] satisfies Routes;
