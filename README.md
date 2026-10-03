# Civic360 AI 🏛️
### Smarter Civic Issue Resolution for West Bengal
> **Report. Route. Resolve.**

Civic360 AI is a modern full-stack civic-tech web platform designed to support civic issue reporting across West Bengal, India. It empowers citizens to report civic grievances—such as potholes, garbage accumulation, broken streetlights, water pipeline bursts, drainage blockages, and road damage—with location details, photo evidence, and complaint status tracking.

For municipal administrations and field officers, Civic360 AI provides an intelligent workspace with automated smart routing, urgency classification, proximity-based duplicate detection, interactive Leaflet city mapping, Before/After resolution verification, and executive analytics.

---

## 🌟 Key Features

### 👤 Citizen Portal
- **Interactive Landing & Discovery:** Overview of civic health, recent citywide tickets, and resolution metrics.
- **AI-Assisted Issue Reporting:**
  - Enter description and photo to receive instant AI suggestions on issue category, urgency, and recommended municipal division.
  - Proximity duplicate alerts to prevent redundant reports for the same incident.
- **Accurate Geolocation & Pinning:**
  - One-click HTML5 GPS auto-detection.
  - Interactive Leaflet + OpenStreetMap pin picker with coordinates display.
- **My Complaints Tracker:**
  - Filter by category and status (Pending, Assigned, In Progress, Resolved).
  - Search complaints by title, ward, or reference ID.
- **Full Resolution Timeline:**
  - Complete chronological audit log with notes and assigned officer details.
  - **Before / After Photo Verification:** Interactive slider comparing original damage to completed repairs.
- **Notification Drawer:** Live alerts when an officer updates ticket status.
- **Citizen Profile:** View total reports, pending issues, and customize default ward.

### 👷 Field Officer Workspace
- **Departmental Filtering:** Switch between personal assignments and departmental pool (PWD / Roads, Sanitation, Water Department, Electrical, Drainage Department).
- **Urgency Telemetry:** Critical and High priority badges with alert indicators.
- **Interactive Map View:** City map with color-coded markers (Red = Critical, Orange = High, Amber = Medium, Green = Resolved).
- **Resolution Desk:**
  - Transition status from Assigned → In Progress → Resolved.
  - Record official resolution notes.
  - Upload photographic proof of completed work ("After Resolution" photo).

### 📊 Municipal Administration Center
- **Executive KPI Dashboard:** Real-time metrics on total complaints, resolution percentage, active critical tickets, and active workforce.
- **Interactive Charts (Chart.js):**
  - Category distribution breakdown (Doughnut chart).
  - Department workload & resolution comparison (Bar chart).
- **Ward-Wise Density Statistics:** Identifies highest incident wards for municipal budget allocation.
- **Master Ticket Audit Table:** Citywide view with direct inspection and status management.
- **Personnel Management:** View registered citizens and officers, promote roles, and reassign officers across municipal departments.

---

## 🤖 AI Architecture (`services/aiService.js`)

Civic360 AI features a clean, modular AI interface ready for plug-and-play integration with OpenAI GPT-4o, Google Gemini, or custom municipal NLP models:

1. **`classifyComplaint(text, imageDescription)`**
   - Natural language classification extracting civic intent and matching to appropriate categories (Pothole, Garbage, Broken Streetlight, Water Leakage, Drainage, Road Damage).
2. **`detectPriority({ category, description, ward })`**
   - Heuristic priority engine checking for hazards (e.g. exposed live wire, hospital zones, highway craters, open manholes) to mark issues as **Critical** or **High**.
3. **`detectDuplicateComplaint({ category, latitude, longitude, ComplaintModel })`**
   - Geo-spatial Haversine proximity engine checking for active tickets within **150 meters** logged in the past 30 days to prevent municipal work redundancy.
4. **`recommendDepartment(category)`**
   - Smart routing matrix mapping issues directly to relevant civic bodies:
     - **Pothole / Road Damage** → *PWD / Roads*
     - **Garbage / Litter** → *Sanitation*
     - **Broken Streetlight / Exposed Wire** → *Electrical*
     - **Water Leakage / Pipe Burst** → *Water Department*
     - **Drainage / Silt Block** → *Drainage Department*

