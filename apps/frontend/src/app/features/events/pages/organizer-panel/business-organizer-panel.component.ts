import { DatePipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import * as L from 'leaflet';
import { EventCategory } from '../../../../core/models/domain.models';
import { EventService } from '../../../../core/services/event.service';
import { WellnessIconComponent } from '../../../../shared/components/icon/wellness-icon.component';

@Component({
  selector: 'app-business-organizer-panel',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, DatePipe, WellnessIconComponent],
  template: `
    <div class="space-y-6">
      <!-- Üst Başlık -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <span class="inline-flex items-center gap-1.5 rounded-full bg-lavender-100 px-3 py-1 text-xs font-semibold text-lavender-700">
            <app-icon name="sparkle" sizeClass="h-3.5 w-3.5" />
            <span>İşletme, Stüdyo & Spor Kulübü Paneli</span>
          </span>
          <h1 class="mt-2 text-3xl text-ink-900">Yeni Wellness Etkinliği Oluştur</h1>
          <p class="text-xs text-ink-500">
            Harita üzerinden buluşma noktasını seç, kontenjan ve bilet tipini belirleyerek yayınla.
          </p>
        </div>

        <a
          routerLink="/app/map"
          class="inline-flex items-center gap-1.5 rounded-2xl border border-cream-300 bg-cream-50 px-4 py-2.5 text-xs font-semibold text-ink-700 hover:border-sage-400"
        >
          <app-icon name="chevron-left" sizeClass="h-4 w-4" />
          <span>Etkinlik Haritasına Dön</span>
        </a>
      </div>

      @if (createdBanner()) {
        <div class="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sage-300 bg-sage-50 px-4 py-3 text-xs font-semibold text-sage-800">
          <span class="inline-flex items-center gap-1.5">
            <app-icon name="check" sizeClass="h-4 w-4 text-sage-600" />
            <span>Etkinlik başarıyla yayınlandı ve haritaya pin olarak eklendi!</span>
          </span>
          <a routerLink="/app/map" class="underline">Haritada Görüntüle</a>
        </div>
      }

      <div class="grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <!-- Sol: Etkinlik Yönetim Formu -->
        <section class="wl-card">
          <h2 class="text-xl text-ink-900">Etkinlik Bilgileri</h2>

          <form [formGroup]="form" (ngSubmit)="onSubmit()" class="mt-4 space-y-4" novalidate>
            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label for="organizerName" class="wl-label">Kulüp / Stüdyo Adı</label>
                <input
                  id="organizerName"
                  type="text"
                  formControlName="organizerName"
                  placeholder="Moda Mindful Studio"
                  class="wl-input"
                />
              </div>

              <div>
                <label for="category" class="wl-label">Spor Branşı</label>
                <select id="category" formControlName="category" class="wl-input">
                  @for (cat of categories; track cat.value) {
                    <option [value]="cat.value">{{ cat.label }}</option>
                  }
                </select>
              </div>
            </div>

            <div>
              <label for="title" class="wl-label">Etkinlik Başlığı</label>
              <input
                id="title"
                type="text"
                formControlName="title"
                placeholder="Örn: Pazar Sabahı Sahil Yoga & Matcha Buluşması"
                class="wl-input"
              />
            </div>

            <div>
              <label for="description" class="wl-label">Açıklama & Gerekli Ekipmanlar</label>
              <textarea
                id="description"
                rows="3"
                formControlName="description"
                placeholder="Seans akışı, eğitmen bilgisi ve katılımcıların yanında getirmesi gerekenler..."
                class="wl-input"
              ></textarea>
            </div>

            <div class="grid gap-4 sm:grid-cols-2">
              <div>
                <label for="date" class="wl-label">Tarih & Saat</label>
                <input id="date" type="datetime-local" formControlName="date" class="wl-input" />
              </div>

              <div>
                <label for="capacity" class="wl-label">Kontenjan (Kişi)</label>
                <input
                  id="capacity"
                  type="number"
                  min="2"
                  max="500"
                  formControlName="capacity"
                  class="wl-input"
                />
              </div>
            </div>

            <div>
              <label for="address" class="wl-label">Açık Adres / Buluşma Noktası</label>
              <input
                id="address"
                type="text"
                formControlName="address"
                placeholder="Fenerbahçe Parkı Girişi, Kadıköy / İstanbul"
                class="wl-input"
              />
            </div>

            <!-- Ücretsiz / Ücretli Seçimi -->
            <div class="rounded-2xl border border-cream-200 bg-white p-4">
              <div class="flex items-center justify-between">
                <div>
                  <span class="block text-xs font-semibold text-ink-900">Ücretsiz Topluluk Etkinliği</span>
                  <span class="block text-[11px] text-ink-500">
                    İşaretli değilse katılım ücreti (₺) belirleyebilirsiniz
                  </span>
                </div>
                <input
                  type="checkbox"
                  formControlName="isFree"
                  class="h-4 w-4 rounded border-cream-400 text-sage-600 focus:ring-sage-300"
                />
              </div>

              @if (!form.controls.isFree.value) {
                <div class="mt-3">
                  <label for="price" class="wl-label">Katılım Ücreti (₺)</label>
                  <input
                    id="price"
                    type="number"
                    min="0"
                    formControlName="price"
                    placeholder="350"
                    class="wl-input"
                  />
                </div>
              }
            </div>

            <button type="submit" [disabled]="form.invalid" class="wl-btn-primary">
              <app-icon name="plus" sizeClass="h-4 w-4" />
              <span>Etkinliği Haritada Yayınla</span>
            </button>
          </form>
        </section>

        <!-- Sağ: Etkileşimli Harita Konum Seçici & Yayınlanan Etkinlikler -->
        <div class="space-y-6">
          <section class="wl-card space-y-3">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="text-xl text-ink-900">Haritadan Konum Seçici</h2>
                <p class="text-xs text-ink-500">
                  Haritada istediğin noktaya dokunarak etkinlik pinini yerleştir
                </p>
              </div>
              <span class="rounded-full bg-sage-100 px-2.5 py-1 font-mono text-[11px] font-semibold text-sage-800">
                {{ form.controls.latitude.value }}, {{ form.controls.longitude.value }}
              </span>
            </div>

            <!-- Hızlı Semt Seçim Butonları -->
            <div class="flex flex-wrap gap-1.5">
              @for (preset of locationPresets; track preset.label) {
                <button
                  type="button"
                  (click)="applyPreset(preset)"
                  class="inline-flex items-center gap-1 rounded-full border border-cream-300 bg-white px-2.5 py-1 text-[11px] font-medium text-ink-700 hover:border-sage-400"
                >
                  <app-icon name="map-pin" sizeClass="h-3 w-3 text-sage-600" />
                  <span>{{ preset.label }}</span>
                </button>
              }
            </div>

            <div
              #pickerMap
              class="h-64 w-full overflow-hidden rounded-2xl border border-cream-300"
            ></div>
          </section>

          <!-- Kulübün Yayınladığı Etkinlikler Listesi -->
          <section class="wl-card space-y-3">
            <h3 class="text-sm font-bold text-ink-900">
              Stüdyonun Yayınladığı Etkinlikler ({{ eventService.organizerEvents().length }})
            </h3>

            @if (eventService.organizerEvents().length === 0) {
              <p class="text-xs text-ink-500">
                Henüz bu oturumda yeni bir kulüp etkinliği eklenmedi. Soldaki formu kullanarak ilk
                etkinliğini haritaya ekleyebilirsin.
              </p>
            } @else {
              <div class="space-y-2.5">
                @for (item of eventService.organizerEvents(); track item.id) {
                  <div class="flex items-center justify-between gap-2 rounded-2xl border border-cream-200 bg-white p-3 text-xs">
                    <div>
                      <p class="font-bold text-ink-900">{{ item.title }}</p>
                      <p class="text-[11px] text-ink-500">
                        {{ item.date | date: 'dd MMM HH:mm' }} · {{ item.capacity }} kişi ·
                        {{ item.isFree ? 'Ücretsiz' : item.price + ' ₺' }}
                      </p>
                    </div>
                    <button
                      type="button"
                      (click)="eventService.removeOrganizerEvent(item.id)"
                      class="inline-flex items-center gap-1 rounded-lg border border-terracotta-200 px-2.5 py-1 text-[11px] font-semibold text-terracotta-700 hover:bg-terracotta-50"
                    >
                      <app-icon name="trash" sizeClass="h-3.5 w-3.5" />
                      <span>Kaldır</span>
                    </button>
                  </div>
                }
              </div>
            }
          </section>
        </div>
      </div>
    </div>
  `,
})
export class BusinessOrganizerPanelComponent implements AfterViewInit, OnDestroy {
  @ViewChild('pickerMap', { static: true })
  private readonly pickerMapEl!: ElementRef<HTMLDivElement>;

