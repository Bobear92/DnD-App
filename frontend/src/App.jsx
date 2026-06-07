import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { CampaignProvider } from './campaigns/CampaignContext';
import ProtectedRoute from './shared/components/ProtectedRoute';
import ErrorBoundary from './shared/components/ErrorBoundary';
import Login from './auth/pages/Login';
import CampaignSelection from './campaigns/pages/CampaignSelection';
import Dashboard from './dashboard/Dashboard';
import CharacterList from './characters/pages/CharacterList';
import CharacterCreate from './characters/pages/CharacterCreate';
import CharacterDetail from './characters/pages/CharacterDetail';
import LocationList from './locations/pages/LocationList';
import LocationDetail from './locations/pages/LocationDetail';
import NPCList from './npcs/pages/NPCList';
import NPCDetail from './npcs/pages/NPCDetail';
import CampaignSettings from './settings/pages/CampaignSettings';
import TimelinePage from './timeline/pages/TimelinePage';
import SessionList from './sessions/pages/SessionList';
import SessionDetail from './sessions/pages/SessionDetail';
import CampaignMembers from './campaigns/pages/CampaignMembers';
import CampaignSettingsPage from './campaigns/pages/CampaignSettingsPage';
import EncyclopediaPage from './encyclopedia/pages/EncyclopediaPage';
import SpellEditPage from './encyclopedia/pages/SpellEditPage';
import ItemEditPage from './encyclopedia/pages/ItemEditPage';
import ManeuversPage from './encyclopedia/pages/ManeuversPage';
import MainLayout from './shared/components/layout/MainLayout';

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
            <Route path="/campaigns/:campaignId/characters/create" element={<ProtectedRoute><CharacterCreate /></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/characters/:characterId" element={<ProtectedRoute><CharacterDetail /></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/locations" element={<ProtectedRoute><LocationList /></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/locations/:locationId" element={<ProtectedRoute><LocationDetail /></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/npcs" element={<ProtectedRoute><NPCList /></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/npcs/:npcId" element={<ProtectedRoute><NPCDetail /></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/campaign-time" element={<ProtectedRoute><MainLayout><CampaignSettings /></MainLayout></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/timeline" element={<ProtectedRoute><MainLayout><TimelinePage /></MainLayout></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/sessions" element={<ProtectedRoute><SessionList /></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/sessions/:sessionId" element={<ProtectedRoute><SessionDetail /></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/members" element={<ProtectedRoute><CampaignMembers /></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/settings" element={<ProtectedRoute><CampaignSettingsPage /></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/encyclopedia" element={<ProtectedRoute><MainLayout><EncyclopediaPage /></MainLayout></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/encyclopedia/maneuvers" element={<ProtectedRoute><MainLayout><ManeuversPage /></MainLayout></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/encyclopedia/spells/:spellId" element={<ProtectedRoute><MainLayout><SpellEditPage /></MainLayout></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/encyclopedia/items/:category/:itemId" element={<ProtectedRoute><MainLayout><ItemEditPage /></MainLayout></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/campaigns" replace />} />
          </Routes>
          </ErrorBoundary>
        </CampaignProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
