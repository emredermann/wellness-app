import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, map, of, tap } from 'rxjs';
import { CyclePhase, DietType, Ingredient, Recipe } from '../models/domain.models';
import { ApiService } from './api.service';

export interface RecipeFilter {
  dietType?: DietType;
  cyclePhase?: CyclePhase;
  turkishCuisineOnly?: boolean;
  search?: string;
}

export interface RecipeDetail extends Recipe {
  prepMinutes: number;
  servings: number;
  steps: string[];
  hormoneBenefitNote: string;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  amount: number;
  unit: string;
  recipeTitle: string;
  checked: boolean;
}

export interface PhotoAnalysisResponse {
  detectedDishName: string;
  turkishCuisineMatch: boolean;
  estimatedIngredients: {
    name: string;
    estimatedAmountGrams: number;
    confidence: number;
    category: string;
  }[];
  calorieRange: { min: number; max: number; unit: string };
  estimatedMacros: {
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    fiberGrams: number;
  };
  supportedCyclePhases: CyclePhase[];
  nutritionistNote: string;
}

const SHOPPING_LIST_KEY = 'wl_shopping_list';

const FALLBACK_RECIPES: RecipeDetail[] = [
  {
    id: 'rcp-1',
    title: 'Zerdeçallı Kırmızı Mercimek & Kinoa Kasesi',
    description:
      'Demir ve bitkisel protein açısından zengin, sindirimi rahatlatan ılık Anadolu kasesi.',
    ingredients: [
      { name: 'Kırmızı mercimek', amount: 80, unit: 'g' },
      { name: 'Haşlanmış kinoa', amount: 60, unit: 'g' },
      { name: 'Taze bebek ıspanak', amount: 50, unit: 'g' },
      { name: 'Soğuk sıkım zeytinyağı & zerdeçal sos', amount: 15, unit: 'ml' },
      { name: 'Kavrulmuş kabak çekirdeği', amount: 15, unit: 'g' },
    ],
    dietType: 'VEGAN',
    calories: 410,
    protein: 19,
    carbs: 52,
    fat: 12,
    turkishCuisine: true,
    cyclePhaseSupport: ['MENSTRUAL', 'LUTEAL'],
    prepMinutes: 20,
    servings: 1,
    hormoneBenefitNote:
      'Menstrüel fazda azalan demir depolarını bitkisel demir ve C vitaminiyle destekler; zerdeçal doğal anti-inflamatuar etki sunar.',
    steps: [
      'Kırmızı mercimeği ve kinoayı ayrı küçük tencerelerde yumuşayana kadar 12-15 dakika haşlayın.',
      'Ispanak yapraklarını sıcak kinoa ile karıştırarak hafifçe sönmesini sağlayın.',
      'Üzerine sızma zeytinyağı, toz zerdeçal, taze çekilmiş karabiber ve limon suyunu gezdirin.',
      'Magnezyum ve çinko desteği için kavrulmuş kabak çekirdekleriyle servis edin.',
    ],
  },
  {
    id: 'rcp-2',
    title: 'Avokadolu & Çörek Otlu Izgara Hellim Salatası',
    description:
      'Foliküler fazda yükselen enerjiyi destekleyen ferah Akdeniz yeşillikleri ve sağlıklı yağlar.',
    ingredients: [
      { name: 'Az tuzlu ızgara hellim', amount: 75, unit: 'g' },
      { name: 'Olgun avokado', amount: 0.5, unit: 'adet' },
      { name: 'Roka, semizotu ve taze nane', amount: 100, unit: 'g' },
      { name: 'Çörek otu & nar ekşisi sos', amount: 15, unit: 'ml' },
    ],
    dietType: 'VEGETARIAN',
    calories: 465,
    protein: 22,
    carbs: 18,
    fat: 32,
    turkishCuisine: true,
    cyclePhaseSupport: ['FOLLICULAR', 'OVULATORY'],
    prepMinutes: 15,
    servings: 1,
    hormoneBenefitNote:
      'Foliküler fazda yükselen östrojen sentezini avokadodaki tekli doymamış yağ asitleri ve semizotundaki bitkisel Omega-3 ile destekler.',
    steps: [
      'Semizotu, roka ve taze nane yapraklarını yıkayıp kurulayın.',
      'Hellim dilimlerini döküm tavada yağ eklemeden her iki yüzü altın rengi olana dek kızartın.',
      'Dilimlenmiş avokado, ılık hellim ve çörek otunu kaseye yerleştirip zeytinyağı-limon sosuyla tamamlayın.',
    ],
  },
  {
    id: 'rcp-3',
    title: 'Fırında Rezene & Zeytinyağlı Somon Fileto',
    description:
      'Omega-3 ve magnezyum desteğiyle hormonal dengeyi ve kas toparlanmasını destekler.',
    ingredients: [
      { name: 'Somon fileto', amount: 150, unit: 'g' },
      { name: 'Taze rezene & Girit kabağı', amount: 140, unit: 'g' },
      { name: 'Sızma zeytinyağı & taze dereotu', amount: 15, unit: 'ml' },
      { name: 'Deniz tuzu & limon kabuğu rendesi', amount: 5, unit: 'g' },
    ],
    dietType: 'PESCATARIAN',
    calories: 510,
    protein: 34,
    carbs: 14,
    fat: 33,
    turkishCuisine: false,
    cyclePhaseSupport: ['OVULATORY', 'LUTEAL'],
    prepMinutes: 25,
    servings: 1,
    hormoneBenefitNote:
      'Yüksek EPA/DHA Omega-3 içeriği luteal fazdaki prostaglandin dengesini korur ve antrenman sonrası toparlanmayı hızlandırır.',
    steps: [
      'Fırını 190°C derecede ısıtın; ince dilimlenmiş rezene ve kabakları fırın tepsisine yayın.',
      'Somon filetoyu sebzelerin üzerine yerleştirip zeytinyağı ve limon kabuğu rendesiyle marine edin.',
      '18-20 dakika fırınladıktan sonra taze dereotu ile sıcak servis yapın.',
    ],
  },
  {
    id: 'rcp-4',
    title: 'Tahinli, Cevizli & Kakao Nibli Yulaf Lapası',
    description:
      'Luteal fazdaki tatlı isteğini doğal magnezyum ve lifle dengeleyen sakinleştirici kahvaltı.',
    ingredients: [
      { name: 'Glutensiz yulaf ezmesi', amount: 50, unit: 'g' },
      { name: 'Şekersiz badem sütü', amount: 200, unit: 'ml' },
      { name: 'Doğal çifte kavrulmuş tahin', amount: 15, unit: 'g' },
      { name: 'Çiğ ceviz içi', amount: 15, unit: 'g' },
      { name: 'Ham kakao parçacıkları & tarçın', amount: 10, unit: 'g' },
    ],
    dietType: 'VEGAN',
    calories: 385,
    protein: 13,
    carbs: 44,
    fat: 18,
    turkishCuisine: true,
    cyclePhaseSupport: ['LUTEAL', 'MENSTRUAL'],
    prepMinutes: 10,
    servings: 1,
    hormoneBenefitNote:
      'B6 vitamini, triptofan ve magnezyum açısından zengin tahin-kakao ikilisi serotonin üretimini destekleyerek PMS tatlı krizlerini dengeler.',
    steps: [
      'Yulaf ezmesi, badem sütü ve Seylan tarçınını kısık ateşte kıvam alana kadar 5 dakika pişirin.',
      'Kaseye aldıktan sonra üzerine tahin gezdirip ceviz içi ve ham kakao parçacıklarıyla süsleyin.',
    ],
  },
  {
    id: 'rcp-5',
    title: 'Dereotlu & Nohutlu Zeytinyağlı Çanak Enginar',
    description:
      'Karaciğerin östrojen detoksunu destekleyen prebiyotik lif zengini geleneksel Ege tabağı.',
    ingredients: [
      { name: 'Çanak enginar', amount: 2, unit: 'adet' },
      { name: 'Haşlanmış nohut', amount: 70, unit: 'g' },
      { name: 'Havuç & bezelye', amount: 60, unit: 'g' },
      { name: 'Taze dereotu & zeytinyağı', amount: 20, unit: 'ml' },
    ],
    dietType: 'VEGAN',
    calories: 360,
    protein: 14,
    carbs: 42,
    fat: 15,
    turkishCuisine: true,
    cyclePhaseSupport: ['FOLLICULAR', 'OVULATORY'],
    prepMinutes: 30,
    servings: 1,
    hormoneBenefitNote:
      'Enginardaki sinarin bileşiği karaciğer fonksiyonlarını destekleyerek ovulasyon döneminde fazla östrojenin sağlıklı metabolize edilmesine yardımcı olur.',
    steps: [
      'Enginar çanaklarını limonlu suda zeytinyağı ile yumuşayana kadar pişirin.',
      'Haşlanmış nohut ve sebzeleri çanakların ortasına paylaştırıp bol taze dereotu ile ılık veya soğuk servis edin.',
    ],
  },
];

