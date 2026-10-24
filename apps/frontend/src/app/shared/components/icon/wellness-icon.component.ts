import { Component, input } from '@angular/core';

export type WellnessIconName =
  | 'lotus'
  | 'sun'
  | 'moon'
  | 'moon-new'
  | 'moon-waxing'
  | 'moon-full'
  | 'moon-waning'
  | 'yoga'
  | 'pilates'
  | 'running'
  | 'sailing'
  | 'hiking'
  | 'cycling'
  | 'swimming'
  | 'dance'
  | 'fitness'
  | 'meditation'
  | 'breath'
  | 'sleep'
  | 'bowl'
  | 'leaf'
  | 'fish'
  | 'sprout'
  | 'sparkle'
  | 'map-pin'
  | 'compass'
  | 'calendar'
  | 'clock'
  | 'users'
  | 'qr'
  | 'bag'
  | 'camera'
  | 'shield-check'
  | 'download'
  | 'trash'
  | 'play'
  | 'pause'
  | 'volume'
  | 'volume-off'
  | 'check'
  | 'plus'
  | 'close'
  | 'chevron-left'
  | 'chevron-right'
  | 'arrow-right'
  | 'droplet'
  | 'flame'
  | 'heart-pulse'
  | 'user';

/**
 * Sakin, organik, yuvarlatılmış uçlu (stroke-linecap="round") özel SVG wellness ikon seti.
 * Emoji yerine tüm ekranlarda tutarlı editorial görünüm sağlar.
 */
