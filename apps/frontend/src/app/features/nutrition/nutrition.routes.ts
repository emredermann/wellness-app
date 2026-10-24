import { Routes } from '@angular/router';

export default [
  { path: '', loadComponent: () => import('./pages/recipe-list/recipe-list.page').then((m) => m.RecipeListPage) },
] satisfies Routes;
