# RoommateGroups — Final Project

Welcome to the final version of **RoommateGroups**, a modern, Gen Z-aesthetic platform designed to help people find compatible roommates and list properties with ease.

## 🚀 Key Features

- **Dynamic SPA Architecture**: A fast, Single Page Application built with Vanilla JS and Vite.
- **Advanced Search**: Filter listings by city, property type, and roommate preferences with a glassmorphism floating search bar.
- **Secure Authentication**: Complete Login and Registration flows with password hashing, strength estimation, and **Google One Tap** integration.
- **Listing Management**: A multi-step listing wizard allowing users to upload photos, set preferences, and use **AI-assisted descriptions**.
- **Admin Panel & Blog CMS**: A comprehensive dashboard for managing users, listings, cities, and a fully featured Blog CMS with live previews.
- **Cloud-Native Backend**: Serverless architecture using **Cloudflare Workers** (`worker.ts`) for high performance and low latency.
- **Robust Database**: **Cloudflare D1** SQL database for reliable data storage and complex queries.
- **Image Storage**: **Cloudflare R2** for fast and scalable image serving.
- **Premium Subscriptions**: Integrated with **Stripe Customer Portal** for plan management and payments.
- **Interactive Maps**: Integrated OpenStreetMap for property location visualization.

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Design System), JavaScript (ESModules)
- **Bundler**: Vite
- **Backend**: Cloudflare Workers (TypeScript)
- **Database**: Cloudflare D1 (SQLite)
- **Object Storage**: Cloudflare R2 (Images)
- **AI Integration**: Google Generative AI
- **Authentication**: Custom JWT-style session management + Google Identity Services
- **Payments**: Stripe Billing & Customer Portal

## 🏁 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Cloudflare Wrangler
Ensure you have Wrangler installed and authenticated:
```bash
npx wrangler login
```

### 3. Start the Development Servers
You can run the frontend (Vite) and the backend (Cloudflare Worker):
```bash
npm run dev           # Starts Vite frontend
npm run dev:worker    # Starts Cloudflare Worker backend
```
Or run the full legacy stack if needed:
```bash
npm run dev:full      # Starts legacy Express server and Vite
```
*   **Web App**: [http://localhost:5173](http://localhost:5173) (Vite default)
*   **API Server**: Cloudflare Worker local URL (typically [http://localhost:8787](http://localhost:8787))

### 4. Database Setup
To initialize the local D1 database:
```bash
npx wrangler d1 execute <DB_NAME> --local --file=./schema.sql
```

## 📁 Project Structure

- `/index.html`: Main SPA entry point.
- `/src/main.js`: Router and application initialization.
- `/src/pages/`: Modular page components (Home, Search, Dashboard, Blog, etc.).
- `/src/services/`: Core logic (Auth, API integration).
- `/src/components/`: Reusable UI elements.
- `/worker.ts`: Cloudflare Workers backend routing and API logic.
- `/schema.sql` & `/migrate.sql`: D1 Database schema definitions and migrations.
- `/wrangler.toml`: Cloudflare Workers configuration.
- `/src/style.css`: Modern SPA Design System.

---
*Created with ❤️ for the RoommateGroups Community.*
