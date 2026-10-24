import { CyclePhase, Gender } from '../../../generated/prisma/enums.js';

export type TrackingMode = 'CYCLE_TRACKING' | 'ENERGY_RHYTHM';

export type BmiCategory = 'UNDERWEIGHT' | 'NORMAL' | 'OVERWEIGHT' | 'OBESE' | 'UNKNOWN';

export interface BmiStatusResult {
  bmi: number | null;
  category: BmiCategory;
  label: string;
  description: string;
}

export interface PhaseRecommendationTags {
  movementTags: string[];
  nutritionTags: string[];
  wellnessTip: string;
}

export interface CyclePhaseCalculationInput {
  gender?: Gender | null;
  isCycleTrackingActive?: boolean | null;
  cycleStartDate?: Date | string | null;
  cycleLength?: number | null;
  referenceDate?: Date;
}

export interface CyclePhaseCalculationResult {
  mode: TrackingMode;
  phase: CyclePhase | 'ENERGY_RHYTHM';
  /** Tarif ve egzersiz eşleştirmelerinde kullanılacak efektif faz */
  effectiveCyclePhase: CyclePhase;
  phaseNameTr: string;
  dayInCycle: number | null;
  cycleLength: number | null;
  daysUntilNextCycle: number | null;
  movementTags: string[];
  nutritionTags: string[];
  wellnessTip: string;
}

const MS_PER_DAY = 86_400_000;
const DEFAULT_CYCLE_LENGTH = 28;
const MIN_CYCLE_LENGTH = 21;
const MAX_CYCLE_LENGTH = 45;

const PHASE_NAMES_TR: Record<CyclePhase | 'ENERGY_RHYTHM', string> = {
  [CyclePhase.MENSTRUAL]: 'Menstrual',
  [CyclePhase.FOLLICULAR]: 'Foliküler',
  [CyclePhase.OVULATORY]: 'Yumurtlama',
  [CyclePhase.LUTEAL]: 'Lüteel',
  ENERGY_RHYTHM: 'Enerji Ritim Modu',
};

const PHASE_RECOMMENDATIONS: Record<CyclePhase | 'ENERGY_RHYTHM', PhaseRecommendationTags> = {
  [CyclePhase.MENSTRUAL]: {
    movementTags: ['Yin Yoga', 'Nefes Egzersizi', 'Hafif Yürüyüş', 'Pelvik Esneme'],
    nutritionTags: [
      'Demir Zengini Besinler',
      'Sıcak Bitki Çayları',
      'Magnezyum Desteği',
      'Anti-inflamatuar Çorbalar',
    ],
    wellnessTip:
      'Bedeninin dinlenmeye ihtiyaç duyduğu bu fazda yavaşla, sıcak bitki çayları ve nazik esnemelerle kendini destekle.',
  },
  [CyclePhase.FOLLICULAR]: {
    movementTags: ['Akış Yogası (Vinyasa)', 'Tempolu Yürüyüş', 'Pilates', 'Hafif Kardiyo'],
    nutritionTags: [
      'Fermente Gıdalar',
      'Taze Yeşillikler',
      'Kaliteli Protein',
      'Kompleks Karbonhidratlar',
    ],
    wellnessTip:
      'Enerjin yükselirken yeni egzersiz rutinleri deneyebilir ve fermente, taze besinlerle metabolizmanı destekleyebilirsin.',
  },
  [CyclePhase.OVULATORY]: {
    movementTags: ['Dinamik Pilates', 'Koşu & Kondisyon', 'Dans', 'Grup Antrenmanları'],
    nutritionTags: [
      'Antioksidan Meyveler',
      'Çinko ve B Vitamini',
      'Yüksek Lifli Sebzeler',
      'Bol Hidrasyon',
    ],
    wellnessTip:
      'Enerji ve iletişim gücünün zirvesindesin; topluluk etkinliklerine katılmak ve bol su tüketmek için harika bir gün.',
  },
  [CyclePhase.LUTEAL]: {
    movementTags: ['Restoratif Pilates', 'Düşük Tempolu Yüzme', 'Meditasyon', 'Gece Esnemesi'],
    nutritionTags: [
      'Kompleks Karbonhidratlar',
      'B6 Vitamini & Magnezyum',
      'Kök Sebzeler',
      'Bitkisel Sağlıklı Yağlar',
    ],
    wellnessTip:
      'Sinir sistemini sakinleştiren nefes çalışmaları ve kan şekerini dengeleyen kök sebzelerle bedensel konforunu koru.',
  },
  ENERGY_RHYTHM: {
    movementTags: [
      'Mobilite & Esneme',
      'Fonksiyonel Antrenman',
      'Odak Nefesi',
      'Açık Hava Yürüyüşü',
    ],
    nutritionTags: [
      'Dengeli Makro Tabağı',
      'Omega-3 Kaynakları',
      'Probiyotik Yoğurt/Kefir',
      'Elektrolit & Su Dengesi',
    ],
    wellnessTip:
      'Günlük biyoritmini korumak için sabah hareketliliğini dengeli protein ve antioksidan ağırlıklı öğünlerle birleştir.',
  },
};

