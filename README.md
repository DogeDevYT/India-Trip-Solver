# 🇮🇳 India Trip Decision Dashboard
A quantitative decision matrix, risk model, and simulation dashboard designed to evaluate the trade-offs of traveling to India during a critical software engineering recruiting season.

---

## 📌 The Dilemma
Weighing a **3-week family trip to India** (mid-July to mid-August) against staying home to prep and apply for **Summer Analyst (SA) recruiting**, which traditionally opens around August 1st. 

*   **Go Factors (Benefits of Traveling)**: Mental reset/rest, family relationship capital, novelty value of rare long-haul trips.
*   **Stay Factors (Costs of Traveling)**: High-stress recruiting offset, 10.5-hour time zone lag, Leetcode rust, administrative risks (co-op registration deadlines), and financial ticket costs.

---

## 🚀 Key Features

### 1. 📊 Interactive Decision Matrix
*   **Dynamic Sliders**: Weigh benefits and costs from 0–10 with real-time scoring feedback.
*   **Specialized Flags**:
    *   `HIGH RISK`: Identifies critical threat factors (e.g. administrative deadlines or application window closures).
    *   `BINARY`: Highlights non-linear hazards that can cause single-point failure (e.g. missing an OA because of jet lag).

### 2. 🎲 Monte Carlo Recruiting Simulator
*   **Calibrated Distributions**: Fits normal distributions to historical opening timelines across **140+ top-tier firms** (divided into categories like Quant/HFT, Bulge Brackets, Big Tech, and Fintech).
*   **Simulation Engine**: Runs 10,000 randomized trials to compute the exact statistical probability of missing a high-priority application opening during the trip window.
*   **Asynchronous Processing**: Splits execution chunks via `setTimeout(0)` to maintain a responsive 60 FPS UI.

### 3. 📅 Dynamic Date Picker & Timeline
*   Adjust travel departure and return dates via calendar inputs.
*   Computes and displays **jet lag zones** (return date + 7 days) and counts how many firms are expected to open within your dates.
*   Visualizes the entire summer timeline (Jun 1 – Oct 1) with color-coded markers for each firm:
    *   🔴 **In-Trip Openings** (high risk)
    *   🔵 **In-Jetlag Openings** (medium risk)
    *   🟢 **Safe Openings** (out of range)

### 4. ✈️ Live flight client (SerpApi) & Local Cache
*   Queries real-time Google Flights offers using **SerpApi**.
*   Calculates total round-trip pricing alongside a **financial cost-per-day** metric.
*   **Smart Cache**: Saves searches in `localStorage` keyed by route/dates. Date adjustments load from the cache instantly to conserve credits.
*   **🔄 Sync Live Deals Button**: Click to bypass the cache and trigger a fresh query.

### 5. 🌍 3D Geopolitical Globe (Globe.gl)
*   Visualizes flight routes as glowing great-circle arcs on a WebGL Earth.
*   Pins a permanent warning zone for the **Strait of Hormuz** (Persian Gulf) with a pulsing red ring target.
*   Scans flight segments and triggers a **Danger Alert** (GPS spoofing, airspace closure risks) if the route transits via hubs like Dubai (DXB), Abu Dhabi (AUH), or Doha (DOH).

### 6. 📈 Top Stats panel
*   Displays decision matrix delta and flight budget statistics side-by-side at the top of the screen, updating instantly.

---

## 🛠️ Architecture & Tech Stack
*   **Core**: HTML5, Vanilla JavaScript (ESM).
*   **Dev Server & Bundling**: [Vite](https://vite.dev/).
*   **Rendering**: WebGL via [Globe.gl](https://globe.gl/) (Three.js wrapper).
*   **State Management**: Centralized Pub/Sub Store.
*   **Styling**: Pure CSS variables (Dark Theme, glassmorphic headers, neon accent badges).

---

## 💻 Getting Started

### 1. Installation
Clone the repository, open a terminal in the folder, and install dependencies:
```bash
npm install
```

### 2. Run Locally
Start the development server:
```bash
npm run dev
```
Open [http://localhost:5173/](http://localhost:5173/) in your browser.

### 3. API Credentials (Optional)
Click **⚙️ API Settings** on the flights card to configure:
*   **SerpApi Key**: Enter your key to pull live Google Flights deals.
*   **Airports**: Customize departure/arrival codes (e.g. `SFO` or `JFK` to `DEL` or `BOM`).
*   *(Without keys, the dashboard seamlessly falls back to offline calibrated summer curves).*
