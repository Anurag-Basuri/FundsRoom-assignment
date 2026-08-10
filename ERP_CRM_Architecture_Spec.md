# Mini ERP + CRM Operations Portal
## Complete Technical Architecture & Build Specification

**Purpose of this document:** This is a single source-of-truth engineering spec for the "Full Stack Developer Case Study" assignment. It defines the system design pattern, the exact tech stack, the folder structure, the database design, every module's internal logic, the API contract, the diagrams (DFD/ERD/sequence/state), and the deployment plan. It is written so that it can be handed directly to a developer or an AI coding agent and built end-to-end without further clarification.

---

## Table of Contents

1. Executive Summary
2. System Design Pattern
3. Tech Stack (Full Breakdown)
4. High-Level Architecture Diagram
5. Data Flow Diagrams (DFD Level 0 & 1)
6. Database Design (ERD + Schema)
7. Backend Folder Structure
8. Backend Module-by-Module Breakdown
9. Authentication & RBAC Strategy
10. API Endpoint Reference
11. Real-Time Layer (Socket.io) Strategy
12. Frontend Architecture
13. Validation & Error Handling Strategy
14. Core Business Logic (Stock, Challan Numbering, Snapshots)
15. Security Considerations
16. Deployment Strategy (Render + Netlify)
17. Testing Strategy
18. Bonus Feature Implementation Notes
19. 48-Hour Execution Roadmap
20. Coding Conventions
21. Assumptions & Known Limitations (Template)
22. Submission Checklist

---

## 1. Executive Summary

We are building a **Mini ERP + CRM Operations Portal** for a wholesale/distribution company. Internal users (Admin, Sales, Warehouse, Accounts) will log in with role-based access and operate four connected modules: **Customer CRM**, **Product & Inventory**, **Sales Challan**, and a **Reporting Dashboard**.

The system is a classic **3-tier web application**:

- **Frontend:** React 18 + TypeScript SPA, deployed on **Netlify**.
- **Backend:** Node.js + TypeScript REST API (Express.js) with a layered architecture, deployed on **Render**.
- **Database:** PostgreSQL (Render Postgres or Neon), accessed through Sequelize ORM.
- **Real-time layer:** Socket.io, for live stock alerts and challan status updates, running on the same Render service.

The backend strictly follows the folder pattern requested: `routes → middlewares → controllers → services → models`, plus `socket`, `utils`, `app.ts`, `db.ts`, `server.ts`. The frontend follows a page/feature-based React + TypeScript structure with a clear API layer, global state, and reusable UI components.

---

## 2. System Design Pattern

### 2.1 Pattern: Layered Architecture (MVC-inspired, with an explicit Service Layer)

We are **not** using a pure MVC pattern (no server-side views — this is a pure REST API consumed by a React SPA), and we are **not** using NestJS's decorator/module system. Instead we use a **layered/N-tier architecture**, which is the industry-standard pattern for Express + TypeScript APIs and maps 1:1 to the folder structure requested:

```
Client (React)
   │  HTTP / WebSocket
   ▼
Routes            → declares URL + HTTP method, wires middleware + controller
   ▼
Middlewares       → auth, role guard, request validation, rate limiting
   ▼
Controllers       → parses req/res, calls the right service, shapes the HTTP response
   ▼
Services          → ALL business logic lives here (stock checks, transactions, calculations)
   ▼
Models            → Sequelize models = the only layer that talks to the database
   ▼
PostgreSQL
```

**Why this pattern:**

| Reason | Explanation |
|---|---|
| Separation of concerns | Each layer has exactly one job. Controllers never touch the DB directly; Services never touch `req`/`res`. |
| Testability | Services are plain functions/classes that can be unit-tested without spinning up Express or a real HTTP request. |
| Predictability for an agent/dev | Any new feature always follows the same 5-step recipe: route → middleware → controller → service → model. No guessing where logic belongs. |
| Matches the required folder convention | `controllers/`, `middlewares/`, `models/`, `routes/`, `services/`, `socket/`, `utils/`, `app.ts`, `db.ts`, `server.ts` — exactly as specified. |
| Scales cleanly | New modules (e.g., "Purchase Orders" later) just add one file per layer, without touching existing modules. |

### 2.2 Rule of thumb for every request

> **Controller = thin.** It only does: validate input already done by middleware → call one service method → send response/handle error via `next(err)`.
> **Service = fat.** All business rules, transactions, and orchestration across multiple models live here.
> **Model = dumb.** Only schema definition, associations, and simple instance/class methods (e.g., `toSafeJSON()`).

### 2.3 Layered Architecture Diagram

```mermaid
flowchart TD
    R[Routes] --> M1["Middlewares<br/>(auth · role · validate · rate-limit)"]
    M1 --> Ctrl[Controllers]
    Ctrl --> Svc["Services<br/>(business logic + transactions)"]
    Svc --> Mdl["Models<br/>(Sequelize)"]
    Mdl --> DB[(PostgreSQL)]
    Ctrl --> Utl[Utils]
    Svc --> Utl
    Svc --> Sock["Socket Emitter<br/>(real-time events)"]
```

---

## 3. Tech Stack (Full Breakdown)

### 3.1 Backend

| Concern | Choice | Why |
|---|---|---|
| Runtime | Node.js (LTS) | Required by assignment |
| Language | TypeScript | Type safety across the whole stack, shared DTO thinking with frontend |
| Framework | **Express.js** | Assignment allows Express or NestJS; Express is chosen because it maps directly to the requested `routes/controllers/middlewares/services` folder pattern without fighting a framework's own module/decorator system |
| Database | **PostgreSQL** | Required by assignment; relational integrity fits ERP data (customers, products, challans) |
| ORM | **Sequelize** (with TypeScript) | Mature, stable, huge community, first-class migrations/seeders via `sequelize-cli`, and naturally produces a `models/` folder — a perfect match for the requested structure. Supports both PostgreSQL and MySQL, so the DB choice stays flexible. |
| Validation | **Zod** | TypeScript-first schema validation, infers static types from schemas, very popular and actively maintained |
| Auth | **jsonwebtoken** + **bcrypt** | Simple JWT auth as explicitly allowed by the assignment |
| Real-time | **Socket.io** | Industry-standard WebSocket library with fallback support, room/namespace support for role-based broadcast |
| Logging | **winston** (app logs) + **morgan** (HTTP request logs) | Standard, stable combo |
| Security middleware | **helmet**, **cors**, **express-rate-limit**, **hpp**, **compression** | Standard hardening stack |
| File uploads (bonus) | **multer** (+ **@aws-sdk/client-s3** for S3) | Standard upload handling, modern AWS SDK v3 |
| PDF generation (bonus) | **pdfkit** | Lightweight, no headless browser needed, good enough for structured invoice PDFs |
| Env management | **dotenv** | Standard |
| Dev tooling | **ts-node-dev** (or `tsx`), **nodemon** (optional) | Fast reload in dev |
| Testing (bonus) | **Jest** + **Supertest** + **ts-jest** | Standard Node/TS testing stack |
| Linting/formatting | **ESLint** + **Prettier** | Standard |

