# Mini ERP + CRM Operations Portal

This is a complete full-stack implementation of a Mini ERP + CRM Operations Portal. It was built with a React frontend and a Node.js (Express) backend connecting to a PostgreSQL database via Sequelize.

## Live Links

- **Live Frontend URL:** [https://fundsroom-erp-ui.netlify.app](https://fundsroom-erp-ui.netlify.app)
- **Live Backend API URL:** [https://fundsroom-assignment-kr0x.onrender.com/api](https://fundsroom-assignment-kr0x.onrender.com/api)

> **Note:** The backend is hosted on Render's free tier, which sleeps after 15 minutes of inactivity. If the frontend feels unresponsive on the first load, please allow up to 30-50 seconds for the backend to wake up.

## Test Credentials

The database has been pre-seeded with test accounts for each role. The password for **all** accounts is `password123`.

- **Admin:** `admin@fundsroom.com`
- **Sales:** `sales@fundsroom.com`
- **Warehouse:** `warehouse@fundsroom.com`
- **Accounts:** `accounts@fundsroom.com`

---

## Architecture Overview

The system strictly follows a layered 3-tier architecture separating the client, API server, and database layer.

1. **Client Layer (Frontend)**
   - Built with **React 18, TypeScript, and Vite**.
   - Global state handled by **Zustand** (for auth) and **TanStack Query** (for data caching and refetching).
   - UI styled with **Tailwind CSS** and **shadcn/ui**.
   - Hosted statically on **Netlify**.

2. **Application Layer (Backend)**
   - Built with **Node.js, Express.js, and TypeScript**.
   - Follows an N-tier layered pattern: `Routes` → `Middlewares` → `Controllers` → `Services` → `Models`.
   - **Routes/Controllers:** Handle HTTP logic.
   - **Services:** Encapsulate all business logic (like transactions and stock checking).
   - **Middlewares:** Enforce JWT authentication, role-based access control (RBAC), and request validation via **Zod**.
   - Hosted on a **Render** Web Service.

3. **Data Layer**
   - **PostgreSQL** database managed via **Sequelize ORM**.
   - Hosted on **Neon**.

### Data Flow Example: Confirming a Challan
When a Sales user confirms a challan, a single transaction is created. The system locks the product rows, checks for sufficient stock, deducts the stock, records a `StockMovement`, and marks the challan as `Confirmed`. If any step fails, the entire transaction rolls back cleanly.

---

## Local Setup & Deployment Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL (running locally or remotely)
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

## API Documentation

The backend exposes a RESTful API. Below are the primary endpoints. All endpoints (except `/auth/login`) require a JWT Bearer token in the `Authorization` header.

### Authentication
- `POST /api/auth/login` - Authenticate and receive tokens
- `POST /api/auth/refresh` - Issue a new access token using a refresh token
- `GET /api/auth/me` - Get current user profile

### Customers (CRM)
- `GET /api/customers` - List customers (paginated/filtered)
- `POST /api/customers` - Create customer
- `GET /api/customers/:id/follow-ups` - Get follow-up history

### Products & Inventory
- `GET /api/products` - List products
- `GET /api/products/low-stock` - Get low stock alerts
- `POST /api/stock/movements` - Manually adjust stock

### Sales Challans
- `GET /api/challans` - List challans
- `POST /api/challans` - Create draft challan
- `PATCH /api/challans/:id/confirm` - Confirm challan (deducts stock)

> *To test these via Postman, send a `POST` request to `/api/auth/login` with `{"email": "admin@fundsroom.com", "password": "password123"}`. Extract the `accessToken` from the response and add it as a Bearer Token authorization header for subsequent requests.*

---

## Known Limitations & Incomplete Parts

While the core functionality is robust, there are a few known limitations due to the scope of this case study:
1. **Real-Time Layer:** The architecture spec calls for Socket.io integration for real-time stock alerts. The socket infrastructure exists on the backend, but the frontend currently relies on TanStack Query polling/refetching instead of active WebSocket connections.
2. **PDF Generation:** While the backend structure supports a `pdfGenerator` utility, actual PDF invoice generation for confirmed challans has not been fully implemented.
3. **Advanced Filtering:** The frontend tables support basic pagination, but advanced multi-column filtering has not been exposed in the UI.
4. **Audit Logs:** While `StockMovements` act as a ledger, full audit logs (who changed customer details, when) are not yet implemented.