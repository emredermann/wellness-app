import { CyclePhase, DietType } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { RecipesService } from './recipes.service.js';

describe('RecipesService (GET /api/v1/recipes & POST /api/v1/recipes/photo-analyze-mock)', () => {
  let service: RecipesService;
  let mockPrisma: {
    recipe: {
      findMany: ReturnType<typeof vi.fn>;
    };
  };

  beforeEach(() => {
    mockPrisma = {
      recipe: {
        findMany: vi.fn().mockResolvedValue([]),
      },
    };
    service = new RecipesService(mockPrisma as unknown as PrismaService);
  });

  it('diyet tipi, Türk mutfağı ve döngü fazına göre Prisma filtrelerini doğru oluşturmalıdır', async () => {
    await service.findAll({
      dietType: DietType.VEGAN,
      turkishCuisine: true,
      phase: CyclePhase.MENSTRUAL,
    });

    expect(mockPrisma.recipe.findMany).toHaveBeenCalledWith({
      where: {
        dietType: DietType.VEGAN,
        turkishCuisine: true,
        cyclePhaseSupport: { has: CyclePhase.MENSTRUAL },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  });

  it('photo-analyze-mock servisi tahmini malzemeleri ve min-max kalori aralığını dönmelidir', () => {
    const analysis = service.analyzeMealPhoto({
      mealHint: 'mercimek çorbası',
      portionSize: 'MEDIUM',
    });

    expect(analysis.provider).toBe('mock-openai-vision-v1');
    expect(analysis.turkishCuisineMatch).toBe(true);
    expect(analysis.estimatedIngredients.length).toBeGreaterThan(0);
    expect(analysis.calorieRange.min).toBeGreaterThan(0);
    expect(analysis.calorieRange.max).toBeGreaterThan(analysis.calorieRange.min);
    expect(analysis.minCalories).toBe(analysis.calorieRange.min);
    expect(analysis.maxCalories).toBe(analysis.calorieRange.max);
  });
});
