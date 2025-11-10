"""
Aegis: Python Backend (FastAPI)

This server provides all backend logic for the Aegis platform, including:
- Real-time AI/ML risk prediction.
- AI-powered analysis of voice reports.
- AI-generated dispatch briefings and SOPs.
- Secure API endpoints with CORS and rate limiting.

Architecture:
- React Frontend (AegisApp.jsx) -> Calls this API
- Python Backend (main.py) -> Serves all logic
"""

# --- Core Libraries ---
import os
import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import google.generativeai as genai
import uvicorn

# --- Application Setup ---
app = FastAPI(
    title="Aegis AI Backend",
    description="Provides real-time ML risk prediction and AI-powered emergency analysis.",
    version="1.0.0"
)

# --- Security & CORS ---
# Configure CORS to allow the React frontend (running on localhost:3000)
# to communicate with this backend (running on localhost:8000).
NETLIFY_APP_URL = "[https://aegisemergencyresponse.netlify.app](https://aegisemergency.netlify.app)" # <-- YOUR REAL URL

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        NETLIFY_APP_URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- AI & Model Configuration ---

# 1. Gemini AI Configuration
# We try to get the API key from environment variables (best practice).
# If not set, we fall back to a hardcoded key for demo/development.
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    GEMINI_API_KEY = "AIzaSyDdbjUGdVhZTSZkqUovmnbIcQGVuSua0w0" # Fallback key
    print("WARNING: GEMINI_API_KEY environment variable not set. Using hardcoded key for demo.")

try:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-2.5-flash')
    print("Gemini AI model configured successfully.")
except Exception as e:
    print(f"Error configuring Gemini AI: {e}")
    gemini_model = None

# 2. Machine Learning Model Loading
ML_MODEL_PATH = "aegis_risk_model.joblib"
LABEL_MAPPING_INV = {0: 'Low', 1: 'Medium', 2: 'High'} # To convert 0,1,2 back to text
ml_model = None
expected_model_features = [ # The exact columns the model was trained on
    'lat', 'lon', 'elevation_meters', 'dist_to_coast_km', 
    'dist_to_major_river_km', 'avg_annual_rainfall_mm', 'seismic_zone', 
    'state', 'district', 'primary_hazard_type'
]

try:
    ml_model = joblib.load(ML_MODEL_PATH)
    print(f"Successfully loaded ML model from '{ML_MODEL_PATH}'")
except FileNotFoundError:
    print(f"WARNING: '{ML_MODEL_PATH}' not found. Using dummy model.")
except Exception as e:
    print(f"Error loading ML model: {e}. Using dummy model.")

# --- Pydantic Models (Data Validation) ---
# These models define the *exact* JSON structure the API expects.
# If the incoming data doesn't match, FastAPI automatically returns a 422 error.

class RiskRequest(BaseModel):
    """Defines the data structure for a risk prediction request."""
    lat: float
    lon: float

class ReportAnalysisRequest(BaseModel):
    """Defines the data structure for a voice/text report analysis."""
    text: str
    language: str = 'en' # Default to English

class SopRequest(BaseModel):
    """Defines the data structure for an SOP request."""
    query: str
    language: str = 'en' # Default to English

class BriefingPayload(BaseModel):
    """
    Defines the full alert object sent from React.
    We only *need* a few fields for the prompt, but by defining the full
    structure, Pydantic ensures the data is valid.
    """
    id: str
    alert_type: str
    details: str
    latitude: float
    longitude: float
    risk_level: str
    risk_reason: str
    status: str
    live_ml_risk: Optional[Dict[str, Any]] = None # To hold the new ML risk
    user: Dict[str, Any]
    # 'created_at' can be complex, so we allow 'Any'
    created_at: Optional[Any] = None


# --- API Endpoints ---

@app.get("/")
def read_root():
    """Health check endpoint to confirm the server is running."""
    return {"status": "Aegis AI Backend is running"}

