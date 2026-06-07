import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Swords, ChevronRight, Search, ArrowLeft } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useCampaign } from '../../campaigns/CampaignContext';
import { getManeuvers } from '../../characters/components/maneuversData';

export default function ManeuversPage() {
  const { campaignId } = useParams();
  const { campaign } = useCampaign();
  const campaignEdition = campaign?.edition === '5.5e' ? '5.5e' : '5e';

  const [edition, setEdition] = useState(campaignEdition);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState({});

  const toggle = (name) => setExpanded((prev) => ({ ...prev, [name]: !prev[name] }));

  const maneuvers = useMemo(() => getManeuvers(edition), [edition]);
  const filtered = maneuvers.filter((m) =>
    !search || m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div className="min-w-0">
          <Link
            to={`/campaigns/${campaignId}/encyclopedia`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1"
            data-testid="maneuvers-back"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Encyclopedia
          </Link>
          <h1 className="flex items-center gap-2 text-xl font-bold">
            <Swords className="w-5 h-5 text-red-600 dark:text-red-400" />
            Battle Master Maneuvers
          </h1>
          <p className="text-sm text-muted-foreground">
            Available to the Battle Master fighter and to anyone who takes the Martial Adept feat.
          </p>
        </div>

        {/* Edition toggle */}
        <div className="flex items-center gap-1 bg-muted rounded-lg p-1 shrink-0">
          {['5e', '5.5e'].map((ed) => (
            <button
              key={ed}
              onClick={() => setEdition(ed)}
              data-testid={`maneuvers-edition-${ed}`}
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

      {/* Filter bar */}
      <div className="shrink-0 p-4 border-b border-border">
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search maneuvers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-9"
            data-testid="maneuvers-search"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-4 space-y-2">
          <div className="text-xs text-muted-foreground px-1">
            {filtered.length} maneuver{filtered.length !== 1 ? 's' : ''}
          </div>
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-muted-foreground text-sm gap-2">
              <Swords className="h-8 w-8 opacity-30" />
              <span>No maneuvers match your search.</span>
            </div>
          ) : (
            filtered.map((m) => {
              const isOpen = !!expanded[m.name];
              return (
                <div key={m.name} className="rounded-lg border border-border bg-card">
                  <button
                    type="button"
                    onClick={() => toggle(m.name)}
                    aria-expanded={isOpen}
                    data-testid={`maneuver-toggle-${m.name}`}
                    className="w-full flex items-center gap-2 px-4 py-3 text-left group"
                  >
                    <ChevronRight
                      className={cn(
                        'w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-150',
                        isOpen && 'rotate-90'
                      )}
                    />
                    <span className="text-sm font-semibold text-red-700 dark:text-red-400 group-hover:underline">
                      {m.name}
                    </span>
                  </button>
                  {isOpen && (
                    <p className="text-sm text-muted-foreground leading-relaxed px-4 pb-3 pl-10">
                      {m.description}
                    </p>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
