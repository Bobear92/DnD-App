import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Award, RefreshCw, Trash2, Plus, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import FeatPicker from '@/characters/components/feats/FeatPicker';
import featService from '@/encyclopedia/featService';
import { getFeatResources, getFeatManeuvers } from '@/characters/components/feats/featEffects';
import { getManeuvers } from '@/characters/components/classData/maneuversData';
import { RestResourceControl } from '@/characters/components/sheets/classSheet/RestResourceTracker';

function prereqText(feat) {
  const p = feat?.prerequisites;
  if (p && typeof p === 'object' && typeof p.text === 'string' && p.text.trim()) return p.text;
  return null;
}

const ABILITY_LABEL = {
  strength: 'Strength', dexterity: 'Dexterity', constitution: 'Constitution',
  intelligence: 'Intelligence', wisdom: 'Wisdom', charisma: 'Charisma',
};

// A short chip label for a structured effect, so the sheet shows the MECHANIC, not just prose.
// Returns null for 'note' effects (rendered as muted text instead). For an ability_choice that
// the character has already resolved, show the chosen ability.
function effectChipLabel(e, feat) {
  switch (e.kind) {
    case 'stat_mod': return e.label || `${e.amount >= 0 ? '+' : ''}${e.amount} ${e.stat}`;
    case 'ability_score': return e.label || `+${e.amount} ${ABILITY_LABEL[e.ability] || e.ability}`;
    case 'ability_choice':
      return feat?.choices?.ability
        ? `+${e.amount || 1} ${ABILITY_LABEL[feat.choices.ability] || feat.choices.ability}`
        : (e.label || `+${e.amount || 1} ${(e.abilities || []).map((a) => ABILITY_LABEL[a] || a).join(' / ')}`);
    case 'attack_mod': return e.label || `${e.target} ${e.dice}`;
    case 'action': return e.label || `${e.name} (${e.economy})`;
    case 'resource': {
      const name = e.label || e.key;
      return e.total === 'pb' ? `${name} (PB)` : `${name} ×${e.total}`;
    }
    case 'proficiency':
      if (Array.isArray(e.items)) {
        return e.items.map((i) => (e.prof_type === 'armor' && !/armor|shield/i.test(i) ? `${i} armor` : i)).join(', ');
      }
      if (e.prof_type === 'saving_throw') {
        return feat?.choices?.ability ? `${ABILITY_LABEL[feat.choices.ability]} save` : 'Saving-throw proficiency';
      }
      if (e.count) return `${e.count} ${String(e.prof_type).replace(/_/g, ' ')}`;
      return e.label || String(e.prof_type);
    case 'maneuver_grant':
      return feat?.choices?.maneuvers?.length
        ? feat.choices.maneuvers.join(', ')
        : (e.label || `${e.count || 0} maneuvers`);
    case 'expertise': return e.label || `Expertise ×${e.count || 1}`;
    case 'ac_mod': return e.label || (e.amount ? `+${e.amount} AC` : 'AC');
    default: return null; // note
  }
}

/**
 * Feats sub-tab for the character sheet (lives under the Features tab).
 *
 * `character_data.feats` only stores { id, name } (plus optional level/source) — this
 * component fetches the edition-aware feat catalogue to resolve each owned feat's full
 * description + prerequisite. Read-only for everyone; when `canManage` (GM, not player
 * view) it also offers an Add Feat picker and a per-feat remove. Changes are emitted via
 * `onChange({ feats })` (CharacterDetail persists immediately through autoSaveClassPatch).
 */
