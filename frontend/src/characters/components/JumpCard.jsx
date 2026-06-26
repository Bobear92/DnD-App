import { Link, useParams } from 'react-router-dom';
import { ArrowUpRight } from 'lucide-react';
import { computeJump } from './jumpData';
import { hasFeat, remarkableAthlete } from './combatBonuses';

/**
 * Small dedicated "Jumping" card for the CharacterDetail Stats tab.
 *
 * Shows the four key distances compactly with a "Learn more" link to the
 * encyclopedia Jump mechanics page (which holds the formulas, modifiers, and
 * examples — no need to repeat them here). Display-only (no save) — derived from
 * the character's Strength + Athlete feat.
 */
export default function JumpCard({ strength, feats = [], charClass, subclass, level, edition }) {
  const { campaignId } = useParams();

  const athlete = hasFeat(feats, 'Athlete');
  // Only 5e's Remarkable Athlete adds a jump bonus; the 2024 version grants advantage instead.
  const raJump = !!remarkableAthlete({ charClass, subclass, level, edition })?.jumpStrBonus;
  const j = computeJump(strength, { athlete, remarkableAthlete: raJump });

  const Stat = ({ label, value, testid }) => (
    <div className="rounded-md border py-2 text-center">
      <div className="text-[10px] text-muted-foreground uppercase leading-tight">{label}</div>
      <div className="font-bold" data-testid={testid}>{value} ft</div>
    </div>
  );

  return (
    <div className="rounded-lg border border-border bg-card p-4" data-testid="jump-card">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Jumping</h3>
        <Link
          to={`/campaigns/${campaignId}/encyclopedia/mechanics/jump`}
          className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          data-testid="jump-learn-more"
        >
          Learn more <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-2 text-sm">
        <Stat label="Long (running)" value={j.longRunning} testid="jump-long-running" />
        <Stat label="High (running)" value={j.highRunning} testid="jump-high-running" />
        <Stat label="Long (standing)" value={j.longStanding} testid="jump-long-standing" />
        <Stat label="High (standing)" value={j.highStanding} testid="jump-high-standing" />
      </div>

      {athlete && (
        <p className="mt-2 text-xs text-emerald-600 leading-snug" data-testid="jump-feat-note">
          Athlete: running start of only {j.runStartFt} ft (normally 10 ft).
        </p>
      )}
      {raJump && j.raLongJumpBonus > 0 && (
        <p className="mt-2 text-xs text-teal-600 leading-snug" data-testid="jump-remarkable-athlete-note">
          Remarkable Athlete: running long jump +{j.raLongJumpBonus} ft (your Strength modifier).
        </p>
      )}
    </div>
  );
}