---

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 18 with Vite
- **Styling:** Tailwind CSS (Custom civic palette: Blue primary accent, Emerald success, Red critical, Orange pending)
- **Routing:** React Router v6
- **Icons:** Lucide React
- **Maps:** Leaflet & React-Leaflet with OpenStreetMap
- **Data Visualizations:** Chart.js & React-Chartjs-2

### Backend
- **Runtime:** Node.js (ES Modules)
- **Framework:** Express.js RESTful API
- **Database:** MongoDB with Mongoose ODM (Zero-config in-memory fallback enabled out-of-the-box!)
- **Authentication:** JWT (JSON Web Tokens) with `bcryptjs` password hashing
- **File Uploads:** Multer with local static serving and base64 resilience

---

## 📁 Project Structure

```
civic360-ai/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx               # Brand header, notifications & demo indicator
│   │   │   ├── Footer.jsx               # Helplines, civic links & municipal directory
│   │   │   ├── ComplaintCard.jsx        # Responsive issue card
│   │   │   ├── ComplaintMap.jsx         # Interactive Leaflet map with filtered markers
│   │   │   ├── MapPicker.jsx            # Geolocation coordinate picker
│   │   │   ├── ImageCompareModal.jsx    # Interactive Before/After slider & side-by-side view
│   │   │   ├── NotificationDrawer.jsx   # Slide-over alert feed
│   │   │   ├── DemoSwitcherModal.jsx    # Non-production demo role selector
│   │   │   ├── StatusBadge.jsx          # Color-coded status pills
│   │   │   ├── PriorityBadge.jsx        # Urgency badges
│   │   │   ├── LoadingSpinner.jsx       # State spinners
│   │   │   └── EmptyState.jsx           # Zero-data state displays
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx          # Public showcase & hero section
│   │   │   ├── LoginPage.jsx            # Sign-in and controlled demo access
│   │   │   ├── RegisterPage.jsx         # Citizen & Officer registration
│   │   │   ├── ReportIssuePage.jsx      # Multi-step complaint submission with AI assistant
│   │   │   ├── CitizenDashboard.jsx     # Citizen KPI counters and tickets
│   │   │   ├── MyComplaintsPage.jsx     # Filterable user complaint archive
│   │   │   ├── ComplaintDetailPage.jsx  # Timeline, map pin & officer resolution desk
│   │   │   ├── TrackComplaintPage.jsx   # Public ticket reference search
│   │   │   ├── CityMapPage.jsx          # Dedicated citywide spatial intelligence map
│   │   │   ├── OfficerDashboard.jsx     # Field officer operations & department pool
│   │   │   ├── AdminDashboard.jsx       # Commissioner analytics & personnel management
│   │   │   ├── ProfilePage.jsx          # Personal ward settings and metrics
│   │   │   └── NotFoundPage.jsx         # 404 page
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx           # Shell layout
│   │   ├── context/
│   │   │   ├── AuthContext.jsx          # Global auth state & JWT persistence
│   │   │   └── NotificationContext.jsx  # Unread badge & alert syncing
│   │   ├── services/
│   │   │   ├── api.js                   # Universal fetch wrapper with auth header
│   │   │   ├── authService.js           # Login, demo session, register, profile
│   │   │   ├── complaintService.js      # CRUD, analytics & AI analysis
│   │   │   └── notificationService.js   # Notification queries
│   │   ├── utils/
│   │   │   ├── constants.js             # Categories, wards, departments & demo role labels
│   │   │   └── formatters.js            # Date & badge helpers
│   │   ├── App.jsx                      # Protected routing
│   │   ├── main.jsx                     # Client bootstrap
│   │   └── index.css                    # Tailwind & Leaflet styles
│   ├── package.json
│   └── vite.config.js
│
├── server/
│   ├── config/
│   │   └── db.js                        # Resilient Mongoose connection + In-Memory fallback
│   ├── controllers/
│   │   ├── authController.js            # Auth & profile logic
│   │   ├── complaintController.js       # Issue ingestion, updates & AI draft analysis
│   │   ├── officerController.js         # Officer metrics & queue
│   │   ├── adminController.js           # Analytics aggregation & user modification
│   │   └── notificationController.js   # Notification polling
│   ├── models/
│   │   ├── User.js                      # Citizen, Officer, Admin schema
│   │   ├── Complaint.js                 # Geo-indexed complaint schema
│   │   └── Notification.js              # User notifications schema
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── complaintRoutes.js
│   │   ├── officerRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── notificationRoutes.js
│   │   └── uploadRoutes.js
│   ├── middleware/
│   │   ├── auth.js                      # JWT protect & role authorize
│   │   └── upload.js                    # Multer image storage
│   ├── services/
│   │   └── aiService.js                 # NLP classification, priority & duplicate engine
│   ├── utils/
│   │   └── seedData.js                  # West Bengal DEMO/SAMPLE civic dataset
│   ├── uploads/                         # Statically served issue photos
│   ├── server.js                        # Express server entry point
│   ├── .env.example
│   └── package.json
│
├── package.json                         # Root convenience scripts
└── README.md
```

