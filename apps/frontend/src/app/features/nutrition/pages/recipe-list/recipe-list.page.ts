import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CyclePhase, DietType } from '../../../../core/models/domain.models';
import { ProfileService } from '../../../../core/services/profile.service';
import {
  PhotoAnalysisResponse,
  RecipeDetail,
  RecipeService,
} from '../../../../core/services/recipe.service';

type NutritionTab = 'recipes' | 'shopping' | 'vision';

@Component({
  selector: 'app-recipe-list',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Üst Başlık, Sekmeler & Kalori Gizleme Toggle -->
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-xs font-medium tracking-wide text-lavender-700 uppercase">
            Modül 3 · Döngü Fazı & Diyet Uyumlu Beslenme
          </p>
          <h1 class="text-2xl font-bold text-ink-900">Tarifler, Alışveriş Listesi & AI Tabak Analizi</h1>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <!-- Sekme Geçişleri -->
          <div class="inline-flex rounded-2xl border border-cream-300 bg-cream-50 p-1">
            <button
              type="button"
              (click)="activeTab.set('recipes')"
              class="rounded-xl px-3.5 py-2 text-xs font-semibold transition"
              [class.bg-sage-500]="activeTab() === 'recipes'"
              [class.text-white]="activeTab() === 'recipes'"
              [class.text-ink-700]="activeTab() !== 'recipes'"
            >
              🥗 Tarifler ({{ filteredRecipes().length }})
            </button>
            <button
              type="button"
              (click)="activeTab.set('shopping')"
              class="rounded-xl px-3.5 py-2 text-xs font-semibold transition"
              [class.bg-sage-500]="activeTab() === 'shopping'"
              [class.text-white]="activeTab() === 'shopping'"
              [class.text-ink-700]="activeTab() !== 'shopping'"
            >
              🛒 Alışveriş Listem ({{ recipeService.uncheckedShoppingCount() }})
            </button>
            <button
              type="button"
              (click)="activeTab.set('vision')"
              class="rounded-xl px-3.5 py-2 text-xs font-semibold transition"
              [class.bg-sage-500]="activeTab() === 'vision'"
              [class.text-white]="activeTab() === 'vision'"
              [class.text-ink-700]="activeTab() !== 'vision'"
            >
              📸 AI Tabak Analizi
            </button>
          </div>

          <button
            type="button"
            (click)="profileService.toggleCaloriesVisibility()"
            class="rounded-2xl border border-cream-300 bg-cream-50 px-3.5 py-2 text-xs font-semibold text-ink-700 hover:border-lavender-300"
          >
            {{ profileService.hideCalories() ? 'Kaloriler Gizli' : 'Kalorileri Gizle' }}
          </button>
        </div>
      </div>

      @if (toastMessage()) {
        <div class="rounded-2xl border border-sage-300 bg-sage-50 px-4 py-3 text-xs font-semibold text-sage-800">
          ✓ {{ toastMessage() }}
        </div>
      }

      <!-- SEKME 1: TARİFLER VE FİLTRELEME -->
      @if (activeTab() === 'recipes') {
        <!-- Filtre Çubuğu -->
        <section class="wl-card space-y-4">
          <div class="grid gap-3 md:grid-cols-3">
            <div>
              <label class="wl-label">Tarif veya Malzeme Ara</label>
              <input
                type="text"
                [(ngModel)]="searchText"
                placeholder="Mercimek, avokado, somon, tahin..."
                class="wl-input py-2.5 text-xs"
              />
            </div>

            <div>
              <label class="wl-label">Diyet Tipi</label>
              <select [(ngModel)]="selectedDiet" class="wl-input py-2.5 text-xs">
                <option [ngValue]="undefined">Tüm Diyet Tipleri</option>
                <option value="VEGAN">🌱 Vegan</option>
                <option value="VEGETARIAN">🥗 Vejetaryen</option>
                <option value="PESCATARIAN">🐟 Pesketaryen</option>
                <option value="REGULAR">🍲 Normal</option>
              </select>
            </div>

            <div>
              <label class="wl-label">Döngü Fazı Desteği</label>
              <select [(ngModel)]="selectedPhase" class="wl-input py-2.5 text-xs">
                <option [ngValue]="undefined">Tüm Fazlar</option>
                <option value="MENSTRUAL">Menstrüel Faz</option>
                <option value="FOLLICULAR">Foliküler Faz</option>
                <option value="OVULATORY">Ovulasyon Fazı</option>
                <option value="LUTEAL">Luteal Faz</option>
              </select>
            </div>
          </div>

          <div class="flex flex-wrap items-center justify-between gap-2 border-t border-cream-200 pt-3">
            <label class="inline-flex cursor-pointer items-center gap-2 text-xs font-medium text-ink-700">
              <input
                type="checkbox"
                [(ngModel)]="turkishOnly"
                class="h-4 w-4 rounded border-cream-400 text-sage-600 focus:ring-sage-300"
              />
              <span>Sadece Geleneksel Anadolu / Ege Mutfağı Tarifleri</span>
            </label>

            <button
              type="button"
              (click)="applyUserCycleAndDiet()"
              class="text-xs font-semibold text-lavender-700 hover:underline"
            >
              ✨ Mevcut Fazıma ({{ profileService.cycleSnapshot().phaseLabel }}) Uygun Olanları Seç
            </button>
          </div>
        </section>

        <!-- Tarif Kartları Grid -->
        <div class="grid gap-4 md:grid-cols-2">
          @for (r of filteredRecipes(); track r.id) {
            <article class="wl-card flex flex-col justify-between">
              <div>
                <div class="flex items-center justify-between gap-2">
                  <div class="flex items-center gap-1.5">
                    <span class="rounded-full bg-lavender-100 px-3 py-1 text-xs font-semibold text-lavender-700">
                      {{ r.dietType }}
                    </span>
                    @if (r.turkishCuisine) {
                      <span class="rounded-full bg-cream-200 px-2.5 py-0.5 text-[11px] font-medium text-ink-700">
                        Anadolu Mutfağı
                      </span>
                    }
                  </div>
                  @if (!profileService.hideCalories()) {
                    <span class="text-xs font-bold text-sage-700">{{ r.calories }} kcal</span>
                  } @else {
                    <span class="text-[11px] font-medium text-ink-400">⏱ {{ r.prepMinutes }} dk</span>
                  }
                </div>

                <h2 class="mt-3 text-base font-bold text-ink-900">{{ r.title }}</h2>
                <p class="mt-1 text-xs leading-relaxed text-ink-700">{{ r.description }}</p>

                <!-- Makro Özeti (Kalori görünürse) -->
                @if (!profileService.hideCalories()) {
                  <div class="mt-3 flex flex-wrap gap-2 text-[11px]">
                    <span class="rounded-lg bg-white px-2.5 py-1 font-medium text-ink-700">
                      Protein: <strong>{{ r.protein }}g</strong>
                    </span>
                    <span class="rounded-lg bg-white px-2.5 py-1 font-medium text-ink-700">
                      Karb: <strong>{{ r.carbs }}g</strong>
                    </span>
                    <span class="rounded-lg bg-white px-2.5 py-1 font-medium text-ink-700">
                      Yağ: <strong>{{ r.fat }}g</strong>
                    </span>
                    <span class="rounded-lg bg-white px-2.5 py-1 font-medium text-ink-500">
                      ⏱ {{ r.prepMinutes }} dk
                    </span>
                  </div>
                }

                <ul class="mt-3 space-y-1 text-xs text-ink-500">
                  @for (ing of r.ingredients.slice(0, 4); track ing.name) {
                    <li>• {{ ing.name }} ({{ ing.amount }} {{ ing.unit }})</li>
                  }
                </ul>
              </div>

              <div class="mt-4 space-y-3 border-t border-cream-200 pt-3">
                <div class="flex flex-wrap gap-1.5">
                  @for (phase of r.cyclePhaseSupport; track phase) {
                    <span class="rounded-lg bg-sage-50 px-2.5 py-0.5 text-[11px] font-semibold text-sage-800">
                      {{ phaseLabel(phase) }}
                    </span>
                  }
                </div>

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="selectedRecipeModal.set(r)"
                    class="flex-1 rounded-xl bg-sage-500 px-3.5 py-2 text-xs font-semibold text-white transition hover:bg-sage-600"
                  >
                    Tarif Detayı & Hazırlanışı
                  </button>
                  <button
                    type="button"
                    (click)="addRecipeToShoppingList(r)"
                    class="rounded-xl border border-lavender-300 bg-lavender-50 px-3.5 py-2 text-xs font-semibold text-lavender-700 transition hover:bg-lavender-100"
                  >
                    + Listeye Ekle
                  </button>
                </div>
              </div>
            </article>
          }
        </div>
      }

      <!-- SEKME 2: ALIŞVERİŞ LİSTEM -->
      @if (activeTab() === 'shopping') {
        <section class="wl-card space-y-4">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 class="text-base font-bold text-ink-900">Haftalık Wellness Alışveriş Listem</h2>
              <p class="text-xs text-ink-500">
                Tariflerden eklediğin malzemeler otomatik birleştirilir
              </p>
            </div>

            @if (recipeService.shoppingList().length > 0) {
              <button
                type="button"
                (click)="recipeService.clearCompletedShoppingItems()"
                class="rounded-xl border border-cream-300 bg-white px-3 py-1.5 text-xs font-semibold text-ink-700 hover:border-rose-300 hover:text-rose-700"
              >
                İşaretlenenleri Temizle
              </button>
            }
          </div>

          @if (recipeService.shoppingList().length === 0) {
            <div class="rounded-2xl border border-dashed border-cream-300 bg-white/60 p-8 text-center">
              <p class="text-sm font-semibold text-ink-700">Alışveriş listen henüz boş</p>
              <p class="mt-1 text-xs text-ink-500">
                Tarif kartlarındaki <strong>"+ Listeye Ekle"</strong> butonuna tıklayarak malzemeleri
                buraya aktarabilirsin.
              </p>
            </div>
          } @else {
            <div class="divide-y divide-cream-200 rounded-2xl border border-cream-200 bg-white">
              @for (item of recipeService.shoppingList(); track item.id) {
                <div class="flex items-center justify-between gap-3 px-4 py-3">
                  <label class="flex flex-1 cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      [checked]="item.checked"
                      (change)="recipeService.toggleShoppingItem(item.id)"
                      class="h-4 w-4 rounded border-cream-400 text-sage-600 focus:ring-sage-300"
                    />
                    <div>
                      <span
                        class="text-xs font-semibold text-ink-900"
                        [class.line-through]="item.checked"
                        [class.text-ink-400]="item.checked"
                      >
                        {{ item.name }} — <strong>{{ item.amount }} {{ item.unit }}</strong>
                      </span>
                      <span class="block text-[11px] text-ink-400">{{ item.recipeTitle }}</span>
                    </div>
                  </label>

                  <button
                    type="button"
                    (click)="recipeService.removeShoppingItem(item.id)"
                    class="text-xs text-ink-400 hover:text-rose-600"
                  >
                    Sil
                  </button>
                </div>
              }
            </div>
          }
        </section>
      }

      <!-- SEKME 3: AI TABAK / FOTOĞRAF ANALİZİ (Backend /api/recipes/photo-analyze-mock) -->
      @if (activeTab() === 'vision') {
        <section class="wl-card space-y-5">
          <div>
            <span class="rounded-full bg-lavender-100 px-3 py-1 text-xs font-semibold text-lavender-700">
              AI Vision Beslenme Asistanı
            </span>
            <h2 class="mt-2 text-lg font-bold text-ink-900">
              Tabak Fotoğrafı veya Öğün İçeriği Analizi
            </h2>
            <p class="mt-1 text-xs text-ink-500">
              Yediğin öğünü tarif et veya hızlı örneklerden seç; tahmini malzemeleri, makro
              dağılımını ve döngü fazı uyumunu anında hesaplayalım.
            </p>
          </div>

          <div class="grid gap-4 md:grid-cols-[1fr_auto_auto]">
            <input
              type="text"
              [(ngModel)]="visionMealHint"
              placeholder="Örn: Zeytinyağlı enginar, haşlanmış nohut ve dereotu..."
              class="wl-input text-xs"
            />
            <select [(ngModel)]="visionPortion" class="wl-input text-xs sm:w-44">
              <option value="SMALL">Küçük Porsiyon</option>
              <option value="MEDIUM">Standart Porsiyon</option>
              <option value="LARGE">Büyük Porsiyon</option>
            </select>
            <button
              type="button"
              (click)="runPhotoAnalysis()"
              class="wl-btn-primary sm:w-auto"
            >
              📸 Tabağı Analiz Et
            </button>
          </div>

          <div class="flex flex-wrap gap-2 text-xs">
            <span class="text-ink-400">Hızlı Test Tabakları:</span>
            <button
              type="button"
              (click)="visionMealHint = 'Mercimek ve Kinoa Kasesi'; runPhotoAnalysis()"
              class="rounded-full bg-cream-200 px-3 py-1 font-medium text-ink-700 hover:bg-sage-100"
            >
              🥣 Mercimek & Kinoa
            </button>
            <button
              type="button"
              (click)="visionMealHint = 'Izgara Somon ve Rezene Salatası'; runPhotoAnalysis()"
              class="rounded-full bg-cream-200 px-3 py-1 font-medium text-ink-700 hover:bg-sage-100"
            >
              🐟 Izgara Somon
            </button>
            <button
              type="button"
              (click)="visionMealHint = 'Zeytinyağlı Çanak Enginar'; runPhotoAnalysis()"
              class="rounded-full bg-cream-200 px-3 py-1 font-medium text-ink-700 hover:bg-sage-100"
            >
              🌿 Zeytinyağlı Enginar
            </button>
          </div>

          @if (visionResult(); as res) {
            <div class="rounded-2xl border border-sage-200 bg-sage-50/70 p-5 space-y-4">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span class="text-[11px] font-semibold text-sage-700 uppercase">
                    Tespit Edilen Tabak
                  </span>
                  <h3 class="text-base font-bold text-ink-900">{{ res.detectedDishName }}</h3>
                </div>

                @if (!profileService.hideCalories()) {
                  <span class="rounded-full bg-white px-3.5 py-1 text-xs font-bold text-sage-800 shadow-2xs">
                    {{ res.calorieRange.min }} – {{ res.calorieRange.max }} {{ res.calorieRange.unit }}
                  </span>
                }
              </div>

              <p class="text-xs leading-relaxed text-ink-700">
                💡 <strong>Diyetisyen & Hormon Notu:</strong> {{ res.nutritionistNote }}
              </p>

              <div class="grid gap-2 sm:grid-cols-3">
                @for (ing of res.estimatedIngredients; track ing.name) {
                  <div class="rounded-xl bg-white p-3 text-xs">
                    <span class="font-semibold text-ink-900">{{ ing.name }}</span>
                    <span class="mt-0.5 block text-[11px] text-ink-500">
                      ~{{ ing.estimatedAmountGrams }}g · {{ ing.category }}
                    </span>
                  </div>
                }
              </div>
            </div>
          }
        </section>
      }

      <!-- TARİF DETAY & ADIM ADIM HAZIRLANIŞ MODALI -->
      @if (selectedRecipeModal(); as modalRecipe) {
        <div
          class="fixed inset-0 z-50 flex items-end justify-center bg-ink-900/45 p-0 backdrop-blur-xs sm:items-center sm:p-4"
          (click)="selectedRecipeModal.set(null)"
        >
          <div
            class="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-cream-200 bg-cream-50 p-6 shadow-2xl sm:rounded-3xl"
            (click)="$event.stopPropagation()"
          >
            <div class="flex items-start justify-between gap-3">
              <span class="rounded-full bg-lavender-100 px-3 py-1 text-xs font-semibold text-lavender-700">
                {{ modalRecipe.dietType }} · ⏱ {{ modalRecipe.prepMinutes }} dk
              </span>
              <button
                type="button"
                (click)="selectedRecipeModal.set(null)"
                class="flex h-8 w-8 items-center justify-center rounded-full border border-cream-300 bg-white text-sm text-ink-500"
              >
                ✕
              </button>
            </div>

            <h2 class="mt-3 text-xl font-bold text-ink-900">{{ modalRecipe.title }}</h2>
            <p class="mt-1 text-xs leading-relaxed text-ink-700">{{ modalRecipe.description }}</p>

            <!-- Hormonal Fayda Kutusu -->
            <div class="mt-4 rounded-2xl border border-sage-200 bg-sage-50 p-3.5 text-xs text-sage-900">
              🌿 <strong>Döngü & Hormon Desteği:</strong> {{ modalRecipe.hormoneBenefitNote }}
            </div>

            <!-- Malzeme Listesi -->
            <div class="mt-4">
              <h3 class="text-xs font-bold tracking-wide text-ink-500 uppercase">Malzemeler</h3>
              <ul class="mt-2 grid gap-1.5 sm:grid-cols-2 text-xs text-ink-900">
                @for (ing of modalRecipe.ingredients; track ing.name) {
                  <li class="rounded-xl border border-cream-200 bg-white px-3 py-2">
                    <strong>{{ ing.amount }} {{ ing.unit }}</strong> {{ ing.name }}
                  </li>
                }
              </ul>
            </div>

            <!-- Adım Adım Hazırlanışı -->
            <div class="mt-4">
              <h3 class="text-xs font-bold tracking-wide text-ink-500 uppercase">
                Adım Adım Hazırlanışı
              </h3>
              <ol class="mt-2 space-y-2 text-xs leading-relaxed text-ink-700">
                @for (step of modalRecipe.steps; track step; let idx = $index) {
                  <li class="flex gap-2.5 rounded-xl bg-white p-3">
                    <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage-500 text-[11px] font-bold text-white">
                      {{ idx + 1 }}
                    </span>
                    <span>{{ step }}</span>
                  </li>
                }
              </ol>
            </div>

            <div class="mt-5 flex justify-end gap-2">
              <button
                type="button"
                (click)="addRecipeToShoppingList(modalRecipe); selectedRecipeModal.set(null)"
                class="wl-btn-primary"
              >
                🛒 Tüm Malzemeleri Alışveriş Listeme Ekle
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
})
export class RecipeListPage implements OnInit {
  protected readonly recipeService = inject(RecipeService);
  protected readonly profileService = inject(ProfileService);

  protected readonly activeTab = signal<NutritionTab>('recipes');
  protected readonly selectedRecipeModal = signal<RecipeDetail | null>(null);
  protected readonly toastMessage = signal<string | null>(null);

  protected searchText = '';
  protected selectedDiet?: DietType;
  protected selectedPhase?: CyclePhase;
  protected turkishOnly = false;

  protected visionMealHint = 'Mercimek ve Kinoa Kasesi';
  protected visionPortion: 'SMALL' | 'MEDIUM' | 'LARGE' = 'MEDIUM';
  protected readonly visionResult = signal<PhotoAnalysisResponse | null>(null);

  protected readonly filteredRecipes = computed(() => {
    return this.recipeService.recipes().filter((r) => {
      if (this.selectedDiet && r.dietType !== this.selectedDiet) return false;
      if (this.selectedPhase && !r.cyclePhaseSupport.includes(this.selectedPhase)) return false;
      if (this.turkishOnly && !r.turkishCuisine) return false;
      if (this.searchText.trim()) {
        const q = this.searchText.trim().toLowerCase();
        const matchTitle = r.title.toLowerCase().includes(q);
        const matchIng = r.ingredients.some((i) => i.name.toLowerCase().includes(q));
        if (!matchTitle && !matchIng) return false;
      }
      return true;
    });
  });

  ngOnInit(): void {
    this.recipeService.getRecipes().subscribe();
  }

  protected applyUserCycleAndDiet(): void {
    this.selectedPhase = this.profileService.cycleSnapshot().phase;
    this.selectedDiet = undefined;
    this.showToast(`${this.profileService.cycleSnapshot().phaseLabel} için önerilen tarifler filtrelendi.`);
  }

  protected addRecipeToShoppingList(recipe: RecipeDetail): void {
    this.recipeService.addIngredientsToShoppingList(recipe.title, recipe.ingredients);
    this.showToast(`"${recipe.title}" malzemeleri alışveriş listene eklendi.`);
  }

  protected runPhotoAnalysis(): void {
    this.recipeService
      .analyzeMealPhoto({
        mealHint: this.visionMealHint,
        portionSize: this.visionPortion,
      })
      .subscribe((res) => this.visionResult.set(res));
  }

  protected phaseLabel(phase: CyclePhase): string {
    const map: Record<CyclePhase, string> = {
      MENSTRUAL: 'Menstrüel',
      FOLLICULAR: 'Foliküler',
      OVULATORY: 'Ovulasyon',
      LUTEAL: 'Luteal',
    };
    return map[phase];
  }

  private showToast(msg: string): void {
    this.toastMessage.set(msg);
    setTimeout(() => this.toastMessage.set(null), 3200);
  }
}
