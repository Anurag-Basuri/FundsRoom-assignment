# Mini ERP + CRM Operations Portal

A full-stack Operations Portal for managing customers, products, stock, and sales challans for a wholesale/distribution company.

## Tech Stack
- **Backend**: Node.js, Express.js, TypeScript, PostgreSQL (Neon DB), Sequelize ORM, Socket.io, PDFKit
- **Frontend**: React.js, TypeScript, Vite, Tailwind CSS, shadcn/ui, Zustand, React Query, Socket.io-client
- **Authentication**: JWT (JSON Web Tokens) with role-based access control.

## Setup Instructions

### Prerequisites
- Node.js (v18+)
- PostgreSQL database (or use the provided Neon DB string)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd FundsRoom-assignment
```

### 2. Backend Setup
```bash
cd backend
npm install
```

**Environment Variables**
Create a `.env` file in the `backend` directory (or modify the existing one):
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://neondb_owner:npg_s8VEo0WCjXRu@ep-steep-math-azawag3t-pooler.c-3.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require
JWT_ACCESS_SECRET=access_secret_super_secret_key_123
JWT_REFRESH_SECRET=refresh_secret_super_secret_key_456
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
BCRYPT_SALT_ROUNDS=12
```

**Initialize Database & Seed Data**
```bash
npm run seed
```

**Start the Backend Server**
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd frontend
npm install
```

**Environment Variables**
Create a `.env` file in the `frontend` directory:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

**Start the Frontend Server**
```bash
npm run dev
```

The application will be running at `http://localhost:5173`.

## Test Login Credentials

All test accounts use the password: `password123`

| Role | Email | Capabilities |
|------|-------|--------------|
| **Admin** | admin@fundsroom.com | Full access to all modules. |
| **Sales** | sales@fundsroom.com | Customers, Challans, Products (read-only) |
| **Warehouse** | warehouse@fundsroom.com | Products, Stock Movements, Dashboard (limited) |
| **Accounts** | accounts@fundsroom.com | Read-only access across modules, view dashboard metrics. |

## Deployment Strategy
*(Deployment is pending based on assignment requirements, but here is the strategy)*
- **Frontend**: Can be deployed seamlessly to Vercel or Netlify via GitHub integration.
- **Backend**: Can be containerized via Docker and deployed to Render, Railway, or AWS Elastic Beanstalk.
- **Database**: Already hosted on Neon Serverless Postgres.

## Bonus Features Implemented
- **Export invoice as PDF**: Available when a Challan is confirmed.
- **Real-time Updates (Socket.io)**: Live stock updates and low-stock alerts without page refresh.

## Assumptions
- Challan stock deduction happens sequentially but utilizes PostgreSQL row-level locking (`FOR UPDATE`) to prevent race conditions during high concurrent traffic.
- Soft deletes are not extensively used for all tables to keep the assignment simple, but role-based restrictions prevent accidental data loss.