# BSOMS — Bakery Shop Owner Management System

BSOMS is a full-stack web application designed to help small bakery businesses manage daily operations from a single platform. It centralizes inventory tracking, billing, credit records, expiry monitoring, and production-related workflows.

## Project Overview

Many small bakeries still depend on manual registers or disconnected tools, which can lead to stock mismatches, delayed collections, and avoidable product wastage. BSOMS addresses this by providing a unified workflow for operational visibility and decision support.

## Key Features

- **Inventory Management**: Track products, quantities, pricing, and shelf allocation.
- **Expiry Tracking**: Monitor expiry dates and identify at-risk stock.
- **Billing and Sales**: Generate and store bills with automated stock deduction.
- **Credit Management**: Maintain customer credit records and payment status.
- **Waste and Sales Insights**: Review wastage and sales activity for better planning.
- **Production Planning Support**: Use current inventory and sales patterns to guide production.
- **Worker and Leave Management**: Manage worker profiles and leave requests.

## Tech Stack

- **Frontend**: React, Vite, JavaScript, HTML, CSS
- **Backend**: Node.js, Express.js
- **Database**: NeDB (embedded file-based datastore)

## System Architecture

BSOMS uses a client-server architecture:

- The React frontend delivers the user interface.
- The Express backend exposes API endpoints and handles business logic.
- NeDB persists operational records locally on the server.

The `legacy/` folder contains an older version of the application that predates the current React-based implementation.

## Run the Project Locally

### Prerequisites

- Node.js 18+ (recommended)
- npm 9+ (recommended)

### 1) Install dependencies

From the repository root:

```bash
npm install
```

### 2) Start in development mode

Run frontend and backend together:

```bash
npm run dev
```

This starts:
- Backend API server on `http://localhost:5000` (default)
- Frontend dev server on Vite’s default local port (typically `http://localhost:5173`)

### 3) Optional: Run frontend and backend separately

```bash
npm run backend
npm run frontend
```

### 4) Build and run production bundle locally

```bash
npm run build
npm start
```

The backend serves the built frontend from the `dist/` directory.

## Repository Structure

```text
BSOMS/
├── client/        # React frontend (Vite root)
├── server/        # Express backend, APIs, and datastore files
├── legacy/        # Earlier implementation
├── package.json
└── README.md
```

## Project Goal

This project was built to deliver a practical bakery operations system while strengthening full-stack engineering skills across frontend development, backend API design, and data management.

## Disclaimer

BSOMS was developed as a college project with AI-assisted workflows for learning and rapid prototyping. It is an evolving academic project and not positioned as a production-ready commercial system.