  protected readonly eventService = inject(EventService);
  private readonly fb = inject(FormBuilder);

  protected readonly createdBanner = signal(false);

  private map?: L.Map;
  private pinMarker?: L.Marker;

  protected readonly categories: { value: EventCategory; label: string }[] = [
    { value: 'YOGA', label: 'Yoga' },
    { value: 'PILATES', label: 'Pilates' },
    { value: 'RUNNING', label: 'Koşu Kulübü' },
    { value: 'SAILING', label: 'Yelken' },
    { value: 'HIKING', label: 'Doğa Yürüyüşü' },
    { value: 'MEDITATION', label: 'Meditasyon & Nefes' },
    { value: 'CYCLING', label: 'Bisiklet' },
    { value: 'SWIMMING', label: 'Yüzme' },
    { value: 'DANCE', label: 'Dans' },
  ];

  protected readonly locationPresets = [
    { label: 'Caddebostan Sahil', lat: 40.9632, lng: 29.0635, address: 'Caddebostan Sahili, Kadıköy / İstanbul' },
    { label: 'Maçka Parkı', lat: 41.0445, lng: 28.9945, address: 'Maçka Demokrasi Parkı, Şişli / İstanbul' },
    { label: 'Bebek Sahili', lat: 41.0771, lng: 29.0436, address: 'Bebek Parkı, Beşiktaş / İstanbul' },
    { label: 'Moda İskelesi', lat: 40.9796, lng: 29.0255, address: 'Moda Sahili, Kadıköy / İstanbul' },
  ];

