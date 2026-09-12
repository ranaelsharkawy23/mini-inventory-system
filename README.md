# Mini Inventory System

A full-stack inventory management system supporting multiple warehouses and stock operations
(add, remove, transfer), built as a technical assignment for Invia.

- **Backend:** Node.js + TypeScript + Express + Prisma ORM
- **Database:** PostgreSQL
- **Frontend:** React + TypeScript (Vite), plain CSS
- **Auth:** JWT (JSON Web Tokens) with bcrypt-hashed passwords
- **Testing:** Jest, integration tests against a real Postgres database

## Features

**Core requirements**
- Add stock, remove stock, and transfer stock between warehouses
- Transfers update both warehouses inside a single database transaction — either both sides
  update or neither does
- View a list of products, expand any product to see its inventory per warehouse
- Create new products and warehouses from the UI
- RESTful API, runnable locally with Docker + two `npm install` commands

**Bonus enhancements implemented**
- **Stock movement logging** — every add/remove/transfer is recorded in an audit log
  (`StockMovement` table), viewable via `GET /api/inventory/movements` and shown live in the UI
- **Authentication** — real user accounts with hashed passwords (bcrypt) and JWT-based session
  tokens; every data endpoint requires a valid token
- **Automated tests** — 8 integration tests covering `addStock`, `removeStock`, and
  `transferStock`, including their validation and error-handling paths, run against a real
  (isolated) test database

## Getting started on a new machine

These steps assume a fresh laptop with nothing installed yet — follow them in order.

### 1. Prerequisites

- **Git** — to clone the repository
- **Node.js 18+** (includes npm) — download from nodejs.org (LTS version)
- **Docker Desktop** — for running PostgreSQL locally without installing it directly

### 2. Clone the repository

```bash
git clone https://github.com/<your-username>/mini-inventory-system.git
cd mini-inventory-system
```

### 3. Start the database

```bash
docker compose up -d
```

Starts Postgres on `localhost:5432` with database `inventory`, user `postgres`, password
`postgres` (local dev defaults only — see `docker-compose.yml`).

### 4. Set up the backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` (copy from the values below — there is no committed
`.env`, since it's excluded from git for security):
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/inventory?schema=public"
PORT=4000
JWT_SECRET=<any long random string>


Then create the database tables and (optionally) add sample data:

```bash
npm run prisma:migrate
npm run seed
```

Start the API:

```bash
npm run dev
```

The backend runs at `http://localhost:4000`. Leave this terminal running.

### 5. Set up the frontend

In a **second** terminal:

```bash
cd frontend
npm install
```

Create a `.env` file in `frontend/`:
VITE_API_KEY=unused


*(Note: this line is a leftover placeholder and not read by the current auth system — real
authentication is handled via the login screen, not an env-based key. Safe to omit.)*

Start the frontend:

```bash
npm run dev
```

Open `http://localhost:5173`. You'll land on a login screen — click "Need an account?
Register" to create your first user, then you're in.

### 6. Running the tests

Tests run against a **separate** database (`inventory_test`) so they never touch your real
data. One-time setup:

```bash
docker compose exec postgres psql -U postgres -c "CREATE DATABASE inventory_test;"
```

Then, from `backend/`:

```bash
npm test
```

This automatically applies migrations to the test database first (via the `pretest` script),
then runs all tests. You should see 8 passing tests covering add/remove/transfer stock
operations and their validation rules.

## API reference

All endpoints except `/api/health`, `/api/auth/register`, and `/api/auth/login` require an
`Authorization: Bearer <token>` header, obtained by logging in.

| Method | Path                        | Auth required | Body                                                       | Description                          |
|--------|-----------------------------|:---:|---------------------------------------------------------------------|---------------------------------------|
| GET    | `/api/health`               | No  | —                                                                     | Health check                          |
| POST   | `/api/auth/register`        | No  | `{ email, password }`                                                | Create an account, returns a token    |
| POST   | `/api/auth/login`           | No  | `{ email, password }`                                                | Log in, returns a token               |
| GET    | `/api/products`             | Yes | —                                                                     | List products with per-warehouse inventory |
| POST   | `/api/products`             | Yes | `{ sku, name, description? }`                                        | Create a product                     |
| GET    | `/api/warehouses`           | Yes | —                                                                     | List warehouses                      |
| POST   | `/api/warehouses`           | Yes | `{ name, location? }`                                                | Create a warehouse                   |
| POST   | `/api/inventory/add`        | Yes | `{ productId, warehouseId, quantity }`                               | Add stock                            |
| POST   | `/api/inventory/remove`     | Yes | `{ productId, warehouseId, quantity }`                               | Remove stock (fails if insufficient) |
| POST   | `/api/inventory/transfer`   | Yes | `{ productId, fromWarehouseId, toWarehouseId, quantity }`            | Move stock between warehouses         |
| GET    | `/api/inventory/movements`  | Yes | —                                                                     | Recent stock movement history (audit log) |

