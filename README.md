<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=white" alt="Firebase" />
  <img src="https://img.shields.io/badge/Google_Gemini-8E75B2?style=for-the-badge&logo=google&logoColor=white" alt="Gemini AI" />
  <br>
  <h1>Aegis: AI-Powered Emergency Response Platform</h1>
  <p>A modern, full-stack emergency management system integrating real-time ML risk prediction and specialized generative AI assistance for citizens and command center authorities.</p>
</div>

---

## Table of Contents
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

---

## Key Features

### Authority Command Center
- **Live Alert Triage:** A centralized dashboard that receives instant citizen SOS pings via Firebase real-time listeners.
- **AI Dispatch Briefings:** Utilizes the Google Gemini AI to auto-generate concise, actionable situation briefings for dispatch operators based on incoming alert data.
- **SOP Assistant:** An integrated GPT-style assistant where authorities can query standard operating procedures for various emergency types.
- **Dynamic Risk Assessment:** Leverages a Python Machine Learning model to evaluate geographic coordinates and contextual data to assign a High, Medium, or Low risk severity to every alert.

### Citizen Safety App
- **Intuitive SOS Flow:** Designed for high-stress situations. Citizens can report emergencies manually or via voice/text descriptions.
- **AI Report Summarization:** Gemini AI instantly analyzes free-form text/voice reports to extract the emergency type, severity, and a quick summary.
- **Real-time Safety Guidance:** Generates customized safety instructions (e.g., "While you wait for help...") based on the specific emergency and the user's mapped location.
- **Localization:** Includes multi-language support (English and Tamil) for better accessibility.

---

## Architecture

Aegis has been modernized into a decoupled, robust client-server architecture.

### Frontend (React)
- **Framework:** React.js Single Page Application (SPA).
- **Styling:** Custom CSS featuring a premium, dark-mode glassmorphism design system (backdrop-filter) and Google 'Outfit' typography.
- **State & Routing:** Modular component structure (screens/, components/) to comfortably handle Auth, Citizen, and Authority views.
- **Maps:** Deep integration with the Google Maps Javascript API for pinpointing incidents.

### Backend (FastAPI / Python)
- **Framework:** High-performance FastAPI server running on Uvicorn.
- **AI Integration:** Direct connection to `google-generativeai` for complex text analysis and SOP generation.
- **ML Engine:** Loads a `.joblib` machine learning model to simulate geographic disaster risk calculations.
- **Security:** Standardized CORS middleware and `.env` secret management.

### Database (Firebase)
- **Auth:** Firebase Authentication handles secure login/registration for authority and citizen user roles.
- **Firestore:** NoSQL document database acts as the single source of truth, synchronizing active alerts across all connected clients instantly.

---

## Getting Started

To run Aegis locally, you need Node.js and Python 3.11+ installed.

### 1. Clone the repository
```bash
git clone https://github.com/GughanS/aegis-emergency-response.git
cd aegis-emergency-response
```

### 2. Start the FastAPI Backend
```bash
cd aegis_backend
python -m venv .venv
source .venv/bin/activate  # Or `.venv\Scripts\activate` on Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 3. Start the React Frontend
```bash
cd aegis-frontend
npm install
npm start
```
The application will be available at `http://localhost:3000`.

---

## Environment Variables

You must configure your own API keys for the services to work. Create `.env` files in the respective directories or configure your deployment host.

**Backend (`aegis_backend/.env`):**
```env
GEMINI_API_KEY=your_google_ai_studio_api_key_here
```

**Frontend (`aegis-frontend/src/utils/config.js`):**
*Note: Ensure your Firebase Config and Maps keys are set in this file.*
```javascript
export const GOOGLE_MAPS_API_KEY = "your_maps_api_key";
// ... Firebase config object
```

---

## Deployment

Aegis is fully configured for containerized and static delivery.

### Backend (Render)
A `Dockerfile` and `render.yaml` are included in the `aegis_backend` directory. Connecting this repository to Render.com will automatically build and deploy the FastAPI container. Remember to set the `GEMINI_API_KEY` in the Render dashboard.

### Frontend (Netlify)
The `aegis-frontend` directory includes a `netlify.toml` file configured for single-page applications. Connect the folder to Netlify to deploy the static build seamlessly.

---

## Contributing
Contributions are welcome! Please follow these steps:
1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes (`git commit -m 'feat: Add some AmazingFeature'`).
4. Push to the branch (`git push origin feature/AmazingFeature`).
5. Open a Pull Request.

---

## License
This project is licensed under the MIT License - see the LICENSE file for details.
