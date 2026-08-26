import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Swords, Zap, Repeat, ShieldAlert, Sparkles, ArrowUpRight, ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import FeatureNote from '@/characters/components/shared/FeatureNote';
import { isEffectActive, toggleEffectPatch } from '@/characters/components/effects/activeEffects';
import encyclopediaService from '@/encyclopedia/encyclopediaService';
import { CLASS_PROFICIENCIES_5E } from '@/characters/components/classData/classProficienciesData';
import { getRaceGrantedWeapons, getRaceGrantedArmor } from '@/characters/components/race/raceProficienciesData';
import { getRacialRestResources } from '@/characters/components/race/racialRestResources';
import { getAttacks, creatureSize, formatSigned, nonProficientEquippedArmor } from '@/characters/components/inventory/inventoryData';
import { gatherProficiencies } from '@/characters/components/inventory/inventoryProficiencies';
import { isHexWarrior, hexWeaponUid as storedHexWeaponUid } from '@/characters/components/inventory/weaponBondData';
import WeaponAmmoControl from '@/characters/components/inventory/WeaponAmmoControl';
import MagicAttackBadge from '@/characters/components/inventory/MagicAttackBadge';
import WeaponRangeBadge from '@/characters/components/inventory/WeaponRangeBadge';
import { gatherFightingStyles } from '@/characters/components/combat/fightingStyles';
import {
  buildActionEconomy, castableSpells, combineAttackDamage, TABS, TAB_LABELS, SOURCE_ORDER,
} from '@/characters/components/combat/actionEconomyData';
import { getClassConfig } from '@/characters/components/sheets/classSheet/configs';
import { useRestResource } from '@/characters/components/sheets/classSheet/hooks/useRestResource';
import { RestResourceControl } from '@/characters/components/sheets/classSheet/RestResourceTracker';
import BreakdownValue, { BreakdownPanel } from '@/characters/components/skills/BreakdownValue';

const TAB_ICONS = { no_action: Sparkles, action: Swords, bonus: Zap, 'action+bonus': Repeat, reaction: ShieldAlert };

const EMPTY_NOTES = {
  no_action: 'This character has no features that work outside the normal action economy (e.g. Action Surge).',
  action: 'This character has no actions available.',
  bonus: 'This character has nothing it can do as a bonus action.',
  'action+bonus': 'This character has nothing that combines an action and a bonus action (e.g. Two-Weapon Fighting).',
  reaction: 'This character has no reactions available.',
};

/**
 * An attack number as a clickable chip — tapping it toggles the term-by-term breakdown
 * behind it. Serves BOTH numbers on an attack: the to-hit (ability mod, proficiency,
 * fighting styles) and the damage (weapon die, ability mod, fighting styles, and any
 * feature folding a bonus in, e.g. Great Weapon Master's +10 or Unwavering Mark's half
 * Fighter level). One component rather than two near-identical ones, because the only
 * difference is that a damage breakdown leads with a die: a part whose `value` is a
 * string renders as-is ("1d8 weapon die"), a numeric one renders signed ("+3 STR").
 *
 * Falls back to plain text when there's no breakdown to show.
 */
function AttackNumber({ value, breakdown, testId, breakdownTestId }) {
  const [open, setOpen] = useState(false);
  if (!breakdown || breakdown.length === 0) return <span>{value}</span>;
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="font-medium text-foreground underline decoration-dotted underline-offset-2 hover:text-primary"
        aria-expanded={open}
        title="How this number is calculated"
        data-testid={testId}
      >
        {value}
      </button>
      {open && (
        <span className="ml-1 text-muted-foreground" data-testid={breakdownTestId || `${testId}-breakdown`}>
          ({breakdown
            .map((p) => `${typeof p.value === 'number' ? formatSigned(p.value) : p.value} ${p.label}`)
            .join(', ')})
        </span>
      )}
    </>
  );
}

/**
 * A rider: a separate feature that hangs off another entry because it costs nothing of its own
 * (Arcane Charge on Action Surge, Unwavering Mark on a melee attack). Delegates to the shared
 * `FeatureNote` — the same collapsed-name/expand-on-click widget the Items-tab feature notes
 * use — and only adds the indent rule that keeps a rider from reading as part of the base text.
 */
function RiderLine({ rider }) {
  const slug = rider.source.toLowerCase().replace(/\s+/g, '-');
  return (
    <FeatureNote
      name={rider.source}
      text={rider.text}
      testId={`ae-rider-${slug}`}
      className="mt-1.5 border-l-2 border-border pl-2"
    />
  );
}

/**
 * A limited-use feature that rides on THIS attack, rendered inside the attack's own card:
 * name, one line of rules text, and its own Use control spending its own pool.
 *
 * The control sits inside the block, not at the card's top-right, so the remaining count reads
 * as belonging to the FEATURE rather than to the attack — a "5 / 5 remaining" beside a
 * longsword would say the longsword had five uses. Same reasoning as ArcaneShotBlock.
 *
 * Used by Echo Knight **Unleash Incarnation**. Arcane Shot deliberately keeps its own richer
 * block (a menu of options plus a save DC, neither of which this can express); if a third
 * rich one appears, fold that into this rather than writing a third block.
 */
