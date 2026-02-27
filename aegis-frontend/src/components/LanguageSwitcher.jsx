import React from 'react';

export const LanguageSwitcher = ({ language, setLang, isMain = false }) => (
    <select
        value={language}
        onChange={(e) => setLang(e.target.value)}
        className={`language-switcher ${isMain ? 'lang-switcher-main' : ''}`}
    >
        <option value="en">English</option>
        <option value="ta">தமிழ்</option>
    </select>
);