**package.json — key dependencies (backend)**

```json
{
  "dependencies": {
    "express": "^4.19.0",
    "sequelize": "^6.37.0",
    "pg": "^8.12.0",
    "pg-hstore": "^2.3.4",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "zod": "^3.23.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "hpp": "^0.2.3",
    "compression": "^1.7.4",
    "morgan": "^1.10.0",
    "winston": "^3.13.0",
    "dotenv": "^16.4.5",
    "socket.io": "^4.7.5",
    "multer": "^1.4.5-lts.1",
    "pdfkit": "^0.15.0",
    "express-rate-limit": "^7.2.0",
    "uuid": "^9.0.1"
  },
  "devDependencies": {
    "typescript": "^5.4.0",
    "ts-node-dev": "^2.0.0",
    "sequelize-cli": "^6.6.2",
    "eslint": "^8.57.0",
    "prettier": "^3.2.5",
    "jest": "^29.7.0",
    "supertest": "^6.3.4",
    "ts-jest": "^29.1.2",
    "@types/express": "^4.17.21",
    "@types/node": "^20.12.0",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/bcrypt": "^5.0.2",
    "@types/cors": "^2.8.17",
    "@types/multer": "^1.4.11"
  }
}
```

### 3.2 Frontend

| Concern | Choice | Why |
|---|---|---|
| Library | **React 18** | Required |
| Language | **TypeScript** | Required |
| Build tool | **Vite** | Fast, standard, minimal config, first-class TS + React support |
| Routing | **react-router-dom v6** | Standard SPA routing |
| Server state / data fetching | **TanStack Query (React Query)** | Handles caching, loading/error states, refetching, and pagination for all REST calls — removes the need to hand-roll `useEffect` fetch logic everywhere |
| Client/global state | **Zustand** | Tiny, stable store for auth/session state (current user, role, token) — simpler than Redux for this scope while still being a widely-adopted, production-grade library |
| HTTP client | **Axios** | Interceptors for attaching JWT and handling 401/refresh centrally |
| Forms | **React Hook Form** + **Zod** (via `@hookform/resolvers`) | Same validation schemas can be shared/mirrored with backend Zod schemas, minimal re-renders |
| UI styling | **Tailwind CSS** | Utility-first, fast to build a clean admin UI |
| UI components | **shadcn/ui** (built on Radix UI primitives) | Accessible, unstyled-by-default components you own the code for — pairs perfectly with Tailwind, extremely popular for admin dashboards |
| Data tables | **TanStack Table** | Sorting/filtering/pagination for Customers, Products, Challans lists |
| Charts | **Recharts** | Dashboard KPIs (sales trend, low-stock count) |
| Icons | **lucide-react** | Clean, consistent icon set (also what shadcn/ui uses by default) |
| Toasts/notifications | **sonner** | Lightweight toast notifications for success/error feedback |
| Dates | **date-fns** | Lightweight date formatting/parsing |
| Real-time client | **socket.io-client** | Matches backend Socket.io |
| Testing (bonus) | **Vitest** + **React Testing Library** | Standard Vite-native testing stack |
| Linting/formatting | **ESLint** + **Prettier** | Standard |

**package.json — key dependencies (frontend)**

```json
{
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.23.0",
    "@tanstack/react-query": "^5.40.0",
    "@tanstack/react-table": "^8.17.0",
    "zustand": "^4.5.0",
    "axios": "^1.7.0",
    "react-hook-form": "^7.51.0",
    "@hookform/resolvers": "^3.4.0",
    "zod": "^3.23.0",
    "recharts": "^2.12.0",
    "lucide-react": "^0.383.0",
    "sonner": "^1.4.0",
    "date-fns": "^3.6.0",
    "socket.io-client": "^4.7.5",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.3.0"
  },
  "devDependencies": {
    "vite": "^5.2.0",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.4.0",
    "tailwindcss": "^3.4.0",
    "postcss": "^8.4.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.57.0",
    "prettier": "^3.2.5",
    "vitest": "^1.6.0",
    "@testing-library/react": "^15.0.0"
  }
}
```

### 3.3 DevOps / Deployment

| Concern | Choice |
|---|---|
| Backend hosting | **Render** (Web Service, Node) |
| Database hosting | **Render PostgreSQL** (or **Neon**, free-tier friendly alternative) |
| Frontend hosting | **Netlify** (static site, built via Vite) |
| CI (bonus) | **GitHub Actions** — lint + typecheck + test on every push/PR |
| Containerization (bonus) | **Docker** + `docker-compose` for local parity (Postgres + backend) |
| Version control | Git + GitHub, Conventional Commits |

---

## 4. High-Level Architecture Diagram

```mermaid
flowchart LR
    subgraph Client["Client Layer"]
        A["React + TypeScript SPA<br/>Hosted on Netlify"]
    end
    subgraph Server["Application Layer (Render)"]
        B["Express.js REST API<br/>Node.js + TypeScript"]
        C["Socket.io Server<br/>(shared HTTP server with B)"]
    end
    subgraph Data["Data Layer"]
        D[("PostgreSQL Database<br/>Render Postgres / Neon")]
    end

    A -- "REST calls: Axios + JWT Bearer token" --> B
    A <-- "WebSocket: stock alerts, challan events" --> C
    B -- "Sequelize ORM queries" --> D
    C --- B
```

---

## 5. Data Flow Diagrams (DFD)

### 5.1 DFD — Level 0 (Context Diagram)

```mermaid
flowchart LR
    Sales[Sales User]
    Warehouse[Warehouse User]
    Accounts[Accounts User]
    Admin[Admin User]
    Sys(("0.0<br/>Mini ERP + CRM<br/>Operations Portal"))

    Sales -- "Customer data, Challan requests" --> Sys
    Sys -- "Customer list, Challan status" --> Sales
    Warehouse -- "Stock updates, Product data" --> Sys
    Sys -- "Stock alerts, Product list" --> Warehouse
    Accounts -- "Report requests" --> Sys
    Sys -- "Sales reports, Invoices" --> Accounts
    Admin -- "User & role management" --> Sys
    Sys -- "System configuration data" --> Admin
```

### 5.2 DFD — Level 1 (Major Processes)

