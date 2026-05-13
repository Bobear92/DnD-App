import { useParams } from 'react-router-dom';
import { useCampaign } from '../../campaigns/CampaignContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Clock } from 'lucide-react';
import CalendarTab from './CalendarTab';
import TimelineTab from './TimelineTab';

export default function CampaignSettings() {
  const { campaignId } = useParams();
  const { campaign } = useCampaign();
  const isGm = campaign?.userRole === 'gm';

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-6 h-6" />
        <h1 className="text-2xl font-bold">Campaign Time</h1>
      </div>

      <Tabs defaultValue="calendar">
        <TabsList className="mb-6">
          <TabsTrigger value="calendar">Calendar</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="calendar">
          <CalendarTab campaignId={campaignId} isGm={isGm} />
        </TabsContent>

        <TabsContent value="timeline">
          <TimelineTab campaignId={campaignId} isGm={isGm} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