/**
 * Boy (cm) ve kilo (kg) değerlerinden VKİ (BMI) hesaplayan pure fonksiyon.
 */
export function calculateBmiValue(weightKg: number, heightCm: number): number {
  if (weightKg <= 0 || heightCm <= 0) {
    throw new RangeError('Kilo ve boy değerleri sıfırdan büyük olmalıdır.');
  }
  const heightMeters = heightCm / 100;
  return Number((weightKg / (heightMeters * heightMeters)).toFixed(1));
}

/**
 * VKİ değerine göre kategori, Türkçe etiket ve açıklama döndüren pure fonksiyon.
 */
export function calculateBmiStatus(bmiInput?: number | string | null): BmiStatusResult {
  if (bmiInput === null || bmiInput === undefined || bmiInput === '') {
    return {
      bmi: null,
      category: 'UNKNOWN',
      label: 'Belirtilmedi',
      description: 'VKİ analizi için profilinizdeki boy/kilo veya VKİ bilgisini güncelleyebilirsiniz.',
    };
  }

  const numericBmi = typeof bmiInput === 'string' ? Number.parseFloat(bmiInput) : Number(bmiInput);
  if (Number.isNaN(numericBmi) || numericBmi <= 0) {
    return {
      bmi: null,
      category: 'UNKNOWN',
      label: 'Belirtilmedi',
      description: 'Geçerli bir VKİ değeri bulunamadı.',
    };
  }

  const bmi = Number(numericBmi.toFixed(1));

  if (bmi < 18.5) {
    return {
      bmi,
      category: 'UNDERWEIGHT',
      label: 'Zayıf',
      description: 'Besin yoğunluğu yüksek, sağlıklı yağ ve protein ağırlıklı öğünler önerilir.',
    };
  }

  if (bmi < 25) {
    return {
      bmi,
      category: 'NORMAL',
      label: 'Normal',
      description: 'İdeal aralıktasınız; mevcut dengeli beslenme ve hareket rutininizi koruyabilirsiniz.',
    };
  }

  if (bmi < 30) {
    return {
      bmi,
      category: 'OVERWEIGHT',
      label: 'Fazla Kilolu',
      description: 'Lif oranı yüksek öğünler ve düzenli düşük-orta tempolu kardiyo/mobilite önerilir.',
    };
  }

  return {
    bmi,
    category: 'OBESE',
    label: 'Obez',
    description:
      'Eklem dostu hareketler (yüzme, yürüyüş, restoratif pilates) ve anti-inflamatuar beslenme önerilir.',
  };
}

/**
 * Tarih nesnesini UTC gün başlangıcına (00:00:00.000Z) normalize eder.
 */