```mermaid
flowchart TD
    Sales[Sales User]
    Warehouse[Warehouse User]
    Accounts[Accounts User]
    Admin[Admin User]

    P1(("1.0 Authenticate<br/>and Authorize"))
    P2(("2.0 Manage Customer<br/>and CRM"))
    P3(("3.0 Manage Product<br/>and Inventory"))
    P4(("4.0 Process Sales<br/>Challan"))
    P5(("5.0 Generate Reports<br/>and Dashboard"))

    D1[("D1 Users")]
    D2[("D2 Customers / FollowUps")]
    D3[("D3 Products")]
    D4[("D4 StockMovements")]
    D5[("D5 Challans / ChallanItems")]

    Sales --> P1
    Warehouse --> P1
    Accounts --> P1
    Admin --> P1
    P1 <--> D1

    Sales --> P2
    P2 <--> D2

    Warehouse --> P3
    P3 <--> D3
    P3 --> D4

    Sales --> P4
    P4 <--> D5
    P4 --> D4
    P4 --> D3

    Accounts --> P5
    P5 --> D5
    P5 --> D3
    P5 --> D2
```

---

## 6. Database Design

### 6.1 Entity Relationship Diagram

```mermaid
erDiagram
    USER {
        uuid id PK
        string name
        string email
        string password_hash
        string role
        boolean is_active
        timestamp created_at
    }
    CUSTOMER {
        uuid id PK
        string name
        string mobile
        string email
        string business_name
        string gst_number
        string customer_type
        string address
        string status
        date follow_up_date
        text notes
        uuid created_by FK
        timestamp created_at
    }
    FOLLOW_UP {
        uuid id PK
        uuid customer_id FK
        text note
        date follow_up_date
        uuid created_by FK
        timestamp created_at
    }
    PRODUCT {
        uuid id PK
        string name
        string sku
        string category
        decimal unit_price
        int current_stock
        int min_stock_alert
        string location
        timestamp created_at
    }
    STOCK_MOVEMENT {
        uuid id PK
        uuid product_id FK
        int quantity_changed
        string movement_type
        string reason
        uuid created_by FK
        timestamp created_at
    }
    CHALLAN {
        uuid id PK
        string challan_number
        uuid customer_id FK
        string status
        int total_quantity
        decimal total_amount
        uuid created_by FK
        timestamp created_at
        timestamp confirmed_at
    }
    CHALLAN_ITEM {
        uuid id PK
        uuid challan_id FK
        uuid product_id FK
        string product_name_snapshot
        string sku_snapshot
        decimal unit_price_snapshot
        int quantity
    }

    USER ||--o{ CUSTOMER : creates
    USER ||--o{ FOLLOW_UP : logs
    CUSTOMER ||--o{ FOLLOW_UP : has
    USER ||--o{ STOCK_MOVEMENT : records
    PRODUCT ||--o{ STOCK_MOVEMENT : tracks
    USER ||--o{ CHALLAN : creates
    CUSTOMER ||--o{ CHALLAN : places
    CHALLAN ||--o{ CHALLAN_ITEM : contains
    PRODUCT ||--o{ CHALLAN_ITEM : referenced_in
```

### 6.2 Table Definitions

**users**

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK, default `gen_random_uuid()` |
| name | VARCHAR(120) | NOT NULL |
| email | VARCHAR(160) | NOT NULL, UNIQUE |
| password_hash | VARCHAR | NOT NULL |
| role | ENUM('Admin','Sales','Warehouse','Accounts') | NOT NULL |
| is_active | BOOLEAN | default `true` |
| created_at / updated_at | TIMESTAMP | auto |

**customers**

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR(120) | NOT NULL |
| mobile | VARCHAR(20) | NOT NULL |
| email | VARCHAR(160) | nullable |
| business_name | VARCHAR(160) | nullable |
| gst_number | VARCHAR(20) | nullable |
| customer_type | ENUM('Retail','Wholesale','Distributor') | NOT NULL |
| address | TEXT | nullable |
| status | ENUM('Lead','Active','Inactive') | default `Lead` |
| follow_up_date | DATE | nullable |
| notes | TEXT | nullable |
| created_by | UUID | FK → users.id |
| created_at / updated_at | TIMESTAMP | auto |

**follow_ups**

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| customer_id | UUID | FK → customers.id, NOT NULL |
| note | TEXT | NOT NULL |
| follow_up_date | DATE | nullable |
| created_by | UUID | FK → users.id |
| created_at | TIMESTAMP | auto |

**products**

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| name | VARCHAR(160) | NOT NULL |
| sku | VARCHAR(60) | NOT NULL, UNIQUE |
| category | VARCHAR(80) | nullable |
| unit_price | DECIMAL(12,2) | NOT NULL, ≥ 0 |
| current_stock | INTEGER | NOT NULL, default 0, ≥ 0 (DB check constraint) |
| min_stock_alert | INTEGER | default 10 |
| location | VARCHAR(120) | nullable |
| created_at / updated_at | TIMESTAMP | auto |

**stock_movements**

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| product_id | UUID | FK → products.id, NOT NULL |
| quantity_changed | INTEGER | NOT NULL |
| movement_type | ENUM('IN','OUT') | NOT NULL |
| reason | VARCHAR(255) | NOT NULL (e.g. "Sales Challan CH-2026-000123", "Manual restock") |
| created_by | UUID | FK → users.id |
| created_at | TIMESTAMP | auto |

**challans**

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| challan_number | VARCHAR(30) | NOT NULL, UNIQUE (e.g. `CH-2026-000123`) |
| customer_id | UUID | FK → customers.id, NOT NULL |
| status | ENUM('Draft','Confirmed','Cancelled') | default `Draft` |
| total_quantity | INTEGER | computed on save |
| total_amount | DECIMAL(14,2) | computed on save |
| created_by | UUID | FK → users.id |
| created_at | TIMESTAMP | auto |
| confirmed_at | TIMESTAMP | nullable |

**challan_items**

| Column | Type | Constraints |
|---|---|---|
| id | UUID | PK |
| challan_id | UUID | FK → challans.id, NOT NULL, `ON DELETE CASCADE` |
| product_id | UUID | FK → products.id, NOT NULL |
| product_name_snapshot | VARCHAR(160) | NOT NULL — copied at creation time |
| sku_snapshot | VARCHAR(60) | NOT NULL — copied at creation time |
| unit_price_snapshot | DECIMAL(12,2) | NOT NULL — copied at creation time |
| quantity | INTEGER | NOT NULL, > 0 |

> **Why snapshot fields?** The assignment explicitly requires "Challan should store product snapshot data, not only product ID." If a product's price or name changes later, historical challans must still show what was actually sold at that time. `product_id` is kept for reference/joins, but `product_name_snapshot`, `sku_snapshot`, and `unit_price_snapshot` are the source of truth for display and totals.

