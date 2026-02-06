# BillMate24

Smart Billing & Revenue Management System.

## Tech Stack

- **Frontend**: Next.js 14+, TypeScript, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express.js, TypeScript, MongoDB
- **Auth**: JWT (Access + Refresh tokens)

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### Development

```bash
# Run both frontend and backend
npm run dev

# Run separately
npm run dev:frontend
npm run dev:backend
```

### Build

```bash
npm run build
```

## Project Structure

```
├── frontend/          # Next.js application
├── backend/           # Express.js API server
└── package.json       # Root workspace config
```

## Features

- Multi-tenant architecture for 1000+ shopkeepers
- Role-based access (Admin, Shopkeeper)
- Feature-based permissions per shopkeeper
- Wholesaler/Distributor ledger management
- Due customer tracking
- Unified billing system
- Revenue reports & dashboards
