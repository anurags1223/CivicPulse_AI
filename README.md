# CivicPulse AI

> **Report smarter. Respond faster.**  
> An AI-powered civic issue reporting and municipal resolution platform featuring transparent priority scoring, Smart City CCTV AI vision, automated hazard detection, non-monetary citizen gamification, proximity duplicate detection, and resident-verified closure.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://civicpulse-ai-chi.vercel.app)
[![Tests Passing](https://img.shields.io/badge/Tests-Passing-brightgreen?style=for-the-badge)](https://github.com/anurags1223/CivicPulse_AI)

- **Production URL:** [https://civicpulse-ai-chi.vercel.app](https://civicpulse-ai-chi.vercel.app)
- **GitHub Repository:** [https://github.com/anurags1223/CivicPulse_AI](https://github.com/anurags1223/CivicPulse_AI)

---

## 🌟 Key Features

### 1. 🎥 Smart City CCTV AI Vision Network
- **Automated Highway & Junction Monitoring**: Eliminates reliance on busy highway drivers or commuters to report road hazards. Municipal CCTV cameras continuously monitor critical traffic intersections and expressways.
- **Computer Vision Hazard Detection**: AI bounding boxes identify potholes (`[POTHOLE 98%]`), drain overflow / waterlogging (`[WATERLOG 95%]`), solid waste accumulation, and streetlight outages in real time.
- **1-Click Dispatch to Municipal Queue**: Operations staff can review live camera telemetry (FPS, vehicle density, coordinates) and immediately route AI detections to the responsible department.

### 2. 🏆 Citizen Gamification & Non-Monetary Rewards
- **Civic Points**: Citizens earn `+10 pts` for reporting, `+2 pts` for community upvotes, and `+50 pts` when their reported issue is resolved by field crews.
- **Civic Badges**: Milestones including 🌱 *First Report*, 📋 *Reporter* (5 reports), 🦅 *Eagle Eye* (10 reports), 🏆 *Civic Hero* (25 reports), and ✅ *Problem Solver*.
- **Citizen Rewards Bar**: Signed-in citizens can track their total civic score and community impact.

### 3. 🤖 AI Photo Evidence Validator
- **Image Hazard Classification**: Uses Gemini Vision (`gemini-2.0-flash`) and visual heuristics to verify whether an uploaded photo depicts a genuine civic issue (pothole, garbage, flood) or an irrelevant photo before submission.
- **Instant Visual Feedback**: Shows color-coded verdict chips (`✅ Detected: Roads & footpaths`, `⏳ Analyzing…`, or `⚠️ Not a civic issue detected`).

### 4. 📍 High-Accuracy "Use My Location" & Reverse Geocoding
- **One-Tap GPS Lock**: Direct browser geolocation with `enableHighAccuracy: true` for mobile devices.
- **Automated Street Name Detection**: Uses OpenStreetMap Nominatim reverse geocoding to automatically populate landmarks and street names (e.g., *Kartavya Path*, *Sector 17 Plaza*).

### 5. ⚡ Explainable Priority Scoring & Duplicate Prevention
- **Transparent Scoring Formula**: Prioritizes tickets based on reported severity, public safety risk, affected population density, and age of report.
- **Proximity Duplicate Detection**: Automatically flags existing reports within 150 meters in the same category to prevent duplicate work orders while aggregating resident impact.

### 6. 🛠️ Staff Triage Portal & Resident-Verified Closure
- **Role-Based Workflow**: Dedicated access for municipal operations staff (`bikeesah30@gmail.com`).
- **Proof-Backed Resolution**: Staff must upload photographic proof of repair before requesting closure.
- **Citizen Confirmation Lock**: Only the original resident reporter can confirm resolution or reopen an unsatisfied repair.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 8, React-Leaflet, Leaflet, Lucide React
- **AI & Vision**: Gemini Vision API integration (`gemini-2.0-flash`), OpenStreetMap Geocoding
- **Storage & State**: Built-in persistent browser mock store (fallback) + Supabase (PostgreSQL, Row-Level Security, Managed Auth, Storage)
- **Testing**: Node.js native test runner (`node --test`)
- **Deployment**: Vercel (Production CI/CD)

---

## 📁 Project Structure

```text
CivicPulse_AI/
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main application UI, state & workflow navigation
│   │   ├── Map.jsx             # Interactive Leaflet map component with issue pins
│   │   ├── api.js              # Supabase API client, persistent mock store & rewards engine
│   │   ├── cctv.js             # Smart City CCTV feeds, telemetry & AI hazard generation
│   │   ├── aiValidatePhoto.js  # Gemini Vision & heuristic photo verification
│   │   ├── civic.js            # Business logic (priority scoring, duplicate rules, badges)
│   │   ├── seed.js             # Synthetic demo cases for out-of-the-box demo
│   │   ├── style.css           # UI layout, CCTV surveillance HUD & rewards bar styling
│   │   └── main.jsx            # React root mount
│   ├── tests/
│   │   └── civic.test.js       # Unit tests for scoring, duplicates & role permissions
│   ├── .env.example            # Environment variable template
│   ├── package.json            # Frontend scripts and dependencies
│   └── vite.config.js          # Vite build configuration
├── backend/
│   ├── supabase/
│   │   └── schema.sql          # PostgreSQL schema, RLS policies, functions & triggers
│   └── tests/
│       └── database.sql        # Database integration tests
├── package.json                # Root package script runner
└── README.md
```

---

## 🚀 Steps to Run Locally

### Prerequisites

- **Node.js**: `v20.0.0` or higher (tested on Node `v22` and `v24`)
- **npm**: `v10.0.0` or higher
- **Git**

---

### 1. Clone the Repository

```bash
git clone https://github.com/anurags1223/CivicPulse_AI.git
cd CivicPulse_AI
```

---

### 2. Install Dependencies

You can install all dependencies from the root directory:

```bash
npm run setup
```

*(Alternatively: `cd frontend && npm install`)*

---

### 3. Run the Development Server

Start the local development server:

```bash
npm run dev
```

Open your browser and navigate to:

```
http://127.0.0.1:5173/
```

> **Note on Demo Mode:**  
> The application runs in **Demo Mode** out-of-the-box using synthetic community reports and CCTV feeds. You can explore the dashboard, filter by severity, view live CCTV surveillance cameras, test the AI validator, and toggle staff/resident roles without needing any database setup.

---

### 4. Running Unit Tests

Run the built-in decision-rule and workflow test suite:

```bash
npm test
```

---

### 5. Production Build

To build the project for production:

```bash
npm run build
```

The compiled output will be generated in `frontend/dist/`. To preview locally:

```bash
npm run preview
```

---

## ⚙️ Optional Environment Variables

If connecting to a live Supabase backend or Gemini Vision API, configure `frontend/.env.local`:

```env
# Supabase Backend (Optional)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-publishable-key

# Gemini AI Vision (Optional)
VITE_GEMINI_API_KEY=your-gemini-api-key
```

*(Without these keys, CivicPulse AI automatically falls back to its persistent local mock store and heuristic classifier).*

---

## 📜 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run setup` | Installs frontend dependencies |
| `npm run dev` | Starts Vite local development server on `http://127.0.0.1:5173/` |
| `npm test` | Runs the test suite for priority scoring & workflow logic |
| `npm run build` | Compiles optimized production bundle in `frontend/dist` |
| `npm run preview` | Previews the production build locally |

---

## 👥 Roles & Credentials

- **Lead Operations Officer:** `bikeesah30@gmail.com` (password: `bikeesah30` or quick login button)
- **Resident Citizen:** Sign in with any personal email to track reports, earn points, and unlock badges.

---

## 📄 License

This project is licensed under the MIT License.
