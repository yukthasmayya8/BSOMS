# BSOMS — Bakery Smart Operations Management System

BSOMS is a full-stack web application designed to help small bakery businesses manage everyday operations from a single platform. It brings inventory, billing, customer credit, expiry tracking, worker management, waste monitoring, and shelf organization together in one system.

> **Project status:** BSOMS is an educational prototype developed as a team project for the **Introduction to Design Thinking (IDT) project during the first year of engineering**. The application was created for learning, experimentation, and demonstrating software-development concepts.

## Overview

Small bakeries often rely on manual processes to track stock, sales, customer dues, employee information, and product expiry dates. These processes can make it difficult to maintain accurate records and identify wastage.

BSOMS addresses these challenges through a centralized client-server application with a React frontend, an Express backend, and local NeDB data storage.

## Features

- **Inventory management** — Add and manage bakery products, quantities, prices, shelves, and expiry dates.
- **Expiry tracking** — Monitor product expiry dates and identify items that require attention.
- **Billing and sales** — Create bills and record sales transactions.
- **Credit management** — Maintain customer credit records and track outstanding payments.
- **Worker management** — Manage worker profiles, roles, and leave requests.
- **Waste tracking** — Record spoiled or discarded inventory for wastage analysis.
- **Shelf configuration** — Organize products by shelf and update shelf contents.
- **Production planning** — Use inventory and sales information to support production decisions.
- **Localization and settings** — Configure application language and tax settings.

## Technology Stack

- **Frontend:** React, Vite, JavaScript, HTML, and CSS
- **Backend:** Node.js and Express.js
- **Database:** NeDB with persistent local data files
- **Development tools:** ESLint and Concurrently

## Academic Context and Team

BSOMS was developed as a **team project for the Introduction to Design Thinking (IDT) project during the first year of engineering**.

The project team consisted of:

- **Yuktha S. Mayya**
- **Aadhya Adiga**
- **Abhishek Moolya**
- **Adarsh**
- **Anantheshwara Somayaji**
- **Nikhil V. Shetty**

Together, the team explored the operational challenges faced by small bakery businesses and designed a practical software solution to organize their daily activities.

## AI-Assisted Development

BSOMS was developed with assistance from **Google Gemini** and **StackBlitz AI**.

These tools supported the development process through:

- Project ideation and problem exploration
- Feature planning and implementation guidance
- Code-generation assistance
- Prototyping and development support
- Debugging and refinement
- Documentation assistance

AI tools were used as development assistants rather than substitutes for the project team's design decisions, implementation, testing, and review. The team reviewed and adapted AI-assisted suggestions and generated code according to the project's requirements.

## Project Structure

```text
BSOMS/
├── client/              # React frontend and Vite configuration
├── server/              # Express API and database logic
│   ├── data/            # Local NeDB data files
│   └── index.js         # Backend entry point
├── legacy/              # Earlier version of the application
├── package.json         # Scripts and dependencies
├── package-lock.json    # Locked dependency versions
└── README.md            # Project documentation
```

## Prerequisites

Before running BSOMS locally, install:

- [Node.js](https://nodejs.org/) — preferably the current LTS version
- npm — included with Node.js
- Git — for cloning the repository

You can verify your installations with:

```bash
node --version
npm --version
git --version
```

## Run the Project Locally

### 1. Clone the repository

```bash
git clone https://github.com/yukthasmayya8/BSOMS.git
cd BSOMS
```

### 2. Install dependencies

Install the project dependencies from the repository root:

```bash
npm install
```

### 3. Start the development servers

Run the backend and frontend together with:

```bash
npm run dev
```

This starts:

- **Backend API:** `http://localhost:5000`
- **Frontend development server:** usually `http://localhost:5173`

Open the frontend URL in a browser. If Vite selects a different port, use the URL shown in the terminal.

### 4. Stop the application

Press `Ctrl+C` in the terminal to stop both development servers.

## Available Scripts

Run these commands from the project root:

| Command | Description |
| --- | --- |
| `npm run dev` | Starts the frontend and backend development servers concurrently. |
| `npm run frontend` | Starts the Vite frontend development server. |
| `npm run backend` | Starts the Express backend server. |
| `npm start` | Starts the backend server. |
| `npm run build` | Builds the frontend for production. |
| `npm run preview` | Serves the production frontend build using Vite preview. |
| `npm run lint` | Runs ESLint checks. |

## Production-Style Local Run

To create and serve a production frontend build locally:

```bash
npm run build
npm start
```

Then open:

```text
http://localhost:5000
```

The Express server serves the generated frontend files from the `dist` directory and exposes the backend API under `/api`.

## Data Storage

BSOMS uses NeDB for local persistence. Database files are stored in the `server/data/` directory and are created or updated when the backend runs.

Because the data is stored locally:

- Do not commit private or sensitive business data to the repository.
- Back up the `server/data/` directory if you need to preserve local records.
- Resetting or deleting these files will remove the corresponding local data.

## Development Notes

- The frontend and backend are managed from the repository root.
- No separate database server is required for local development.
- The backend uses port `5000` by default and respects the `PORT` environment variable if one is provided.
- The `legacy/` directory contains an earlier version of the application and is not required for the current React-based implementation.

## Contributing

This project was developed as an academic team project. If you would like to suggest an improvement:

1. Fork the repository.
2. Create a feature branch.
3. Make and test your changes.
4. Open a pull request with a clear description of the update.

## License

No formal open-source license has been specified. Please contact the repository owner before redistributing or using this project beyond educational purposes.