@Injectable({ providedIn: 'root' })
export class RecipeService {
  private readonly api = inject(ApiService);

  private readonly recipesSignal = signal<RecipeDetail[]>(FALLBACK_RECIPES);
  private readonly shoppingListSignal = signal<ShoppingListItem[]>(this.readShoppingList());

  readonly recipes = this.recipesSignal.asReadonly();
  readonly shoppingList = this.shoppingListSignal.asReadonly();
  readonly uncheckedShoppingCount = computed(
    () => this.shoppingListSignal().filter((i) => !i.checked).length,
  );

  getRecipes(filter?: RecipeFilter): Observable<RecipeDetail[]> {
    return this.api.get<Recipe[]>('/recipes').pipe(
      catchError(() => of(FALLBACK_RECIPES)),
      map((items) => {
        if (!items.length) return FALLBACK_RECIPES;
        return items.map((item, idx) => ({
          ...FALLBACK_RECIPES[idx % FALLBACK_RECIPES.length],
          ...item,
        }));
      }),
      tap((items) => this.recipesSignal.set(items)),
      map((items) => this.applyFilter(items, filter)),
    );
  }

  getRecommendedForToday(phase: CyclePhase, dietType: DietType): RecipeDetail {
    const list = this.recipesSignal();
    const byPhaseAndDiet = list.find(
      (r) => r.cyclePhaseSupport.includes(phase) && this.isDietCompatible(r.dietType, dietType),
    );
    if (byPhaseAndDiet) return byPhaseAndDiet;

    const byPhase = list.find((r) => r.cyclePhaseSupport.includes(phase));
    return byPhase ?? list[0] ?? FALLBACK_RECIPES[0];
  }

