import { Routes } from '@angular/router';

export default [
  {
    path: '',
    loadComponent: () =>
      import('./pages/event-map/event-map.component').then((m) => m.EventMapComponent),
  },
  {
    path: 'organizer',
    loadComponent: () =>
      import('./pages/organizer-panel/business-organizer-panel.component').then(
        (m) => m.BusinessOrganizerPanelComponent,
      ),
  },
] satisfies Routes;
