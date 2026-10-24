import { Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client.js';
import { CyclePhase, DietType } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { FilterRecipesQueryDto } from './dto/filter-recipes.query.dto.js';
import { PhotoAnalyzeDto } from './dto/photo-analyze.dto.js';

export interface EstimatedIngredient {
  name: string;
  estimatedAmountGrams: number;
  confidence: number;
  category: string;
}

export interface PhotoAnalysisResult {
  provider: 'mock-openai-vision-v1';
  analyzedAt: string;
  detectedDishName: string;
  turkishCuisineMatch: boolean;
  estimatedIngredients: EstimatedIngredient[];
  calorieRange: {
    min: number;
    max: number;
    unit: 'kcal';
  };
  minCalories: number;
  maxCalories: number;
  estimatedMacros: {
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    fiberGrams: number;
  };
  dietCompatibility: DietType[];
  supportedCyclePhases: CyclePhase[];
  nutritionistNote: string;
}

interface MockMealTemplate {
  keywords: string[];
  detectedDishName: string;
  turkishCuisineMatch: boolean;
  estimatedIngredients: EstimatedIngredient[];
  baseMinCalories: number;
  baseMaxCalories: number;
  estimatedMacros: {
    proteinGrams: number;
    carbsGrams: number;
    fatGrams: number;
    fiberGrams: number;
  };
  dietCompatibility: DietType[];
  supportedCyclePhases: CyclePhase[];
  nutritionistNote: string;
}

const MOCK_MEAL_TEMPLATES: MockMealTemplate[] = [
  {
    keywords: ['mercimek', 'corba', 'çorba', 'soup', 'lentil'],
    detectedDishName: 'Kırmızı Mercimek Çorbası & Tam Buğday Kruton',
    turkishCuisineMatch: true,
    estimatedIngredients: [
      { name: 'Kırmızı Mercimek', estimatedAmountGrams: 90, confidence: 0.96, category: 'Bakliyat' },
      { name: 'Havuç & Soğan', estimatedAmountGrams: 60, confidence: 0.91, category: 'Sebze' },
      { name: 'Sızma Zeytinyağı', estimatedAmountGrams: 12, confidence: 0.89, category: 'Sağlıklı Yağ' },
      { name: 'Kimyon & Zerdeçal', estimatedAmountGrams: 4, confidence: 0.85, category: 'Baharat' },
    ],
    baseMinCalories: 260,
    baseMaxCalories: 340,
    estimatedMacros: {
      proteinGrams: 16,
      carbsGrams: 38,
      fatGrams: 8,
      fiberGrams: 9,
    },
    dietCompatibility: [DietType.VEGAN, DietType.VEGETARIAN, DietType.PESCATARIAN, DietType.REGULAR],
    supportedCyclePhases: [CyclePhase.MENSTRUAL, CyclePhase.LUTEAL],
    nutritionistNote:
      'Demir ve bitkisel protein açısından zengin bu geleneksel çorba, özellikle Menstrual ve Lüteel fazlarda sindirimi rahatlatır.',
  },
  {
    keywords: ['somon', 'balik', 'balık', 'levrek', 'fish', 'salmon'],
    detectedDishName: 'Fırında Izgara Somon & Roka Salatası',
    turkishCuisineMatch: false,
    estimatedIngredients: [
      { name: 'Somon Fileto', estimatedAmountGrams: 160, confidence: 0.95, category: 'Deniz Ürünü' },
      { name: 'Roka ve Kırmızı Soğan', estimatedAmountGrams: 85, confidence: 0.92, category: 'Yeşillik' },
      { name: 'Sızma Zeytinyağı & Limon Sosu', estimatedAmountGrams: 15, confidence: 0.88, category: 'Sağlıklı Yağ' },
      { name: 'Haşlanmış Kinoa', estimatedAmountGrams: 70, confidence: 0.83, category: 'Tahıl' },
    ],
    baseMinCalories: 460,
    baseMaxCalories: 580,
    estimatedMacros: {
      proteinGrams: 36,
      carbsGrams: 22,
      fatGrams: 26,
      fiberGrams: 5,
    },
    dietCompatibility: [DietType.PESCATARIAN, DietType.REGULAR],
    supportedCyclePhases: [CyclePhase.OVULATORY, CyclePhase.LUTEAL],
    nutritionistNote:
      'Yüksek Omega-3 içeriği hormonal dengeyi ve hücresel yenilenmeyi destekler.',
  },
  {
    keywords: ['enginar', 'zeytinyagli', 'zeytinyağlı', 'artichoke', 'meze', 'salata'],
    detectedDishName: 'Zeytinyağlı Bebek Enginar & Dereotlu Kinoa Kasesi',
    turkishCuisineMatch: true,
    estimatedIngredients: [
      { name: 'Çanak Enginar', estimatedAmountGrams: 150, confidence: 0.94, category: 'Sebze' },
      { name: 'Bezelye & Havuç Garnitür', estimatedAmountGrams: 80, confidence: 0.91, category: 'Sebze' },
      { name: 'Soğuk Sıkım Zeytinyağı', estimatedAmountGrams: 18, confidence: 0.93, category: 'Sağlıklı Yağ' },
      { name: 'Taze Dereotu', estimatedAmountGrams: 15, confidence: 0.95, category: 'Yeşillik' },
      { name: 'Haşlanmış Nohut', estimatedAmountGrams: 65, confidence: 0.87, category: 'Bakliyat' },
    ],
    baseMinCalories: 350,
    baseMaxCalories: 450,
    estimatedMacros: {
      proteinGrams: 14,
      carbsGrams: 42,
      fatGrams: 16,
      fiberGrams: 11,
    },
    dietCompatibility: [DietType.VEGAN, DietType.VEGETARIAN, DietType.PESCATARIAN, DietType.REGULAR],
    supportedCyclePhases: [CyclePhase.FOLLICULAR, CyclePhase.OVULATORY],
    nutritionistNote:
      'Karaciğer dostu enginar ve prebiyotik lifler, Foliküler ve Yumurtlama fazlarında östrojen metabolizmasını destekler.',
  },
];

@Injectable()
export class RecipesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: FilterRecipesQueryDto = {}) {
    const targetPhase = query.phase ?? query.cyclePhase;
    const where: Prisma.RecipeWhereInput = {};

