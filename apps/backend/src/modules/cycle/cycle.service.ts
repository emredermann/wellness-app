import { Injectable } from '@nestjs/common';
import {
  BmiStatusResult,
  calculateBmiStatus,
  calculateBmiValue,
  calculateCurrentPhase,
  CyclePhaseCalculationInput,
  CyclePhaseCalculationResult,
  getPhaseRecommendations,
  PhaseRecommendationTags,
} from './utils/cycle-calculator.util.js';
import { CyclePhase } from '../../generated/prisma/enums.js';

export interface ProfilePhaseSummaryInput extends CyclePhaseCalculationInput {
  bmi?: number | string | null;
  weightKg?: number | null;
  heightCm?: number | null;
}

export interface ProfilePhaseSummaryResponse {
  mode: CyclePhaseCalculationResult['mode'];
  currentPhase: CyclePhaseCalculationResult['phase'];
  effectiveCyclePhase: CyclePhase;
  phaseNameTr: string;
  dayInCycle: number | null;
  cycleLength: number | null;
  daysUntilNextCycle: number | null;
  bmiStatus: BmiStatusResult;
  recommendations: {
    movementTags: string[];
    nutritionTags: string[];
    wellnessTip: string;
  };
}

@Injectable()
export class CycleService {
  /**
   * Pure utility fonksiyonunu saran servis metodu: mevcut döngü fazını veya Enerji Ritim Modunu hesaplar.
   */
  calculatePhase(input: CyclePhaseCalculationInput): CyclePhaseCalculationResult {
    return calculateCurrentPhase(input);
  }

  /**
   * VKİ değerini veya boy/kilo çiftini analiz ederek VKİ durumunu döndürür.
   */
  evaluateBmi(input: {
    bmi?: number | string | null;
    weightKg?: number | null;
    heightCm?: number | null;
  }): BmiStatusResult {
    let resolvedBmi = input.bmi;
    if (
      (resolvedBmi === null || resolvedBmi === undefined) &&
      input.weightKg &&
      input.heightCm
    ) {
      resolvedBmi = calculateBmiValue(input.weightKg, input.heightCm);
    }
    return calculateBmiStatus(resolvedBmi);
  }

  /**
   * Faz bazlı hareket ve beslenme öneri etiketlerini döndürür.
   */
  getRecommendationsForPhase(
    phase: CyclePhase | 'ENERGY_RHYTHM',
  ): PhaseRecommendationTags {
    return getPhaseRecommendations(phase);
  }

  /**
   * Mevcut faz, VKİ durumu ve rahatlatıcı hareket/beslenme etiketlerini tek bir yanıtta birleştirir.
   */
  buildProfilePhaseSummary(input: ProfilePhaseSummaryInput): ProfilePhaseSummaryResponse {
    const phaseInfo = this.calculatePhase(input);
    const bmiStatus = this.evaluateBmi({
      bmi: input.bmi,
      weightKg: input.weightKg,
      heightCm: input.heightCm,
    });

    return {
      mode: phaseInfo.mode,
      currentPhase: phaseInfo.phase,
      effectiveCyclePhase: phaseInfo.effectiveCyclePhase,
      phaseNameTr: phaseInfo.phaseNameTr,
      dayInCycle: phaseInfo.dayInCycle,
      cycleLength: phaseInfo.cycleLength,
      daysUntilNextCycle: phaseInfo.daysUntilNextCycle,
      bmiStatus,
      recommendations: {
        movementTags: phaseInfo.movementTags,
        nutritionTags: phaseInfo.nutritionTags,
        wellnessTip: phaseInfo.wellnessTip,
      },
    };
  }
}
