import { Navigate, useParams } from 'react-router-dom';
import { useCampaign } from '../../campaigns/CampaignContext';
import { campaignFeatures } from '../../campaigns/campaignFeatures';

// Guards a route behind a campaign feature (see campaignFeatures). When the GM has
// switched the feature off, anyone landing on the URL is sent to the dashboard.
export default function FeatureRoute({ feature, children }) {
  const { campaignId } = useParams();
  const { campaign } = useCampaign();
  if (!campaignFeatures(campaign)[feature]) {
    return <Navigate to={`/campaigns/${campaignId}/dashboard`} replace />;
  }
  return children;
}
