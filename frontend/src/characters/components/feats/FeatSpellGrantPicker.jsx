import React, { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import encyclopediaService from '@/encyclopedia/encyclopediaService';
import { useCampaign } from '@/campaigns/CampaignContext';
import { cn } from '@/lib/utils';

// Spellcasting ability conferred when a spell-grant feat derives it from the chosen class
// (Magic Initiate 5e: ability === 'class').
export const CLASS_SPELL_ABILITY = {
  Bard: 'charisma', Cleric: 'wisdom', Druid: 'wisdom',
  Sorcerer: 'charisma', Warlock: 'charisma', Wizard: 'intelligence',
};
// Classes whose spell lists a 2024 spell-group (Arcane/Divine/Primal) draws from.
export const GROUP_CLASSES = {
  Arcane: ['Bard', 'Sorcerer', 'Warlock', 'Wizard'],
  Divine: ['Cleric', 'Paladin'],
  Primal: ['Druid', 'Ranger'],
};
const CLASS_OPTIONS = ['Bard', 'Cleric', 'Druid', 'Sorcerer', 'Warlock', 'Wizard'];
const GROUP_OPTIONS = ['Arcane', 'Divine', 'Primal'];
const ABILITY_OPTIONS = [['intelligence', 'Intelligence'], ['wisdom', 'Wisdom'], ['charisma', 'Charisma']];

/** Classes the chosen source resolves to (a single class, or a group's class list). */
function sourceClassesOf(spec, source) {
  if (!source) return [];
  return spec.source_kind === 'group' ? (GROUP_CLASSES[source] || []) : [source];
}

// True when the feat asks the player to pick spells from a CLASS/GROUP list (cantrips, or a
// leveled slot without its own `school` filter) — which requires choosing a source list. A
// pure-`fixed` grant (Telekinetic/Telepathic) or a purely school-filtered grant (Fey/Shadow
// Touched) needs no source list.
function specNeedsList(spec) {
  return (spec?.cantrips || 0) > 0 || (spec?.leveled || []).some((slot) => !slot.school);
}

/**
 * True when every part of a spell_grant spec has been satisfied: a source list (only when the
 * feat draws cantrips/leveled spells from one), a spellcasting ability (when the feat lets the
 * player pick one), and the exact required cantrip/leveled counts. A pure-fixed grant is always
 * complete (nothing to choose). Used by the LevelUpWizard + Variant Human creation to gate Next.
 */
export function spellGrantComplete(spec, value) {
  if (!spec) return true;
  if (specNeedsList(spec) && !value?.source) return false;
  if (spec.ability === 'choice' && !value?.ability) return false;
  if ((value?.cantrips?.length || 0) !== (spec.cantrips || 0)) return false;
  for (const slot of spec.leveled || []) {
    const got = (value?.leveled || []).filter((s) => s.level === slot.level).length;
    if (got !== slot.count) return false;
  }
  return true;
}

/**
 * The final spell_grant snapshot stored on the feat instance — the player's picks plus the
 * always-granted `fixed` spells and the resolved 1/long-rest free casts. Pass through this at
 * acquisition (even when the player didn't interact, e.g. a pure-fixed feat).
 *   free_cast 'long_rest' → EVERY leveled granted spell (fixed level≥1 + chosen leveled) is a
 *   1/long-rest free cast (Magic Initiate's 1 chosen, Telepathic's fixed Detect Thoughts, Fey
 *   Touched's Misty Step + chosen). Cantrips are at-will, never free casts.
 */
export function resolveSpellGrantValue(spec, value) {
  if (!spec) return value;
  const v = value || {};
  const leveled = v.leveled || [];
  const fixed = spec.fixed || [];
  // Ritual Caster: the chosen leveled spells become a growable, editable `ritual_book` of names
  // (cast as rituals only — no free cast). Other grants keep the structured leveled/fixed/free_casts.
  if ((spec.leveled || []).some((s) => s.ritual)) {
    return { source: v.source || '', ability: v.ability || '', ritual: true, ritual_book: leveled.map((s) => s.name) };
  }
  const free_casts = spec.free_cast
    ? [
        ...fixed.filter((s) => (s.level ?? 0) >= 1).map((s) => s.name),
        ...leveled.map((s) => s.name),
      ]
    : [];
  return {
    source: v.source || '', ability: v.ability || '',
    cantrips: v.cantrips || [], leveled, fixed, free_casts,
  };
}

/**
 * Picker for a feat that grants spells (Magic Initiate, Fey/Shadow Touched, Telekinetic, …).
 * The player chooses a spell list (a class, a 2024 Arcane/Divine/Primal group, or — for a
 * school-filtered slot — picks from any spell of that school), a spellcasting ability when the
 * feat allows it, and the required cantrips + leveled spell(s); always-granted `fixed` spells
 * show read-only. The raw selection is reported as `{ source, ability, cantrips, leveled }`;
 * `resolveSpellGrantValue` turns it into the `choices.spell_grant` snapshot (adding `fixed` +
 * the `free_casts` list) at acquisition. Changing the source resets the spell picks.
 */
// Module scope on purpose: declaring this inside the picker made it a new component type
// each render, remounting the grid. See src/test/noNestedComponents.test.js.
function SlotGrid({ spells, isSelected, atLimit, onToggle, idFor }) {
  return (
  <div className="max-h-44 overflow-y-auto pr-1 grid grid-cols-2 gap-1.5">
    {spells.map((s) => {
      const sel = isSelected(s.name);
      const disabled = atLimit && !sel;
      return (
        <button
          key={s.id ?? s.name}
          type="button"
          disabled={disabled}
          onClick={() => onToggle(s.name)}
          data-testid={idFor(s.name)}
          className={cn(
            'rounded-md border px-2 py-1.5 text-xs text-left transition-colors',
            sel ? 'border-primary bg-primary/5 font-medium' : 'border-border hover:border-primary/50',
            disabled && 'opacity-40 cursor-not-allowed',
          )}
        >
          {s.name}
        </button>
      );
    })}
  </div>
  );
}

export default function FeatSpellGrantPicker({ spec, value = null, onChange, campaignId, testIdPrefix = 'feat-spell' }) {
  const edition = useCampaign()?.campaign?.edition;
  const [allSpells, setAllSpells] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    encyclopediaService.getSpells(campaignId, edition).then((spells) => {
      if (active) { setAllSpells(Array.isArray(spells) ? spells : []); setLoading(false); }
    });
    return () => { active = false; };
  }, [campaignId, edition]);

  const v = value || { source: '', ability: '', cantrips: [], leveled: [] };
  const classes = useMemo(() => sourceClassesOf(spec, v.source).map((c) => c.toLowerCase()), [spec, v.source]);

  // Spells of `level`, filtered by `school` (a school-filtered slot) or by the chosen class
  // list (cantrips + class/group leveled slots), and by `ritual` (Ritual Caster) — alphabetized.
  const spellsForFilter = (level, { school, ritual } = {}) => allSpells
    .filter((s) => {
      if (s.level !== level) return false;
      if (ritual && !s.ritual) return false;
      if (school) return school.some((sc) => (s.school || '').toLowerCase() === sc.toLowerCase());
      if (!s.classes) return false;
      const names = s.classes.split(',').map((n) => n.trim().toLowerCase());
      return names.some((n) => classes.includes(n));
    })
    .filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name));

  const emit = (patch) => onChange({ ...v, ...patch });

  const setSource = (source) => onChange({
    source,
    ability: spec.ability === 'class' ? (CLASS_SPELL_ABILITY[source] || '') : v.ability,
    cantrips: [], leveled: [], // changing the list invalidates picks (free casts are derived at storage)
  });

  const toggleCantrip = (name) => {
    const has = v.cantrips.includes(name);
    if (!has && v.cantrips.length >= spec.cantrips) return; // at limit
    emit({ cantrips: has ? v.cantrips.filter((n) => n !== name) : [...v.cantrips, name] });
  };

  const toggleLeveled = (name, level, max) => {
    const has = v.leveled.some((s) => s.name === name);
    if (has) { emit({ leveled: v.leveled.filter((s) => s.name !== name) }); return; }
    if (v.leveled.filter((s) => s.level === level).length >= max) return; // at limit for this level
    emit({ leveled: [...v.leveled, { name, level }] });
  };


  return (
    <div className="space-y-3 rounded-md border bg-muted/30 p-3" data-testid={`${testIdPrefix}-picker`}>
      <div className="text-sm font-medium">{spec.label || 'Spell Grant'}</div>

      {/* Always-granted spells (no choice) */}
      {(spec.fixed || []).length > 0 && (
        <div className="space-y-1" data-testid={`${testIdPrefix}-fixed`}>
          <label className="text-xs text-muted-foreground">Always granted</label>
          <div className="flex flex-wrap gap-1.5">
            {spec.fixed.map((s) => (
              <span key={s.name} className="rounded-md border bg-background px-2 py-1 text-xs">
                {s.name}{spec.free_cast && (s.level ?? 0) >= 1 ? ' · 1/long rest' : ''}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Source list (class or Arcane/Divine/Primal group) — only when picking from a list */}
      {specNeedsList(spec) && (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">
            {spec.source_kind === 'group' ? 'Spell list' : 'Class list'}
          </label>
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={v.source || '__none__'}
            onChange={(e) => setSource(e.target.value === '__none__' ? '' : e.target.value)}
            data-testid={`${testIdPrefix}-source`}
          >
            <option value="__none__">Choose a {spec.source_kind === 'group' ? 'list' : 'class'}…</option>
            {(spec.source_kind === 'group' ? GROUP_OPTIONS : CLASS_OPTIONS).map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>
        </div>
      )}

      {/* Spellcasting ability — chosen for groups, derived for a class */}
      {spec.ability === 'choice' ? (
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground">Spellcasting ability</label>
          <select
            className="w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={v.ability || '__none__'}
            onChange={(e) => emit({ ability: e.target.value === '__none__' ? '' : e.target.value })}
            data-testid={`${testIdPrefix}-ability`}
          >
            <option value="__none__">Choose an ability…</option>
            {ABILITY_OPTIONS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
        </div>
      ) : v.source ? (
        <p className="text-xs text-muted-foreground" data-testid={`${testIdPrefix}-ability-derived`}>
          Spellcasting ability: <span className="font-medium capitalize">{v.ability || '—'}</span>
        </p>
      ) : null}

      {(v.source || (spec.leveled || []).some((s) => s.school)) && (
        <>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Search spells…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>

          {loading ? (
            <div className="text-xs text-muted-foreground italic py-4 text-center">Loading spells…</div>
          ) : (
            <>
              {/* Cantrips come from the chosen class/group list */}
              {spec.cantrips > 0 && v.source && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Cantrips</span>
                    <span className={cn('text-xs', v.cantrips.length === spec.cantrips ? 'text-muted-foreground' : 'text-amber-600')}>
                      {v.cantrips.length}/{spec.cantrips}
                    </span>
                  </div>
                  <SlotGrid
                    spells={spellsForFilter(0)}
                    isSelected={(n) => v.cantrips.includes(n)}
                    atLimit={v.cantrips.length >= spec.cantrips}
                    onToggle={toggleCantrip}
                    idFor={(n) => `${testIdPrefix}-cantrip-${n}`}
                  />
                </div>
              )}

              {/* Leveled slots: school-filtered slots render independent of a class list */}
              {(spec.leveled || []).map((slot) => {
                if (!slot.school && !v.source) return null; // class-list slot needs a source first
                const chosenAtLevel = v.leveled.filter((s) => s.level === slot.level).length;
                return (
                  <div key={slot.level} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Level {slot.level} {slot.ritual ? 'Ritual' : 'Spell'}{slot.count > 1 ? 's' : ''}
                        {slot.school && <span className="ml-1 normal-case font-normal">({slot.school.join(' or ')})</span>}
                      </span>
                      <span className={cn('text-xs', chosenAtLevel === slot.count ? 'text-muted-foreground' : 'text-amber-600')}>
                        {chosenAtLevel}/{slot.count}
                      </span>
                    </div>
                    <SlotGrid
                      spells={spellsForFilter(slot.level, { school: slot.school, ritual: slot.ritual })}
                      isSelected={(n) => v.leveled.some((s) => s.name === n)}
                      atLimit={chosenAtLevel >= slot.count}
                      onToggle={(n) => toggleLeveled(n, slot.level, slot.count)}
                      idFor={(n) => `${testIdPrefix}-leveled-${slot.level}-${n}`}
                    />
                  </div>
                );
              })}
            </>
          )}
        </>
      )}
    </div>
  );
}
