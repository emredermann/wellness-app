import { Routes } from '@angular/router';

export default [
  { path: '', loadComponent: () => import('./pages/session-list/session-list.page').then((m) => m.SessionListPage) },
] satisfies Routes;
