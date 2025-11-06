import React, { useState, useEffect, useRef, useCallback } from 'react';

// --- Firebase Imports ---
import { initializeApp } from 'firebase/app';
import { 
    getAuth, 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut 
} from 'firebase/auth';
import { 
    getFirestore, 
    doc, 
    setDoc, 
    addDoc, 
    collection, 
    serverTimestamp, 
    query, 
    where, 
    onSnapshot, 
    getDoc, 
    updateDoc 
} from 'firebase/firestore';

// --- Import CSS ---
import './styles.css'; // <-- MOVED to index.js

// --- Configuration ---
const firebaseConfig = {
    apiKey: "AIzaSyDIJwx314tXfjpZpJ7EpBRn8QZ0V1duwQc",
    authDomain: "aegis-project-2f6a9.firebaseapp.com",
    projectId: "aegis-project-2f6a9",
    storageBucket: "aegis-project-2f6a9.appspot.com",
    messagingSenderId: "254245404836",
    appId: "1:254245404836:web:62182b19d6f32455956631"
};

const GOOGLE_MAPS_API_KEY = "AIzaSyD3phEVM-_zOr5lh4xncnPHPeDSiOy3Nvg";
const PYTHON_BACKEND_URL = "[https://aegis-backend.onrender.com](https://aegis-backend.onrender.com)"; // URL of your local Python server

