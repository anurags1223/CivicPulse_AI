# CivicPulse AI

> **Report smarter. Respond faster.**  
> A civic issue reporting and resolution platform featuring transparent priority scoring, proximity duplicate detection, automated department routing, photo evidence tracking, and resident-verified closure.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://civicpulse-ai-chi.vercel.app)

- **Production URL:** [https://civicpulse-ai-chi.vercel.app](https://civicpulse-ai-chi.vercel.app)
- **GitHub Repository:** [https://github.com/anurags1223/CivicPulse_AI](https://github.com/anurags1223/CivicPulse_AI)

---

## Overview

CivicPulse AI bridges citizens and municipal departments through a clear, inspectable workflow:
- **Explainable Priority Scoring**: Calculates priority dynamically based on citizen severity, public safety risk, affected population, and report age.
- **Duplicate Detection**: Flags nearby issues (<150m) in the same category to prevent redundant tickets while aggregating public impact.
- **Interactive City Map**: Real-time Leaflet map of reported issues categorized by urgency level with visual pins.
- **Department Routing**: Automatically suggests the responsible municipal department (Roads, Electrical, Water & Sanitation, etc.).
- **Proof-Backed Resolution**: Field staff must upload repair proof before requesting closure; tickets are only completed when confirmed by the original resident.
- **Instant Demo Mode**: Includes 6 synthetic community reports so anyone can test all features immediately without requiring database credentials.

---

## Tech Stack

- **Frontend**: React 19, Vite 8, React-Leaflet, Leaflet, Lucide React
- **Backend (Optional / Production)**: Supabase (PostgreSQL, Row-Level Security, Managed Auth, Storage)
- **Testing**: Node.js native test runner (`node --test`)

---

## Project Structure

```text
CivicPulse_AI/
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main application UI and workflow state
│   │   ├── Map.jsx             # Interactive Leaflet map component
│   │   ├── api.js              # Supabase API client and demo data fallback
│   │   ├── civic.js            # Business logic (priority scoring, duplicate detection)
│   │   ├── seed.js             # Synthetic demo cases
│   │   ├── style.css           # UI layout and styling
│   │   └── main.jsx            # React root mount
│   ├── tests/
│   │   └── civic.test.js       # Unit tests for scoring, duplicates & role permissions
│   ├── .env.example            # Environment variable template
│   ├── package.json            # Frontend scripts and dependencies
│   └── vite.config.js          # Vite build configuration
├── backend/
│   ├── supabase/
│   │   └── schema.sql          # PostgreSQL schema, RLS policies, functions & triggers
│   ├── tests/
│   │   └── database.sql        # Database integration tests (rollback-safe)
│   └── README.md               # Backend deployment instructions
├── .github/
│   └── workflows/
│       └── ci.yml              # CI test workflow
├── package.json                # Root package script runner
└── README.md
```

---

## Steps to Run Locally

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

*(Alternatively, you can navigate directly to the frontend folder and install: `cd frontend && npm install`)*

---

### 3. Run the Development Server

Start the local development server:

```bash
npm run dev
```

The Vite server will launch. Open your browser and navigate to:

```
http://127.0.0.1:5173/
```

> **Note on Demo Mode:**  
> The application will automatically run in **Demo Mode** out-of-the-box using 6 synthetic civic reports. You can explore the dashboard, filter by severity, view map pins, inspect the decision rules, and test staff/resident role toggles without setting up any backend.

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

The compiled output will be generated in `frontend/dist/`. To preview the production build locally:

```bash
npm run preview
```

---

## Optional: Connecting to a Real Supabase Backend

If you wish to run the app with live Supabase authentication, PostgreSQL storage, and real database triggers:

1. **Create a Supabase Project** at [supabase.com](https://supabase.com).
2. **Execute Database Schema**:
   - Open your project's **SQL Editor**.
   - Copy the contents of `backend/supabase/schema.sql` and run it.
3. **Configure Environment Variables**:
   - Copy `frontend/.env.example` to `frontend/.env.local`:
     ```bash
     cp frontend/.env.example frontend/.env.local
     ```
   - Fill in your Supabase credentials:
     ```env
     VITE_SUPABASE_URL=https://your-project-id.supabase.co
     VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-publishable-key
     ```
   *(Never expose your `service_role` secret key in Vite.)*
4. **Restart the dev server** (`npm run dev`). The app will now connect to your live Supabase database.

---

## Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run setup` | Installs frontend dependencies using `npm ci` |
| `npm run dev` | Starts Vite local development server on `http://127.0.0.1:5173/` |
| `npm test` | Runs the Node.js test suite for priority scoring & workflow logic |
| `npm run build` | Compiles optimized production bundle in `frontend/dist` |
| `npm run preview` | Previews the production build locally |

---

## License

This project is licensed under the MIT License.
