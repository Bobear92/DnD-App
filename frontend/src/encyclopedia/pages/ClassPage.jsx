import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCampaign } from '../../campaigns/CampaignContext';
import classService from '../../characters/classService';
import ClassOverview from '@/characters/components/classData/ClassOverview';

/**
 * The encyclopedia's page for ONE class — the linkable target the Classes tab never had (there,
 * a class is selected into local state, which nothing outside the tab can address). Sibling of
 * SubclassPage, one segment shorter.
 *
 * The body is the same `ClassOverview` the Classes tab and the creation flow render, so the
 * reference text has one source. Unlike the character sheet — which lists only the features you
 * have EARNED — this shows the class at every level, which is the reason to come here from a sheet.
 *
 * Route: /campaigns/:campaignId/encyclopedia/classes/:className
 */
export default function ClassPage() {
  const { campaignId, className } = useParams();
  const { campaign } = useCampaign();
  const campaignEdition = campaign?.edition === '5.5e' ? '5.5e' : '5e';

  const cls = decodeURIComponent(className ?? '');

  const [edition, setEdition] = useState(campaignEdition);
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setClassData(null);
    classService.getClassByName(cls, edition, campaignId).then((data) => {
      if (cancelled) return;
      setClassData(data);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, [cls, edition, campaignId]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div className="min-w-0">
          <Link
            to={`/campaigns/${campaignId}/encyclopedia`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1"
            data-testid="class-page-back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Encyclopedia
          </Link>
          <h1 className="text-xl font-bold truncate">{cls}</h1>
          <p className="text-sm text-muted-foreground">Class reference — every level</p>
        </div>

        {/* Edition toggle — a class can differ between editions (or, like Artificer, exist in one
            only, in which case ClassOverview shows its own "unavailable" state). */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1 shrink-0">
          {['5e', '5.5e'].map((ed) => (
            <button
              key={ed}
              onClick={() => setEdition(ed)}
              data-testid={`class-page-edition-${ed}`}
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
        <div className="p-6" data-testid="class-page-body">
          <ClassOverview
            classData={classData}
            loading={loading}
            maneuversTo={`/campaigns/${campaignId}/encyclopedia/maneuvers`}
          />
        </div>
      </div>
    </div>
  );
}
