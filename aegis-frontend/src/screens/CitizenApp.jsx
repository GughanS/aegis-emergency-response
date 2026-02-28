import React, { useState, useEffect, useRef } from 'react';
import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db, PYTHON_BACKEND_URL } from '../utils/config';
import { useTranslation } from '../utils/useTranslation';

// Provide a global window function handler similar to what existed
const loadGoogleMapsScript = (callback) => {
    const existingScript = document.getElementById('googleMapsScript');
    if (!existingScript) {
        const script = document.createElement('script');
        // Warning: This key needs to be set properly in your environment in a real app
        script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyD3phEVM-_zOr5lh4xncnPHPeDSiOy3Nvg&callback=initMap`;
        script.id = 'googleMapsScript';
        window.initMap = callback;
        document.body.appendChild(script);
    } else {
        window.initMap = callback;
        if (typeof window.google !== 'undefined' && typeof window.google.maps !== 'undefined') {
            callback();
        }
    }
};

export function CitizenApp({ t, LanguageSwitcher, user }) {
    const [screen, setScreen] = useState({ name: 'home' });
    const [userLocation, setUserLocation] = useState({ lat: 13.0292, lon: 80.0188 });
    const [riskLevel, setRiskLevel] = useState({ level: t('loading'), reason: '' });
    const [vulnerability, setVulnerability] = useState('NONE');

    useEffect(() => {
        getDoc(doc(db, "users", user.uid)).then(userDoc => {
            if (userDoc.exists()) {
                setVulnerability(userDoc.data().vulnerability_status);
            }
        });
    }, [user.uid]);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setUserLocation({ lat: position.coords.latitude, lon: position.coords.longitude });
            },
            () => console.warn("Could not get location. Using default.")
        );
    }, []);

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
    }, [userLocation, vulnerability, t]);

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
            setScreen({ name: 'confirm', alertType: alertType });
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
                <button onClick={() => setScreen({ name: 'sos' })} className="sos-button">
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
                <button onClick={() => setScreen({ name: 'voice' })} className="button-primary large button-indigo">{t('voiceReportButton')}</button>
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
            <button onClick={() => setScreen({ name: 'home' })} className="button-cancel">{t('cancelButton')}</button>
        </div>
    );
}

function VoiceReportScreen({ t, setScreen, handleSendAlert, currentLanguage }) {
    const [status, setStatus] = useState('prompt');
    const [result, setResult] = useState(null);
    const [isRecording, setIsRecording] = useState(false);
    const recognitionRef = useRef(null);

    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
        }
    }, []);

    const processTranscription = async (transcription) => {
        setStatus('analyzing');
        try {
            const response = await fetch(`${PYTHON_BACKEND_URL}/analyze_report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text: transcription })
            });
            if (!response.ok) throw new Error('Analysis API failed');
            const data = await response.json();

            let parsedResult = data;
            if (data.analysis) {
                try {
                    parsedResult = JSON.parse(data.analysis);
                } catch (parseError) {
                    console.error("Failed to parse AI response JSON:", parseError);
                    // Fallback structure in case Gemini ignores formatting instructions
                    parsedResult = { alert_type: "OTHER", summary: data.analysis, severity: "High" };
                }
            }

            setResult(parsedResult);
            setStatus('confirm');
        } catch (error) {
            console.error("Failed to analyze report:", error);
            setStatus('error');
        }
    };

    const handleMicClick = () => {
        if (!recognitionRef.current) {
            const transcription = prompt("Speech recognition not supported in this browser. Please type your emergency report:");
            if (transcription) processTranscription(transcription);
            return;
        }

        if (isRecording) {
            recognitionRef.current.stop();
            return;
        }

        recognitionRef.current.lang = currentLanguage === 'ta' ? 'ta-IN' : 'en-US';

        recognitionRef.current.onstart = () => {
            setIsRecording(true);
            setStatus('recording');
        };

        recognitionRef.current.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            processTranscription(transcript);
        };

        recognitionRef.current.onerror = (event) => {
            console.error("Speech recognition error", event.error);
            setIsRecording(false);
            setStatus('error');
            alert("Microphone error. Please try again or type your report.");
        };

        recognitionRef.current.onend = () => {
            setIsRecording(false);
        };

        try {
            recognitionRef.current.start();
        } catch (e) {
            console.error("Could not start recognition:", e);
        }
    };

    return (
        <div className="citizen-app-container sos-screen">
            <h2>{t('reportTitle')}</h2>
            <div className="voice-status">
                {status === 'prompt' && t('voicePrompt')}
                {status === 'recording' && (currentLanguage === 'ta' ? 'கேட்கிறது... தயவுசெய்து பேசுங்கள்.' : 'Listening... Please speak.')}
                {status === 'analyzing' && t('analysisAnalyzing')}
                {status === 'confirm' && t('analysisConfirm')}
                {status === 'error' && t('analysisFailed')}
            </div>
            <div className="voice-mic-container">
                {status !== 'analyzing' ? (
                    <button
                        onClick={handleMicClick}
                        className={`mic-button ${isRecording ? 'recording' : ''}`}
                        style={isRecording ? { backgroundColor: '#ef4444', animation: 'pulse 1.5s infinite' } : {}}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" viewBox="0 0 16 16"><path d="M5 3a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0V3z" /><path d="M3.5 6.5A.5.5 0 0 1 4 7v1a4 4 0 0 0 8 0V7a.5.5 0 0 1 1 0v1a5 5 0 0 1-4.5 4.975V15h3a.5.5 0 0 1 0 1h-7a.5.5 0 0 1 0-1h3v-2.025A5 5 0 0 1 3 8V7a.5.5 0 0 1 .5-.5z" /></svg>
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
                <button onClick={() => setScreen({ name: 'home' })} className="button-cancel">{t('cancelButton')}</button>
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
                const response = await fetch(`${PYTHON_BACKEND_URL}/get_sop`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        query: alertType || 'emergency',
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
    }, [t, alertType, currentLanguage]);

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
            <button onClick={() => setScreen({ name: 'home' })} className="button-primary">{t('doneButton')}</button>
        </div>
    );
}

export { loadGoogleMapsScript };
