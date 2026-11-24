import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import MainLayout from '../../shared/components/layout/MainLayout';
import MembersPanel from '../components/MembersPanel';
import { useCampaign } from '../CampaignContext';

export default function CampaignMembers() {
  const { campaignId } = useParams();
  const { campaign } = useCampaign();
  const [count, setCount] = useState(null);

  return (
    <MainLayout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Campaign Members</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {campaign?.name}
            {count !== null && ` · ${count} member${count !== 1 ? 's' : ''}`}
          </p>
        </div>
        <MembersPanel campaignId={campaignId} onMembersLoaded={(list) => setCount(list.length)} />
      </div>
    </MainLayout>
  );
}