@app.post("/predict_risk")
async def predict_risk(request: RiskRequest):
    """
    Predicts disaster risk using the loaded ML model.
    This endpoint is now simplified to only take lat/lon and simulates the rest.
    """
    if not ml_model:
        # Fallback to dummy model if the .joblib file wasn't loaded
        print("Using dummy model for prediction.")
        risk_level = "Medium"
        risk_reason = "ML model not loaded."
    else:
        try:
            # --- Real ML Model Prediction ---
            
            # 1. Simulate a database lookup for GIS data based on lat/lon
            # In a real app, this would be a call to a GIS database or another API.
            # For this demo, we create a plausible dummy row of data.
            simulated_data = {
                'lat': request.lat,
                'lon': request.lon,
                'elevation_meters': 50,  # Simulated
                'dist_to_coast_km': 10,   # Simulated
                'dist_to_major_river_km': 5, # Simulated
                'avg_annual_rainfall_mm': 1800, # Simulated
                'seismic_zone': 3, # Simulated
                'state': 'Tamil Nadu', # Simulated
                'district': 'Chennai', # Simulated
                'primary_hazard_type': 'Flood' # Simulated
            }
            
            # 2. Create a DataFrame in the *exact* order the model expects
            # This is critical for the model to work correctly.
            input_df = pd.DataFrame([simulated_data])
            input_df = input_df[expected_model_features] 

            # 3. Make the prediction
            prediction = ml_model.predict(input_df) # This will be a number, e.g., [2]
            
            # 4. Translate the numeric prediction back to a text label
            risk_level_numeric = prediction[0]
            risk_level = LABEL_MAPPING_INV.get(risk_level_numeric, 'Unknown') # e.g., 'High'
            risk_reason = f"Live model prediction based on location and simulated GIS data."

        except Exception as e:
            print(f"Error during ML prediction: {e}")
            raise HTTPException(status_code=500, detail=f"ML prediction error: {e}")

    return {"risk_level": risk_level, "risk_reason": risk_reason}

@app.post("/analyze_report")
async def analyze_report(request: ReportAnalysisRequest):
    """
    Analyzes a user's text report using the Gemini API to extract key info.
    """
    if not gemini_model:
        raise HTTPException(status_code=500, detail="Gemini AI model not configured")
        
    prompt = f"""
    You are an emergency analysis system. From the following text, extract:
    1. 'alert_type': Must be one of [FIRE, FLOOD, MEDICAL, STRUCTURE_COLLAPSE, OTHER].
    2. 'summary': A brief, 2-3 word summary.
    3. 'severity': Must be one of [Low, Medium, High].
    Respond ONLY with a valid, minified JSON object.
    Respond in {request.language}.
    Text: "{request.text}"
    """
    try:
        response = gemini_model.generate_content(prompt)
        # Clean the response to get raw JSON
        json_response = response.text.strip().replace("```json", "").replace("```", "")
        return {"analysis": json_response} # Send back the JSON string
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        raise HTTPException(status_code=500, detail=f"Gemini API error: {e}")

@app.post("/generate_briefing")
async def generate_briefing(payload: BriefingPayload):
    """
    Generates a concise dispatch briefing using the Gemini API.
    Receives the *entire* alert object from the frontend.
    """
    if not gemini_model:
        raise HTTPException(status_code=500, detail="Gemini AI model not configured")

    # Construct a rich prompt using the received alert data
    prompt = f"""
    You are an AI assistant for the Chennai Command Center.
    Generate a 1-2 sentence, plain-text dispatch briefing for an operator.
    Be direct and concise. Do NOT use markdown or bolding.
    
    Data:
    - Alert Type: {payload.alert_type}
    - User Report: "{payload.details}"
    - User Vulnerability: {payload.user.get('vulnerability_status', 'None')}
    - Static Risk: {payload.risk_level} ({payload.risk_reason})
    - Live ML Risk: {payload.live_ml_risk.get('risk_level', 'N/A') if payload.live_ml_risk else 'N/A'}
    
    Generate the briefing.
    """
    try:
        response = gemini_model.generate_content(prompt)
        return {"briefing": response.text}
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        raise HTTPException(status_code=500, detail=f"Gemini API error: {e}")

@app.post("/get_sop")
async def get_sop(request: SopRequest):
    """
    Retrieves a Standard Operating Procedure (SOP) from the Gemini API.
    """
    if not gemini_model:
        raise HTTPException(status_code=500, detail="Gemini AI model not configured")

    prompt = f"""
    You are an SOP (Standard Operating Procedure) assistant for the Chennai Emergency Command Center.
    Provide a clear, numbered list of immediate action steps (3-4 steps) for the following situation.
    Respond ONLY in plain text. Do NOT use any markdown, asterisks, or bold formatting.
    All titles and headings must also be plain text.
    Respond in {request.language}.
    
    Situation: "{request.query}"
    """
    try:
        response = gemini_model.generate_content(prompt)
        return {"sop": response.text}
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        raise HTTPException(status_code=500, detail=f"Gemini API error: {e}")


# --- Main Entry Point ---
if __name__ == "__main__":
    """
    This allows the script to be run directly using `python main.py`.
    `uvicorn.run` is the command that starts the web server.
    """
    # Use the PORT environment variable if it exists, otherwise default to 8000
    port = int(os.environ.get("PORT", 8000))
    # Listen on 0.0.0.0 to be accessible publicly
    uvicorn.run("main:app", host="0.0.0.0", port=port)


