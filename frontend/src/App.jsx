import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { CampaignProvider } from './campaigns/CampaignContext';
import ProtectedRoute from './shared/components/ProtectedRoute';
import FeatureRoute from './shared/components/FeatureRoute';
import ErrorBoundary from './shared/components/ErrorBoundary';
import Login from './auth/pages/Login';
import ForgotPassword from './auth/pages/ForgotPassword';
import ResetPassword from './auth/pages/ResetPassword';
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
import EncountersPage from './encounters/pages/EncountersPage';
import EncyclopediaPage from './encyclopedia/pages/EncyclopediaPage';
import SpellEditPage from './encyclopedia/pages/SpellEditPage';
import ItemEditPage from './encyclopedia/pages/ItemEditPage';
import ManeuversPage from './encyclopedia/pages/ManeuversPage';
import ClassPage from './encyclopedia/pages/ClassPage';
import SubclassPage from './encyclopedia/pages/SubclassPage';
import JumpPage from './encyclopedia/pages/JumpPage';
import ArmorClassPage from './encyclopedia/pages/ArmorClassPage';
import ActionEconomyPage from './encyclopedia/pages/ActionEconomyPage';
import HitDicePage from './encyclopedia/pages/HitDicePage';
import LoadingPage from './encyclopedia/pages/LoadingPage';
import ObjectInteractionPage from './encyclopedia/pages/ObjectInteractionPage';
import SpacingPage from './encyclopedia/pages/SpacingPage';
import SpecialAttacksPage from './encyclopedia/pages/SpecialAttacksPage';
import MagicalAttacksPage from './encyclopedia/pages/MagicalAttacksPage';
import DamageMitigationPage from './encyclopedia/pages/DamageMitigationPage';
import MainLayout from './shared/components/layout/MainLayout';

function App() {
  return (
    <Router>
      <AuthProvider>
        <CampaignProvider>
          <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/campaigns" element={<ProtectedRoute><CampaignSelection /></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/characters" element={<ProtectedRoute><FeatureRoute feature="characters"><CharacterList /></FeatureRoute></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/characters/create" element={<ProtectedRoute><FeatureRoute feature="characters"><CharacterCreate /></FeatureRoute></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/characters/:characterId" element={<ProtectedRoute><FeatureRoute feature="characters"><CharacterDetail /></FeatureRoute></ProtectedRoute>} />
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
            {/* EncountersPage renders its own MainLayout (it needs the full-height flex body). */}
            <Route path="/campaigns/:campaignId/encounters" element={<ProtectedRoute><FeatureRoute feature="encounters"><EncountersPage /></FeatureRoute></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/encyclopedia" element={<ProtectedRoute><FeatureRoute feature="encyclopedia"><MainLayout><EncyclopediaPage /></MainLayout></FeatureRoute></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/encyclopedia/maneuvers" element={<ProtectedRoute><FeatureRoute feature="encyclopedia"><MainLayout><ManeuversPage /></MainLayout></FeatureRoute></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/encyclopedia/classes/:className" element={<ProtectedRoute><FeatureRoute feature="encyclopedia"><MainLayout><ClassPage /></MainLayout></FeatureRoute></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/encyclopedia/classes/:className/:subclassName" element={<ProtectedRoute><FeatureRoute feature="encyclopedia"><MainLayout><SubclassPage /></MainLayout></FeatureRoute></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/encyclopedia/mechanics/jump" element={<ProtectedRoute><FeatureRoute feature="encyclopedia"><MainLayout><JumpPage /></MainLayout></FeatureRoute></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/encyclopedia/mechanics/armor-class" element={<ProtectedRoute><FeatureRoute feature="encyclopedia"><MainLayout><ArmorClassPage /></MainLayout></FeatureRoute></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/encyclopedia/mechanics/action-economy" element={<ProtectedRoute><FeatureRoute feature="encyclopedia"><MainLayout><ActionEconomyPage /></MainLayout></FeatureRoute></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/encyclopedia/mechanics/hit-dice" element={<ProtectedRoute><FeatureRoute feature="encyclopedia"><MainLayout><HitDicePage /></MainLayout></FeatureRoute></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/encyclopedia/mechanics/loading" element={<ProtectedRoute><FeatureRoute feature="encyclopedia"><MainLayout><LoadingPage /></MainLayout></FeatureRoute></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/encyclopedia/mechanics/object-interaction" element={<ProtectedRoute><FeatureRoute feature="encyclopedia"><MainLayout><ObjectInteractionPage /></MainLayout></FeatureRoute></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/encyclopedia/mechanics/spacing" element={<ProtectedRoute><FeatureRoute feature="encyclopedia"><MainLayout><SpacingPage /></MainLayout></FeatureRoute></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/encyclopedia/mechanics/special-attacks" element={<ProtectedRoute><FeatureRoute feature="encyclopedia"><MainLayout><SpecialAttacksPage /></MainLayout></FeatureRoute></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/encyclopedia/mechanics/magical-attacks" element={<ProtectedRoute><FeatureRoute feature="encyclopedia"><MainLayout><MagicalAttacksPage /></MainLayout></FeatureRoute></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/encyclopedia/mechanics/damage-mitigation" element={<ProtectedRoute><FeatureRoute feature="encyclopedia"><MainLayout><DamageMitigationPage /></MainLayout></FeatureRoute></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/encyclopedia/spells/:spellId" element={<ProtectedRoute><FeatureRoute feature="encyclopedia"><MainLayout><SpellEditPage /></MainLayout></FeatureRoute></ProtectedRoute>} />
            <Route path="/campaigns/:campaignId/encyclopedia/items/:category/:itemId" element={<ProtectedRoute><FeatureRoute feature="encyclopedia"><MainLayout><ItemEditPage /></MainLayout></FeatureRoute></ProtectedRoute>} />
            <Route path="/" element={<Navigate to="/campaigns" replace />} />
          </Routes>
          </ErrorBoundary>
        </CampaignProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
