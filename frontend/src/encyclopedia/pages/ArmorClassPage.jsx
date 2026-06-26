import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Shield } from 'lucide-react';
import { computeArmorClass } from '../../characters/components/inventoryData';
import { getAcOptions } from '../../characters/components/combatBonuses';

/**
 * Static reference page for Armor Class (Encyclopedia → Mechanics → Armor Class).
 * Flow B: the AC math already lives in inventoryData.computeArmorClass /
 * combatBonuses.getAcOptions and is rendered in the Items-tab InventoryTab. This
 * page documents it and is linked from that AC summary's "Learn more". Worked
 * examples call the real helpers so the numbers can never drift from the sheet.
 */

function Section({ title, children }) {
  return (
    <section className="space-y-2">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-2">{children}</div>
    </section>
  );
}

export default function ArmorClassPage() {
  const { campaignId } = useParams();

  // Worked example 1: a fighter in Chain Mail (heavy, base 16) with a shield.
  const armored = computeArmorClass({
    inventory: [
      { category: 'armor', armor_type: 'heavy', armor_class: 16, name: 'Chain Mail', equipped: true },
      { category: 'armor', armor_type: 'shield', name: 'Shield', equipped: true },
    ],
    scores: { dexterity: 12 },
    charClass: 'Fighter',
  });

  // Worked example 2: an unarmored barbarian, DEX 14 (+2) / CON 16 (+3).
  const barbScores = { dexterity: 14, constitution: 16 };
  const unarmored = computeArmorClass({ inventory: [], scores: barbScores, charClass: 'Barbarian' });
  const barbOption = getAcOptions({ charClass: 'Barbarian', scores: barbScores })[0];

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border shrink-0">
        <Link
          to={`/campaigns/${campaignId}/encyclopedia`}
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1"
          data-testid="armor-class-back"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Encyclopedia
        </Link>
        <h1 className="flex items-center gap-2 text-xl font-bold">
          <Shield className="w-5 h-5 text-sky-600 dark:text-sky-400" />
          Armor Class
        </h1>
        <p className="text-sm text-muted-foreground">
          How hard you are to hit — what builds your AC, and how the sheet calculates it.
        </p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto p-6 space-y-6">
          <Section title="What Armor Class is">
            <p>
              Armor Class (AC) is the number an attacker must <span className="font-medium text-foreground">meet
              or beat</span> on their attack roll (d20 + bonuses) to hit you. A higher AC means more attacks miss.
              Your AC is built from one base formula — usually your armor, or an "unarmored" formula — plus a few
              situational bonuses like a shield.
            </p>
          </Section>

          <Section title="Wearing armor">
            <p>Worn body armor sets your base AC, and how much Dexterity helps depends on its category:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <span className="font-medium text-foreground">Light armor</span> — armor's value + your{' '}
                <span className="font-medium text-foreground">full Dexterity modifier</span> (e.g. Leather 11 + DEX).
              </li>
              <li>
                <span className="font-medium text-foreground">Medium armor</span> — armor's value + Dexterity, but{' '}
                <span className="font-medium text-foreground">capped at +2</span> (e.g. Half Plate 15 + DEX, max +2).
              </li>
              <li>
                <span className="font-medium text-foreground">Heavy armor</span> — a{' '}
                <span className="font-medium text-foreground">flat value</span>; Dexterity doesn't apply at all
                (e.g. Plate is 18). Heavy armor often has a Strength requirement and can give disadvantage on Stealth.
              </li>
              <li>
                <span className="font-medium text-foreground">Shield</span> — a flat{' '}
                <span className="font-medium text-foreground">+2</span> on top of whatever base you're using.
              </li>
            </ul>
            <p>
              On your sheet, equip a piece of body armor (and optionally a shield) on the{' '}
              <span className="font-medium text-foreground">Items</span> tab and the AC summary recomputes
              automatically from its category and your Dexterity.
            </p>
          </Section>

          <Section title="Fighting without armor">
            <p>
              With no body armor worn, your AC falls back to the best formula available to you. The sheet picks
              the highest one for you:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-medium text-foreground">Everyone</span> — 10 + DEX.</li>
              <li><span className="font-medium text-foreground">Barbarian (Unarmored Defense)</span> — 10 + DEX + CON; a shield still adds +2.</li>
              <li><span className="font-medium text-foreground">Monk (Unarmored Defense)</span> — 10 + DEX + WIS, with no armor and no shield.</li>
              <li><span className="font-medium text-foreground">Draconic Sorcerer</span> (Draconic Bloodline / Draconic Sorcery) — 13 + DEX while not wearing armor.</li>
            </ul>
          </Section>

          <Section title="Feats and features that change AC">
            <p>
              A few options the sheet knows about adjust your AC automatically when they apply:
            </p>
            <ul className="list-disc pl-5 space-y-1">
              <li><span className="font-medium text-foreground">Defense fighting style</span> — +1 AC while you're wearing any armor.</li>
              <li><span className="font-medium text-foreground">Dual Wielder</span> — +1 AC while wielding two melee weapons.</li>
              <li><span className="font-medium text-foreground">Medium Armor Master</span> — raises the medium-armor Dexterity cap from +2 to +3.</li>
            </ul>
            <p>
              Temporary effects aren't folded in automatically — spells like <span className="italic">Mage Armor</span>{' '}
              (sets your base to 13 + DEX) or <span className="italic">Shield</span> (+5 until your next turn), and
              situational bonuses like half/three-quarters cover, are things you apply at the table on top of the
              number the sheet shows.
            </p>
          </Section>

          <Section title="Worked examples">
            <p>
              A <span className="font-medium text-foreground">fighter in Chain Mail</span> (heavy, base 16) with a
              shield: heavy armor ignores Dexterity, so it's a flat 16, +2 for the shield ={' '}
              <span className="font-medium text-foreground">AC {armored.value}</span> ({armored.parts.join(', ')}).
            </p>
            <p>
              An <span className="font-medium text-foreground">unarmored barbarian</span> with DEX 14 (+2) and CON
              16 (+3) uses Unarmored Defense — {barbOption.formula} ={' '}
              <span className="font-medium text-foreground">AC {unarmored.value}</span>. Strap a shield on and it
              climbs to {unarmored.value + 2}; the barbarian keeps the shield bonus because Unarmored Defense only
              forbids armor, not shields.
            </p>
          </Section>

          <Section title="At the table">
            <p>
              An orc swings at the chain-mail fighter and rolls a 15 on the d20, +4 to hit, for a 19 — that meets
              the fighter's AC of {armored.value}, so it hits. Next turn the fighter's wizard ally casts{' '}
              <span className="italic">Shield</span> on themselves as a reaction (+5 AC until their next turn),
              turning a would-be hit into a miss. Neither the cover the fighter took nor that Shield spell shows up
              in the sheet's AC box — those are momentary, so you track them in the moment.
            </p>
          </Section>
        </div>
      </div>
    </div>
  );
}
