import { useState, useEffect, useMemo } from 'react';
import { Award, RefreshCw, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import FeatPicker from './FeatPicker';
import featService from '../../encyclopedia/featService';
import { getFeatResources } from './featEffects';
import { RestResourceControl } from './classSheet/RestResourceTracker';

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

  // Rest-rechargeable resource pools from feats (Lucky, Martial Adept). The expended count
  // lives in character_data as `${key}_used`; RestResourceControl persists it via onChange.
  const featResources = getFeatResources(resolved, { pb });
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
    onChange?.({ feats: [...feats, { id: feat.id, name: feat.name }] });
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
                <RestResourceControl row={row} onChange={onChange} readOnly={readOnly} idPrefix={`feat-${r.key}`} />
              </div>
            );
          })}
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