export default function FeatsSubTab({ feats = [], campaignId, edition = '5e', canManage = false, onChange, characterData = {}, readOnly = false, pb = 0 }) {
  const [catalogue, setCatalogue] = useState([]);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    let cancelled = false;
    featService.getFeats(campaignId, edition).then((list) => {
      if (!cancelled) setCatalogue(Array.isArray(list) ? list : []);
    });
    return () => { cancelled = true; };
  }, [campaignId, edition]);

  // Resolve each owned feat against the catalogue (by id, then name) for full detail.
  const resolved = useMemo(() => feats.map((f) => {
    const owned = typeof f === 'string' ? { name: f } : (f || {});
    const full = catalogue.find((c) => (owned.id != null && c.id === owned.id) || c.name === owned.name);
    return { ...owned, ...(full || {}), name: owned.name ?? full?.name };
  }), [feats, catalogue]);

  const ownedNames = new Set(resolved.map((f) => f.name));
  const addable = catalogue.filter((c) => c.repeatable || !ownedNames.has(c.name));

  // A Battle Master folds the Martial Adept feat's die + maneuvers into their Combat Superiority
  // pool (BattleMasterPanel), so its standalone d6 tracker + maneuver list are suppressed here.
  const isBattleMaster = characterData?.subclass === 'Battle Master';

  // Rest-rechargeable resource pools from feats (Lucky, Martial Adept). The expended count
  // lives in character_data as `${key}_used`; RestResourceControl persists it via onChange.
  // Hide the Martial Adept superiority die for a Battle Master (folded into their shared pool).
  const featResources = getFeatResources(resolved, { pb })
    .filter((r) => !(isBattleMaster && r.key === 'martial_adept_superiority'));

  // Battle Master maneuvers a feat (Martial Adept) granted. For a non-Battle-Master these are
  // shown here with full descriptions + a d6 die (tracked via featResources above). For a Battle
  // Master they're part of the known list in the BattleMasterPanel, so just note that.
  const featManeuvers = getFeatManeuvers(resolved);
  const maneuverDescs = getManeuvers(edition);
  const maneuverDesc = (name) => maneuverDescs.find((m) => m.name === name)?.description || '';
  const resourceRow = (r) => {
    const used = characterData?.[r.usedKey] || 0;
    return {
      key: r.usedKey,
      label: r.source ? `${r.label} (${r.source})` : r.label,
      total: r.total,
      used,
      remaining: Math.max(0, r.total - used),
      recharge: r.recharge,
    };
  };

  const addFeat = (feat) => {
    if (!feat) return;
    // Snapshot the feat's structured `effects` onto the instance (inventory-snapshot pattern) so
    // the sheet's resolvers (unarmed die, proficiency banners, action economy, the Defenses
    // panel) work without a re-fetch — matching how the LevelUpWizard / Variant Human
    // acquisition paths store feats.
    //
    // The effects are read off the CATALOGUE, not off `feat`: FeatPicker's documented payload is
    // `{id, name}` only, so trusting `feat.effects` silently stored every feat added here with no
    // mechanics at all (the resolved list above papered over it for display, but anything reading
    // character_data.feats directly got a bare {id, name}).
    const full = catalogue.find((c) => (feat.id != null && c.id === feat.id) || c.name === feat.name);
    const entry = { id: feat.id, name: feat.name };
    const effects = Array.isArray(feat.effects) ? feat.effects : full?.effects;
    if (Array.isArray(effects)) entry.effects = effects;
    onChange?.({ feats: [...feats, entry] });
    setAdding(false);
  };

  const removeFeat = (idx) => {
    onChange?.({ feats: feats.filter((_, i) => i !== idx) });
  };

  return (
    <div className="space-y-3" data-testid="feats-subtab">
      {featResources.length > 0 && (
        <div className="space-y-1.5" data-testid="feat-resources">
          {featResources.map((r) => {
            const row = resourceRow(r);
            return (
              <div key={r.key} className="flex items-center justify-between rounded-md border px-3 py-2" data-testid={`feat-resource-${r.key}`}>
                <span className="text-sm font-medium">{row.label}</span>
                <RestResourceControl row={row} onChange={onChange} readOnly={readOnly} isGm={canManage} idPrefix={`feat-${r.key}`} />
              </div>
            );
          })}
        </div>
      )}
      {featManeuvers.length > 0 && (
        <div className="rounded-md border p-3 space-y-2" data-testid="feat-maneuvers">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold">Maneuvers (Martial Adept)</span>
            <Badge variant="outline" className="text-[10px]">
              {isBattleMaster ? 'folded into Battle Master' : `d6 · ${featManeuvers.length} known`}
            </Badge>
          </div>
          {isBattleMaster ? (
            <p className="text-xs text-muted-foreground" data-testid="feat-maneuvers-bm-note">
              Your Martial Adept maneuvers and extra superiority die are part of your Combat Superiority
              pool — see the Battle Master panel in the Class Features tab.
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Fueled by one d6 superiority die (tracked above; regained on a short or long rest).
              Maneuver save DC = 8 + proficiency bonus + Strength or Dexterity modifier.
            </p>
          )}
          <div className="space-y-1.5">
            {featManeuvers.map((m) => (
              <div key={m.name} className="rounded-md border p-2.5" data-testid={`feat-maneuver-${m.name}`}>
                <span className="font-medium text-sm">{m.name}</span>
                {maneuverDesc(m.name) && (
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{maneuverDesc(m.name)}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
      {resolved.length === 0 ? (
        <div className="rounded-md border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground" data-testid="feats-empty">
          No feats yet.{canManage ? ' Add one below or grant feats at level-up.' : ''}
        </div>
      ) : (
        <div className="space-y-2">
          {resolved.map((feat, i) => {
            const prereq = prereqText(feat);
            return (
              <div key={`${feat.id ?? feat.name}-${i}`} className="rounded-md border bg-card p-3" data-testid={`feat-row-${feat.name}`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <Award className="w-4 h-4 shrink-0 text-primary" />
                  <span className="font-medium text-sm">{feat.name}</span>
                  {feat.repeatable && <RefreshCw className="h-3 w-3 text-muted-foreground" aria-label="Repeatable" />}
                  {feat.source && <Badge variant="secondary" className="text-xs">{feat.source}</Badge>}
                  {feat.level != null && <Badge variant="outline" className="text-xs">Lvl {feat.level}</Badge>}
                  {canManage && (
                    <Button
                      variant="ghost" size="icon"
                      className="h-7 w-7 ml-auto text-muted-foreground hover:text-destructive"
                      onClick={() => removeFeat(i)}
                      aria-label={`Remove ${feat.name}`}
                      data-testid={`feat-remove-${feat.name}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
                {prereq && (
                  <div className="text-xs text-amber-700 dark:text-amber-400 mt-1">Prerequisite: {prereq}</div>
                )}
                {Array.isArray(feat.effects) && feat.effects.some((e) => effectChipLabel(e, feat)) && (
                  <div className="flex flex-wrap gap-1 mt-1.5" data-testid={`feat-effects-${feat.name}`}>
                    {feat.effects.map((e, j) => {
                      const label = effectChipLabel(e, feat);
                      if (!label) return null;
                      return (
                        <Badge key={j} variant="outline" className="text-[10px] border-emerald-400/50 text-emerald-700 dark:text-emerald-400">
                          {label}
                        </Badge>
                      );
                    })}
                  </div>
                )}
                {feat.description && (
                  <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed">{feat.description}</p>
                )}
                {/* Dual Wielder (both editions) lets you "draw or stow two" weapons — link the rule. */}
                {/draw or stow/i.test(feat.description || '') && (
                  <Link
                    to={`/campaigns/${campaignId}/encyclopedia/mechanics/object-interaction`}
                    className="mt-1 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                    data-testid={`feat-object-interaction-link-${feat.name}`}
                  >
                    How drawing &amp; stowing weapons works <ArrowUpRight className="w-3 h-3" />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}

      {canManage && (
        adding ? (
          <div className="space-y-2">
            <FeatPicker feats={addable} value={null} onChange={addFeat} testIdPrefix="add-feat" />
            <Button variant="ghost" size="sm" onClick={() => setAdding(false)}>Cancel</Button>
          </div>
        ) : (
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setAdding(true)} data-testid="feats-add-btn">
            <Plus className="h-4 w-4" /> Add Feat
          </Button>
        )
      )}
    </div>
  );
}
