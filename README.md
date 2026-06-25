# LaundryOS — Multi-Tenant Laundry Billing & Management Platform

A SaaS platform where one operator hosts many independent laundry shops. Each
shop runs its own customers, staff, pricing, orders, billing and reports while
the platform admin manages every tenant centrally.

Built entirely on **free / open-source** tooling and deployable on **free
hosting tiers** (Render + Neon/Supabase Postgres + Vercel).

---

## Architecture

```
Platform
 └── Shop (tenant)
      ├── Users (Shop Admin · Billing Executive · Laundry Staff)
      ├── Customers
      ├── Services & Pricing (catalogue)
      └── Order ──► OrderItems ──► Invoice ──► Payments
```

**Tenancy model:** shared database, every tenant row carries a `shopId`.
Isolation is enforced centrally by [`resolveShopId()`](backend/src/common/tenant.ts):
shop-scoped users are pinned to their own shop, and a JWT carries `{ sub, role, shopId }`.

### Stack

| Layer    | Tech                                                       |
| -------- | ---------------------------------------------------------- |
| Backend  | NestJS 10 · Prisma · PostgreSQL · JWT/Passport · Swagger   |
| Frontend | Next.js · React · TanStack Query · Tailwind · Zustand      |
| Invoices | jsPDF + QR code (client-side, no paid service)             |
| Hosting  | Render (API) · Neon/Supabase (DB) · Vercel (web) — all free |

---

## Roles (RBAC)

| Role                | Scope        | Can do                                             |
| ------------------- | ------------ | -------------------------------------------------- |
| `PLATFORM_ADMIN`    | All tenants  | Create/suspend shops, global analytics             |
| `SHOP_ADMIN`        | Own shop     | Staff, customers, pricing, billing, reports, settings |
| `BILLING_EXECUTIVE` | Own shop     | Create orders, bills, collect payments             |
| `LAUNDRY_STAFF`     | Own shop     | Update order status through the lifecycle          |

---

## Local development

### Option A — Docker (one command)

```bash
docker compose up --build
```

- API → http://localhost:8000/api  (Swagger: `/api/docs`)
- Web → http://localhost:3000

### Option B — manual

```bash
# 1. Postgres (or use a free Neon/Supabase URL)
# 2. Backend
cd backend
cp .env.example .env          # set DATABASE_URL + JWT_SECRET
npm install
npx prisma migrate dev --name init
npm run prisma:seed
npm run start:dev             # http://localhost:8000/api

# 3. Frontend
cd ../frontend
cp .env.example .env.local    # NEXT_PUBLIC_API_URL=http://localhost:8000/api
npm install
npm run dev                   # http://localhost:3000
```

### Seeded logins

| Role           | Email                  | Password    |
| -------------- | ---------------------- | ----------- |
| Platform admin | admin@laundryos.dev    | Admin@123   |
| Shop admin     | owner@sparkle.dev      | Owner@123   |
| Billing staff  | counter@sparkle.dev    | Counter@123 |

The seed also creates a demo shop (*Sparkle Laundry*), a price list, a customer,
and one sample order + partially-paid invoice.

---

## API surface (Phase 1)

| Area      | Routes                                                        |
| --------- | ------------------------------------------------------------ |
| Auth      | `POST /auth/login` · `POST /auth/register-shop` · `GET /auth/me` |
| Shops     | `GET/POST /shops` · `PATCH /shops/:id` · `PATCH /shops/:id/status` |
| Users     | `GET/POST /users` · `PATCH /users/:id`                       |
| Customers | `GET/POST /customers` · `GET/PATCH /customers/:id`           |
| Services  | `GET/POST /services` · `GET/PATCH /services/:id`             |
| Orders    | `GET/POST /orders` · `GET /orders/:id` · `PATCH /orders/:id/status` |
| Invoices  | `GET /invoices` · `GET /invoices/:id`                        |
| Payments  | `POST /payments` · `GET /payments/invoice/:id`              |
| Analytics | `GET /analytics/shop` · `GET /analytics/platform`           |

Full interactive docs at `/api/docs`.

---

## Billing engine

All invoice math lives in one pure, testable function:
[`computeBill()`](backend/src/orders/billing.ts) — subtotal → discount (fixed/%) →
extra charges → GST (inclusive/exclusive). The same logic is mirrored on the
frontend so the counter sees a live total before saving.

---

## Roadmap (from the PRD)

- **Phase 1 (this build):** shops, users, customers, pricing, orders, billing, payments, analytics.
- **Phase 2:** customer portal, pickup/delivery, WhatsApp/SMS notifications.
- **Phase 3:** multi-branch, loyalty, QR tag tracking, franchise.
- **Phase 4:** AI demand forecasting, pricing suggestions.
