import { Link, useParams } from 'react-router-dom';
import { ChevronRight, Cog } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MECHANICS } from '../data/mechanicsRegistry';

/**
 * Encyclopedia "Mechanics" tab — a card grid linking to the routed static
 * reference pages (one per game mechanic). Available mechanics are clickable;
 * planned ones render muted as "Coming soon". Driven by mechanicsRegistry.js.
 */
export default function MechanicsTab() {
  const { campaignId } = useParams();

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-3xl mx-auto p-6">
        <p className="text-sm text-muted-foreground mb-4">
          Plain-language explanations of how the game's mechanics are calculated, with worked examples.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {MECHANICS.map((m) => {
            const inner = (
              <div className="flex items-start gap-3">
                <Cog className="w-5 h-5 shrink-0 text-sky-600 dark:text-sky-400 mt-0.5" />
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{m.title}</span>
                    {!m.available && (
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground border rounded px-1.5 py-0.5">
                        Coming soon
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{m.blurb}</p>
                </div>
                {m.available && <ChevronRight className="w-4 h-4 shrink-0 text-muted-foreground ml-auto self-center" />}
              </div>
            );

            return m.available ? (
              <Link
                key={m.slug}
                to={`/campaigns/${campaignId}/encyclopedia/mechanics/${m.slug}`}
                data-testid={`mechanic-card-${m.slug}`}
                className="rounded-lg border border-border bg-card p-4 hover:bg-muted/60 transition-colors"
              >
                {inner}
              </Link>
            ) : (
              <div
                key={m.slug}
                data-testid={`mechanic-card-${m.slug}`}
                className={cn('rounded-lg border border-border bg-card p-4 opacity-60 cursor-default')}
              >
                {inner}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