---

## 7. Backend Folder Structure

```
backend/
├── src/
│   ├── app.ts                     # Express app config: middleware chain, route mounting, error handler
│   ├── server.ts                  # Creates HTTP server, attaches Socket.io, starts listening on PORT
│   ├── db.ts                      # Sequelize instance creation + connection test + model loading
│   ├── config/
│   │   └── env.ts                 # Centralized, validated process.env access (via zod)
│   ├── routes/
│   │   ├── index.ts               # Combines all sub-routers under /api
│   │   ├── auth.routes.ts
│   │   ├── user.routes.ts
│   │   ├── customer.routes.ts
│   │   ├── product.routes.ts
│   │   ├── stock.routes.ts
│   │   ├── challan.routes.ts
│   │   └── dashboard.routes.ts
│   ├── controllers/
│   │   ├── auth.controller.ts
│   │   ├── user.controller.ts
│   │   ├── customer.controller.ts
│   │   ├── product.controller.ts
│   │   ├── stock.controller.ts
│   │   ├── challan.controller.ts
│   │   └── dashboard.controller.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── user.service.ts
│   │   ├── customer.service.ts
│   │   ├── product.service.ts
│   │   ├── stock.service.ts
│   │   ├── challan.service.ts
│   │   └── report.service.ts
│   ├── models/
│   │   ├── index.ts               # Loads all models, defines associations, exports `db`
│   │   ├── user.model.ts
│   │   ├── customer.model.ts
│   │   ├── followUp.model.ts
│   │   ├── product.model.ts
│   │   ├── stockMovement.model.ts
│   │   ├── challan.model.ts
│   │   └── challanItem.model.ts
│   ├── middlewares/
│   │   ├── auth.middleware.ts       # verifies JWT, attaches req.user
│   │   ├── role.middleware.ts       # restrictTo('Admin','Sales', ...)
│   │   ├── validate.middleware.ts   # generic zod-schema validator
│   │   ├── errorHandler.middleware.ts
│   │   ├── notFound.middleware.ts
│   │   └── rateLimiter.middleware.ts
│   ├── validators/
│   │   ├── auth.validator.ts
│   │   ├── customer.validator.ts
│   │   ├── product.validator.ts
│   │   ├── stock.validator.ts
│   │   └── challan.validator.ts
│   ├── socket/
│   │   ├── index.ts                # initSocket(httpServer), auth handshake, room joining by role
│   │   └── events.ts                # typed event name constants + emitter helpers
│   ├── utils/
│   │   ├── AppError.ts              # custom operational error class
│   │   ├── asyncHandler.ts          # wraps async controllers, forwards errors to next()
│   │   ├── apiResponse.ts           # standard success/paginated response shape helper
│   │   ├── generateChallanNumber.ts
│   │   ├── logger.ts                # winston logger instance
│   │   ├── jwt.ts                   # sign/verify access & refresh tokens
│   │   └── pdfGenerator.ts          # builds invoice PDF with pdfkit (bonus)
│   └── types/
│       └── express.d.ts             # augments Express Request with `user`
├── migrations/                      # sequelize-cli migration files
├── seeders/                         # seed script: 1 user per role + sample data
├── tests/
│   ├── auth.test.ts
│   └── challan.test.ts
├── .env.example
├── .eslintrc.json
├── .prettierrc
├── package.json
├── tsconfig.json
└── README.md
```

**Root file responsibilities**

| File | Responsibility |
|---|---|
| `db.ts` | Creates the single `Sequelize` instance from `DATABASE_URL`, exports `sequelize`, exposes `connectDB()` which is called once at boot and tests the connection with `authenticate()`. |
| `app.ts` | Builds the Express `app`: applies `helmet`, `cors`, `compression`, `morgan`, JSON body parsing, mounts `routes/index.ts` at `/api`, mounts `notFound` + `errorHandler` last. Exports `app` only — does **not** call `.listen()`. |
| `server.ts` | Imports `app` from `app.ts`, wraps it in `http.createServer(app)`, calls `initSocket(httpServer)`, calls `connectDB()`, then `httpServer.listen(PORT)`. This split lets the app be imported into Supertest tests without opening a real port. |

---

## 8. Backend Module-by-Module Breakdown

Every module below follows the same 5-file recipe: **route → middleware(s) → controller → service → model(s)**.

### 8.1 Auth Module

- **Route (`auth.routes.ts`):** `POST /login`, `POST /refresh`, `POST /logout`, `GET /me`
- **Middleware:** `validate(loginSchema)` on login; `authenticate` on `/me` and `/logout`
- **Controller (`auth.controller.ts`):** reads `req.body`, calls `authService.login(...)`, sets response; never touches bcrypt/jwt directly
- **Service (`auth.service.ts`):**
  - `login(email, password)` → finds user by email, `bcrypt.compare`, throws `AppError(401)` on mismatch, signs access token (15 min) + refresh token (7 days), returns `{ user, accessToken, refreshToken }`
  - `refresh(refreshToken)` → verifies refresh token, issues a new access token
  - `getProfile(userId)` → returns safe user object (no password hash)
- **Model:** `User`

### 8.2 User Module (Admin-managed accounts/roles)

- **Route:** `GET /users`, `POST /users`, `PATCH /users/:id`, `DELETE /users/:id` (deactivate, not hard delete)
- **Middleware:** `authenticate`, `restrictTo('Admin')`
- **Service:** `createUser` hashes password with bcrypt (salt rounds 12) before insert; `deactivateUser` sets `is_active = false` instead of deleting, preserving audit trail (users are `created_by` on many other records)

### 8.3 Customer / CRM Module

- **Route (`customer.routes.ts`):**
  - `GET /customers` — list with `search`, `status`, `customerType`, `page`, `limit`
  - `POST /customers`
  - `GET /customers/:id`
  - `PATCH /customers/:id`
  - `DELETE /customers/:id` (Admin only)
  - `POST /customers/:id/follow-ups`
  - `GET /customers/:id/follow-ups`
- **Middleware:** `authenticate`, `restrictTo('Admin','Sales')` for writes; `restrictTo('Admin','Sales','Accounts')` for reads; `validate(customerSchema)`
- **Controller:** thin pass-through to service, formats paginated response via `apiResponse.paginated(...)`
- **Service (`customer.service.ts`):**
  - `listCustomers(filters, pagination)` → builds a Sequelize `where` clause dynamically (ILIKE search across name/mobile/business_name), returns `{ rows, count }`
  - `createCustomer(dto, userId)` → sets `created_by`, defaults `status = 'Lead'`
  - `addFollowUp(customerId, note, followUpDate, userId)` → creates `FollowUp` row **and** updates `customers.follow_up_date` so the list view always shows the next pending follow-up
