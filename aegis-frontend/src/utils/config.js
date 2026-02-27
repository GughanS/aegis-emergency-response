import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyDIJwx314tXfjpZpJ7EpBRn8QZ0V1duwQc",
    authDomain: "aegis-project-2f6a9.firebaseapp.com",
    projectId: "aegis-project-2f6a9",
    storageBucket: "aegis-project-2f6a9.appspot.com",
    messagingSenderId: "254245404836",
    appId: "1:254245404836:web:62182b19d6f32455956631"
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

export const GOOGLE_MAPS_API_KEY = "AIzaSyD3phEVM-_zOr5lh4xncnPHPeDSiOy3Nvg";
export const PYTHON_BACKEND_URL = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:8000"
    : "https://aegis-backend.onrender.com";
