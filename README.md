# Wellness App

Monorepo: **NestJS + Prisma + PostgreSQL/PostGIS** backend, **Angular (standalone) + TailwindCSS** frontend.

```
.
├── docker-compose.yml           # PostgreSQL 16 + PostGIS 3.4 (+ opsiyonel pgAdmin)
├── docker/postgres/init/        # İlk açılışta çalışan SQL (extension'lar)
├── apps/
│   ├── backend/                 # NestJS 12 (ESM)
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/      # init migration + PostGIS trigger & CHECK'ler
│   │   ├── prisma.config.ts
│   │   └── src/
│   │       ├── config/          # env doğrulama
│   │       ├── prisma/          # PrismaModule (global) + PrismaService (adapter-pg)
│   │       ├── generated/       # Prisma Client (git'e girmez)
│   │       └── modules/
│   │           ├── health/  auth/  users/
│   │           ├── events/      # PostGIS ST_DWithin yakınlık sorgusu
│   │           ├── bookings/  recipes/  sessions/  cycle/
│   └── frontend/                # Angular 22
│       └── src/app/
│           ├── core/            # models, services (ApiService), interceptors
│           ├── shared/          # yeniden kullanılabilir UI bileşenleri
│           ├── layout/          # Shell (navbar + router-outlet)
│           └── features/        # auth, events, nutrition, cycle, sessions (lazy)
```

## Başlangıç

```bash
npm run install:all
cp .env.example .env && cp apps/backend/.env.example apps/backend/.env
npm run db:up            # PostGIS container
npm run db:migrate       # migration'ları uygula + client üret
npm run dev:backend      # http://localhost:3000/api  (GET /api/health)
npm run dev:frontend     # http://localhost:4200
```

pgAdmin: `docker compose --profile tools up -d` → http://localhost:5050

## Notlar

- `Event.location` (`geography(Point,4326)`) **DB trigger'ı** ile `latitude/longitude`'dan otomatik doldurulur; Prisma Client'ta yazılamaz (`Unsupported`), yakınlık sorguları `$queryRaw` ile yapılır (bkz. `events.service.ts`).
- `Recipe.cyclePhaseSupport` bir tarifin birden fazla fazı desteklemesi için **enum dizisi**dir.
- KVKK denetimi için `User.kvkkConsentAt` alanı eklenmiştir.