function toUtcMidnight(dateInput: Date | string): number {
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Enerji Ritim Modu için referans tarihe göre günlük/haftalık efektif döngü fazı eşlemesi.
 */
function resolveEnergyRhythmEffectivePhase(referenceDate: Date): CyclePhase {
  const dayOfWeek = referenceDate.getUTCDay(); // 0 (Pazar) - 6 (Cumartesi)
  if (dayOfWeek === 0) return CyclePhase.MENSTRUAL; // Pazar: Dinlenme & Yenilenme
  if (dayOfWeek === 1 || dayOfWeek === 2) return CyclePhase.FOLLICULAR; // Pzt-Salı: Başlangıç & Planlama
  if (dayOfWeek === 3 || dayOfWeek === 4) return CyclePhase.OVULATORY; // Çar-Per: Zirve Performans & Sosyalleşme
  return CyclePhase.LUTEAL; // Cuma-Cmt: Yavaşlama & Denge
}

/**
 * Kullanıcının döngü başlangıç tarihi, döngü uzunluğu, cinsiyet ve takip tercihine göre
 * mevcut döngü fazını (Menstrual, Foliküler, Yumurtlama, Lüteel) veya
 * "Enerji Ritim Modunu" hesaplayan Pure Function.
 */
export function calculateCurrentPhase(
  input: CyclePhaseCalculationInput,
): CyclePhaseCalculationResult {
  const referenceDate = input.referenceDate ?? new Date();
  const parsedStartDate = input.cycleStartDate ? new Date(input.cycleStartDate) : null;
  const hasValidStartDate =
    parsedStartDate !== null && !Number.isNaN(parsedStartDate.getTime());

  const shouldUseEnergyRhythm =
    input.gender === Gender.MALE ||
    !input.isCycleTrackingActive ||
    !hasValidStartDate;

  if (shouldUseEnergyRhythm || !parsedStartDate) {
    const effectiveCyclePhase = resolveEnergyRhythmEffectivePhase(referenceDate);
    const recommendations = PHASE_RECOMMENDATIONS.ENERGY_RHYTHM;
    return {
      mode: 'ENERGY_RHYTHM',
      phase: 'ENERGY_RHYTHM',
      effectiveCyclePhase,
      phaseNameTr: PHASE_NAMES_TR.ENERGY_RHYTHM,
      dayInCycle: null,
      cycleLength: null,
      daysUntilNextCycle: null,
      movementTags: [...recommendations.movementTags],
      nutritionTags: [...recommendations.nutritionTags],
      wellnessTip: recommendations.wellnessTip,
    };
  }

  const rawLength = input.cycleLength ?? DEFAULT_CYCLE_LENGTH;
  const cycleLength = Math.min(
    MAX_CYCLE_LENGTH,
    Math.max(MIN_CYCLE_LENGTH, Math.trunc(rawLength)),
  );

  const startUtc = toUtcMidnight(parsedStartDate);
  const refUtc = toUtcMidnight(referenceDate);
  const diffDays = Math.floor((refUtc - startUtc) / MS_PER_DAY);

  // Modulo aritmetiği ile geçmiş veya gelecek başlangıç tarihlerinde de 1..cycleLength aralığını korur
  const dayIndex = ((diffDays % cycleLength) + cycleLength) % cycleLength;
  const dayInCycle = dayIndex + 1;
  const daysUntilNextCycle = cycleLength - dayInCycle + 1;

  // Luteal faz ortalama 14 gündür; yumurtlama günü yaklaşık (cycleLength - 14)
  const ovulationCenterDay = Math.max(10, cycleLength - 14);
  const menstrualEndDay = 5;
  const follicularEndDay = ovulationCenterDay - 2;
  const ovulatoryEndDay = ovulationCenterDay + 1;

  let phase: CyclePhase;
  if (dayInCycle <= menstrualEndDay) {
    phase = CyclePhase.MENSTRUAL;
  } else if (dayInCycle <= follicularEndDay) {
    phase = CyclePhase.FOLLICULAR;
  } else if (dayInCycle <= ovulatoryEndDay) {
    phase = CyclePhase.OVULATORY;
  } else {
    phase = CyclePhase.LUTEAL;
  }

  const recommendations = PHASE_RECOMMENDATIONS[phase];

  return {
    mode: 'CYCLE_TRACKING',
    phase,
    effectiveCyclePhase: phase,
    phaseNameTr: PHASE_NAMES_TR[phase],
    dayInCycle,
    cycleLength,
    daysUntilNextCycle,
    movementTags: [...recommendations.movementTags],
    nutritionTags: [...recommendations.nutritionTags],
    wellnessTip: recommendations.wellnessTip,
  };
}

/**
 * Verilen faza ait rahatlatıcı hareket ve beslenme öneri etiketlerini döndüren pure fonksiyon.
 */
export function getPhaseRecommendations(
  phase: CyclePhase | 'ENERGY_RHYTHM',
): PhaseRecommendationTags {
  const rec = PHASE_RECOMMENDATIONS[phase];
  return {
    movementTags: [...rec.movementTags],
    nutritionTags: [...rec.nutritionTags],
    wellnessTip: rec.wellnessTip,
  };
}
