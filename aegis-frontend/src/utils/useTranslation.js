import { useState } from 'react';

export const translations = {
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

export function useTranslation() {
    const [language, setLanguage] = useState(localStorage.getItem('aegisLang') || 'en');

    const setLang = (lang) => {
        localStorage.setItem('aegisLang', lang);
        setLanguage(lang);
    };

    const t = (key) => translations[language]?.[key] || translations['en'][key] || key;

    return { language, setLang, t };
}