function AttachedFeatureBlock({ feature, entryKey, resource, onChange, readOnly, isGm }) {
  const slug = String(feature.key || feature.name).toLowerCase().replace(/\s+/g, '-');
  return (
    <div
      className="mt-2 rounded-md border border-dashed bg-muted/20 px-2.5 py-2"
      data-testid={`ae-attached-${slug}-${entryKey}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs font-semibold">{feature.name}</div>
          <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{feature.note}</p>
        </div>
        {resource && (
          <RestResourceControl
            row={resource}
            onChange={onChange}
            readOnly={readOnly}
            isGm={isGm}
            idPrefix={`ae-attached-${slug}`}
          />
        )}
      </div>
    </div>
  );
}

/**
 * Arcane Shot, rendered inside the card of the bow attack it rides on. The header row —
 * cost, save DC, and the Use control spending the shared pool — is always visible, because
 * that is the at-a-glance combat state. The OPTIONS collapse behind a toggle (closed by
 * default, same shape as the ClassSheet features list): an archer knows up to six, each a
 * paragraph, and expanding all of them would bury the attack rows below this card.
 *
 * The save DC is clickable, expanding into its arithmetic through the same BreakdownValue the
 * skills and saving throws use — "18" alone doesn't say whether a new Intelligence score or
 * proficiency bonus has landed yet. Each option's 18th-level upgrade is already written into
 * its description upstream, so nothing here appends a second "…increases to 4d6" clause.
 */
function ArcaneShotBlock({ arcaneShot, entryKey, resource, onChange, readOnly, isGm }) {
  const [open, setOpen] = useState(false);
  const [dcOpen, setDcOpen] = useState(false);
  const options = arcaneShot.options || [];
  return (
    <div
      className="mt-2.5 rounded-md border border-primary/30 bg-primary/5 p-3 space-y-2"
      data-testid={`ae-arcane-shot-${entryKey}`}
    >
      {/* No cost badge: the block sits inside the bow's ACTION card, and Arcane Shot rides on an
          arrow that attack was already firing — a "No Action" tag next to it reads as a second,
          separate thing to spend. The standalone fallback entry (no bow equipped) keeps its badge. */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold">Arcane Shot</span>
        <span className="text-[11px] text-muted-foreground">
          Save DC{' '}
          {arcaneShot.saveDcBreakdown ? (
            <BreakdownValue
              testId={`ae-arcane-shot-dc-${entryKey}`}
              label="the Arcane Shot save DC"
              breakdown={arcaneShot.saveDcBreakdown}
              signed={false}
              expanded={dcOpen}
              onToggle={() => setDcOpen((o) => !o)}
              className="font-semibold text-foreground"
            />
          ) : (
            <span className="font-semibold text-foreground">{arcaneShot.saveDc}</span>
          )}
        </span>
        {resource && (
          <span className="ml-auto">
            <RestResourceControl
              row={resource}
              onChange={onChange}
              readOnly={readOnly}
              isGm={isGm}
              idPrefix={`ae-arcane-${entryKey}`}
            />
          </span>
        )}
      </div>
      {dcOpen && arcaneShot.saveDcBreakdown && (
        <BreakdownPanel
          testId={`ae-arcane-shot-dc-breakdown-${entryKey}`}
          breakdown={arcaneShot.saveDcBreakdown}
          signed={false}
        />
      )}
      {/* Nothing to hide when no option has been picked yet — show the prompt inline. */}
      {arcaneShot.emptyNote ? (
        <p className="text-[11px] text-amber-600 leading-relaxed">{arcaneShot.emptyNote}</p>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            data-testid={`ae-arcane-shot-toggle-${entryKey}`}
            className="w-full flex items-center gap-2 rounded-md border border-primary/20 bg-background/60 px-2 py-1 text-left"
          >
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Options</span>
            <span className="text-[11px] text-muted-foreground">({options.length})</span>
            <span className="flex-1" />
            <ChevronDown className={cn('h-3.5 w-3.5 text-muted-foreground transition-transform', open && 'rotate-180')} />
          </button>
          {open && (
            <>
              <p className="text-[11px] text-muted-foreground leading-relaxed">{arcaneShot.note}</p>
              <ul className="space-y-1.5">
                {options.map((o) => (
                  <li key={o.name} data-testid={`ae-arcane-shot-option-${o.name}`}>
                    <span className="text-[11px] font-medium">{o.name}</span>
                    <span className="text-[11px] text-muted-foreground leading-relaxed"> — {o.description}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}

/**
 * The on/off switch for an ACTIVE EFFECT, rendered inside the card whose action starts it.
 *
 * Activating is one click that does two things — spends a charge and switches the effect on —
 * because they are one event at the table. Ending it is a separate, free click: nothing refunds
 * a use, and nothing tracks the duration (the app models no rounds), so the stated duration is
 * text and the player switches it off when the fiction says so.
 *
 * Declared at module scope, never inside ItemRow, so toggling can't remount the card's subtree.
 */
function ActiveEffectToggle({ effectKey, entryKey, resource, characterData, onChange, readOnly }) {
  const active = isEffectActive(characterData, effectKey);
  const remaining = resource ? resource.remaining : null;
  const canStart = !readOnly && !!onChange && (remaining === null || remaining > 0);
  const start = () => {
    const patch = toggleEffectPatch(characterData, effectKey, true);
    // One patch, so a spent charge and a running effect can never disagree.
    if (resource) patch[resource.key] = (resource.used ?? 0) + 1;
    onChange(patch);
  };
  const end = () => onChange(toggleEffectPatch(characterData, effectKey, false));
  return (
    <div
      className={cn(
        'mt-2 flex flex-wrap items-center gap-2 rounded-md border px-2.5 py-2',
        active ? 'border-primary/60 bg-primary/10' : 'border-border',
      )}
      data-testid={`ae-effect-${effectKey}-${entryKey}`}
    >
      <span className="text-xs font-medium">
        {active ? 'Active now' : 'Not active'}
      </span>
      {resource && (
        <span className="text-[11px] text-muted-foreground" data-testid={`ae-effect-uses-${effectKey}`}>
          {resource.remaining} / {resource.total} uses
        </span>
      )}
      <div className="ml-auto flex items-center gap-1.5">
        {active ? (
          <Button
            type="button" size="sm" variant="outline"
            disabled={readOnly || !onChange}
            onClick={end}
            data-testid={`ae-effect-end-${effectKey}`}
          >
            End
          </Button>
        ) : (
          <Button
            type="button" size="sm"
            disabled={!canStart}
            onClick={start}
            data-testid={`ae-effect-start-${effectKey}`}
          >
            Use
          </Button>
        )}
      </div>
    </div>
  );
}

function ItemRow({ entry, resource, onChange, readOnly, isGm, campaignId, inventory = [], onInventoryChange, resourceByKey = {}, onNavigateToSpell, characterData = {} }) {
  // Power attack (Great Weapon Master on Heavy melee / Sharpshooter on ranged): when a weapon
  // entry carries a `powerAttack` variant, a toggle swaps the displayed to-hit/damage between
  // the normal and −5/+10 numbers. The variant names its own feat, so one control serves both.
  const [powerOn, setPowerOn] = useState(false);
  // A feature-imposed save DC expands into its arithmetic on click (Ferocious Charger).
  const [dcOpen, setDcOpen] = useState(false);
  const view = powerOn && entry.powerAttack ? entry.powerAttack : entry;
  // The conditional extras this attack can add on a hit (Fire Rune, Psionic Strike, an active
  // Giant's Might), totalled against the damage CURRENTLY displayed so the power-attack toggle
  // is reflected rather than ignored. Null when nothing adds damage.
  const damageTotal = combineAttackDamage(view.damage, entry.damageAdditions || []);
  // An attached feature block (Arcane Shot on a bow) owns the resource control itself, inside
  // the block — so the Use button reads as belonging to that feature, not to the attack.
  const attached = entry.arcaneShot ? resource : null;
  const topResource = entry.arcaneShot ? null : resource;
  // A second resource this entry's Use control touches: one it falls back to SPENDING once its
  // own free use is gone (Telekinetic Movement → Psionic Energy dice), or one it hands a use
  // back TO (the Psi Warrior's die regain). Looked up in the same index the attached-feature
  // blocks use, so a card gets live counts for both without extra threading.
  const fallbackResource = entry.fallbackResourceKey ? resourceByKey[entry.fallbackResourceKey] ?? null : null;
  const restoresResource = entry.restoresResourceKey ? resourceByKey[entry.restoresResourceKey] ?? null : null;
  // The live inventory entry behind an Ammunition weapon (the ammo control needs the weapon's
  // stored `ammo_uid`, which only the inventory has).
  const ammoWeapon = entry.needsAmmo && entry.weaponUid
    ? inventory.find((e) => e.uid === entry.weaponUid)
    : null;
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 rounded-md border bg-card px-3',
        // A card carrying an attached feature block needs room to breathe.
        entry.arcaneShot ? 'py-3' : 'py-2'
      )}
      data-testid={topResource ? `ae-resource-${topResource.key}` : undefined}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {/* A spell card links to that spell's own row in the Spells tab — this card answers
              "what does it cost me?", and the next question is always the spell's actual text,
              which lives one tab over. Only the NAME is the link, so the Use control and any
              other card affordance stay separately clickable. Falls back to plain text wherever
              there is nothing to navigate (the encyclopedia's copy of this tab). */}
          {entry.spellRef && onNavigateToSpell ? (
            <button
              type="button"
              onClick={() => onNavigateToSpell(entry.spellRef)}
              className="font-medium text-sm text-left underline decoration-dotted underline-offset-4 hover:text-primary"
              data-testid={`ae-spell-link-${entry.spellRef.name}`}
              title={`Show ${entry.spellRef.name} in the Spells tab`}
            >
              {entry.name}
            </button>
          ) : (
            <span className="font-medium text-sm">{entry.name}</span>
          )}
          <Badge variant="outline" className="text-[10px] uppercase tracking-wide shrink-0">{entry.cost}</Badge>
          {/* This weapon's attacks overcome resistance/immunity to nonmagical damage. The SOURCE
              is named because it's what tells the player when the tag stops applying; clicking
              the tag reveals the rule text. */}
          <MagicAttackBadge magical={entry.magical} testId={`ae-magical-${entry.key}`} campaignId={campaignId} />
        </div>
        {/* Per-weapon attack rows (e.g. Two-Weapon Fighting main hand / off hand). */}
        {entry.subAttacks && entry.subAttacks.length > 0 && (
          <div className="mt-1 space-y-0.5">
            {entry.subAttacks.map((sa) => (
              <div
                // Label alone collides whenever a card has several same-labelled rows —
                // Unwavering Mark emits one 'Attack' row per melee weapon.
                key={`${sa.label}-${sa.name}`}
                className="flex flex-wrap items-baseline gap-x-2 text-xs"
                data-testid={`ae-twf-${sa.label.toLowerCase().replace(/\s+/g, '-')}`}
              >
                <span className="w-16 shrink-0 text-muted-foreground">{sa.label}</span>
                <span className="font-medium">{sa.name}</span>
                <span className="text-muted-foreground">
                  {sa.toHit || sa.damage ? (
                    <>
                      {sa.toHit ? `${sa.toHit} to hit · ` : ''}
                      {/* Damage on a sub-row is clickable too — these are exactly the rows
                          carrying a folded-in bonus (Unwavering Mark's half level, the
                          off-hand's dropped ability modifier), so they're where "where did
                          that number come from?" actually gets asked. */}
                      <AttackNumber
                        value={sa.damage || ''}
                        breakdown={sa.damageBreakdown}
                        testId={`ae-sub-damage-${sa.label.toLowerCase().replace(/\s+/g, '-')}`}
                      />
                      {sa.note ? ` · ${sa.note}` : ''}
                      {sa.warning ? ' · disadvantage' : ''}
                    </>
                  ) : (sa.detail || '')}
                </span>
              </div>
            ))}
          </div>
        )}
        {/* The bonus half of an Action+Bonus combo when it is an ORDINARY weapon attack
            (Telekinetic Master). Rendered as the real attack card rather than a summary row,
            because taking the attack needs everything that card carries — the range band,
            Psionic Strike's Use control, the Sharpshooter toggle, spacing, ammunition. The key
            is prefixed at RENDER time (not in the data) so the nested copy's testids can't
            collide with the same weapon's own card in the Actions tab, while the entry object
            stays a live reference right up to the moment it is drawn. */}
        {entry.bonusEntries?.length > 0 && (
          <div className="mt-1.5 space-y-1.5" data-testid={`ae-combo-bonus-${entry.key}`}>
            <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
              Bonus Action — one weapon attack
            </span>
            {entry.bonusEntries.map((be) => (
              <ItemRow
                key={be.key}
                entry={{ ...be, key: `${entry.key}-bonus-${be.key}` }}
                resource={be.resourceKey ? resourceByKey[be.resourceKey] : null}
                onChange={onChange}
                readOnly={readOnly}
                isGm={isGm}
                campaignId={campaignId}
                inventory={inventory}
                onInventoryChange={onInventoryChange}
                resourceByKey={resourceByKey}
              />
            ))}
          </div>
        )}
        {entry.toHitBreakdown ? (
          <p className="text-xs text-muted-foreground mt-0.5">
            <AttackNumber
              value={view.toHit}
              breakdown={view.toHitBreakdown}
              testId={`ae-tohit-${entry.key}`}
              breakdownTestId={`ae-tohit-breakdown-${entry.key}`}
            />
            {' to hit · '}
            <AttackNumber
              value={view.damage}
              breakdown={view.damageBreakdown}
              testId={`ae-damage-${entry.key}`}
              breakdownTestId={`ae-damage-breakdown-${entry.key}`}
            />
            {view.damageFlags || ''}
          </p>
        ) : (
          entry.detail && <p className="text-xs text-muted-foreground mt-0.5">{entry.detail}</p>
        )}
        {/* Everything this attack can add on a hit, totalled under the printed damage rather
            than folded INTO it: the printed string must stay true for an ordinary swing, and
            every term here is conditional (Fire Rune spends one of a limited number of uses,
            Psionic Strike spends a die, Giant's Might is once per turn). That is the same rule
            that keeps Sneak Attack and Divine Smite as prose. Combined against `view.damage`,
            not the stored damage, so it follows the Great Weapon Master / Sharpshooter toggle
            instead of going stale when that is switched on. Each term names its source — a
            total that grew because an effect is running would otherwise read as a bug in the
            weapon damage. */}
        {damageTotal && (
          <div className="mt-1" data-testid={`ae-damage-total-${entry.key}`}>
            <p className="text-xs font-medium">
              <span className="text-muted-foreground">On a hit: </span>
              <span className="text-foreground">{damageTotal.text}</span>
            </p>
            <p className="text-[10px] text-muted-foreground/80 leading-tight mt-0.5">
              {damageTotal.parts
                .map((p) => (p.source ? `${p.text} (${p.source})` : `${p.text} (weapon)`))
                .join(' · ')}
            </p>
          </div>
        )}
        {/* The distance band, directly under the numbers it qualifies. Separate from the spacing
            note below, which is a different rule about a different distance (an enemy within
            5 ft), so the two are never merged into one line. */}
        {entry.range && (
          <div className="mt-0.5">
            <WeaponRangeBadge range={entry.range} testId={`ae-range-${entry.key}`} />
          </div>
        )}
        {/* A save DC this feature imposes, as a clickable number rather than arithmetic baked
            into the sentence above it — the same treatment the Arcane Shot DC gets. */}
        {entry.saveDc && (
          <p className="text-xs text-muted-foreground mt-1">
            {entry.saveDc.label}{' '}
            <BreakdownValue
              testId={`ae-save-dc-${entry.key}`}
              label={`the ${entry.saveDc.label}`}
              breakdown={entry.saveDc.breakdown}
              signed={false}
              className="font-semibold text-foreground"
              expanded={dcOpen}
              onToggle={() => setDcOpen((o) => !o)}
            />
            {dcOpen && (
              <BreakdownPanel
                testId={`ae-save-dc-breakdown-${entry.key}`}
                breakdown={entry.saveDc.breakdown}
                signed={false}
              />
            )}
          </p>
        )}
        {/* Riders: separate features that hang off this entry (e.g. Arcane Charge on Action
            Surge, Unwavering Mark on a melee attack). Given their own indented line so they
            don't read as part of the base rule, and collapsed to the NAME until clicked — a
            rider is a paragraph of consequences you only need once the trigger fires, and
            several of them expanded at once buries the attack numbers the card exists for. */}
        {entry.riders?.map((rider) => (
          <RiderLine key={rider.source} rider={rider} />
        ))}
        {entry.powerAttack && (
          <button
            type="button"
            onClick={() => setPowerOn((v) => !v)}
            className={cn(
              'mt-1 rounded border px-1.5 py-0.5 text-[11px] font-medium transition-colors',
              powerOn
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:text-foreground'
            )}
            aria-pressed={powerOn}
            data-testid={`ae-power-attack-toggle-${entry.key}`}
          >
            {powerOn
              ? `${entry.powerAttack.source}: on (${entry.powerAttack.offer})`
              : `Use ${entry.powerAttack.source} (${entry.powerAttack.offer})`}
          </button>
        )}
        {entry.warning && (
          <p className="text-[11px] text-amber-600 leading-tight mt-0.5" data-testid={`ae-warning-${entry.key}`}>⚠ {entry.warning}</p>
        )}
        {entry.loadingNote && (
          <p
            className={cn('text-[11px] leading-tight mt-0.5', /ignored/i.test(entry.loadingNote) ? 'text-emerald-600' : 'text-amber-600')}
            data-testid={`ae-loading-${entry.key}`}
          >
            {entry.loadingNote}{' '}
            <Link
              to={`/campaigns/${campaignId}/encyclopedia/mechanics/loading`}
              className="text-primary hover:underline"
              data-testid={`loading-learn-more-${entry.key}`}
            >How the Loading property works</Link>
          </p>
        )}
        {entry.spacingNote && (
          <p
            className={cn('text-[11px] leading-tight mt-0.5', /Crossbow Expert/i.test(entry.spacingNote) ? 'text-emerald-600' : 'text-muted-foreground')}
            data-testid={`ae-spacing-${entry.key}`}
          >
            {entry.spacingNote}{' '}
            <Link
              to={`/campaigns/${campaignId}/encyclopedia/mechanics/spacing`}
              className="text-primary hover:underline"
              data-testid={`spacing-learn-more-${entry.key}`}
            >How spacing works</Link>
          </p>
        )}
        {entry.savageAttacksNote && (
          <p className="text-[11px] text-emerald-600 leading-tight mt-0.5" data-testid={`ae-savage-${entry.key}`}>
            {entry.savageAttacksNote}
          </p>
        )}
        {entry.eldritchStrikeNote && (
          <p className="text-[11px] text-violet-500 leading-tight mt-0.5" data-testid={`ae-eldritch-${entry.key}`}>
            {entry.eldritchStrikeNote}
          </p>
        )}
        {entry.hexNote && (
          <p className="text-[11px] text-violet-500 leading-tight mt-0.5" data-testid={`ae-hex-${entry.key}`}>
            {entry.hexNote}
          </p>
        )}
        {entry.critRange && (
          <p className="text-[11px] text-primary leading-tight font-medium mt-0.5" data-testid={`ae-crit-${entry.key}`}>
            Crit {entry.critRange}{entry.critSource ? ` (${entry.critSource})` : ''}
          </p>
        )}
        {entry.remarkableMoveNote && (
          <p className="text-[11px] text-emerald-600 leading-tight mt-0.5" data-testid={`ae-remarkable-move-${entry.key}`}>
            {entry.remarkableMoveNote}
          </p>
        )}
        {entry.greatWeaponMasterNote && (
          <p className="text-[11px] text-emerald-600 leading-tight mt-0.5" data-testid={`ae-gwm-${entry.key}`}>
            {entry.greatWeaponMasterNote}
          </p>
        )}
        {/* Ammunition: a weapon with the Ammunition property fires from a stack in the
            inventory, so the same control the Items tab uses sits on the attack card —
            spending a round from where you're actually making the attack. */}
        {entry.needsAmmo && ammoWeapon && (
          <WeaponAmmoControl
            weapon={ammoWeapon}
            inventory={inventory}
            onChange={onInventoryChange}
            readOnly={readOnly || !onInventoryChange}
            idPrefix="ae-"
            emptyHint="No matching ammunition — add some in the Items tab."
            className="mt-1.5"
          />
        )}
        {/* Arcane Shot rides on this bow's attack, so it lives in the attack's own card with
            its options spelled out — no cross-referencing a separate entry mid-combat. */}
        {entry.arcaneShot && (
          <ArcaneShotBlock
            arcaneShot={entry.arcaneShot}
            entryKey={entry.key}
            resource={attached}
            onChange={onChange}
            readOnly={readOnly}
            isGm={isGm}
          />
        )}
        {/* Limited-use features that ride on THIS attack (Unleash Incarnation), each with its
            own pool — read off the card you're already looking at mid-attack. */}
        {entry.attachedFeatures?.map((f) => (
          <AttachedFeatureBlock
            key={f.key || f.name}
            feature={f}
            entryKey={entry.key}
            resource={f.resourceKey ? resourceByKey[f.resourceKey] : null}
            onChange={onChange}
            readOnly={readOnly}
            isGm={isGm}
          />
        ))}
        {/* An ACTIVE EFFECT (Giant's Might) — the card is where you switch it on, because
            activating it is the action. Spending a use and switching it on are ONE click: they
            are the same event in the fiction, and a counter that went down without the effect
            coming on would be a trap. Switching it off never refunds the use. */}
        {entry.activeEffect && (
          <ActiveEffectToggle
            effectKey={entry.activeEffect}
            entryKey={entry.key}
            resource={topResource}
            characterData={characterData}
            onChange={onChange}
            readOnly={readOnly}
          />
        )}
      </div>
      {/* Rest-rechargeable features get the same Use button as the Features tab. A card carrying
          an active-effect toggle owns its own spend, so it doesn't also get the standard one. */}
      {topResource && !entry.activeEffect && (
        <RestResourceControl
          row={topResource}
          fallbackRow={fallbackResource}
          restoresRow={restoresResource}
          onChange={onChange}
          readOnly={readOnly}
          isGm={isGm}
          idPrefix="ae-rest"
        />
      )}
    </div>
  );
}

/**
 * Action Economy tab body: shows what THIS character can do, bucketed into Actions /
 * Bonus Actions / Action+Bonus / Reactions sub-tabs. Sources are auto-derived
 * (equipped-weapon attacks, spells classified by casting_time, the universal action
 * menu) plus a curated per-class feature map (see actionEconomyData.js). Button-based
 * sub-tabs (not Radix Tabs) to avoid nested tab contexts.
 */
// Group headings that read better than the bare source key.
const SOURCE_GROUP_LABELS = { Weapon: 'Weapon Attacks', Spell: 'Spells' };

/**
 * A source-group heading ("Weapon Attacks", "Subclass", "General"). Becomes a collapse toggle
 * only when the active tab holds MORE THAN ONE group — with a single group there is nothing to
 * scan past, so a disclosure triangle would be a control that solves no problem. Declared at
 * module scope (never inside a component) so toggling one group can't remount its own subtree.
 */
function GroupHeading({ id, label, count, collapsible, open, onToggle, tone = 'muted' }) {
  const titleClass = cn(
    'text-xs font-semibold uppercase tracking-wide',
    tone === 'primary' ? 'text-primary' : 'text-muted-foreground'
  );
  if (!collapsible) return <h3 className={titleClass}>{label}</h3>;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="flex w-full items-center gap-1.5 text-left"
      data-testid={`ae-group-toggle-${id}`}
    >
      <ChevronDown
        className={cn(
          'h-3.5 w-3.5 shrink-0 transition-transform',
          tone === 'primary' ? 'text-primary' : 'text-muted-foreground',
          !open && '-rotate-90'
        )}
      />
      <h3 className={titleClass}>{label}</h3>
      {/* The count matters most while collapsed — it says how much is hidden behind the heading. */}
      <Badge variant="secondary" className="text-[10px] px-1.5">{count}</Badge>
    </button>
  );
}

export default function ActionEconomyTab({
  charClass, subclass, level = 1, edition = '5e',
  characterData = {}, inventory = [], scores = {}, race, subrace, campaignId,
  onChange, readOnly = false, isGm = false, onNavigateToSpell,
}) {
  const [active, setActive] = useState('action');
  const [spellIndex, setSpellIndex] = useState({});
  const [loading, setLoading] = useState(false);
  // `${tab}:${groupId}` → true when that group has been EXPANDED. Groups default to CLOSED: a
  // tab routinely stacks three groups of several cards each, and opening on a wall of them means
  // scrolling to find out what the tab even holds. Closed, the headings + counts are the index.
  const [expandedGroups, setExpandedGroups] = useState({});

  // The fetch gate must use the SAME source set the cards are built from. Gating on the class
  // lists alone meant a character whose only spells come from a race, subclass or feat (a Psi
  // Warrior with telekinesis) fetched nothing, so the catalog was empty and every one of their
  // spells was silently unclassifiable.
  const spellNames = useMemo(
    () => castableSpells({ characterData, charClass, subclass, level, edition, race, subrace }),
    [characterData, charClass, subclass, level, edition, race, subrace],
  );

  // Fetch the spell catalog only when the character actually knows spells, then index by
  // lowercased name → { casting_time, level, school, concentration, ritual } for classification.
  useEffect(() => {
    if (spellNames.length === 0) { setSpellIndex({}); return; }
    let cancelled = false;
    setLoading(true);
    encyclopediaService.getSpells(campaignId, edition).then((all) => {
      if (cancelled) return;
      const idx = {};
      for (const s of all || []) {
        idx[(s.name || '').toLowerCase()] = {
          casting_time: s.casting_time, level: s.level, school: s.school,
          concentration: s.concentration, ritual: s.ritual,
        };
      }
      setSpellIndex(idx);
      setLoading(false);
    }).catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [campaignId, edition, spellNames.length]);

  const proficiencies = gatherProficiencies({ charClass, subclass, edition, characterData });
  // Class text + race trait grants + gathered grants (feat/subclass weapon riders like
  // Hex Warrior's martial weapons) — same assembly as the Items tab.
  const weaponProfText = [(CLASS_PROFICIENCIES_5E[charClass] || {}).weapons || '', ...proficiencies.weapons.grants].filter(Boolean).join(', ');
  const raceWeapons = [...(getRaceGrantedWeapons(race, subrace) || []), ...proficiencies.weapons.grants];
  const size = creatureSize(characterData, race, { charClass, subclass, level, edition });
  const styles = gatherFightingStyles(characterData);
  // Armor proficiency context (class text + race trait grants + stored race/feat grants) —
  // worn non-proficient armor puts every STR/DEX attack roll at disadvantage and blocks casting.
  const armorProfText = (CLASS_PROFICIENCIES_5E[charClass] || {}).armor || '';
  const raceArmor = [
    ...(getRaceGrantedArmor(race, subrace) || []),
    ...proficiencies.armor.grants,
  ];
  const badArmor = nonProficientEquippedArmor(inventory, { armorProfText, raceArmor });
  // Hexblade's designated Hex Warrior weapon attacks with CHA when it's better.
  const hexUid = isHexWarrior({ charClass, subclass, edition }) ? storedHexWeaponUid(characterData) : null;
  const attacks = getAttacks({ inventory, scores, level, weaponProfText, raceWeapons, size, edition, feats: characterData?.feats, styles, armorProfText, raceArmor, hexWeaponUid: hexUid, charClass, subclass });

  // A loading weapon caps the Attack action to one shot even with Extra Attack (unless a
  // feat lifts it — Crossbow Expert sets loadingNote to "…ignored…"). Surface a caveat on
  // the Extra Attack note when such a weapon is equipped.
  const cappedLoadingWeapon = attacks.find((a) => a.loadingNote && !/ignored/i.test(a.loadingNote));

  const economy = useMemo(
    () => buildActionEconomy({ charClass, subclass, level, edition, characterData, inventory, attacks, scores, spellIndex, armorProfText, raceArmor, race, subrace }),
    [charClass, subclass, level, edition, characterData, inventory, attacks, spellIndex, armorProfText, raceArmor, race, subrace]
  );

  // Rest-rechargeable resources from the class config (Fighter: Second Wind, Action Surge,
  // Indomitable) PLUS the character's RACIAL ones (Dragonborn Breath Weapon), which live in
  // their own table rather than any class config. Indexed by key so an entry's `resourceKey`
  // resolves to a live row with remaining/used counts — the Use button writes `<key>_used`
  // back via onChange, the same key the Stats-tab Racial Features tracker writes.
  const config = getClassConfig(charClass, edition);
  const racialResources = getRacialRestResources(characterData.race_traits ?? [], level)
    .map((r) => ({ key: r.key, label: r.label, total: r.max, recharge: r.recharge, description: r.note }));
  const restRows = useRestResource({
    resources: [...(config?.restResources ?? []), ...racialResources],
    level,
    data: characterData,
    scores, // ability-derived pool sizes (Cavalier's Strength/Constitution-modifier uses)
  });
  const restByKey = {};
  for (const r of restRows) restByKey[r.key] = r;
  const resourceFor = (entry) => (entry.resourceKey ? restByKey[entry.resourceKey] : null) || null;

  // Spending a round of ammunition writes the whole inventory back through the same
  // character_data save path the Items tab uses, so the two tabs stay in sync.
  const handleInventoryChange = (next) => onChange?.({ inventory: next });

  const entries = economy[active] || [];
  // Reactions that do NOT spend your one normal reaction (Cavalier's Vigilant Defender) are
  // pulled out of their source group into a section of their own. Listed beside the others they
  // read as one more thing competing for the single reaction you get, which is the opposite of
  // what they are — the whole point is that they're additional.
  const extraReactions = entries.filter((e) => e.extraReaction);
  const normal = entries.filter((e) => !e.extraReaction);
  const special = normal.filter((e) => e.source !== 'Universal');
  const universal = normal.filter((e) => e.source === 'Universal');

  // Group the character-specific entries by source for headed sections.
  const grouped = SOURCE_ORDER
    .filter((src) => src !== 'Universal')
    .map((src) => [src, special.filter((e) => e.source === src)])
    .filter(([, list]) => list.length > 0);

  // Collapsing is offered only when a tab has more than one group to scan past — the Actions tab
  // routinely stacks Weapon Attacks + Subclass + General, while Reactions is often a single
  // group where a disclosure triangle would be a control that solves no problem.
  const groupCount = grouped.length + (universal.length > 0 ? 1 : 0)
    + (extraReactions.length > 0 ? 1 : 0);
  const collapsible = groupCount > 1;
  // Keyed by TAB as well as group, so collapsing "General" on Actions doesn't also collapse it on
  // Bonus Actions, and a choice survives switching tabs and coming back.
  const groupKey = (id) => `${active}:${id}`;
  // A tab with a single group has no toggle to open it with, so it must always render open —
  // otherwise the sole group would be closed behind a control that isn't there.
  const isOpen = (id) => !collapsible || !!expandedGroups[groupKey(id)];
  const toggleGroup = (id) => setExpandedGroups((c) => ({ ...c, [groupKey(id)]: !c[groupKey(id)] }));

  return (
    <div className="space-y-4" data-testid="action-economy-tab">
      {/* Sub-tab selector. The "Learn more" link shares this row rather than sitting in its own
          right-aligned strip pulled down with a negative margin — with five tabs the strip wrapped
          to a second line and rode up into the link, clipping it (found in QA). Here the tabs wrap
          inside their own flex child and the link is a shrink-0 sibling, so the two can never
          occupy the same space however narrow the viewport gets. */}
      <div className="flex items-start justify-between gap-3 border-b border-border pb-2">
        <div className="flex flex-wrap gap-1">
          {TABS.map((tab) => {
            const Icon = TAB_ICONS[tab];
            const count = (economy[tab] || []).length;
            return (
              <button
                key={tab}
                onClick={() => setActive(tab)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  active === tab ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
                data-testid={`ae-subtab-${tab}`}
              >
                <Icon className="h-4 w-4" />
                {TAB_LABELS[tab]}
                {count > 0 && <Badge variant="secondary" className="text-xs px-1.5">{count}</Badge>}
              </button>
            );
          })}
        </div>
        {/* mt-1.5 matches the buttons' vertical padding so the link's baseline lines up with the
            first row of tabs rather than floating above them. */}
        <Link
          to={`/campaigns/${campaignId}/encyclopedia/mechanics/action-economy`}
          className="mt-1.5 inline-flex shrink-0 items-center gap-1 text-xs text-primary hover:underline"
          data-testid="action-economy-learn-more"
        >
          Learn more <ArrowUpRight className="w-3 h-3" />
        </Link>
      </div>

      {active === 'action' && economy.attacksPerAction > 1 && (
        <p className="text-xs text-muted-foreground" data-testid="ae-attacks-per-action">
          Extra Attack: you make {economy.attacksPerAction} attacks when you take the Attack action.
          {cappedLoadingWeapon && (
            <span className="text-amber-600" data-testid="ae-loading-caveat">
              {' '}A loading weapon ({cappedLoadingWeapon.name}) can still be fired only once per action.
            </span>
          )}
        </p>
      )}

      {loading && <p className="text-sm text-muted-foreground">Loading spells…</p>}

      {entries.length === 0 ? (
        <p className="text-sm italic text-muted-foreground" data-testid="ae-empty">{EMPTY_NOTES[active]}</p>
      ) : (
        <div className="space-y-4">
          {grouped.map(([src, list]) => (
            <div key={src} className="space-y-2">
              <GroupHeading
                id={src}
                label={SOURCE_GROUP_LABELS[src] ?? src}
                count={list.length}
                collapsible={collapsible}
                open={isOpen(src)}
                onToggle={() => toggleGroup(src)}
              />
              {isOpen(src) && (
              <>
              {src === 'Spell' && badArmor && (
                <p className="text-[11px] text-amber-600 leading-tight" data-testid="ae-armor-spells">
                  You can't cast spells while wearing {badArmor.name} — you're not proficient with it.
                </p>
              )}
              {src === 'Spell' && (
                <p className="text-[11px] text-muted-foreground leading-tight" data-testid="ae-spacing-spells">
                  A spell that requires a ranged attack roll (Fire Bolt, Eldritch Blast…) has disadvantage while an enemy is within 5 ft.{' '}
                  <Link
                    to={`/campaigns/${campaignId}/encyclopedia/mechanics/spacing`}
                    className="text-primary hover:underline"
                    data-testid="spacing-learn-more-spells"
                  >How spacing works</Link>
                </p>
              )}
              <div className="space-y-2">
                {list.map((e) => (
                  <ItemRow
                    key={e.key} entry={e} resource={resourceFor(e)} onChange={onChange}
                    readOnly={readOnly} isGm={isGm} campaignId={campaignId}
                    inventory={inventory} onInventoryChange={onChange ? handleInventoryChange : null}
                    resourceByKey={restByKey} onNavigateToSpell={onNavigateToSpell}
                    characterData={characterData}
                  />
                ))}
              </div>
              </>
              )}
            </div>
          ))}

          {universal.length > 0 && (
            <div className="space-y-2" data-testid="ae-universal">
              <GroupHeading
                id="universal"
                label="General — available to everyone"
                count={universal.length}
                collapsible={collapsible}
                open={isOpen('universal')}
                onToggle={() => toggleGroup('universal')}
              />
              {isOpen('universal') && (
                <div className="space-y-2 opacity-80">
                  {universal.map((e) => <ItemRow key={e.key} entry={e} />)}
                </div>
              )}
            </div>
          )}

          {/* Reactions that don't spend your one normal reaction. Given a bordered section of
              their own, last, so the list above reads as "pick ONE of these" and this reads as
              "and also this, on someone else's turn". */}
          {extraReactions.length > 0 && (
            <div
              className="space-y-2 rounded-md border border-primary/30 bg-primary/5 p-3"
              data-testid="ae-extra-reactions"
            >
              <GroupHeading
                id="extra-reactions"
                label="Extra reactions — on other creatures' turns"
                count={extraReactions.length}
                collapsible={collapsible}
                open={isOpen('extra-reactions')}
                onToggle={() => toggleGroup('extra-reactions')}
                tone="primary"
              />
              {isOpen('extra-reactions') && (
                <>
                  <p className="text-[11px] text-muted-foreground leading-tight">
                    These don&apos;t use your one normal reaction, so you can still take one of the
                    reactions above in the same round.
                  </p>
                  <div className="space-y-2">
                    {extraReactions.map((e) => <ItemRow key={e.key} entry={e} />)}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