---

## ⚡ Quick Start & Installation

### Prerequisites
- **Node.js** (v18 or higher recommended)
- **NPM** (v9 or higher)
- *Optional:* Local MongoDB instance (The backend includes an automatic in-memory fallback, so it runs out-of-the-box with **zero external database setup required**).

### 1. Clone & Setup Backend
```bash
cd server
npm install
npm run seed     # Explicitly upserts labeled demo fixtures without clearing existing records
npm start        # Starts server on http://localhost:5000
```

### 2. Setup Frontend
```bash
cd ../client
npm install
npm run dev      # Starts Vite dev server on http://localhost:5173
```

Open your browser and navigate to `http://localhost:5173`.

---

## Demo Environment

In local development, choose **Demo Environment** on the sign-in page and select a role. Demo access uses the backend authentication flow and is enabled only when the backend runs with `NODE_ENV=development`. No demo passwords are displayed or bundled in the frontend.

| Role | Name | Jurisdiction / Focus |
|---|---|---|
| **Citizen** | Soumodeep Maiti | West Bengal, India |
| **PWD Officer** | Souvik Baidya | PWD / Roads |
| **Sanitation Officer** | Priya Sen | Sanitation |
| **Administrator** | Soumodeep Maiti | West Bengal, India |

---
## 🌐 Environment Variables

### Backend (`server/.env`)
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/civic360
JWT_SECRET=replace-with-a-long-random-value
NODE_ENV=development
```

### Frontend (`client/.env`)
```env
VITE_API_URL=/api
```

---

## 📡 REST API Overview

### Authentication
- `POST /api/auth/register` - Create a citizen or officer account
- POST /api/auth/login - Authenticate and receive JWT token
- POST /api/auth/demo - Start a controlled non-production demo session
- `GET /api/auth/me` - Fetch authenticated user profile & counters
- `PUT /api/auth/profile` - Update phone number and preferred ward

### Complaints & AI
- `GET /api/complaints` - Query complaints with filters (`status`, `category`, `priority`, `ward`, `search`)
- `POST /api/complaints` - Submit complaint (runs AI classification & auto-routing)
- `POST /api/complaints/analyze` - Real-time AI draft analysis & duplicate detection
- `GET /api/complaints/:id` - Retrieve full complaint, map coordinate, and timeline
- `PUT /api/complaints/:id` - Officer updates (status transition, notes, after-photo)
- `DELETE /api/complaints/:id` - Remove complaint (citizen if pending, or admin)
- `POST /api/upload` - Upload image evidence

### Dashboards & Management
- `GET /api/officer/dashboard` - Assigned tickets, department counters & critical alerts
- `GET /api/admin/dashboard` - Citywide metrics, department breakdown & ward distribution
- `GET /api/admin/users` - View all municipal users
- `PUT /api/admin/users/:id` - Reassign officer department or modify permissions

### Notifications
- `GET /api/notifications` - Retrieve alerts for logged-in user
- `PUT /api/notifications/:id/read` - Mark single notification as read
- `PUT /api/notifications/read-all` - Clear all unread notifications

---

## 🚀 Future AI Roadmap
- **Computer Vision (YOLO / MobileNet):** Edge-based pothole depth estimation and garbage volume classification directly from mobile cameras.
- **Multilingual Voice Reporting:** Bhashini integration for voice complaint dictation in Hindi, Kannada, Tamil, Telugu, and Marathi.
- **Predictive Infrastructure Maintenance:** Time-series analysis predicting monsoon drainage overflows based on historical rainfall and ticket frequency.

---
Civic360 AI · West Bengal, India
