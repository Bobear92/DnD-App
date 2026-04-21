import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './auth/pages/Login';
import CampaignSelection from './campaigns/pages/CampaignSelection';
import Dashboard from './dashboard/Dashboard';
import CharacterList from './characters/pages/CharacterList';
import LocationList from './locations/pages/LocationList';
import LocationDetail from './locations/pages/LocationDetail';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/campaigns" element={<CampaignSelection />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/characters" element={<CharacterList />} />
        <Route path="/locations" element={<LocationList />} />
        <Route path="/locations/:locationId" element={<LocationDetail />} />
        <Route path="/" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;