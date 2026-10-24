import { CyclePhase, Gender } from '../../generated/prisma/enums.js';
import { CycleService } from './cycle.service.js';
import {
  calculateBmiStatus,
  calculateBmiValue,
  calculateCurrentPhase,
} from './utils/cycle-calculator.util.js';

describe('CycleService & Pure Cycle Calculator Utilities', () => {
  let service: CycleService;

  beforeEach(() => {
    service = new CycleService();
  });

  describe('calculateCurrentPhase (Pure Function)', () => {
    const startDate = '2026-10-01';

    it('döngünün 1-5. günleri arasında MENSTRUAL fazı ve uygun etiketleri döndürmelidir', () => {
      const result = calculateCurrentPhase({
        gender: Gender.FEMALE,
        isCycleTrackingActive: true,
        cycleStartDate: startDate,
        cycleLength: 28,
        referenceDate: new Date('2026-10-03T12:00:00Z'), // 3. gün
      });

      expect(result.mode).toBe('CYCLE_TRACKING');
      expect(result.phase).toBe(CyclePhase.MENSTRUAL);
      expect(result.phaseNameTr).toBe('Menstrual');
      expect(result.dayInCycle).toBe(3);
      expect(result.movementTags).toContain('Yin Yoga');
      expect(result.nutritionTags).toContain('Demir Zengini Besinler');
    });

    it('28 günlük döngünün 6-12. günleri arasında FOLLICULAR (Foliküler) fazı döndürmelidir', () => {
      const result = calculateCurrentPhase({
        gender: Gender.FEMALE,
        isCycleTrackingActive: true,
        cycleStartDate: startDate,
        cycleLength: 28,
        referenceDate: new Date('2026-10-09T12:00:00Z'), // 9. gün
      });

      expect(result.phase).toBe(CyclePhase.FOLLICULAR);
      expect(result.phaseNameTr).toBe('Foliküler');
      expect(result.dayInCycle).toBe(9);
      expect(result.movementTags).toContain('Akış Yogası (Vinyasa)');
    });

    it('28 günlük döngünün 13-15. günleri arasında OVULATORY (Yumurtlama) fazı döndürmelidir', () => {
      const result = calculateCurrentPhase({
        gender: Gender.FEMALE,
        isCycleTrackingActive: true,
        cycleStartDate: startDate,
        cycleLength: 28,
        referenceDate: new Date('2026-10-14T12:00:00Z'), // 14. gün
      });

      expect(result.phase).toBe(CyclePhase.OVULATORY);
      expect(result.phaseNameTr).toBe('Yumurtlama');
      expect(result.dayInCycle).toBe(14);
      expect(result.movementTags).toContain('Dinamik Pilates');
    });

    it('28 günlük döngünün 16-28. günleri arasında LUTEAL (Lüteel) fazı döndürmelidir', () => {
      const result = calculateCurrentPhase({
        gender: Gender.FEMALE,
        isCycleTrackingActive: true,
        cycleStartDate: startDate,
        cycleLength: 28,
        referenceDate: new Date('2026-10-22T12:00:00Z'), // 22. gün
      });

      expect(result.phase).toBe(CyclePhase.LUTEAL);
      expect(result.phaseNameTr).toBe('Lüteel');
      expect(result.dayInCycle).toBe(22);
      expect(result.daysUntilNextCycle).toBe(7);
      expect(result.nutritionTags).toContain('B6 Vitamini & Magnezyum');
    });

    it('birden fazla döngü geçtiğinde modulo aritmetiği ile doğru günü hesaplamalıdır', () => {
      const result = calculateCurrentPhase({
        gender: Gender.FEMALE,
        isCycleTrackingActive: true,
        cycleStartDate: '2026-09-01',
        cycleLength: 28,
        referenceDate: new Date('2026-09-29T00:00:00Z'), // Tam 28 gün sonra -> Yeni döngü 1. gün
      });

      expect(result.dayInCycle).toBe(1);
      expect(result.phase).toBe(CyclePhase.MENSTRUAL);
    });

    it('erkek kullanıcılar (Gender.MALE) için Enerji Ritim Modunu döndürmelidir', () => {
      const result = calculateCurrentPhase({
        gender: Gender.MALE,
        isCycleTrackingActive: true,
        cycleStartDate: startDate,
        cycleLength: 28,
        referenceDate: new Date('2026-10-10T12:00:00Z'),
      });

      expect(result.mode).toBe('ENERGY_RHYTHM');
      expect(result.phase).toBe('ENERGY_RHYTHM');
      expect(result.phaseNameTr).toBe('Enerji Ritim Modu');
      expect(result.dayInCycle).toBeNull();
      expect(result.movementTags).toContain('Mobilite & Esneme');
    });

    it('döngü takibi kapalı olan kullanıcılar için Enerji Ritim Modunu döndürmelidir', () => {
      const result = calculateCurrentPhase({
        gender: Gender.FEMALE,
        isCycleTrackingActive: false,
        cycleStartDate: startDate,
        cycleLength: 28,
      });

      expect(result.mode).toBe('ENERGY_RHYTHM');
      expect(result.phase).toBe('ENERGY_RHYTHM');
    });
  });

  describe('calculateBmiValue & calculateBmiStatus', () => {
    it('boy ve kilodan doğru VKİ hesaplamalı ve NORMAL kategorisini döndürmelidir', () => {
      const bmi = calculateBmiValue(62, 168);
      expect(bmi).toBe(22);

      const status = calculateBmiStatus(bmi);
      expect(status.category).toBe('NORMAL');
      expect(status.label).toBe('Normal');
    });

    it('Zayıf, Fazla Kilolu ve Obez VKİ sınırlarını doğru sınıflandırmalıdır', () => {
      expect(calculateBmiStatus(17.2).category).toBe('UNDERWEIGHT');
      expect(calculateBmiStatus(27.4).category).toBe('OVERWEIGHT');
      expect(calculateBmiStatus(31.8).category).toBe('OBESE');
      expect(calculateBmiStatus(null).category).toBe('UNKNOWN');
    });
  });

  describe('buildProfilePhaseSummary', () => {
    it('faz bilgisini, VKİ durumunu ve öneri etiketlerini birleştirmelidir', () => {
      const summary = service.buildProfilePhaseSummary({
        gender: Gender.FEMALE,
        isCycleTrackingActive: true,
        cycleStartDate: '2026-10-20',
        cycleLength: 28,
        weightKg: 60,
        heightCm: 165,
        referenceDate: new Date('2026-10-24T00:00:00Z'), // 5. gün -> Menstrual
      });

      expect(summary.currentPhase).toBe(CyclePhase.MENSTRUAL);
      expect(summary.bmiStatus.bmi).toBe(22);
      expect(summary.bmiStatus.category).toBe('NORMAL');
      expect(summary.recommendations.movementTags.length).toBeGreaterThan(0);
      expect(summary.recommendations.nutritionTags.length).toBeGreaterThan(0);
    });
  });
});
