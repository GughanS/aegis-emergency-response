import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { auth, db } from './utils/config';
import { useTranslation } from './utils/useTranslation';

// Components
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { LoginScreen } from './screens/LoginScreen';
import { CitizenApp } from './screens/CitizenApp';
import { AuthorityDashboard } from './screens/AuthorityDashboard';

// --- Import CSS ---
import './styles.css';

export default function App() {
    const [user, setUser] = useState(null);
    const [role, setRole] = useState('citizen');
    const [isAuthReady, setIsAuthReady] = useState(false);
    const { language, setLang, t } = useTranslation();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            if (u) {
                try {
                    const userDoc = await getDoc(doc(db, "users", u.uid));
                    if (userDoc.exists()) {
                        setRole(userDoc.data().role || 'citizen');
                    }
                } catch (error) {
                    console.error("Error fetching user role:", error);
                }
                setUser(u);
            } else {
                setUser(null);
                setRole('citizen');
            }
            setIsAuthReady(true);
        });
        return () => unsubscribe();
    }, []);

    if (!isAuthReady) {
        return (
            <div className="auth-page-container">
                <div className="loader"></div>
            </div>
        );
    }

    if (!user) {
        return <LoginScreen t={t} LanguageSwitcher={LanguageSwitcher} language={language} setLang={setLang} />;
    }

    if (role === 'authority') {
        return <AuthorityDashboard t={t} user={user} />;
    }

    return <CitizenApp t={t} LanguageSwitcher={LanguageSwitcher} user={user} />;
}