  /** Tarifin tüm malzemelerini veya tek bir malzemeyi alışveriş listesine ekler */
  addIngredientsToShoppingList(recipeTitle: string, ingredients: Ingredient[]): void {
    const current = [...this.shoppingListSignal()];
    for (const ing of ingredients) {
      const existing = current.find(
        (item) =>
          item.name.toLowerCase() === ing.name.toLowerCase() && item.unit === ing.unit,
      );
      if (existing) {
        existing.amount = Number((existing.amount + ing.amount).toFixed(1));
      } else {
        current.unshift({
          id: `shp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
          name: ing.name,
          amount: ing.amount,
          unit: ing.unit,
          recipeTitle,
          checked: false,
        });
      }
    }
    this.shoppingListSignal.set(current);
    this.writeShoppingList(current);
  }

  toggleShoppingItem(id: string): void {
    const updated = this.shoppingListSignal().map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item,
    );
    this.shoppingListSignal.set(updated);
    this.writeShoppingList(updated);
  }

  removeShoppingItem(id: string): void {
    const updated = this.shoppingListSignal().filter((item) => item.id !== id);
    this.shoppingListSignal.set(updated);
    this.writeShoppingList(updated);
  }

  clearCompletedShoppingItems(): void {
    const updated = this.shoppingListSignal().filter((item) => !item.checked);
    this.shoppingListSignal.set(updated);
    this.writeShoppingList(updated);
  }

  /** Backend `/api/recipes/photo-analyze-mock` endpoint'ini veya yerel AI şablonunu çağırır */
  analyzeMealPhoto(payload: {
    mealHint: string;
    portionSize: 'SMALL' | 'MEDIUM' | 'LARGE';
  }): Observable<PhotoAnalysisResponse> {
    return this.api.post<PhotoAnalysisResponse>('/recipes/photo-analyze-mock', payload).pipe(
      catchError(() => {
        const mult =
          payload.portionSize === 'SMALL' ? 0.8 : payload.portionSize === 'LARGE' ? 1.25 : 1;
        return of({
          detectedDishName: payload.mealHint.toLowerCase().includes('somon')
            ? 'Fırında Somon & Akdeniz Yeşillikleri'
            : payload.mealHint.toLowerCase().includes('enginar')
              ? 'Zeytinyağlı Çanak Enginar & Nohut'
              : 'Zeytinyağlı Mercimek & Kinoa Wellness Kasesi',
          turkishCuisineMatch: true,
          estimatedIngredients: [
            {
              name: 'Bitkisel Protein / Bakliyat Tabanı',
              estimatedAmountGrams: Math.round(130 * mult),
              confidence: 0.94,
              category: 'Protein',
            },
            {
              name: 'Mevsim Yeşillikleri & Sebze',
              estimatedAmountGrams: Math.round(110 * mult),
              confidence: 0.92,
              category: 'Sebze',
            },
            {
              name: 'Soğuk Sıkım Sızma Zeytinyağı',
              estimatedAmountGrams: Math.round(15 * mult),
              confidence: 0.95,
              category: 'Sağlıklı Yağ',
            },
          ],
          calorieRange: {
            min: Math.round(360 * mult),
            max: Math.round(450 * mult),
            unit: 'kcal',
          },
          estimatedMacros: {
            proteinGrams: Math.round(21 * mult),
            carbsGrams: Math.round(39 * mult),
            fatGrams: Math.round(16 * mult),
            fiberGrams: Math.round(9 * mult),
          },
          supportedCyclePhases: ['FOLLICULAR', 'LUTEAL'],
          nutritionistNote:
            'Tabaktaki lif ve sağlıklı yağ dengesi kan şekeri dalgalanmalarını önler ve döngü boyunca sürdürülebilir enerji sağlar.',
        } satisfies PhotoAnalysisResponse);
      }),
    );
  }

  private applyFilter(items: RecipeDetail[], filter?: RecipeFilter): RecipeDetail[] {
    if (!filter) return items;
    return items.filter((r) => {
      if (filter.dietType && !this.isDietCompatible(r.dietType, filter.dietType)) return false;
      if (filter.cyclePhase && !r.cyclePhaseSupport.includes(filter.cyclePhase)) return false;
      if (filter.turkishCuisineOnly && !r.turkishCuisine) return false;
      if (filter.search?.trim()) {
        const q = filter.search.trim().toLowerCase();
        const inTitle = r.title.toLowerCase().includes(q);
        const inIng = r.ingredients.some((i) => i.name.toLowerCase().includes(q));
        if (!inTitle && !inIng) return false;
      }
      return true;
    });
  }

  private isDietCompatible(recipeDiet: DietType, userDiet: DietType): boolean {
    if (userDiet === 'REGULAR') return true;
    if (userDiet === 'PESCATARIAN') return recipeDiet !== 'REGULAR';
    if (userDiet === 'VEGETARIAN') return recipeDiet === 'VEGETARIAN' || recipeDiet === 'VEGAN';
    return recipeDiet === 'VEGAN';
  }

  private readShoppingList(): ShoppingListItem[] {
    try {
      const raw = localStorage.getItem(SHOPPING_LIST_KEY);
      return raw ? (JSON.parse(raw) as ShoppingListItem[]) : [];
    } catch {
      return [];
    }
  }

  private writeShoppingList(items: ShoppingListItem[]): void {
    try {
      localStorage.setItem(SHOPPING_LIST_KEY, JSON.stringify(items));
    } catch {
      // ignore
    }
  }
}
