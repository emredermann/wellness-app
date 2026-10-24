-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('FEMALE', 'MALE', 'OTHER', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "DietType" AS ENUM ('VEGAN', 'VEGETARIAN', 'PESCATARIAN', 'REGULAR');

-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('RUNNING', 'YOGA', 'PILATES', 'SAILING', 'CYCLING', 'HIKING', 'SWIMMING', 'MEDITATION', 'DANCE', 'FITNESS', 'OTHER');

-- CreateEnum
CREATE TYPE "RsvpStatus" AS ENUM ('CONFIRMED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CyclePhase" AS ENUM ('MENSTRUAL', 'FOLLICULAR', 'OVULATORY', 'LUTEAL');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('VIDEO', 'AUDIO');

-- CreateEnum
CREATE TYPE "SessionCategory" AS ENUM ('MEDITATION', 'BREATHING', 'YOGA', 'PILATES', 'SLEEP', 'STRETCHING', 'WORKOUT');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" TEXT NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "gender" "Gender",
    "diet_type" "DietType" NOT NULL DEFAULT 'REGULAR',
    "bmi" DECIMAL(4,1),
    "cycle_start_date" DATE,
    "cycle_length" SMALLINT DEFAULT 28,
    "is_cycle_tracking_active" BOOLEAN NOT NULL DEFAULT false,
    "kvkk_consent" BOOLEAN NOT NULL DEFAULT false,
    "kvkk_consent_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "category" "EventCategory" NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "location" geography(Point, 4326),
    "address" TEXT NOT NULL,
    "date" TIMESTAMPTZ(6) NOT NULL,
    "capacity" INTEGER NOT NULL,
    "is_free" BOOLEAN NOT NULL DEFAULT true,
    "price" DECIMAL(10,2),
    "organizer_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_bookings" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "event_id" UUID NOT NULL,
    "rsvp_status" "RsvpStatus" NOT NULL DEFAULT 'CONFIRMED',
    "qr_code" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "recipes" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "description" TEXT,
    "ingredients" JSONB NOT NULL,
    "diet_type" "DietType" NOT NULL,
    "calories" INTEGER NOT NULL,
    "protein" DECIMAL(6,2) NOT NULL,
    "carbs" DECIMAL(6,2) NOT NULL,
    "fat" DECIMAL(6,2) NOT NULL,
    "turkish_cuisine" BOOLEAN NOT NULL DEFAULT false,
    "cycle_phase_support" "CyclePhase"[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wellness_sessions" (
    "id" UUID NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "duration_minutes" SMALLINT NOT NULL,
    "media_type" "MediaType" NOT NULL,
    "media_url" TEXT NOT NULL,
    "category" "SessionCategory" NOT NULL,
    "recommended_phase" "CyclePhase",
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wellness_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "events_location_idx" ON "events" USING GIST ("location");

-- CreateIndex
CREATE INDEX "events_category_date_idx" ON "events"("category", "date");

-- CreateIndex
CREATE INDEX "events_organizer_id_idx" ON "events"("organizer_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_bookings_qr_code_key" ON "event_bookings"("qr_code");

-- CreateIndex
CREATE INDEX "event_bookings_event_id_rsvp_status_idx" ON "event_bookings"("event_id", "rsvp_status");

-- CreateIndex
CREATE UNIQUE INDEX "event_bookings_user_id_event_id_key" ON "event_bookings"("user_id", "event_id");

-- CreateIndex
CREATE INDEX "recipes_diet_type_idx" ON "recipes"("diet_type");

-- CreateIndex
CREATE INDEX "wellness_sessions_category_idx" ON "wellness_sessions"("category");

-- CreateIndex
CREATE INDEX "wellness_sessions_recommended_phase_idx" ON "wellness_sessions"("recommended_phase");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_organizer_id_fkey" FOREIGN KEY ("organizer_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_bookings" ADD CONSTRAINT "event_bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_bookings" ADD CONSTRAINT "event_bookings_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- ───────────── Manuel eklemeler (PostGIS + veri bütünlüğü) ─────────────

-- latitude/longitude -> location (geography) otomatik senkronizasyonu
CREATE OR REPLACE FUNCTION events_sync_location() RETURNS trigger AS $$
BEGIN
  NEW.location := ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER events_sync_location_trg
BEFORE INSERT OR UPDATE OF latitude, longitude ON "events"
FOR EACH ROW EXECUTE FUNCTION events_sync_location();

-- Koordinat, kapasite ve ücret tutarlılığı
ALTER TABLE "events"
  ADD CONSTRAINT "events_latitude_chk"  CHECK ("latitude"  BETWEEN -90  AND 90),
  ADD CONSTRAINT "events_longitude_chk" CHECK ("longitude" BETWEEN -180 AND 180),
  ADD CONSTRAINT "events_capacity_chk"  CHECK ("capacity" > 0),
  ADD CONSTRAINT "events_price_chk"     CHECK (("is_free" AND "price" IS NULL) OR (NOT "is_free" AND "price" > 0));

ALTER TABLE "users"
  ADD CONSTRAINT "users_cycle_length_chk" CHECK ("cycle_length" IS NULL OR "cycle_length" BETWEEN 15 AND 60);