// --- Firebase Initialization ---
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// --- Translation Data ---
const translations = {
    en: {
        loginTitle: "Aegis Login", emailPlaceholder: "Email", passwordPlaceholder: "Password", loginButton: "Log In", noAccount: "No account?", registerLink: "Register",
        registerTitle: "Create Account", namePlaceholder: "Full Name", vulnerabilityPlaceholder: "Vulnerability Status (None)", registerButton: "Register", haveAccount: "Have an account?",
        vulnerabilityNone: "Vulnerability Status (None)", vulnerabilityWheelchair: "Wheelchair User", vulnerabilityVisual: "Visually Impaired", vulnerabilityElderly: "Elderly",
        mainTitle: "Aegis", mainSubtitle: "Safety Assistant", logoutButton: "Logout", riskLabel: "Risk", loading: "Loading...", emergencyPrompt: "In case of emergency, press below.",
        reportTitle: "Report an Emergency", reportSubtitle: "How would you like to report?", manualReportButton: "Select Alert Type Manually", voiceReportButton: "Report with Voice/Text", cancelButton: "Cancel",
        alertType_FLOOD: "Flood", alertType_FIRE: "Fire", alertType_MEDICAL: "Medical", alertType_STRUCTURE_COLLAPSE: "Collapse",
        voicePrompt: "Press the button and describe your situation.", voiceRecording: "🔴 Recording... Click again when done.", voiceProcessing: "🗣️ Processing text...",
        analysisAnalyzing: "🧠 Analyzing with AI...", analysisConfirm: "Analysis complete. Please confirm.", analysisFailed: "Analysis Failed. Please try again.", confirmSendButton: "Confirm & Send",
        alertSentTitle: "Alert Sent", alertSentSubtitle: "Authorities have been notified.", citizenSopTitle: "While You Wait For Help:", doneButton: "Done",
        safetyInstructionsLoading: "Generating safety instructions...",
        lang_code: "en"
    },
    ta: {
        loginTitle: "ஏஜிஸ் உள்நுழை", emailPlaceholder: "மின்னஞ்சல்", passwordPlaceholder: "கடவுச்சொல்", loginButton: "உள்நுழை", noAccount: "கணக்கு இல்லையா?", registerLink: "பதிவு செய்க",
        registerTitle: "புதிய கணக்கு", namePlaceholder: "முழு பெயர்", vulnerabilityPlaceholder: "பாதிப்பு நிலை (ஏதுமில்லை)", registerButton: "பதிவு செய்க", haveAccount: "ஏற்கனவே கணக்கு உள்ளதா?",
        vulnerabilityNone: "பாதிப்பு நிலை (ஏதுமில்லை)", vulnerabilityWheelchair: "சக்கர நாற்காலி பயனர்", vulnerabilityVisual: "பார்வையற்றவர்", vulnerabilityElderly: "முதியவர்",
        mainTitle: "ஏஜிஸ்", mainSubtitle: "பாதுகாப்பு உதவியாளர்", logoutButton: "வெளியேறு", riskLabel: "ஆபத்து", loading: "ஏற்றுகிறது...", emergencyPrompt: "அவசரநிலை ஏற்பட்டால், கீழே அழுத்தவும்.",
        reportTitle: "அவசரநிலையைப் புகாரளிக்கவும்", reportSubtitle: "நீங்கள் எப்படி புகாரளிக்க விரும்புகிறீர்கள்?", manualReportButton: "விழிப்பூட்டல் வகையைத் தேர்ந்தெடுக்கவும்", voiceReportButton: "குரல்/உரை மூலம் புகாரளிக்கவும்", cancelButton: "ரத்துசெய்",
        alertType_FLOOD: "வெள்ளம்", alertType_FIRE: "தீ", alertType_MEDICAL: "மருத்துவம்", alertType_STRUCTURE_COLLAPSE: "கட்டமைப்பு சரிவு",
        voicePrompt: "பொத்தானை அழுத்தி உங்கள் நிலையை விவரிக்கவும்.", voiceRecording: "🔴 பதிவு செய்கிறது... முடிந்ததும் மீண்டும் கிளிக் செய்யவும்.", voiceProcessing: "🗣️ உரையைச் செயலாக்குகிறது...",
        analysisAnalyzing: "🧠 AI மூலம் பகுப்பாய்வு செய்கிறது...", analysisConfirm: "பகுப்பாய்வு முடிந்தது. உறுதிப்படுத்தவும்.", analysisFailed: "பகுப்பாய்வு தோல்வியுற்றது. மீண்டும் முயக்கவும்.", confirmSendButton: "உறுதிசெய்து அனுப்பவும்",
        alertSentTitle: "விழிப்பூட்டல் அனுப்பப்பட்டது", alertSentSubtitle: "அதிகாரிகளுக்கு அறிவிக்கப்பட்டுள்ளது.", citizenSopTitle: "உதவிக்காக நீங்கள் காத்திருக்கும் போது:", doneButton: "முடிந்தது",
        safetyInstructionsLoading: "பாதுகாப்பு வழிமுறைகளை உருவாக்குகிறது...",
        lang_code: "ta"
    }
};

// --- Translation Hook ---
function useTranslation() {
    const [language, setLanguage] = useState(localStorage.getItem('aegisLang') || 'en');

    const setLang = (lang) => {
        localStorage.setItem('aegisLang', lang);
        setLanguage(lang);
    };

    const t = (key) => translations[language]?.[key] || translations['en'][key] || key;

    return { language, setLang, t };
}