  protected readonly form = this.fb.nonNullable.group({
    organizerName: ['Moda Mindful Studio', [Validators.required]],
    category: ['YOGA' as EventCategory, [Validators.required]],
    title: ['', [Validators.required, Validators.minLength(4)]],
    description: [''],
    date: [new Date(Date.now() + 24 * 3_600_000).toISOString().slice(0, 16), [Validators.required]],
    capacity: [20, [Validators.required, Validators.min(2), Validators.max(500)]],
    address: ['Caddebostan Sahili, Kadıköy / İstanbul', [Validators.required]],
    latitude: [40.9632, [Validators.required]],
    longitude: [29.0635, [Validators.required]],
    isFree: [true],
    price: ['350'],
  });

  ngAfterViewInit(): void {
    const startLat = this.form.controls.latitude.value;
    const startLng = this.form.controls.longitude.value;

    this.map = L.map(this.pickerMapEl.nativeElement, {
      center: [startLat, startLng],
      zoom: 13,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(this.map);

    this.setPickerMarker(startLat, startLng);

    this.map.on('click', (e: L.LeafletMouseEvent) => {
      const lat = Number(e.latlng.lat.toFixed(5));
      const lng = Number(e.latlng.lng.toFixed(5));
      this.form.patchValue({ latitude: lat, longitude: lng });
      this.setPickerMarker(lat, lng);
    });

    setTimeout(() => this.map?.invalidateSize(), 150);
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  protected applyPreset(preset: { label: string; lat: number; lng: number; address: string }): void {
    this.form.patchValue({
      latitude: preset.lat,
      longitude: preset.lng,
      address: preset.address,
    });
    this.setPickerMarker(preset.lat, preset.lng);
    this.map?.flyTo([preset.lat, preset.lng], 14, { duration: 0.7 });
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const raw = this.form.getRawValue();
    this.eventService
      .createEvent({
        organizerName: raw.organizerName,
        category: raw.category,
        title: raw.title,
        description: raw.description || null,
        date: new Date(raw.date).toISOString(),
        capacity: Number(raw.capacity),
        address: raw.address,
        latitude: Number(raw.latitude),
        longitude: Number(raw.longitude),
        isFree: raw.isFree,
        price: raw.isFree ? null : String(raw.price),
      })
      .subscribe(() => {
        this.createdBanner.set(true);
        this.form.controls.title.reset('');
        this.form.controls.description.reset('');
      });
  }

  private setPickerMarker(lat: number, lng: number): void {
    if (!this.map) return;
    const icon = L.divIcon({
      className: 'wl-picker-pin',
      html: `<div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9999px;background:#74539e;color:#fff;border:3px solid #fdfbf8;box-shadow:0 6px 16px rgba(0,0,0,0.28);"><span style="width:10px;height:10px;border-radius:9999px;background:#fdfbf8;"></span></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    if (this.pinMarker) {
      this.pinMarker.setLatLng([lat, lng]);
    } else {
      this.pinMarker = L.marker([lat, lng], { icon }).addTo(this.map);
    }
  }
}