- **Models:** `Customer`, `FollowUp`

### 8.4 Product & Inventory Module

- **Route (`product.routes.ts`):**
  - `GET /products` — search/filter by category, low-stock flag
  - `POST /products`
  - `GET /products/:id`
  - `PATCH /products/:id`
  - `DELETE /products/:id` (Admin only)
  - `GET /products/low-stock` — products where `current_stock <= min_stock_alert`
- **Route (`stock.routes.ts`):**
  - `POST /stock/movements` — manual adjustment (e.g. restock, damage write-off)
  - `GET /stock/movements` — filterable log (by product, date range, type)
- **Middleware:** `restrictTo('Admin','Warehouse')` for writes; all authenticated roles can read
- **Service (`product.service.ts`):** standard CRUD + `getLowStock()`
- **Service (`stock.service.ts`):**
  - `recordMovement(productId, qty, type, reason, userId)` runs inside a DB transaction: locks the product row (`SELECT ... FOR UPDATE`), applies `+qty` for `IN` / `-qty` for `OUT`, rejects if the result would go negative, inserts the `StockMovement` row, emits `stock:updated` (and `stock:low` if the new stock ≤ `min_stock_alert`) via the socket layer
- **Models:** `Product`, `StockMovement`

### 8.5 Sales Challan Module

- **Route (`challan.routes.ts`):**
  - `GET /challans` — filter by status, customer, date range
  - `POST /challans` — create as **Draft**, auto-generates challan number
  - `GET /challans/:id`
  - `PATCH /challans/:id` — edit line items while status is still `Draft`
  - `PATCH /challans/:id/confirm` — the core business-logic endpoint
  - `PATCH /challans/:id/cancel`
  - `GET /challans/:id/invoice` — PDF export (bonus)
- **Middleware:** `restrictTo('Admin','Sales')` for create/edit/confirm/cancel; broader read access for Warehouse/Accounts
- **Service (`challan.service.ts`):**
  - `createChallan(customerId, items[], userId)` → generates challan number (see §14.2), copies product snapshot fields into each `ChallanItem`, computes `total_quantity`/`total_amount`, saves as `Draft`
  - `confirmChallan(challanId, userId)` → **wrapped in a single DB transaction** (see sequence diagram in §8.6): for every item, locks the product row, validates sufficient stock, deducts stock, writes a `StockMovement` (`OUT`, reason = challan number), then flips challan `status → 'Confirmed'` and stamps `confirmed_at`. If **any** item has insufficient stock, the whole transaction rolls back and a single `AppError(400, "Insufficient stock for <product>")` is thrown — nothing is partially applied.
  - `cancelChallan(challanId, userId)` → if the challan was `Confirmed`, reverses the stock (writes offsetting `IN` movements) before setting `status → 'Cancelled'`
- **Models:** `Challan`, `ChallanItem` (uses `Product`, `StockMovement` via the service layer)

### 8.6 Sequence Diagram — Challan Confirm & Stock Deduction

```mermaid
sequenceDiagram
    actor Sales as Sales User
    participant F as React Frontend
    participant C as Challan Controller
    participant S as Challan Service
    participant P as Product Model
    participant SM as StockMovement Model
    participant Ch as Challan Model
    participant DB as PostgreSQL Transaction
    participant IO as Socket.io

    Sales->>F: Click "Confirm Challan"
    F->>C: PATCH /api/challans/:id/confirm
    C->>S: confirmChallan(challanId, userId)
    S->>DB: BEGIN TRANSACTION
    loop for each challan item
        S->>P: SELECT stock FOR UPDATE
        P-->>S: current_stock
        alt sufficient stock
            S->>P: UPDATE stock -= quantity
            S->>SM: INSERT movement (OUT, reason = challan_number)
        else insufficient stock
            S->>DB: ROLLBACK
            S-->>C: throw AppError 400 "Insufficient stock"
            C-->>F: 400 { message }
            F-->>Sales: Show error, nothing changed
        end
    end
    S->>Ch: UPDATE status = 'Confirmed', confirmed_at = now()
    S->>DB: COMMIT
    S->>IO: emit stock:updated, emit challan:confirmed
    S-->>C: updated challan (with items)
    C-->>F: 200 OK { challan }
    F-->>Sales: Show success, refresh stock + challan views
```

### 8.7 State Diagram — Challan Lifecycle

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Confirmed: Confirm (stock validated & deducted)
    Draft --> Cancelled: Cancel (no stock impact)
    Confirmed --> Cancelled: Cancel (reverses stock)
    Cancelled --> [*]
    Confirmed --> [*]
```

### 8.8 Sequence Diagram — Login Flow

```mermaid
sequenceDiagram
    actor U as User
    participant F as React Frontend
    participant Mw as Validate Middleware
    participant C as Auth Controller
    participant S as Auth Service
    participant D as PostgreSQL

    U->>F: Enter email & password
    F->>Mw: POST /api/auth/login
    Mw-->>C: body validated
    C->>S: login(email, password)
    S->>D: findOne(User, { email })
    D-->>S: user row
    S->>S: bcrypt.compare(password, hash)
    alt valid credentials
        S->>S: sign JWT access + refresh tokens
        S-->>C: { user, accessToken, refreshToken }
        C-->>F: 200 OK
        F-->>U: redirect to role-based dashboard
    else invalid credentials
        S-->>C: throw AppError 401
        C-->>F: 401 Unauthorized
        F-->>U: show inline error
    end