@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg
      [attr.class]="sizeClass()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      [attr.stroke-width]="strokeWidth()"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @switch (name()) {
        @case ('lotus') {
          <path d="M12 4c2.4 3.2 3.8 6.4 3.8 9.2a3.8 3.8 0 0 1-7.6 0C8.2 10.4 9.6 7.2 12 4Z" />
          <path d="M8.5 11.2C6 10.6 4 11.7 3 14c2.2 2.4 5.2 3.5 9 3.5s6.8-1.1 9-3.5c-1-2.3-3-3.4-5.5-2.8" />
          <path d="M6 19.5c3.6 1 8.4 1 12 0" />
        }
        @case ('sun') {
          <circle cx="12" cy="12" r="4.2" />
          <path d="M12 2.5v2.2M12 19.3v2.2M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M2.5 12h2.2M19.3 12h2.2M4.9 19.1l1.6-1.6M17.5 6.5l1.6-1.6" />
        }
        @case ('moon') {
          <path d="M20.4 14.5A8.5 8.5 0 0 1 9.5 3.6a8.5 8.5 0 1 0 10.9 10.9Z" />
        }
        @case ('moon-new') {
          <circle cx="12" cy="12" r="8" stroke-dasharray="2.5 2.5" />
          <circle cx="12" cy="12" r="4" fill="currentColor" fill-opacity="0.18" />
        }
        @case ('moon-waxing') {
          <circle cx="12" cy="12" r="8" />
          <path d="M12 4a8 8 0 0 1 0 16c2.5-2.2 4-5.1 4-8s-1.5-5.8-4-8Z" fill="currentColor" fill-opacity="0.24" />
        }
        @case ('moon-full') {
          <circle cx="12" cy="12" r="8" fill="currentColor" fill-opacity="0.22" />
          <circle cx="12" cy="12" r="4.5" />
        }
        @case ('moon-waning') {
          <circle cx="12" cy="12" r="8" />
          <path d="M12 4a8 8 0 0 0 0 16c-2.5-2.2-4-5.1-4-8s1.5-5.8 4-8Z" fill="currentColor" fill-opacity="0.24" />
        }
        @case ('yoga') {
          <circle cx="12" cy="5.5" r="2" />
          <path d="M12 9v4.5M7 18.5c1.6-1.8 3.2-2.5 5-2.5s3.4.7 5 2.5" />
          <path d="M6.5 13c2-1.5 3.8-2.2 5.5-2.2s3.5.7 5.5 2.2" />
          <path d="M5.5 20h13" />
        }
        @case ('pilates') {
          <circle cx="7" cy="7" r="2" />
          <path d="M5.5 19.5 11 13l3.5 2 4.5-6.5" />
          <path d="M9 11.5 14.5 9" />
          <path d="M4 19.5h16" />
        }
        @case ('running') {
          <circle cx="14.5" cy="5" r="2" />
          <path d="M8 10.5 11.5 8l2.5 2.5 3.5-1" />
          <path d="m10 14 2.5-3.5L15 13l-1.5 5.5" />
          <path d="M6 18.5 10 14l2.5 1.5" />
        }
        @case ('sailing') {
          <path d="M12 3v14M12 4l7 11h-7" />
          <path d="M12 6.5 6.5 15H12" />
          <path d="M4 18h16l-2 3H6l-2-3Z" />
        }
        @case ('hiking') {
          <path d="m4 19 5.5-10 4.5 7 3-4.5L20 19H4Z" />
          <circle cx="16.5" cy="6.5" r="2" />
        }
        @case ('cycling') {
          <circle cx="6.5" cy="16.5" r="3.2" />
          <circle cx="17.5" cy="16.5" r="3.2" />
          <path d="m6.5 16.5 4-6.5h4l-2.5 4.5h5.5" />
          <circle cx="13" cy="6.5" r="1.6" />
        }
        @case ('swimming') {
          <circle cx="15.5" cy="7" r="2" />
          <path d="M6 12.5 11 9l3.5 2.5" />
          <path d="M3.5 16.5c1.8 1.2 3.6 1.2 5.4 0 1.8-1.2 3.6-1.2 5.4 0 1.8 1.2 3.6 1.2 5.4 0" />
          <path d="M3.5 20c1.8 1.2 3.6 1.2 5.4 0 1.8-1.2 3.6-1.2 5.4 0 1.8 1.2 3.6 1.2 5.4 0" />
        }
        @case ('dance') {
          <circle cx="12" cy="5" r="2" />
          <path d="M8 9c2.5 1.5 5.5 1.5 8 0" />
          <path d="m12 7-1.5 6.5L7.5 19M12 13.5l4 5.5" />
        }
        @case ('fitness') {
          <path d="M6.5 9v6M4 10.5v3M17.5 9v6M20 10.5v3M6.5 12h11" />
        }
        @case ('meditation') {
          <path d="M12 3.5c2 2.8 3.2 5.4 3.2 7.8a3.2 3.2 0 1 1-6.4 0c0-2.4 1.2-5 3.2-7.8Z" />
          <path d="M5 19c2-2 4.3-3 7-3s5 1 7 3" />
          <circle cx="12" cy="11.2" r="1" fill="currentColor" />
        }
        @case ('breath') {
          <path d="M3.5 9.5h11a2.8 2.8 0 1 0-2.8-2.8" />
          <path d="M3.5 13.5h14.5a2.8 2.8 0 1 1-2.8 2.8" />
          <path d="M3.5 17.5h7.5a2.4 2.4 0 1 1-2.4 2.4" />
        }
        @case ('sleep') {
          <path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5Z" />
          <path d="M15.5 4.5h3.5l-3.5 4h3.5" />
        }
        @case ('bowl') {
          <path d="M4 11.5h16a8 8 0 0 1-16 0Z" />
          <path d="M7.5 19.5h9" />
          <path d="M9.5 5c0 1.4 1.3 2 1.3 3.4M14 5c0 1.4 1.3 2 1.3 3.4" />
        }
        @case ('leaf') {
          <path d="M6 18.5C6 11 11.5 5.5 19.5 5c-.5 8-6 13.5-13.5 13.5Z" />
          <path d="M6 18.5 13.5 11" />
        }
        @case ('fish') {
          <path d="M3.5 12c3.2-4.2 7.5-5.5 13-3.5 1.8-1.5 3.2-2.2 4-2.2-.5 2.2-.5 4.2 0 6.4-.8 0-2.2-.7-4-2.2-5.5 2-9.8.7-13-3.5Z" />
          <circle cx="7.5" cy="11.5" r="0.8" fill="currentColor" />
        }
        @case ('sprout') {
          <path d="M12 20v-9" />
          <path d="M12 13c-4 0-6.5-2.5-6.5-6.5 4 0 6.5 2.5 6.5 6.5Z" />
          <path d="M12 11c3.8 0 6-2.2 6-6-3.8 0-6 2.2-6 6Z" />
          <path d="M8.5 20h7" />
        }
        @case ('sparkle') {
          <path d="m12 3 1.9 5.3L19.2 10l-5.3 1.9L12 17.2l-1.9-5.3L4.8 10l5.3-1.7L12 3Z" />
          <path d="m18.5 16.5.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8.8-2.2Z" />
        }
        @case ('map-pin') {
          <path d="M12 21s-6.5-5.4-6.5-10.2a6.5 6.5 0 1 1 13 0C18.5 15.6 12 21 12 21Z" />
          <circle cx="12" cy="10.8" r="2.4" />
        }
        @case ('compass') {
          <circle cx="12" cy="12" r="8.5" />
          <polygon points="14.8,9.2 13,13 9.2,14.8 11,11" />
        }
        @case ('calendar') {
          <rect x="3.5" y="5" width="17" height="15.5" rx="3" />
          <path d="M8 3.2v3.2M16 3.2v3.2M3.5 9.5h17" />
          <circle cx="8.5" cy="13.5" r="1" fill="currentColor" />
          <circle cx="12" cy="13.5" r="1" fill="currentColor" />
          <circle cx="15.5" cy="13.5" r="1" fill="currentColor" />
        }
        @case ('clock') {
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5v4.8l3.2 2" />
        }
        @case ('users') {
          <circle cx="9.5" cy="8.5" r="3" />
          <path d="M4 19a5.5 5.5 0 0 1 11 0" />
          <circle cx="16.5" cy="9.5" r="2.3" />
          <path d="M15.5 19a4.5 4.5 0 0 1 5 0" />
        }
        @case ('qr') {
          <rect x="3.5" y="3.5" width="6.5" height="6.5" rx="1.2" />
          <rect x="14" y="3.5" width="6.5" height="6.5" rx="1.2" />
          <rect x="3.5" y="14" width="6.5" height="6.5" rx="1.2" />
          <path d="M14 14h3v3h-3zM18 18h2.5v2.5H18zM14 19.5h2M19.5 14v2" />
        }
        @case ('bag') {
          <path d="M5.5 8.5h13l-1 11a2 2 0 0 1-2 1.8h-7a2 2 0 0 1-2-1.8l-1-11Z" />
          <path d="M9 8.5V6.8a3 3 0 0 1 6 0v1.7" />
        }
        @case ('camera') {
          <path d="M4 8.5h3l1.6-2.2h6.8L17 8.5h3a1.8 1.8 0 0 1 1.8 1.8v8.2A1.8 1.8 0 0 1 20 20.3H4a1.8 1.8 0 0 1-1.8-1.8v-8.2A1.8 1.8 0 0 1 4 8.5Z" />
          <circle cx="12" cy="14" r="3.3" />
        }
        @case ('shield-check') {
          <path d="M12 3.2 5 6.2v5.4c0 4.6 3 7.9 7 9.2 4-1.3 7-4.6 7-9.2V6.2l-7-3Z" />
          <path d="m9.2 12.2 2 2 3.8-4" />
        }
        @case ('download') {
          <path d="M12 4v11m0 0-4-4m4 4 4-4" />
          <path d="M4.5 18.5h15" />
        }
        @case ('trash') {
          <path d="M4.5 7h15M9.5 7V5.2a1.2 1.2 0 0 1 1.2-1.2h2.6a1.2 1.2 0 0 1 1.2 1.2V7m-8 0 .9 12a1.8 1.8 0 0 0 1.8 1.7h5.6a1.8 1.8 0 0 0 1.8-1.7l.9-12" />
        }
        @case ('play') {
          <polygon points="7.5,5.5 18.5,12 7.5,18.5" fill="currentColor" stroke="none" />
        }
        @case ('pause') {
          <rect x="7" y="5.5" width="3.5" height="13" rx="1" fill="currentColor" stroke="none" />
          <rect x="13.5" y="5.5" width="3.5" height="13" rx="1" fill="currentColor" stroke="none" />
        }
        @case ('volume') {
          <path d="M11 6 6.8 9.5H4v5h2.8L11 18V6Z" />
          <path d="M15 9.2a4.2 4.2 0 0 1 0 5.6M17.8 6.8a7.5 7.5 0 0 1 0 10.4" />
        }
        @case ('volume-off') {
          <path d="M11 6 6.8 9.5H4v5h2.8L11 18V6Z" />
          <path d="m15.5 9.5 4.5 4.5m0-4.5-4.5 4.5" />
        }
        @case ('check') {
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        }
        @case ('plus') {
          <path d="M12 5v14M5 12h14" />
        }
        @case ('close') {
          <path d="m6.5 6.5 11 11m0-11-11 11" />
        }
        @case ('chevron-left') {
          <path d="m14.5 6-6 6 6 6" />
        }
        @case ('chevron-right') {
          <path d="m9.5 6 6 6-6 6" />
        }
        @case ('arrow-right') {
          <path d="M5 12h14m0 0-5-5m5 5-5 5" />
        }
        @case ('droplet') {
          <path d="M12 3.8c3.6 4.5 5.8 7.7 5.8 10.7a5.8 5.8 0 0 1-11.6 0c0-3 2.2-6.2 5.8-10.7Z" />
        }
        @case ('flame') {
          <path d="M12.5 3.5c1.5 3.5 4.8 5.4 4.8 9.4a5.3 5.3 0 0 1-10.6 0c0-2.6 1.5-4.8 3.3-6.6.3 2 1.5 3 2.5 3-.4-2.1-.2-4.1 0-5.8Z" />
        }
        @case ('heart-pulse') {
          <path d="M12 20.2s-7.5-4.6-7.5-10A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 7.5 3.2c0 5.4-7.5 10-7.5 10Z" />
          <path d="M7.5 12.2h2.2l1.3-2.5 2 5 1.3-2.5h2.2" />
        }
        @case ('user') {
          <circle cx="12" cy="8.2" r="3.6" />
          <path d="M5 19.8a7 7 0 0 1 14 0" />
        }
      }
    </svg>
  `,
})
export class WellnessIconComponent {
  readonly name = input.required<WellnessIconName>();
  readonly sizeClass = input<string>('h-5 w-5');
  readonly strokeWidth = input<number>(1.85);
}
