import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCampaign } from '../../campaigns/CampaignContext';
import SubclassOverview from '@/characters/components/subclass/SubclassOverview';

/**
 * The encyclopedia's page for ONE subclass — the linkable target the Classes tab never had
 * (there, a subclass opens in a dialog, which nothing outside the tab can address).
 *
 * The body is the same `SubclassOverview` the Classes tab and the creation flow render, so the
 * reference text has one source. Unlike the character sheet's `SubclassDetails` — which shows only
 * the features you have EARNED — this shows the whole subclass at every level, which is the reason
 * to come here from a sheet.
 *
 * Route: /campaigns/:campaignId/encyclopedia/classes/:className/:subclassName
 * Both names are URL-decoded (a subclass name has spaces: "Arcane Archer").
 */
export default function SubclassPage() {
  const { campaignId, className, subclassName } = useParams();
  const { campaign } = useCampaign();
  const campaignEdition = campaign?.edition === '5.5e' ? '5.5e' : '5e';

  const [edition, setEdition] = useState(campaignEdition);

  const cls = decodeURIComponent(className ?? '');
  const sub = decodeURIComponent(subclassName ?? '');

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div className="min-w-0">
          <Link
            to={`/campaigns/${campaignId}/encyclopedia`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1"
            data-testid="subclass-page-back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Encyclopedia
          </Link>
          <h1 className="text-xl font-bold truncate">{sub}</h1>
          <p className="text-sm text-muted-foreground">{cls} subclass</p>
        </div>

        {/* Edition toggle — a subclass can exist in one edition only, in which case the other
            edition shows SubclassOverview's own "not available" state rather than a blank page. */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1 shrink-0">
          {['5e', '5.5e'].map((ed) => (
            <button
              key={ed}
              onClick={() => setEdition(ed)}
              data-testid={`subclass-page-edition-${ed}`}
              className={cn(
                'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                edition === ed
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {ed === '5.5e' ? '2024' : '5e'}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="p-6 max-w-4xl" data-testid="subclass-page-body">
          <SubclassOverview
            className={cls}
            subclassName={sub}
            edition={edition}
            maneuversTo={`/campaigns/${campaignId}/encyclopedia/maneuvers`}
          />
        </div>
      </div>
    </div>
  );
}
