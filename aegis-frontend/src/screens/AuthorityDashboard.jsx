import React, { useState, useEffect, useRef, useCallback } from 'react';
import { collection, query, where, onSnapshot, getDoc, doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { auth, db, PYTHON_BACKEND_URL } from '../utils/config';
import { loadGoogleMapsScript } from './CitizenApp';

export function AuthorityDashboard({ t, user }) {
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
        if (map && window.google) {
            map.panTo({ lat: alert.latitude, lng: alert.longitude });
            map.setZoom(15);
        }
    }, [map]);

    // Update map markers when alerts change
    useEffect(() => {
        if (!map || !window.google) return;

        const currentMarkers = alertMarkersRef.current;
        Object.values(currentMarkers).forEach(m => m.setMap(null));
        alertMarkersRef.current = {};

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
    }, [map, activeAlerts, handleSelectAlert]);

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
            const briefingPayload = {
                id: alert.id,
                alert_type: alert.alert_type,
                details: alert.details,
                latitude: alert.latitude,
                longitude: alert.longitude,
                status: alert.status,
                risk_level: alert.risk_level,
                risk_reason: alert.risk_reason,
                user: alert.user,
                live_ml_risk: { level: mlRisk.level, reason: mlRisk.reason }
            };

            const response = await fetch(`${PYTHON_BACKEND_URL}/generate_briefing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(briefingPayload)
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
