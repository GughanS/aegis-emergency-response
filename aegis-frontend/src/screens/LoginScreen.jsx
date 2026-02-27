import React, { useState } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../utils/config';

export function LoginScreen({ t, LanguageSwitcher, language, setLang }) {
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
                    <div className="language-switcher-container"><LanguageSwitcher language={language} setLang={setLang} /></div>
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
                <div className="language-switcher-container"><LanguageSwitcher language={language} setLang={setLang} /></div>
            </div>
        </div>
    );
}
