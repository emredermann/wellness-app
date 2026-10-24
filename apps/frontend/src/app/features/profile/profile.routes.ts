import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () =>
      import('./pages/profile-cycle/profile-cycle.component').then((m) => m.ProfileCycleComponent),
  },
] satisfies Routes;
