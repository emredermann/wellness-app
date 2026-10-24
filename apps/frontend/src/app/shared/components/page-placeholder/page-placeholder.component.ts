import { Component, input } from '@angular/core';

/** Henüz geliştirilmemiş feature sayfaları için ortak yer tutucu. */
@Component({
  selector: 'app-page-placeholder',
  template: `
    <section class="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 class="text-2xl font-semibold text-slate-900">{{ title() }}</h1>
      <p class="mt-2 text-slate-500">{{ description() }}</p>
    </section>
  `,
})
export class PagePlaceholderComponent {
  readonly title = input.required<string>();
  readonly description = input('');
}