```

### 8.9 Dashboard / Reports Module

- **Route:** `GET /dashboard/summary` — returns role-aware KPI payload
- **Service (`report.service.ts`):** aggregates, per role:
  - Admin: total customers, total products, low-stock count, challans this week, revenue this month
  - Sales: my open leads/follow-ups due today, my draft challans
  - Warehouse: low-stock products, today's stock movements
  - Accounts: confirmed challans pending invoice, monthly revenue trend (for Recharts)

---

## 9. Authentication & RBAC Strategy

- **Password storage:** `bcrypt`, salt rounds = 12. Never store or log plaintext passwords.
- **Tokens:** short-lived **access token** (15 min, sent in `Authorization: Bearer <token>` header) + longer-lived **refresh token** (7 days, returned to the client and used only to hit `/auth/refresh`).
- **`auth.middleware.ts`** — verifies the access token, loads a lightweight user payload (`id`, `role`) onto `req.user`. Throws `AppError(401)` if missing/expired/invalid.
- **`role.middleware.ts`** — `restrictTo(...roles: Role[])` factory middleware; placed **after** `auth.middleware` on every protected route that needs role restriction. Throws `AppError(403)` if `req.user.role` isn't in the allowed list.
- **RBAC matrix:**

| Module | Admin | Sales | Warehouse | Accounts |
|---|---|---|---|---|
| Users (manage accounts) | Full | – | – | – |
| Customers (CRUD) | Full | Create/Read/Update | Read | Read |
| Follow-ups | Full | Create/Read | – | Read |
| Products (CRUD) | Full | Read | Create/Read/Update | Read |
| Stock movements | Full | Read | Create/Read | Read |
| Challans (create/edit/confirm/cancel) | Full | Full | Read | Read |
| Dashboard/Reports | Full | Own data | Own data | Full reports |

---

## 10. API Endpoint Reference

Base URL: `/api`

| Method | Endpoint | Roles | Description |
|---|---|---|---|
| POST | `/auth/login` | Public | Login, returns tokens |
| POST | `/auth/refresh` | Public (valid refresh token) | Issue new access token |
| POST | `/auth/logout` | Authenticated | Invalidate refresh token |
| GET | `/auth/me` | Authenticated | Current user profile |
| GET | `/users` | Admin | List internal users |
| POST | `/users` | Admin | Create a user with a role |
| PATCH | `/users/:id` | Admin | Update role/status |
| DELETE | `/users/:id` | Admin | Deactivate user |
| GET | `/customers` | Admin, Sales, Accounts | List/search/paginate customers |
| POST | `/customers` | Admin, Sales | Create customer |
| GET | `/customers/:id` | Admin, Sales, Accounts | Customer detail |
| PATCH | `/customers/:id` | Admin, Sales | Edit customer |
| DELETE | `/customers/:id` | Admin | Delete customer |
| POST | `/customers/:id/follow-ups` | Admin, Sales | Add follow-up note |
| GET | `/customers/:id/follow-ups` | Admin, Sales, Accounts | List follow-ups |
| GET | `/products` | All roles | List/search products |
| POST | `/products` | Admin, Warehouse | Create product |
| GET | `/products/:id` | All roles | Product detail |
| PATCH | `/products/:id` | Admin, Warehouse | Edit product |
| DELETE | `/products/:id` | Admin | Delete product |
| GET | `/products/low-stock` | Admin, Warehouse | Low-stock list |
| POST | `/stock/movements` | Admin, Warehouse | Manual stock adjustment |
| GET | `/stock/movements` | Admin, Warehouse, Accounts | Stock movement log |
| GET | `/challans` | Admin, Sales, Accounts, Warehouse | List/filter challans |
| POST | `/challans` | Admin, Sales | Create draft challan |
| GET | `/challans/:id` | Admin, Sales, Accounts, Warehouse | Challan detail |
| PATCH | `/challans/:id` | Admin, Sales | Edit draft challan |
| PATCH | `/challans/:id/confirm` | Admin, Sales | Confirm + deduct stock |
| PATCH | `/challans/:id/cancel` | Admin, Sales | Cancel challan |
| GET | `/challans/:id/invoice` | Admin, Sales, Accounts | PDF invoice export (bonus) |
| GET | `/dashboard/summary` | All roles | Role-aware KPI summary |

**Standard success response shape**

```json
{
  "success": true,
  "data": { },
  "meta": { "page": 1, "limit": 20, "total": 134, "totalPages": 7 }
}
```

**Standard error response shape**

```json
{
  "success": false,
  "message": "Insufficient stock for SKU-0042",
  "errors": []
}
```

---

## 11. Real-Time Layer (Socket.io) Strategy

- Socket.io attaches to the **same HTTP server** created in `server.ts` (no separate port).
- On connection, the client sends its JWT in the handshake `auth` payload; the server verifies it and joins the socket to a room named after the user's role (e.g. `role:Warehouse`) and a room named after their user id (`user:<id>`).
- **Events emitted by the server:**
  - `stock:updated` → broadcast to `role:Warehouse` and `role:Admin` whenever stock changes (manual or via challan confirmation)
  - `stock:low` → broadcast when a product's stock drops to/below `min_stock_alert`
  - `challan:confirmed` → broadcast to `role:Accounts` and `role:Admin` so dashboards refresh live
  - `followup:due` → optional bonus, notifies `role:Sales` of follow-ups due today (via a scheduled check)
- Frontend subscribes through a small `useSocket()` hook that connects once (in the dashboard layout) and invalidates the relevant TanStack Query caches when an event arrives, so lists refresh automatically without manual polling.

---

## 12. Frontend Architecture

### 12.1 Folder Structure

```
frontend/
├── src/
│   ├── main.tsx                     # React root, QueryClientProvider, Router
│   ├── App.tsx                      # Top-level layout/routes wiring
│   ├── api/
│   │   ├── axiosInstance.ts         # baseURL, JWT interceptor, 401 → refresh-or-logout
│   │   ├── auth.api.ts
│   │   ├── customer.api.ts
│   │   ├── product.api.ts
│   │   ├── stock.api.ts
│   │   ├── challan.api.ts
│   │   └── dashboard.api.ts
│   ├── store/
│   │   └── authStore.ts             # Zustand: user, role, accessToken, login()/logout()
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useSocket.ts
│   │   └── useDebouncedValue.ts     # for search inputs
│   ├── routes/
│   │   ├── AppRoutes.tsx
│   │   └── ProtectedRoute.tsx       # checks auth + role before rendering
│   ├── layouts/
│   │   ├── DashboardLayout.tsx      # sidebar + navbar shell for authenticated pages
│   │   └── AuthLayout.tsx           # centered card shell for login
│   ├── pages/
│   │   ├── auth/Login.tsx
│   │   ├── dashboard/Dashboard.tsx
│   │   ├── customers/CustomerList.tsx
│   │   ├── customers/CustomerDetail.tsx
│   │   ├── customers/CustomerForm.tsx
│   │   ├── products/ProductList.tsx
│   │   ├── products/ProductForm.tsx
│   │   ├── stock/StockLog.tsx
│   │   ├── challans/ChallanList.tsx
│   │   ├── challans/ChallanCreate.tsx
│   │   └── challans/ChallanDetail.tsx
│   ├── components/
│   │   ├── ui/                      # shadcn/ui generated primitives (button, input, dialog...)
│   │   └── common/
│   │       ├── DataTable.tsx        # wraps TanStack Table + pagination controls
│   │       ├── Navbar.tsx
│   │       ├── Sidebar.tsx
│   │       ├── StatCard.tsx         # dashboard KPI card
│   │       └── ConfirmDialog.tsx
│   ├── types/
│   │   ├── auth.types.ts
│   │   ├── customer.types.ts
│   │   ├── product.types.ts
│   │   └── challan.types.ts
│   └── utils/
│       ├── formatCurrency.ts
│       └── constants.ts
├── .env.example
├── index.html
├── package.json
├── tailwind.config.ts
├── vite.config.ts
└── README.md
```

### 12.2 How each layer works

- **`api/*.ts`** — one file per module, exporting typed functions (`getCustomers(params)`, `createCustomer(dto)`, etc.) that call `axiosInstance`. No component ever calls `axios` directly.
- **TanStack Query hooks** — colocated with pages (e.g. `useCustomersQuery(filters)`, `useCreateCustomerMutation()`), wrapping the `api/*` functions. Handles loading/error/cache/invalidation.
- **`store/authStore.ts`** (Zustand) — holds `user`, `role`, `accessToken`; persisted to memory only (per artifact rules — no `localStorage` inside any generated artifacts, but the actual delivered app, running outside the artifacts sandbox, may use an httpOnly-cookie-based refresh flow or `localStorage` for the access token as is standard practice).
- **`routes/ProtectedRoute.tsx`** — reads `authStore`, redirects to `/login` if unauthenticated, or to a 403 page if the route's `allowedRoles` doesn't include the user's role.
- **`layouts/DashboardLayout.tsx`** — renders `Sidebar` (role-aware nav items) + `Navbar` (user menu, logout) + `<Outlet />`; also mounts `useSocket()` once so all child pages benefit from live updates.
- **Pages** — each page is a thin composition of a query hook + a presentational component (`DataTable`, a form, a detail card). Business logic (e.g., "can this challan still be edited?") is derived from data, not duplicated — the backend is the source of truth; the frontend just reflects `status`.
- **Forms** — `CustomerForm`, `ProductForm`, `ChallanCreate` all use `react-hook-form` with a `zodResolver` built from the *same shape* of Zod schema used on the backend validators, so client-side and server-side validation rules stay conceptually identical.

### 12.3 Key Pages — What Each One Does

| Page | Responsibility |
|---|---|
| `Login` | Email/password form → `authStore.login()` → redirect by role |
| `Dashboard` | Role-aware KPI cards (`StatCard`) + Recharts sales/stock trend + "due today" list |
| `CustomerList` | Searchable/filterable `DataTable`, "Add Customer" button, status badges |
| `CustomerDetail` | Customer info + follow-up timeline + "Add Follow-up" quick form + related challans |
| `CustomerForm` | Create/Edit customer, shared component driven by a `mode` prop |
| `ProductList` | Searchable table with a low-stock badge, "Add Product" |
| `ProductForm` | Create/Edit product |
| `StockLog` | Filterable table of `StockMovement` rows + manual adjustment dialog |
| `ChallanList` | Filter by status/customer, colored status badges, "New Challan" |
| `ChallanCreate` | Customer picker + multi-product line-item builder with live stock display + Save Draft / Confirm buttons |
| `ChallanDetail` | Read-only view once Confirmed/Cancelled; editable while Draft; "Download Invoice" button (bonus) |

---

## 13. Validation & Error Handling Strategy

- **Backend:** every route that accepts a body/query defines a Zod schema in `validators/`. `validate.middleware.ts` is a generic factory:

  ```ts
  export const validate = (schema: ZodSchema) =>
    (req: Request, res: Response, next: NextFunction) => {
      const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });
      if (!result.success) {
        return next(new AppError(400, "Validation failed", result.error.flatten()));
      }
      req.validated = result.data;
      next();
    };
  ```

- **`AppError`** — a small class extending `Error` with `statusCode` and `isOperational` flags, so the central `errorHandler.middleware.ts` can distinguish expected business errors (400/401/403/404/409) from unexpected bugs (500, logged via `winston` with stack trace, generic message returned to client).
- **`asyncHandler`** — wraps every controller so thrown/rejected errors are automatically forwarded to `next(err)` instead of needing `try/catch` in every controller.
- **Frontend:** Axios response interceptor unwraps `{ success, message, errors }`; `sonner` toasts the `message` on any non-2xx response; form-level errors from `errors` (validation field errors) are mapped into `react-hook-form`'s `setError`.

---

## 14. Core Business Logic Details

### 14.1 Stock Never Goes Negative

Enforced at **two levels** for defense-in-depth:
1. **Application level:** `stock.service.ts` and `challan.service.ts` check `current_stock >= quantity` inside a row-locked transaction before decrementing.
2. **Database level:** a `CHECK (current_stock >= 0)` constraint on `products.current_stock` as a final safety net.

### 14.2 Challan Number Generation

Format: `CH-{YYYY}-{sequence}` e.g. `CH-2026-000123`. Generated the moment a challan is created (Draft or not), via a small `counters` table (`year`, `last_value`) updated inside the same transaction as the insert (`SELECT ... FOR UPDATE` on the counter row, increment, use the new value) — this avoids race conditions from two sales users creating challans at the same instant, which a simple `COUNT(*) + 1` approach would not.

### 14.3 Product Snapshot on Challan Items

At challan creation, `product_name_snapshot`, `sku_snapshot`, and `unit_price_snapshot` are copied from the live `Product` row into each `ChallanItem`. All downstream calculations (`total_amount`) and all display of historical challans/invoices use these snapshot fields — never a live join to `products` — so a later price change never rewrites history.

### 14.4 Pagination, Search & Filtering Convention

All list endpoints accept `page` (default 1), `limit` (default 20, max 100), `search` (free text, matched with `ILIKE '%term%'` across relevant columns), and entity-specific filters (`status`, `customerType`, `category`, `dateFrom`/`dateTo`). Response always includes the `meta` block described in §10.

---

## 15. Security Considerations

- `helmet()` for secure HTTP headers.
- `cors()` restricted to the deployed Netlify origin (and `localhost` in dev) via an allow-list from env vars.
- `express-rate-limit` applied specifically to `/auth/login` (e.g. 10 requests / 15 min per IP) to slow down brute force.
- `hpp()` to guard against HTTP parameter pollution.
- All DB access goes through Sequelize's parameterized queries — no raw string concatenation — eliminating SQL injection risk.
- JWT secrets, DB credentials, and any API keys live only in environment variables, never committed to Git (`.env` is git-ignored; `.env.example` documents the required keys with placeholder values).
- Passwords hashed with bcrypt (cost factor 12); never logged, never returned in any API response.
- Every write action stores `created_by`, giving a full audit trail (who created a customer, who confirmed a challan, who adjusted stock).
- HTTPS is enforced automatically by both Render and Netlify.

---

## 16. Deployment Strategy (Render + Netlify)

### 16.1 Backend on Render

1. Push the repo to GitHub with `backend/` as a subfolder (or a separate repo — either works).
2. Create a new **Web Service** on Render, connect the GitHub repo, set **Root Directory** to `backend`.
3. **Build Command:** `npm install && npm run build` (compiles TypeScript to `dist/`).
4. **Start Command:** `npm run start` → `node dist/server.js`.
5. Provision a **Render PostgreSQL** instance (or use Neon's free tier) and copy its connection string.
6. Set environment variables in the Render dashboard (see table below).
7. After first deploy, run migrations: either as a Render "Pre-Deploy Command" (`npm run migrate`) or manually via the Render shell.

### 16.2 Frontend on Netlify

1. Create a new site on Netlify, connect the same GitHub repo, set **Base directory** to `frontend`.
2. **Build Command:** `npm run build`.
3. **Publish Directory:** `dist`.
4. Add a `public/_redirects` file containing `/*  /index.html  200` so client-side routing works on refresh/deep links.
5. Set environment variables (`VITE_API_BASE_URL`, `VITE_SOCKET_URL`) pointing at the Render backend URL.

### 16.3 Environment Variables

**Backend `.env.example`**

```
NODE_ENV=production
PORT=5000
DATABASE_URL=postgres://user:password@host:5432/dbname
JWT_ACCESS_SECRET=replace_me
JWT_REFRESH_SECRET=replace_me
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=https://your-app.netlify.app
BCRYPT_SALT_ROUNDS=12
# Bonus: AWS S3 for product images
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_S3_BUCKET=
```

**Frontend `.env.example`**

```
VITE_API_BASE_URL=https://your-backend.onrender.com/api
VITE_SOCKET_URL=https://your-backend.onrender.com
```

### 16.4 CI/CD (Bonus)

A simple GitHub Actions workflow (`.github/workflows/ci.yml`) runs on every push/PR: install dependencies, `eslint`, `tsc --noEmit`, and `jest`/`vitest` for both `backend/` and `frontend/`. Actual deployment is left to Render's and Netlify's native GitHub integration (auto-deploy on push to `main`), which is simpler and free-tier friendly; the Actions workflow acts purely as a quality gate.

---

## 17. Testing Strategy (Bonus)

- **Backend:** Jest + Supertest against the exported `app` (not a running server). Priority tests:
  - `challan.service.test.ts` — confirms stock deducts correctly, confirms it rejects when stock is insufficient, confirms the transaction rolls back fully on partial failure across multiple items.
  - `auth.test.ts` — login success/failure, protected route rejects missing/invalid token, role middleware rejects wrong role.
- **Frontend:** Vitest + React Testing Library for `DataTable`, `ChallanCreate` form validation, and `ProtectedRoute` redirect behavior.

---

## 18. Bonus Feature Implementation Notes

| Feature | Approach |
|---|---|
| Docker | `backend/Dockerfile` (multi-stage: build TS → slim `node:20-alpine` runtime) + root `docker-compose.yml` running `postgres:16-alpine` + the backend, for local dev parity with production. |
| GitHub Actions | Lint/typecheck/test workflow as described in §16.4. |
| Invoice PDF export | `utils/pdfGenerator.ts` uses `pdfkit` to stream a formatted invoice (company header, customer info, line items from the challan's snapshot fields, totals) directly as the response of `GET /challans/:id/invoice` with `Content-Type: application/pdf`. |
| Product image upload to S3 | `multer` (memory storage) on `POST /products/:id/image` → `@aws-sdk/client-s3` `PutObjectCommand` → store the resulting public URL on `products.image_url`. |

---

## 19. 48-Hour Execution Roadmap

| Time Block | Focus |
|---|---|
| Hour 0–2 | Repo setup (backend + frontend scaffolds), install deps, `.env` files, DB provisioned, base folder structure created exactly as in §7/§12.1 |
| Hour 2–6 | DB schema + Sequelize models + migrations + seeders (one user per role) |
| Hour 6–10 | Auth module end-to-end (backend + frontend Login page + ProtectedRoute) |
| Hour 10–16 | Customer CRM module end-to-end (backend + frontend list/detail/form) |
| Hour 16–22 | Product & Inventory module end-to-end, including stock movement log |
| Hour 22–30 | Sales Challan module: creation, draft editing, the confirm transaction, cancel, snapshot logic — the most business-logic-heavy part |
| Hour 30–34 | Dashboard/reports module + Socket.io wiring (stock alerts, challan-confirmed events) |
| Hour 34–38 | Frontend polish: Tailwind/shadcn styling pass, responsive check, empty/loading/error states |
| Hour 38–42 | Deployment: Render (backend + DB) + Netlify (frontend), smoke test the live URLs |
| Hour 42–46 | Postman collection, README (setup/deploy/assumptions), bonus features if time allows (PDF invoice first, Docker second) |
| Hour 46–48 | Final QA pass, screen recording, submission write-up |

---

## 20. Coding Conventions

- **Files:** `entity.controller.ts`, `entity.service.ts`, `entity.model.ts`, `entity.routes.ts`, `entity.validator.ts` — always singular entity name, dot-separated layer suffix.
- **Naming:** `camelCase` for variables/functions, `PascalCase` for classes/React components/Sequelize models, `SCREAMING_SNAKE_CASE` for env var names.
- **Commits:** Conventional Commits — `feat: add challan confirm transaction`, `fix: prevent negative stock on manual adjustment`, `docs: update README with deploy steps`.
- **Branching:** `main` stays deployable; feature branches (`feat/challan-module`) merged via PR even solo, for a clean commit history the assignment explicitly asks for.
- **Linting:** ESLint + Prettier run on pre-commit (optionally via `husky` + `lint-staged`) to keep the diff clean for reviewers.

---

## 21. Assumptions & Known Limitations (Template — fill in before submission)

- Assumption: only one currency (INR) is needed; no multi-currency support.
- Assumption: "Delete" on Customer/Product is a soft concern — Admin-only hard delete is acceptable for this assignment's scope (mention if you instead implement soft-delete).
- Assumption: Invoices are generated on-demand from Confirmed challans rather than stored as a separate persisted entity.
- Limitation: no email/SMS notifications (out of scope per assignment).
- Limitation: no multi-warehouse stock transfer logic — `location` on `Product` is informational only.
- (Add/remove items here to match what you actually built.)

---

## 22. Submission Checklist

- [ ] GitHub repository link (with clean, frequent commits)
- [ ] Live frontend URL (Netlify)
- [ ] Live backend API URL (Render)
- [ ] Test login credentials for all 4 roles
- [ ] Postman collection or API documentation
- [ ] README with setup + deployment instructions + env var docs
- [ ] Short architecture explanation (this document can be linked/summarized)
- [ ] Known limitations / incomplete parts documented
- [ ] Screen recording of the full flow (if not deployed, this is mandatory)
