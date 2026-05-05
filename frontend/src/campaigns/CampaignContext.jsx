import { createContext, useContext, useState } from 'react';

const CampaignContext = createContext(null);

export function CampaignProvider({ children }) {
  const [campaign, setCampaign] = useState(() => {
    try {
      const stored = localStorage.getItem('selectedCampaign');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  function enterCampaign(campaignData) {
    setCampaign(campaignData);
    localStorage.setItem('selectedCampaign', JSON.stringify(campaignData));
  }

  function leaveCampaign() {
    setCampaign(null);
    localStorage.removeItem('selectedCampaign');
  }

  return (
    <CampaignContext.Provider value={{ campaign, enterCampaign, leaveCampaign }}>
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaign() {
  return useContext(CampaignContext);
}
