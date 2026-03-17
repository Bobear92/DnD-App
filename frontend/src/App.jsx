import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './auth/pages/Login';
import CampaignSelection from './campaigns/pages/CampaignSelection';
import Dashboard from './dashboard/Dashboard';
import CharacterList from './characters/pages/CharacterList';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/campaigns" element={<CampaignSelection />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/characters" element={<CharacterList />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        {/* We'll add more routes later */}
      </Routes>
    </Router>
  );
}

export default App;