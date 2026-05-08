import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { CampaignProvider } from './campaigns/CampaignContext';
import ProtectedRoute from './shared/components/ProtectedRoute';
import ErrorBoundary from './shared/components/ErrorBoundary';
import Login from './auth/pages/Login';
import CampaignSelection from './campaigns/pages/CampaignSelection';
import Dashboard from './dashboard/Dashboard';
import CharacterList from './characters/pages/CharacterList';
import LocationList from './locations/pages/LocationList';
import LocationDetail from './locations/pages/LocationDetail';
import NPCList from './npcs/pages/NPCList';
import NPCDetail from './npcs/pages/NPCDetail';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CampaignProvider>
          <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/campaigns" element={<ProtectedRoute><CampaignSelection /></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/characters" element={<ProtectedRoute><CharacterList /></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/locations" element={<ProtectedRoute><LocationList /></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/locations/:locationId" element={<ProtectedRoute><LocationDetail /></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/npcs" element={<ProtectedRoute><NPCList /></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/npcs/:npcId" element={<ProtectedRoute><NPCDetail /></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/campaigns" replace />} />
          </Routes>
          </ErrorBoundary>
        </CampaignProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
