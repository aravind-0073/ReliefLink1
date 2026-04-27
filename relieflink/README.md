# ReliefLink — Smart Resource Allocation Platform

A full-stack volunteer coordination platform with real-time priority scoring, smart volunteer matching, and map visualization.

## Tech Stack

- **Frontend**: React 18, React-Leaflet (maps), Chart.js, React-Toastify
- **Backend**: Node.js + Express
- **Database**: Google Cloud Firestore
- **Matching Engine**: Haversine distance + skill scoring
- **Priority Engine**: Weighted formula (urgency + people affected + category)

---

## Folder Structure

```
relieflink/
├── backend/
│   ├── config/
│   │   └── firebase.js          # Firestore initialization
│   ├── controllers/
│   │   ├── needsController.js
│   │   ├── volunteersController.js
│   │   ├── matchingController.js
│   │   ├── assignmentsController.js
│   │   ├── analyticsController.js
│   │   └── seedController.js
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── needs.js
│   │   ├── volunteers.js
│   │   ├── matching.js
│   │   ├── assignments.js
│   │   ├── analytics.js
│   │   └── seed.js
│   ├── utils/
│   │   ├── priorityEngine.js    # Priority scoring logic
│   │   └── matchingEngine.js    # Volunteer matching algorithm
│   ├── .env.example
│   ├── package.json
│   └── server.js
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── components/
    │   │   ├── Sidebar.jsx
    │   │   ├── Topbar.jsx
    │   │   ├── Badges.jsx
    │   │   ├── MetricCard.jsx
    │   │   ├── LoadingSpinner.jsx
    │   │   └── NeedCard.jsx
    │   ├── hooks/
    │   │   ├── useNeeds.js
    │   │   ├── useVolunteers.js
    │   │   └── useAnalytics.js
    │   ├── pages/
    │   │   ├── Dashboard.jsx
    │   │   ├── NeedsPage.jsx
    │   │   ├── VolunteersPage.jsx
    │   │   ├── MapPage.jsx
    │   │   ├── MatchingPage.jsx
    │   │   ├── SubmitNeed.jsx
    │   │   └── AddVolunteer.jsx
    │   ├── utils/
    │   │   ├── api.js
    │   │   └── helpers.js
    │   ├── App.jsx
    │   ├── index.js
    │   └── index.css
    ├── .env.example
    └── package.json
```

---

## Setup Instructions

### Step 1 — Firebase / Firestore Setup

1. Go to [https://console.firebase.google.com](https://console.firebase.google.com)
2. Create a new project (e.g., "relieflink")
3. Click **Firestore Database** → **Create Database** → choose **production mode**
4. Go to **Project Settings** → **Service Accounts** → **Generate new private key**
5. Download the JSON file — it contains all your credentials

### Step 2 — Backend Configuration

```bash
cd relieflink/backend
cp .env.example .env
```

Open `.env` and fill in values from the downloaded JSON file:

```
PORT=5000
FIREBASE_PROJECT_ID=          # "project_id" from JSON
FIREBASE_PRIVATE_KEY_ID=      # "private_key_id" from JSON
FIREBASE_PRIVATE_KEY=         # "private_key" from JSON (keep quotes + \n)
FIREBASE_CLIENT_EMAIL=        # "client_email" from JSON
FIREBASE_CLIENT_ID=           # "client_id" from JSON
```

> **Important**: The `FIREBASE_PRIVATE_KEY` value must be wrapped in double quotes and keep the `\n` escape sequences as-is.

### Step 3 — Install & Run Backend

```bash
cd relieflink/backend
npm install
npm run dev       # development (nodemon)
# OR
npm start         # production
```

Backend runs at: `http://localhost:5000`

### Step 4 — Install & Run Frontend

```bash
cd relieflink/frontend
cp .env.example .env
npm install
npm start
```

Frontend runs at: `http://localhost:3000`

### Step 5 — Seed Sample Data

Once both servers are running, either:
- Visit the app and click **"Seed Sample Data"** button in the Topbar, OR
- Run: `curl -X POST http://localhost:5000/api/seed`

This adds 6 sample needs and 6 volunteers to Firestore.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/needs` | Create a new need |
| GET | `/api/needs` | Get all needs (filterable) |
| GET | `/api/needs/prioritized` | Get needs sorted by priority score |
| PATCH | `/api/needs/:id/status` | Update need status |
| DELETE | `/api/needs/:id` | Delete a need |
| POST | `/api/volunteers` | Register a volunteer |
| GET | `/api/volunteers` | Get all volunteers |
| PATCH | `/api/volunteers/:id` | Update volunteer |
| DELETE | `/api/volunteers/:id` | Delete volunteer |
| GET | `/api/match/:needId` | Get matched volunteers for a need |
| POST | `/api/assignments` | Assign volunteer to need |
| GET | `/api/assignments` | Get all assignments |
| PATCH | `/api/assignments/:id/status` | Update assignment status |
| GET | `/api/analytics` | Get dashboard analytics |
| POST | `/api/seed` | Seed sample data |
| GET | `/api/health` | Health check |

---

## Priority Score Formula

```
Priority Score = (Urgency Weight × 3) + (People Affected / 200 × 5 × 2) + (Category Weight × 2)

Urgency Weights:   High=3, Medium=2, Low=1
Category Weights:  Disaster=1.5, Health=1.4, Food=1.2, Education=1.0
```

## Matching Algorithm

```
Match Score = Skill Overlap Score (0-40%) + Distance Score (0-60%)

Skill Overlap: (matched skills / relevant skills) × 40
Distance Score: max(0, 100 - haversine_distance_km × 50)
```

---

## Features

- Submit and track community needs (food, health, education, disaster)
- Automatic priority scoring on submission
- Volunteer registration with skills and location
- Smart volunteer-to-need matching (skill + proximity)
- Interactive map with color-coded urgency pins (Leaflet + OpenStreetMap)
- Admin dashboard with analytics charts (Chart.js)
- Real-time task assignment and status tracking
- Filter/search across all needs
- Toast notifications for all actions
- Seed API for quick demo data
