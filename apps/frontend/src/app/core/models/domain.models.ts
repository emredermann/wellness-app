// Backend Prisma şemasıyla senkron tutulan paylaşılan domain tipleri.

export type Gender = 'FEMALE' | 'MALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';
export type DietType = 'VEGAN' | 'VEGETARIAN' | 'PESCATARIAN' | 'REGULAR';
export type EventCategory =
  | 'RUNNING' | 'YOGA' | 'PILATES' | 'SAILING' | 'CYCLING'
  | 'HIKING' | 'SWIMMING' | 'MEDITATION' | 'DANCE' | 'FITNESS' | 'OTHER';
export type RsvpStatus = 'CONFIRMED' | 'CANCELLED';
export type CyclePhase = 'FOLLICULAR' | 'LUTEAL' | 'MENSTRUAL' | 'OVULATORY';
export type MediaType = 'VIDEO' | 'AUDIO';
export type SessionCategory = 'MEDITATION' | 'BREATHING' | 'YOGA' | 'PILATES' | 'SLEEP' | 'STRETCHING' | 'WORKOUT';

export interface User {
  id: string;
  email: string;
  name: string;
  gender: Gender | null;
  dietType: DietType;
  bmi: number | null;
  cycleStartDate: string | null;
  cycleLength: number | null;
  isCycleTrackingActive: boolean;
  kvkkConsent: boolean;
}

export interface WellnessEvent {
  id: string;
  title: string;
  description: string | null;
  category: EventCategory;
  latitude: number;
  longitude: number;
  address: string;
  date: string;
  capacity: number;
  isFree: boolean;
  price: string | null;
  organizerId: string;
  createdAt: string;
}

export interface EventBooking {
  id: string;
  userId: string;
  eventId: string;
  rsvpStatus: RsvpStatus;
  qrCode: string;
  createdAt: string;
}

export interface Ingredient {
  name: string;
  amount: number;
  unit: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string | null;
  ingredients: Ingredient[];
  dietType: DietType;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  turkishCuisine: boolean;
  cyclePhaseSupport: CyclePhase[];
}

export interface WellnessSession {
  id: string;
  title: string;
  durationMinutes: number;
  mediaType: MediaType;
  mediaUrl: string;
  category: SessionCategory;
  recommendedPhase: CyclePhase | null;
}