    if (query.dietType) {
      where.dietType = query.dietType;
    }

    if (query.turkishCuisine !== undefined) {
      where.turkishCuisine = query.turkishCuisine;
    }

    if (targetPhase) {
      where.cyclePhaseSupport = { has: targetPhase };
    }

    if (query.maxCalories !== undefined) {
      where.calories = { lte: query.maxCalories };
    }

    if (query.search?.trim()) {
      const search = query.search.trim();
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.recipe.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: query.limit ?? 50,
    });
  }

  /**
   * POST /api/v1/recipes/photo-analyze-mock
   * Yüklenen tabak/malzeme fotoğrafından tahmini malzeme listesi ve
   * kalori aralığı (min-max) dönen mock/OpenAI Vision entegrasyon servisi.
   */
  analyzeMealPhoto(dto: PhotoAnalyzeDto = {}): PhotoAnalysisResult {
    const combinedHint = [dto.mealHint, dto.fileName, dto.imageUrl]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    const matchedTemplate =
      MOCK_MEAL_TEMPLATES.find((tpl) =>
        tpl.keywords.some((kw) => combinedHint.includes(kw)),
      ) ?? MOCK_MEAL_TEMPLATES[2];

    const portionMultiplier =
      dto.portionSize === 'SMALL' ? 0.8 : dto.portionSize === 'LARGE' ? 1.25 : 1.0;

    const minCalories = Math.round(matchedTemplate.baseMinCalories * portionMultiplier);
    const maxCalories = Math.round(matchedTemplate.baseMaxCalories * portionMultiplier);

    return {
      provider: 'mock-openai-vision-v1',
      analyzedAt: new Date().toISOString(),
      detectedDishName: matchedTemplate.detectedDishName,
      turkishCuisineMatch: matchedTemplate.turkishCuisineMatch,
      estimatedIngredients: matchedTemplate.estimatedIngredients.map((ing) => ({
        ...ing,
        estimatedAmountGrams: Math.round(ing.estimatedAmountGrams * portionMultiplier),
      })),
      calorieRange: {
        min: minCalories,
        max: maxCalories,
        unit: 'kcal',
      },
      minCalories,
      maxCalories,
      estimatedMacros: {
        proteinGrams: Math.round(matchedTemplate.estimatedMacros.proteinGrams * portionMultiplier),
        carbsGrams: Math.round(matchedTemplate.estimatedMacros.carbsGrams * portionMultiplier),
        fatGrams: Math.round(matchedTemplate.estimatedMacros.fatGrams * portionMultiplier),
        fiberGrams: Math.round(matchedTemplate.estimatedMacros.fiberGrams * portionMultiplier),
      },
      dietCompatibility: [...matchedTemplate.dietCompatibility],
      supportedCyclePhases: [...matchedTemplate.supportedCyclePhases],
      nutritionistNote: matchedTemplate.nutritionistNote,
    };
  }
}