// --- Google Map Loader ---
const loadGoogleMapsScript = (callback) => {
    const existingScript = document.getElementById('googleMapsScript');
    if (!existingScript) {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&callback=initMap`;
        script.id = 'googleMapsScript';
        window.initMap = callback; // Make callback globally accessible
        document.body.appendChild(script);
    } else {
        window.initMap = callback;
        // If script exists, it might still be loading, but we assume callback will be called
        // or has been called. If initMap is already defined, call it directly.
        if (typeof window.google !== 'undefined' && typeof window.google.maps !== 'undefined') {
             callback();
        }
    }
};

// --- Main App Component ---
export default function App() {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState('citizen');
    const [isAuthReady, setIsAuthReady] = useState(false);
    const { language, setLang, t } = useTranslation();

    // Handle authentication state
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        setRole(userDoc.data().role);
                    }
                } catch (error) {
                    console.error("Error fetching user role:", error);
                }
                setUser(user);
            } else {
                setUser(null);
                setRole('citizen');
            }
            setIsAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    const LanguageSwitcher = ({ isMain = false }) => (
        <select
            value={language}
            onChange={(e) => setLang(e.target.value)}
            className={`language-switcher ${isMain ? 'lang-switcher-main' : ''}`}
        >
            <option value="en">English</option>
            <option value="ta">தமிழ்</option>
        </select>
    );

    if (!isAuthReady) {
        return (
            <div className="auth-page-container">
                <div className="loader"></div>
            </div>
        );
    }

    if (!user) {
        return <LoginScreen t={t} LanguageSwitcher={LanguageSwitcher} />;
    }

    if (role === 'authority') {
        return <AuthorityDashboard t={t} user={user} />;
    }

    return <CitizenApp t={t} LanguageSwitcher={LanguageSwitcher} user={user} />;
}

// --- Auth Screens ---
function LoginScreen({ t, LanguageSwitcher }) {
    const [isRegister, setIsRegister] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [vulnerability, setVulnerability] = useState('NONE');

    const handleLogin = async () => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error) {
            alert(`Login Failed: ${error.message}`);
        }
    };

    const handleRegister = async () => {
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, "users", cred.user.uid), {
                fullName: fullName,
                email: cred.user.email,
                vulnerability_status: vulnerability,
                role: 'citizen'
            });
        } catch (error) {
            alert(`Registration Failed: ${error.message}`);
        }
    };

    if (isRegister) {
        return (
            <div className="auth-page-container">
                <div className="auth-card">
                    <div className="auth-card-header">
                        <h1>{t('registerTitle')}</h1>
                    </div>
                    <input type="text" placeholder={t('namePlaceholder')} className="input-field" value={fullName} onChange={e => setFullName(e.target.value)} />
                    <input type="email" placeholder={t('emailPlaceholder')} className="input-field" value={email} onChange={e => setEmail(e.target.value)} />
                    <input type="password" placeholder={t('passwordPlaceholder')} className="input-field" value={password} onChange={e => setPassword(e.target.value)} />
                    <select className="input-field" value={vulnerability} onChange={e => setVulnerability(e.target.value)}>
                        <option value="NONE">{t('vulnerabilityNone')}</option>
                        <option value="WHEELCHAIR">{t('vulnerabilityWheelchair')}</option>
                        <option value="VISUALLY_IMPAIRED">{t('vulnerabilityVisual')}</option>
                        <option value="ELDERLY">{t('vulnerabilityElderly')}</option>
                    </select>
                    <button onClick={handleRegister} className="button-primary">{t('registerButton')}</button>
                    <p className="auth-card-footer">{t('haveAccount')} <button onClick={() => setIsRegister(false)} className="button-link">{t('loginButton')}</button></p>
                    <div className="language-switcher-container"><LanguageSwitcher /></div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page-container">
            <div className="auth-card">
                <div className="auth-card-header">
                    <h1>{t('loginTitle')}</h1>
                </div>
                <div className="auth-card-body">
                    <input type="email" placeholder={t('emailPlaceholder')} className="input-field large" value={email} onChange={e => setEmail(e.target.value)} />
                    <input type="password" placeholder={t('passwordPlaceholder')} className="input-field large" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
                <button onClick={handleLogin} className="button-primary large">{t('loginButton')}</button>
                <p className="auth-card-footer">{t('noAccount')} <button onClick={() => setIsRegister(true)} className="button-link">{t('registerLink')}</button></p>
                <div className="language-switcher-container"><LanguageSwitcher /></div>
            </div>
        </div>
    );
}

// --- Citizen App ---
function CitizenApp({ t, LanguageSwitcher, user }) {
    const [screen, setScreen] = useState({ name: 'home' }); // home, sos, voice, confirm
    const [userLocation, setUserLocation] = useState({ lat: 13.0292, lon: 80.0188 });
    const [riskLevel, setRiskLevel] = useState({ level: t('loading'), reason: '' });
    const [vulnerability, setVulnerability] = useState('NONE');

    // Fetch user vulnerability
    useEffect(() => {
        getDoc(doc(db, "users", user.uid)).then(userDoc => {
            if (userDoc.exists()) {
                setVulnerability(userDoc.data().vulnerability_status);
            }
        });
    }, [user.uid]);

    // Get user location
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
            },
            () => console.warn("Could not get location. Using default.")
        );
    }, []);

    // Fetch risk level from Python backend
    useEffect(() => {
        const fetchRisk = async () => {
            try {
                const response = await fetch(`${PYTHON_BACKEND_URL}/predict_risk`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        lat: userLocation.lat,
                        lon: userLocation.lon,
                        vulnerability_status: vulnerability
                    })
                });
                if (!response.ok) throw new Error('Risk API failed');
                const data = await response.json();
                setRiskLevel({ level: data.risk_level, reason: data.risk_reason });
            } catch (error) {
                console.error("Failed to fetch risk:", error);
                setRiskLevel({ level: 'Error', reason: 'Could not fetch risk' });
            }
        };
        
        fetchRisk();
    }, [userLocation, vulnerability, t]); // Added t to dependency array

    const handleSendAlert = async (alertType, details = "Manual Report") => {
        try {
            await addDoc(collection(db, "alerts"), {
                userId: user.uid,
                alert_type: alertType,
                details: details,
                latitude: userLocation.lat,
                longitude: userLocation.lon,
                status: "PENDING",
                risk_level: riskLevel.level,
                risk_reason: riskLevel.reason,
                created_at: serverTimestamp()
            });
            setScreen({name: 'confirm', alertType: alertType}); // Pass alert type to confirm screen
        } catch (error) {
            alert(`Error: ${error.message}`);
        }
    };

    const { language } = useTranslation();
    const renderScreen = () => {
        switch (screen.name) {
            case 'sos':
                return <SosScreen t={t} setScreen={setScreen} handleSendAlert={handleSendAlert} />;
            case 'voice':
                return <VoiceReportScreen t={t} setScreen={setScreen} handleSendAlert={handleSendAlert} currentLanguage={language} />;
            case 'confirm':
                return <ConfirmationScreen t={t} setScreen={setScreen} alertType={screen.alertType} currentLanguage={language} />;
            default:
                return <HomeScreen t={t} setScreen={setScreen} LanguageSwitcher={LanguageSwitcher} userLocation={userLocation} riskLevel={riskLevel} />;
        }
    };

    return (
        <div className="mobile-screen">
            {renderScreen()}
        </div>
    );
}

function HomeScreen({ t, setScreen, LanguageSwitcher, userLocation, riskLevel }) {
    const mapRef = useRef(null);
    const userMarkerRef = useRef(null);
    const [map, setMap] = useState(null);

    useEffect(() => {
        loadGoogleMapsScript(() => {
            if (!mapRef.current || map || !window.google) return;
            const newMap = new window.google.maps.Map(mapRef.current, {
                center: { lat: userLocation.lat, lng: userLocation.lon },
                zoom: 15,
                disableDefaultUI: true,
                styles: [{ elementType: "geometry", stylers: [{ color: "#242f3e" }] }, { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] }, { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] }]
            });
            setMap(newMap);
        });
    }, [mapRef, map, userLocation.lat, userLocation.lon]);

    useEffect(() => {
        if (map && window.google) {
            const latLng = { lat: userLocation.lat, lng: userLocation.lon };
            map.setCenter(latLng);
            if (userMarkerRef.current) {
                userMarkerRef.current.setPosition(latLng);
            } else {
                userMarkerRef.current = new window.google.maps.Marker({ position: latLng, map: map, title: "Your Location" });
            }
        }
    }, [map, userLocation]);

    return (
        <div className="citizen-app-container">
            <header className="citizen-header">
                <div>
                    <h1>{t('mainTitle')}</h1>
                    <p>{t('mainSubtitle')}</p>
                </div>
                <div className="citizen-header-controls">
                    <LanguageSwitcher isMain={true} />
                    <button onClick={() => signOut(auth)} className="button-logout">{t('logoutButton')}</button>
                </div>
            </header>
            <main className="citizen-map-container">
                <div id="map-citizen" ref={mapRef} className="map-element"></div>
                <div className="risk-display">
                    <p>{t('riskLabel')}: <span className={`risk-${riskLevel.level?.toLowerCase()}`}>{riskLevel.level}</span></p>
                </div>
            </main>
            <footer className="citizen-footer">
                <p>{t('emergencyPrompt')}</p>
                <button onClick={() => setScreen({name: 'sos'})} className="sos-button">
                    <span>SOS</span>
                </button>
            </footer>
        </div>
    );
}

function SosScreen({ t, setScreen, handleSendAlert }) {
    const [showManual, setShowManual] = useState(false);
    return (
        <div className="citizen-app-container sos-screen">
            <h2>{t('reportTitle')}</h2>
            <p>{t('reportSubtitle')}</p>
            <div className="sos-options">
                <button onClick={() => setShowManual(true)} className="button-primary large">{t('manualReportButton')}</button>
                <button onClick={() => setScreen({name: 'voice'})} className="button-primary large button-indigo">{t('voiceReportButton')}</button>
            </div>
            {showManual && (
                <div className="manual-options-grid">
                    <button className="alert-type-button" onClick={() => handleSendAlert("FLOOD")}>
                        <span className="alert-emoji">🌊</span><span>{t('alertType_FLOOD')}</span>
                    </button>
                    <button className="alert-type-button" onClick={() => handleSendAlert("FIRE")}>
                        <span className="alert-emoji">🔥</span><span>{t('alertType_FIRE')}</span>
                    </button>
                    <button className="alert-type-button" onClick={() => handleSendAlert("MEDICAL")}>
                        <span className="alert-emoji">⚕️</span><span>{t('alertType_MEDICAL')}</span>
                    </button>
                    <button className="alert-type-button" onClick={() => handleSendAlert("STRUCTURE_COLLAPSE")}>
                        <span className="alert-emoji">🧱</span><span>{t('alertType_STRUCTURE_COLLAPSE')}</span>
                    </button>
                </div>
            )}
            <button onClick={() => setScreen({name: 'home'})} className="button-cancel">{t('cancelButton')}</button>
        </div>
    );
}

function VoiceReportScreen({ t, setScreen, handleSendAlert, currentLanguage }) {
    const [status, setStatus] = useState('prompt'); // prompt, analyzing, confirm, error
    const [result, setResult] = useState(null);

    const handleMicClick = async () => {
        const transcription = prompt("For this demo, please type your emergency report. AI will analyze the text.");
        if (!transcription) return;

        setStatus('analyzing');
        try {
            const response = await fetch(`${PYTHON_BACKEND_URL}/analyze_report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: transcription })
            });
            if (!response.ok) throw new Error('Analysis API failed');
            const data = await response.json();
            setResult(data);
            setStatus('confirm');
        } catch (error) {
            console.error("Failed to analyze report:", error);
            setStatus('error');
        }
    };

    return (
        <div className="citizen-app-container sos-screen">
            <h2>{t('reportTitle')}</h2>
            <div className="voice-status">
                {status === 'prompt' && t('voicePrompt')}
                {status === 'analyzing' && t('analysisAnalyzing')}
                {status === 'confirm' && t('analysisConfirm')}
                {status === 'error' && t('analysisFailed')}
            </div>
            <div className="voice-mic-container">
                {status !== 'analyzing' ? (
                    <button onClick={handleMicClick} className="mic-button">
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16"><path d="M5 3a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0V3z"/><path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z"/></svg>
                    </button>
                ) : (
                    <div className="loader"></div>
                )}
            </div>

            {result && (
                <div className="ai-result-panel">
                    <p><strong>Alert Type:</strong> <span>{result.alert_type}</span></p>
                    <p><strong>Summary:</strong> "<span>{result.summary}</span>"</p>
                    <p><strong>Severity:</strong> <span>{result.severity}</span></p>
                </div>
            )}

            <div className="voice-controls">
                <button onClick={() => setScreen({name: 'home'})} className="button-cancel">{t('cancelButton')}</button>
                {status === 'confirm' && (
                    <button onClick={() => handleSendAlert(result.alert_type, result.summary)} className="button-primary">{t('confirmSendButton')}</button>
                )}
            </div>
        </div>
    );
}

