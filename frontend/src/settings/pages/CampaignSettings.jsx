import { useParams } from 'react-router-dom';
import { useCampaign } from '../../campaigns/CampaignContext';
import { Clock } from 'lucide-react';
import CalendarTab from './CalendarTab';

export default function CampaignSettings() {
  const { campaignId } = useParams();
  const { campaign } = useCampaign();
  const isGm = campaign?.userRole === 'gm';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Calendar</h1>
      </div>
      <CalendarTab campaignId={campaignId} isGm={isGm} />
    </div>
  );
}
