# RoommateGroups — Final Project

Welcome to the final version of **RoommateGroups**, a modern, Gen Z-aesthetic platform designed to help people find compatible roommates and list properties with ease.

## 🚀 Key Features

- **Dynamic SPA Architecture**: A fast, Single Page Application built with Vanilla JS and Vite.
- **Advanced Search**: Filter listings by city, property type, and roommate preferences with a glassmorphism floating search bar.
- **Secure Authentication**: Complete Login and Registration flows with password hashing, strength estimation, and **Google One Tap** integration.
- **Listing Management**: A multi-step listing wizard allowing users to upload photos, set preferences, and use **AI-assisted descriptions**.
- **Admin Panel**: A comprehensive dashboard for managing users, listings, and cities.
- **Interactive Maps**: Integrated OpenStreetMap for property location visualization.
- **Mock Database Service**: A robust `localStorage`-based database with pre-seeded data for instant testing.
- **Image Upload System**: Express-based backend for handling image processing and storage.

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Design System), JavaScript (ESModules)
- **Bundler**: Vite
- **Backend**: Node.js, Express (File uploads & Email)
- **Authentication**: Custom JWT-style session management + Google Identity Services
- **Storage**: Browser LocalStorage (Data) + Local Filesystem (Images)

## 🏁 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the Servers
You need to run both the frontend (Vite) and the backend (Express).
```bash
npm run dev:full
```
*   **Web App**: [http://localhost:3001](http://localhost:3001)
*   **API Server**: [http://localhost:3002](http://localhost:3002)

### 3. Login Credentials
- **Admin**: `admin@roommategroups.com` / `password123`
- **Default User**: Any newly registered email.

## 📁 Project Structure

- `/index.html`: Main SPA entry point.
- `/src/main.js`: Router and application initialization.
- `/src/pages/`: Modular page components (Home, Search, Dashboard, etc.).
- `/src/services/`: Core logic (Auth, Database, Upload).
- `/src/components/`: Reusable UI elements (Navbar, Footer).
- `/server.js`: Express backend for uploads.
- `/styles.css`: Legacy static styles.
- `/src/style.css`: Modern SPA Design System.

---
*Created with ❤️ for the RoommateGroups Community.*