function ConfirmationScreen({ t, setScreen, alertType, currentLanguage }) {
    const [sop, setSop] = useState(t('safetyInstructionsLoading'));
    
    useEffect(() => {
        const fetchSop = async () => {
            try {
                const response = await fetch(`${PYTHON_BACKEND_URL}/generate_sop`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        query: alertType || 'emergency', // Use the passed alertType
                        language: t('lang_code') || 'en' 
                    })
                });
                const data = await response.json();
                setSop(data.sop.replace(/\n/g, '<br>'));
            } catch (error) {
                setSop('Could not load safety instructions.');
            }
        };
        fetchSop();
    }, [t, alertType, currentLanguage]); // Added currentLanguage to dependencies

    return (
        <div className="citizen-app-container confirmation-screen">
            <div className="confirmation-icon">
                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2>{t('alertSentTitle')}</h2>
            <p>{t('alertSentSubtitle')}</p>
            <div className="sop-card">
                <h3>{t('citizenSopTitle')}</h3>
                <div className="sop-card-content" dangerouslySetInnerHTML={{ __html: sop }}></div>
            </div>
            <button onClick={() => setScreen({name: 'home'})} className="button-primary">{t('doneButton')}</button>
        </div>
    );
}


// --- Authority Dashboard ---
function AuthorityDashboard({ t, user }) {
    const [activeAlerts, setActiveAlerts] = useState([]);
    const [selectedAlert, setSelectedAlert] = useState(null);
    const [clock, setClock] = useState(new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' }));
    
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const alertMarkersRef = useRef({});

    // Clock
    useEffect(() => {
        const timer = setInterval(() => {
            try {
                setClock(new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata' }));
            } catch (e) {
                console.error("Timezone error, falling back.");
                setClock(new Date().toLocaleTimeString('en-US'));
            }
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    // Init Map
    useEffect(() => {
        loadGoogleMapsScript(() => {
            if (!mapRef.current || map || !window.google) return;
            const newMap = new window.google.maps.Map(mapRef.current, {
                center: { lat: 13.0827, lng: 80.2707 },
                zoom: 12,
                disableDefaultUI: true,
                styles: [{ elementType: "geometry", stylers: [{ color: "#242f3e" }] }, { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] }, { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] }]
            });
            setMap(newMap);
        });
    }, [mapRef, map]);

    // Listen for alerts from Firestore
    useEffect(() => {
        const q = query(collection(db, "alerts"), where("status", "in", ["PENDING"]));
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const promises = snapshot.docs.map(async (d) => {
                const a = d.data();
                const u = await getDoc(doc(db, "users", a.userId));
                return { id: d.id, ...a, user: u.exists() ? u.data() : {} };
            });
            const alerts = await Promise.all(promises);
            // Sort by risk
            const order = { "High": 3, "Medium": 2, "Low": 1 };
            alerts.sort((a, b) => (order[b.risk_level] || 0) - (order[a.risk_level] || 0));
            setActiveAlerts(alerts);
        });
        return () => unsubscribe();
    }, []);

    const handleSelectAlert = useCallback((alert) => {
        setSelectedAlert(alert);
        if (map) {
            map.panTo({ lat: alert.latitude, lng: alert.longitude });
            map.setZoom(15);
        }
    }, [map]);

    // Update map markers when alerts change
    useEffect(() => {
        if (!map || !window.google) return;

        const currentMarkers = alertMarkersRef.current;
        // Clear old markers
        Object.values(currentMarkers).forEach(m => m.setMap(null));
        alertMarkersRef.current = {};

        // Add new markers
        activeAlerts.forEach(a => {
            const marker = new window.google.maps.Marker({
                position: { lat: a.latitude, lng: a.longitude },
                map: map,
                title: a.alert_type
            });
            marker.addListener('click', () => {
                handleSelectAlert(a);
            });
            alertMarkersRef.current[a.id] = marker;
        });
    }, [map, activeAlerts, handleSelectAlert, alertMarkersRef]); // Added alertMarkersRef
    
    const handleDispatch = async (alertId) => {
        await updateDoc(doc(db, "alerts", alertId), { status: "DISPATCHED" });
        setSelectedAlert(null);
    };

    return (
        <div className="dashboard-screen">
            <header className="authority-header">
                <h1>AEGIS COMMAND CENTER</h1>
                <div className="header-controls">
                    <span className="live-indicator">
                        <span className="live-dot">
                            <span className="live-dot-ping"></span>
                            <span className="live-dot-static"></span>
                        </span>
                        <span>Live</span>
                    </span>
                    <div className="header-clock">{clock}</div>
                    <button onClick={() => signOut(auth)} className="button-logout">Logout</button>
                </div>
            </header>
            <div className="dashboard-body">
                <aside className="sidebar">
                    <div className="sidebar-header">
                        <h2>Alert Triage Queue</h2>
                        <p>{activeAlerts.length} active alerts.</p>
                    </div>
                    <div className="alert-queue-container">
                        {activeAlerts.map(a => <AlertCard key={a.id} alert={a} onSelect={handleSelectAlert} isSelected={selectedAlert?.id === a.id} />)}
                    </div>
                    <SopAssistant t={t} />
                </aside>
                <main className="main-content">
                    <div id="map-authority" ref={mapRef} className="map-element"></div>
                </main>
                <aside className="dispatch-panel">
                    {!selectedAlert ? (
                        <div className="dispatch-placeholder">
                            <h3>No Alert Selected</h3>
                        </div>
                    ) : (
                        <DispatchPanel alert={selectedAlert} onDispatch={handleDispatch} t={t} />
                    )}
                </aside>
            </div>
        </div>
    );
}

function AlertCard({ alert, onSelect, isSelected }) {
    let pClass = 'priority-low';
    if (alert.risk_level === 'High') pClass = 'priority-high';
    else if (alert.risk_level === 'Medium') pClass = 'priority-medium';

    return (
        <div 
            onClick={() => onSelect(alert)} 
            className={`alert-card ${pClass} ${isSelected ? 'selected-alert' : ''}`}
        >
            <p className="alert-type">{alert.alert_type}</p>
            <p className="risk-level">Risk: {alert.risk_level}</p>
            <p className="user-name">{alert.user.fullName || 'Unknown'}</p>
        </div>
    );
}

function DispatchPanel({ alert, onDispatch, t }) {
    const [briefing, setBriefing] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [mlRisk, setMlRisk] = useState({ level: 'N/A', reason: 'N/A' });

    // Reset briefing and fetch ML risk when alert changes
    useEffect(() => {
        setBriefing('');
        setIsLoading(false);
        setMlRisk({ level: 'Loading...', reason: 'Loading...' });

        const fetchMlRisk = async () => {
            try {
                const response = await fetch(`${PYTHON_BACKEND_URL}/predict_risk`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        lat: alert.latitude,
                        lon: alert.longitude,
                        vulnerability_status: alert.user.vulnerability_status || 'NONE'
                    })
                });
                if (!response.ok) throw new Error('ML Risk API failed');
                const data = await response.json();
                setMlRisk({ level: data.risk_level, reason: data.risk_reason });
            } catch (error) {
                console.error("Failed to fetch ML risk:", error);
                setMlRisk({ level: 'Error', reason: 'Failed to fetch' });
            }
        };

        if (alert) {
            fetchMlRisk();
        }

    }, [alert]);

    const generateBriefing = async () => {
        setIsLoading(true);
        try {
            // Create the specific payload the backend expects
            const briefingPayload = {
                alert_type: alert.alert_type,
                details: alert.details,
                risk_level: alert.risk_level, // This is the STATIC risk from the citizen app
                risk_reason: alert.risk_reason,
                user: alert.user,
                // Add the NEW live ML risk
                live_ml_risk: mlRisk.level 
            };

            const response = await fetch(`${PYTHON_BACKEND_URL}/generate_briefing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(briefingPayload) // Send the specific payload
            });
            const data = await response.json();
            setBriefing(data.briefing);
        } catch (error) {
            setBriefing('Failed to generate briefing.');
        }
        setIsLoading(false);
    };

    return (
        <div className="dispatch-panel-content">
            <div className="dispatch-panel-header">
                <h2>Alert #{alert.id.substring(0, 8)}</h2>
            </div>
            <div className="dispatch-panel-body">
                <p><strong>User:</strong> <span>{alert.user.fullName}</span></p>
                <p><strong>Type:</strong> <span>{alert.alert_type}</span></p>
                <p><strong>Details:</strong> <span>{alert.details}</span></p>
                <p><strong>Vulnerability:</strong> <span>{alert.user.vulnerability_status || 'NONE'}</span></p>
                <p><strong>Static Risk (from Citizen):</strong> <span className={`risk-${alert.risk_level?.toLowerCase()}`}>{alert.risk_level}</span> ({alert.risk_reason})</p>
                
                <div className="ml-risk-assessment">
                    <strong>Live ML Risk Assessment:</strong>
                    <p><span className={`risk-${mlRisk.level?.toLowerCase()}`}>{mlRisk.level}</span> ({mlRisk.reason})</p>
                </div>
            </div>
            
            <div className="ai-briefing-panel">
                {isLoading && <div className="loader-container"><div className="loader small"></div><span>Generating AI briefing...</span></div>}
                {briefing && !isLoading && (
                    <div className="ai-briefing">
                        <h4>AI-Generated Briefing</h4>
                        <p>{briefing}</p>
                    </div>
                )}
            </div>

            <div className="dispatch-panel-footer">
                <button onClick={generateBriefing} disabled={isLoading} className="button-primary button-indigo">Generate AI Briefing</button>
                <button onClick={() => onDispatch(alert.id)} className="button-primary">Dispatch</button>
            </div>
        </div>
    );
}

function SopAssistant({ t }) {
    const [query, setQuery] = useState('');
    const [result, setResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleQuery = async () => {
        if (!query) return;
        setIsLoading(true);
        setResult('');
        try {
            const response = await fetch(`${PYTHON_BACKEND_URL}/get_sop`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query: query })
            });
            const data = await response.json();
            setResult(data.sop.replace(/\n/g, '<br>'));
        } catch (error) {
            setResult('Failed to fetch SOP.');
        }
        setIsLoading(false);
    };

    return (
        <div className="sop-assistant-container">
            <div className="sop-assistant-card">
                <h3>SOP Assistant</h3>
                <div className="sop-query-controls">
                    <input 
                        type="text" 
                        placeholder="e.g., building fire..." 
                        className="input-field"
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                    />
                    <button onClick={handleQuery} disabled={isLoading} className="button-primary">Ask</button>
                </div>
                <div className="sop-result">
                    {isLoading ? <div className="loader-container"><div className="loader small"></div>Fetching SOP...</div> : <div dangerouslySetInnerHTML={{ __html: result }} />}
                </div>
            </div>
        </div>
    );
}

