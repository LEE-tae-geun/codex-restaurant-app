# Restaurant App (sample scaffold)

This folder contains a minimal Next.js + TypeScript scaffold with Prisma (SQLite) and basic API routes for "places" and "reservations".

Quick start:

1. cd restaurant-app
2. npm install
3. npx prisma generate
4. npx prisma migrate dev --name init
5. npm run dev

Notes:
- The `/api/places` endpoint returns mock place data. Replace it with Kakao/Google API integration.
- The `/api/reservations` endpoint persists reservations to SQLite via Prisma.

Environment variables
- Copy `.env.example` to `.env` and fill your Kakao keys if you want real place search:

  1. `cp .env.example .env`
  2. Set `KAKAO_REST_API_KEY` to your Kakao REST API key (server-side). Optionally set `NEXT_PUBLIC_KAKAO_JS_KEY` for client maps.

When `KAKAO_REST_API_KEY` is set the `/api/places` route will call Kakao Local Search (keyword) and return results; otherwise it falls back to the built-in mock data for development.
