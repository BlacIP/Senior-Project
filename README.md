# LocalLink Marketplace

LocalLink Marketplace is a CSE 499 senior project for connecting local vendors,
including farmers and craftspeople, with customers who want locally sourced
products.

## Sprint 1 Scope

- Next.js App Router project setup with TypeScript, Tailwind CSS, and shadcn/ui.
- API-based backend foundation using Next.js route handlers.
- Neon Auth for sign-up, login, logout, and session management.
- Email verification is required after sign-up before users can log in.
- Neon PostgreSQL database foundation using Drizzle ORM behind the API layer.
- User registration and login foundation for customer and vendor roles.
- Vendor profile onboarding.
- Product listing foundation with name, description, price, category, city, stock,
  and image URL placeholder.
- Basic homepage, authentication screens, marketplace shell, and vendor dashboard.

## Architecture

The app is organized so the frontend and backend are separated by API contracts:

- Frontend pages and client components live under `src/app` and `src/components`.
- Backend API routes live under `src/app/api`.
- Backend business logic lives under `src/server`.
- Database schema and connection helpers live under `src/db`.

This keeps the web frontend from calling the database directly. A future mobile app
can reuse the same API endpoints.

## Current API Endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `ANY /api/auth/[...path]` proxies Neon Auth built-in routes.
- `GET /api/products`
- `GET /api/vendor/profile`
- `POST /api/vendor/profile`
- `GET /api/vendor/products`
- `POST /api/vendor/products`

## Setup

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Then add your Neon connection string, enable Neon Auth in the Neon console, and
set `NEON_AUTH_BASE_URL` plus a long random `NEON_AUTH_COOKIE_SECRET`.

Install dependencies and push the schema:

```bash
npm install
npm run db:push
npm run dev
```

Open http://localhost:3000.

## Scripts

- `npm run dev` starts the development server.
- `npm run build` creates a production build.
- `npm run lint` runs ESLint.
- `npm run db:generate` generates Drizzle migrations.
- `npm run db:push` pushes the schema to Neon for development.
- `npm run db:seed` creates demo admin, customer, vendor, and product data.
- `npm run db:studio` opens Drizzle Studio.

## Demo Accounts

After running `npm run db:seed`, these accounts are available:

- Admin: `admin@locallink.test`
- Customer: `customer@locallink.test`
- Vendor: `vendor@locallink.test`
- Vendor: `vendor2@locallink.test`

The default seed password is `Password123!`. Override it with
`DEMO_SEED_PASSWORD` in `.env.local` if needed.

Name: Boluwatife Adebiyi Omotoyinbo

Quote: "Just do it, live it and repeat"