All errors return `{ "error": "message" }` with an appropriate status code (400 for validation
failures, 401 for missing/invalid auth, 404 for unknown ids, 500 for unexpected errors).

## Data model
User (id, email, passwordHash, createdAt)
Warehouse (id, name, location, createdAt)
Product (id, sku, name, description, createdAt)
InventoryItem (id, productId, warehouseId, quantity) -- one row per product+warehouse
StockMovement (id, type, productId, warehouseId, quantity, createdAt) -- audit log


`InventoryItem` has a unique constraint on `(productId, warehouseId)`, so "how much of product
X is in warehouse Y" is always exactly one row, updated atomically rather than derived by
summing a movements table.

## Transactions

`removeStock` and `transferStock` (in `backend/src/services/inventoryService.ts`) run inside
`prisma.$transaction(...)`. A transfer specifically: checks the source has enough stock,
decrements the source, creates-or-increments the destination, and logs both movement rows, all
inside one database transaction. If any step fails, Postgres rolls back everything, so stock can
never be deducted from one warehouse without correctly appearing in the other.

## Authentication design and trade-offs

Authentication uses per-user accounts (bcrypt-hashed passwords, never stored in plain text) and
JWTs issued on login, verified on every protected request via middleware
(`backend/src/auth.ts`). Tokens expire after 7 days.

Worth being explicit about scope, since this was built as an optional enhancement: this is a
standard, reasonable implementation for an assignment of this size, but a production system
would likely add: refresh tokens (so a user isn't fully logged out the instant a 7-day token
expires), rate-limiting on the login endpoint (to slow down brute-force password guessing), and
possibly moving the token from browser `localStorage` to an `httpOnly` cookie (which JavaScript
cannot read at all, closing off a theoretical XSS-based token-theft vector that `localStorage`
doesn't fully protect against).

## Assumptions & design decisions

- **Quantities are non-negative integers.** Removing/transferring more than is available in a
  warehouse is rejected with a 400 error rather than allowing negative stock.
- **A warehouse doesn't need an explicit inventory row to receive stock.** Adding or transferring
  stock into a warehouse a product has never been in creates the row automatically at quantity
  zero first — no manual "initialization" step is required.
- **SKU, warehouse name, and user email are all unique**, enforced at the database level, not
  just in application code.
- **Login error messages are deliberately identical** whether an email doesn't exist or the
  password is wrong, to avoid revealing which emails have registered accounts.
- **IDs are auto-incrementing integers**, not UUIDs — a deliberate choice for this scale of
  application; integers are smaller, faster to index and join, and this system has no need for
  the distributed-uniqueness or non-guessability properties UUIDs provide.
- **`bcryptjs` over `bcrypt`** for password hashing — the native `bcrypt` package requires
  compiling C++ code during install, which frequently fails on Windows without build tools set
  up; `bcryptjs` is a pure-JavaScript equivalent that installs reliably everywhere, at a small
  (irrelevant at this scale) cost to raw speed.
- **The stock movement log caps at the 100 most recent entries** (no pagination). A reasonable
  scope cut for an assignment-sized dataset; a production system handling years of history would
  paginate this properly.
- **CORS is currently open to all origins.** Appropriate for local development, but a real
  deployment would restrict this to the actual frontend's domain rather than allowing any site
  to call the API.
- **Password policy is minimal** — 8 characters minimum, no complexity rules, no rate-limiting
  on login attempts. Deliberately simple for this scope; documented as a known gap rather than
  an oversight.
- **Same-warehouse transfers are explicitly rejected** as an invalid operation, not silently
  treated as a no-op — a transfer implies moving stock somewhere else.
- **Tests use a real, isolated database rather than mocking Prisma.** The value being tested is
  the transaction behavior itself (does a failed check really roll back both sides); mocking the
  database out would test nothing meaningful about that guarantee.
- **No frontend state management library** (Redux, Zustand, etc.) — plain React `useState` and
  props were sufficient for an app this size; adding one would be extra complexity with no real
  benefit here.
  

## Possible next steps

- Pagination on `/api/products` and `/api/inventory/movements` as data grows
- Refresh tokens and rate-limiting on login (see Authentication section above)
- Role-based permissions (e.g., only certain users can create warehouses)
