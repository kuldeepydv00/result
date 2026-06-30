# Satta King Result Platform

A complete, production-ready, self-healing web application for displaying Satta King results. It features manual administration, background API crawlers, monthly historical charts, multithreaded searches, dark mode, Hindi/English localization, and Progressive Web App (PWA) browser push notifications.

> [!NOTE]
> This platform is **purely informational**. It contains no real money, wagering, betting, or gambling functionalities.

---

## 🚀 Features

- **Public Views**:
  - Live result dashboard with real-time updates and comparisons.
  - Upcoming game schedule ("NEXT") timers.
  - Historic monthly record charts displaying day-by-day matrices.
  - Multilingual support (English & Hindi) using client-side translation layers.
  - Class-based theme toggling (Dark/Light mode).
- **Administrative Operations**:
  - CRUD panels for managing game markets, order indexes, and schedules.
  - Results editor (manual overrides, CSV imports, one-click pending announcements).
  - Monthly chart manager (cell grids and CSV uploads).
  - External API configurations manager with integrated "Test Connection" JSON analyzers.
  - Background fetch log viewer and database audit tracking.
- **PWA & Web Push Alerts**:
  - Fully installable Progressive Web App (Service Worker caches and web manifest).
  - Interactive browser push notifications triggered instantly when starred favorites are announced.

---

## 🛠️ Tech Stack

- **Backend**: Node.js (v20) + Express.js (v4), MongoDB + Mongoose, JWT & Bcryptjs, Winston Logger, Node-cron.
- **Frontend**: React (v18) + Vite, TypeScript, Tailwind CSS, Zustand, React Router (v6), React Hook Form + Zod, React-i18next.
- **Push Alerts**: Web Push API (via the Node `web-push` library).

---

## 📂 Project Structure

```text
├── docker-compose.yml       # Production orchestration
├── backend/
│   ├── src/
│   │   ├── controllers/     # API request handlers (Auth, Games, Results, Charts, settings)
│   │   ├── models/          # Mongoose database models (Game, Result, Chart, Settings, User)
│   │   ├── routes/          # Aggregated Express router and mock crawl endpoint
│   │   ├── middlewares/     # JWT authentication, guards, rate-limiters, Zod validators
│   │   ├── services/        # Web Push notifications, Ethereal mailer, Axios crawler
│   │   ├── cron/            # Chronometer checking settings crawl interval dynamically
│   │   ├── utils/           # Winston logger, Mongoose database connector
│   │   ├── scripts/         # Seed script populating initial games and super-admin
│   │   └── index.ts         # Application entry point
│   ├── package.json
│   └── tsconfig.json
└── frontend/
    ├── src/
    │   ├── components/      # UI components (Header, Footer, SearchBar, InstallPwaPrompt)
    │   ├── pages/           # Views (Home, Charts, Search, Profile, AdminDashboard console)
    │   ├── store/           # Zustand global state store
    │   ├── utils/           # Axios API client
    │   ├── i18n.ts          # Hindi / English translation resources
    │   ├── App.tsx          # Router layout and route guards
    │   ├── index.css        # Custom CSS styling bases
    │   └── main.tsx
    ├── public/
    │   ├── push-sw.js       # Background push alerts service worker listener
    │   └── pwa-*.png        # PWA app icons
    ├── package.json
    └── vite.config.ts
```

---

## ⚙️ Quick Start

### 1. Prerequisites
- **Node.js** v20+ and **npm** installed.
- **MongoDB** running locally on port `27017` (or configured via environment variables).

### 2. Environment Setup
Create a `.env` file in the `backend/` directory (see `backend/.env` for a fully functional development template):
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/satta-king
JWT_SECRET=your_jwt_secret_key_here
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=Admin@123
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
FRONTEND_URL=http://localhost:3000
```
> [!TIP]
> If `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY` are left blank, the application will **automatically generate a valid key pair** on startup, save them in the database, and print details in the terminal console.

### 3. Database Seeding
To register the default games (Disawar, Gali, Taj, Faridabad, etc.), configure the mock API integration target, and create the default super-admin user account (`admin@example.com` / `Admin@123`):
```bash
cd backend
npm run seed
```

### 4. Running the Dev Servers

Start the **Backend API** (runs on `http://localhost:5000`):
```bash
cd backend
npm run dev
```

Start the **Frontend App** (runs on `http://localhost:3000`):
```bash
cd frontend
npm run dev
```

Open your browser and navigate to `http://localhost:3000`.

---

## 📡 Crawling & Testing the Integration

By default, the seeding script configures the background crawler to target a **local mock results endpoint** (`/api/mock-external-results`) running on your own server. This makes offline testing extremely simple:
1. Log in to the administrative panel at `http://localhost:3000/login` using `admin@example.com` / `Admin@123` under the **ADMIN LOGIN** tab.
2. Navigate to **EXTERNAL API CONFIG**.
3. Under the form, click **TEST CONNECTION**. The console will immediately simulate the request, execute JSON-path parsing matching your schemas, and display the diagnosed output mapping.
4. Click **FORCE API CRAWL NOW** on the Overview monitor to trigger a manual results fetch for today's mock data. The Home results dashboard will immediately populate.

---

## 🐳 Production Deployment (Docker Compose)

To spin up the entire production stack (MongoDB, Node Backend API, Nginx frontend reverse proxy) with one command:
```bash
docker-compose up --build
```
The application will compile assets, spin up MongoDB, and expose the public platform on port **`80`** (`http://localhost`).

---

## 🎨 Visual Design Guidelines

The styling strictly reproduces the aesthetic of the reference site:
- **Flat Layout**: Clear borders, no drop shadows, sharp square corners.
- **Stark Contrast**: White backgrounds (`#ffffff`) matching charcoal text (`#1a1a1a`).
- **Accent Boldness**: Results highlighted in huge, bold red numbers (`#dc2626`).
- **Badges**: Flat labels (e.g. green for "UPCOMING" announcements).
