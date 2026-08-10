# Mini ERP + CRM Operations Portal

A complete full-stack implementation of a Mini ERP + CRM Operations Portal. It was built with a React frontend and a Node.js (Express) backend connecting to a PostgreSQL database via Sequelize.

---

## 🚀 Live Links & Credentials

- **Live Frontend URL:** [https://fundsroom-erp-ui.netlify.app](https://fundsroom-erp-ui.netlify.app)
- **Live Backend API URL:** [https://fundsroom-assignment-kr0x.onrender.com/api](https://fundsroom-assignment-kr0x.onrender.com/api)

> **Note:** The backend is hosted on Render's free tier, which sleeps after 15 minutes of inactivity. If the frontend feels unresponsive on the first load, please allow up to 30-50 seconds for the backend to wake up.

### Test Credentials
The database is pre-seeded with test accounts for each role. The password for **all** accounts is `password123`.

- **Admin:** `admin@fundsroom.com`
- **Sales:** `sales@fundsroom.com`
- **Warehouse:** `warehouse@fundsroom.com`
- **Accounts:** `accounts@fundsroom.com`

---

## 🏗 High-Level Architecture Diagram

The system strictly follows a layered 3-tier architecture separating the client, API server, and database layer.

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

### Layered Architecture (Backend)
We use a **layered/N-tier architecture**, which is the industry-standard pattern for Express + TypeScript APIs:

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

## 🔄 Data Flow Diagrams (DFD)

### Level 0 (Context Diagram)
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

### Level 1 (Major Processes)
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

## 🗄️ Database Design (ERD)

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
        string customer_type
        string status
        date follow_up_date
        uuid created_by FK
        timestamp created_at
    }
    PRODUCT {
        uuid id PK
        string name
        string sku
        decimal unit_price
        int current_stock
        int min_stock_alert
        timestamp created_at
    }
    STOCK_MOVEMENT {
        uuid id PK
        uuid product_id FK
        int quantity_changed
        string movement_type
        string reason
        uuid created_by FK
    }
    CHALLAN {
        uuid id PK
        string challan_number
        uuid customer_id FK
        string status
        int total_quantity
        decimal total_amount
        uuid created_by FK
    }
    CHALLAN_ITEM {
        uuid id PK
        uuid challan_id FK
        uuid product_id FK
        string product_name_snapshot
        decimal unit_price_snapshot
        int quantity
    }

    USER ||--o{ CUSTOMER : creates
    USER ||--o{ STOCK_MOVEMENT : records
    PRODUCT ||--o{ STOCK_MOVEMENT : tracks
    USER ||--o{ CHALLAN : creates
    CUSTOMER ||--o{ CHALLAN : places
    CHALLAN ||--o{ CHALLAN_ITEM : contains
    PRODUCT ||--o{ CHALLAN_ITEM : referenced_in
```

---

## ⚙️ Core Workflows

### Challan Confirm & Stock Deduction
When a Sales user confirms a challan, a single transaction is created. The system locks the product rows, checks for sufficient stock, deducts the stock, records a `StockMovement`, and marks the challan as `Confirmed`. If any step fails, the entire transaction rolls back cleanly.

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
    S-->>C: updated challan (with items)
    C-->>F: 200 OK { challan }
    F-->>Sales: Show success, refresh stock + challan views
```

---

## 🛠️ Local Setup & Deployment Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL (running locally or remotely via Neon)
- npm or yarn

### 1. Database Setup
Create a local PostgreSQL database for the project:
```sql
CREATE DATABASE erp_crm;
```

### 2. Backend Setup
```bash
cd backend
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your local DATABASE_URL and JWT secrets

# Run migrations and seed data
npx sequelize-cli db:migrate
npm run seed

# Start the dev server
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install

# Setup environment variables
cp .env.example .env
# Ensure VITE_API_BASE_URL points to http://localhost:5000/api

# Start the dev server
npm run dev
```

---

## 📖 API Documentation & Postman

The backend exposes a RESTful API. To test these via Postman:
1. Send a `POST` request to `https://fundsroom-assignment-kr0x.onrender.com/api/auth/login`.
2. Provide the JSON body: `{"email": "admin@fundsroom.com", "password": "password123"}`.
3. Extract the `accessToken` from the response.
4. Go to the **Authorization** tab in Postman for your subsequent requests, select **Bearer Token**, and paste the token.

### Core Endpoints
- `POST /api/auth/login` - Authenticate and receive tokens
- `GET /api/customers` - List customers (paginated/filtered)
- `POST /api/customers` - Create customer
- `GET /api/products` - List products
- `GET /api/products/low-stock` - Get low stock alerts
- `POST /api/stock/movements` - Manually adjust stock
- `GET /api/challans` - List challans
- `POST /api/challans` - Create draft challan
- `PATCH /api/challans/:id/confirm` - Confirm challan (deducts stock)

---

## ⚠️ Known Limitations & Incomplete Parts

While the core functionality is robust, there are a few known limitations due to the scope of this case study:
1. **Real-Time Layer:** The architecture spec calls for Socket.io integration for real-time stock alerts. The socket infrastructure exists on the backend, but the frontend currently relies on TanStack Query polling/refetching instead of active WebSocket connections.
2. **PDF Generation:** While the backend structure supports a `pdfGenerator` utility, actual PDF invoice generation for confirmed challans has not been fully implemented.
3. **Advanced Filtering:** The frontend tables support basic pagination, but advanced multi-column filtering has not been exposed in the UI.
4. **Audit Logs:** While `StockMovements` act as a ledger, full audit logs (who changed customer details, when) are not yet implemented.