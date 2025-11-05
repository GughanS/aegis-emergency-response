import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './AegisApp.jsx'; // Point to your new component

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
