import { Routes } from '@angular/router';

export default [
  { path: '', loadComponent: () => import('./pages/cycle-tracker/cycle-tracker.page').then((m) => m.CycleTrackerPage) },
] satisfies Routes;
