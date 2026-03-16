import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './auth/pages/Login';
import CampaignSelection from './campaigns/pages/CampaignSelection';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/campaigns" element={<CampaignSelection />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* We'll add more routes later (main app, etc.) */}
      </Routes>
    </Router>
  );
}

export default App;