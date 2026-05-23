import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { StandardSpreadAssignment, PointBuyAssignment, DiceRollAssignment } from '../components/AbilityScoreAssignment';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import MainLayout from '../../shared/components/layout/MainLayout';
import characterService from '../characterService';
import { useCampaign } from '../../campaigns/CampaignContext';
import {
  BarbarianSheet, BardSheet, ClericSheet, DruidSheet,
  FighterSheet, MonkSheet, PaladinSheet, RangerSheet,
  RogueSheet, SorcererSheet, WarlockSheet, WizardSheet,
  SUPPORTED_CLASSES_5E, CLASS_DESCRIPTIONS, CLASS_HIT_DICE,
} from '../components';
import { HIT_DICE_5E } from '../components/classFeatures5e';
import {
  BarbarianSheet as BarbarianSheet2024,
  BardSheet as BardSheet2024,
  ClericSheet as ClericSheet2024,
  DruidSheet as DruidSheet2024,
  FighterSheet as FighterSheet2024,
  MonkSheet as MonkSheet2024,
  PaladinSheet as PaladinSheet2024,
  RangerSheet as RangerSheet2024,
  RogueSheet as RogueSheet2024,
  SorcererSheet as SorcererSheet2024,
  WarlockSheet as WarlockSheet2024,
  WizardSheet as WizardSheet2024,
  SUPPORTED_CLASSES_2024, CLASS_DESCRIPTIONS_2024, CLASS_HIT_DICE_2024,
} from '../components/5e2024';
import { HIT_DICE_2024 } from '../components/classFeatures2024';
import { cn } from '@/lib/utils';

const ALIGNMENTS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil',
];

// Standard D&D 5e backgrounds (PHB)
const BACKGROUNDS_5E = [
  { name: 'Acolyte',       skills: ['Insight', 'Religion'],             tools: null,                                          feature: 'Shelter of the Faithful' },
  { name: 'Charlatan',     skills: ['Deception', 'Sleight of Hand'],    tools: 'Disguise kit, forgery kit',                   feature: 'False Identity' },
  { name: 'Criminal',      skills: ['Deception', 'Stealth'],            tools: "Thieves' tools, one gaming set",              feature: 'Criminal Contact' },
  { name: 'Entertainer',   skills: ['Acrobatics', 'Performance'],       tools: 'Disguise kit, one musical instrument',        feature: 'By Popular Demand' },
  { name: 'Folk Hero',     skills: ['Animal Handling', 'Survival'],     tools: "One type of artisan's tools, vehicles (land)", feature: 'Rustic Hospitality' },
  { name: 'Guild Artisan', skills: ['Insight', 'Persuasion'],           tools: "One type of artisan's tools",                 feature: 'Guild Membership' },
  { name: 'Hermit',        skills: ['Medicine', 'Religion'],            tools: 'Herbalism kit',                               feature: 'Discovery' },
  { name: 'Noble',         skills: ['History', 'Persuasion'],           tools: 'One gaming set',                              feature: 'Position of Privilege' },
  { name: 'Outlander',     skills: ['Athletics', 'Survival'],           tools: 'One musical instrument',                      feature: 'Wanderer' },
  { name: 'Sage',          skills: ['Arcana', 'History'],               tools: null,                                          feature: 'Researcher' },
  { name: 'Sailor',        skills: ['Athletics', 'Perception'],         tools: "Navigator's tools, vehicles (water)",         feature: "Ship's Passage" },
  { name: 'Soldier',       skills: ['Athletics', 'Intimidation'],       tools: 'One gaming set, vehicles (land)',             feature: 'Military Rank' },
  { name: 'Urchin',        skills: ['Sleight of Hand', 'Stealth'],      tools: "Thieves' tools, disguise kit",                feature: 'City Secrets' },
];

// Class proficiencies for all 12 classes (5e 2014 rules)
const CLASS_PROFICIENCIES_5E = {
  Barbarian: {
    armor: 'Light armor, medium armor, shields',
    weapons: 'Simple weapons, martial weapons',
    tools: null,
    saving_throws: ['Strength', 'Constitution'],
  },
  Bard: {
    armor: 'Light armor',
    weapons: 'Simple weapons, hand crossbows, longswords, rapiers, shortswords',
    tools: 'Three musical instruments of your choice',
    saving_throws: ['Dexterity', 'Charisma'],
  },
  Cleric: {
    armor: 'Light armor, medium armor, shields',
    weapons: 'Simple weapons',
    tools: null,
    saving_throws: ['Wisdom', 'Charisma'],
  },
  Druid: {
    armor: 'Light armor, medium armor, shields (druids will not wear metal armor)',
    weapons: 'Clubs, daggers, darts, javelins, maces, quarterstaffs, scimitars, sickles, slings, spears',
    tools: 'Herbalism kit',
    saving_throws: ['Intelligence', 'Wisdom'],
  },
  Fighter: {
    armor: 'All armor, shields',
    weapons: 'Simple weapons, martial weapons',
    tools: null,
    saving_throws: ['Strength', 'Constitution'],
  },
  Monk: {
    armor: 'None',
    weapons: 'Simple weapons, shortswords',
    tools: "One type of artisan's tools or one musical instrument",
    saving_throws: ['Strength', 'Dexterity'],
  },
  Paladin: {
    armor: 'All armor, shields',
    weapons: 'Simple weapons, martial weapons',
    tools: null,
    saving_throws: ['Wisdom', 'Charisma'],
  },
  Ranger: {
    armor: 'Light armor, medium armor, shields',
    weapons: 'Simple weapons, martial weapons',
    tools: null,
    saving_throws: ['Strength', 'Dexterity'],
  },
  Rogue: {
    armor: 'Light armor',
    weapons: "Simple weapons, hand crossbows, longswords, rapiers, shortswords",
    tools: "Thieves' tools",
    saving_throws: ['Dexterity', 'Intelligence'],
  },
  Sorcerer: {
    armor: 'None',
    weapons: 'Daggers, darts, slings, quarterstaffs, light crossbows',
    tools: null,
    saving_throws: ['Constitution', 'Charisma'],
  },
  Warlock: {
    armor: 'Light armor',
    weapons: 'Simple weapons',
    tools: null,
    saving_throws: ['Wisdom', 'Charisma'],
  },
  Wizard: {
    armor: 'None',
    weapons: 'Daggers, darts, slings, quarterstaffs, light crossbows',
    tools: null,
    saving_throws: ['Intelligence', 'Wisdom'],
  },
};

const CLASS_COLORS = {
  Barbarian: 'border-orange-500 bg-orange-50 dark:bg-orange-950/30 hover:border-orange-600',
  Bard:      'border-pink-500 bg-pink-50 dark:bg-pink-950/30 hover:border-pink-600',
  Cleric:    'border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30 hover:border-yellow-600',
  Druid:     'border-green-500 bg-green-50 dark:bg-green-950/30 hover:border-green-600',
  Fighter:   'border-red-500 bg-red-50 dark:bg-red-950/30 hover:border-red-600',
  Monk:      'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/30 hover:border-cyan-600',
  Paladin:   'border-amber-500 bg-amber-50 dark:bg-amber-950/30 hover:border-amber-600',
  Ranger:    'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 hover:border-emerald-600',
  Rogue:     'border-purple-500 bg-purple-50 dark:bg-purple-950/30 hover:border-purple-600',
  Sorcerer:  'border-rose-500 bg-rose-50 dark:bg-rose-950/30 hover:border-rose-600',
  Warlock:   'border-violet-500 bg-violet-50 dark:bg-violet-950/30 hover:border-violet-600',
  Wizard:    'border-blue-500 bg-blue-50 dark:bg-blue-950/30 hover:border-blue-600',
};

const CLASS_ACCENT = {
  Barbarian: 'text-orange-700 dark:text-orange-400',
  Bard:      'text-pink-700 dark:text-pink-400',
  Cleric:    'text-yellow-700 dark:text-yellow-400',
  Druid:     'text-green-700 dark:text-green-400',
  Fighter:   'text-red-700 dark:text-red-400',
  Monk:      'text-cyan-700 dark:text-cyan-400',
  Paladin:   'text-amber-700 dark:text-amber-400',
  Ranger:    'text-emerald-700 dark:text-emerald-400',
  Rogue:     'text-purple-700 dark:text-purple-400',
  Sorcerer:  'text-rose-700 dark:text-rose-400',
  Warlock:   'text-violet-700 dark:text-violet-400',
  Wizard:    'text-blue-700 dark:text-blue-400',
};

function AbilityScoreSection({ method, allowRerollOnes, scores, onChange }) {
  if (method === 'point_buy') {
    return <PointBuyAssignment scores={scores} onChange={onChange} />;
  }
  if (method === 'roll') {
    return <DiceRollAssignment scores={scores} onChange={onChange} allowRerollOnes={allowRerollOnes} />;
  }
  return <StandardSpreadAssignment scores={scores} onChange={onChange} />;
}

function ProficienciesCard({ cls }) {
  const profs = CLASS_PROFICIENCIES_5E[cls];
  if (!profs) return null;
  return (
    <section className="rounded-lg border bg-card p-4 space-y-3">
      <h2 className="font-semibold">Proficiencies</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div className="space-y-0.5">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Armor</div>
          <div>{profs.armor === 'None' ? <span className="text-muted-foreground italic">None</span> : profs.armor}</div>
        </div>
        <div className="space-y-0.5">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Weapons</div>
          <div>{profs.weapons}</div>
        </div>
        <div className="space-y-0.5">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tools</div>
          <div>{profs.tools ?? <span className="text-muted-foreground italic">None</span>}</div>
        </div>
        <div className="space-y-0.5">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Saving Throws</div>
          <div className="flex gap-1.5 flex-wrap">
            {profs.saving_throws.map(s => (
              <Badge key={s} variant="secondary">{s}</Badge>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function CharacterCreate() {
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const { campaign } = useCampaign();

  const [step, setStep] = useState('class'); // 'class' | 'details'
  const [selectedClass, setSelectedClass] = useState('');

  const initialForm = (abilityScoreMethod) => {
    const base = abilityScoreMethod === 'point_buy' ? 8 : 10;
    return {
      name: '', race: '', background: '', alignment: '',
      strength: base, dexterity: base, constitution: base,
      intelligence: base, wisdom: base, charisma: base,
      notes: '',
    };
  };

  const [form, setForm] = useState(() => initialForm(campaign?.ability_score_method));

  useEffect(() => {
    if ((campaign?.ability_score_method ?? 'standard_spread') === 'point_buy') {
      setForm(f => ({
        ...f,
        strength: 8, dexterity: 8, constitution: 8,
        intelligence: 8, wisdom: 8, charisma: 8,
      }));
    }
  }, [campaign?.ability_score_method]);

  const [classData, setClassData] = useState({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleClassDataChange = (patch) => {
    setClassData(prev => ({ ...prev, ...patch }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('Name is required.'); return; }
    setSaving(true);
    setError('');

    const HIT_DICE = is2024 ? HIT_DICE_2024 : HIT_DICE_5E;
    const hitDie = HIT_DICE[selectedClass] ?? 8;
    const conMod = Math.floor((form.constitution - 10) / 2);
    const hp_max = hitDie + Math.max(0, conMod);

    const result = await characterService.createCharacter({
      ...form,
      level: 1,
      char_class: selectedClass,
      campaign_id: parseInt(campaignId),
      character_data: { ...classData, hp_max },
    });

    if (result.success) {
      navigate(`/campaigns/${campaignId}/characters/${result.data.id}`);
    } else {
      setError(result.error);
      setSaving(false);
    }
  };

  const edition = campaign?.edition || '5e';
  const is2024 = edition === '5.5e';

  const CLASSES = is2024 ? SUPPORTED_CLASSES_2024 : SUPPORTED_CLASSES_5E;
  const DESCRIPTIONS = is2024 ? CLASS_DESCRIPTIONS_2024 : CLASS_DESCRIPTIONS;
  const HIT_DICE = is2024 ? CLASS_HIT_DICE_2024 : CLASS_HIT_DICE;

  const ClassSheet = (is2024 ? {
    Barbarian: BarbarianSheet2024, Bard: BardSheet2024, Cleric: ClericSheet2024, Druid: DruidSheet2024,
    Fighter: FighterSheet2024, Monk: MonkSheet2024, Paladin: PaladinSheet2024, Ranger: RangerSheet2024,
    Rogue: RogueSheet2024, Sorcerer: SorcererSheet2024, Warlock: WarlockSheet2024, Wizard: WizardSheet2024,
  } : {
    Barbarian: BarbarianSheet, Bard: BardSheet, Cleric: ClericSheet, Druid: DruidSheet,
    Fighter: FighterSheet, Monk: MonkSheet, Paladin: PaladinSheet, Ranger: RangerSheet,
    Rogue: RogueSheet, Sorcerer: SorcererSheet, Warlock: WarlockSheet, Wizard: WizardSheet,
  })[selectedClass];

  const selectedBackground = BACKGROUNDS_5E.find(b => b.name === form.background);

  return (
    <MainLayout>
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => step === 'details' ? setStep('class') : navigate(`/campaigns/${campaignId}/characters`)}
            className="p-2 rounded hover:bg-muted"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">
              {step === 'class' ? 'Choose Your Class' : `Create ${selectedClass}`}
            </h1>
            <p className="text-sm text-muted-foreground">
              {step === 'class'
                ? `${campaign?.edition?.toUpperCase() ?? '5E'} · Select a class to continue`
                : 'Fill in your character details'}
            </p>
          </div>
        </div>

        {/* Step: Class picker */}
        {step === 'class' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {CLASSES.map(cls => (
              <button
                key={cls}
                onClick={() => { setSelectedClass(cls); setClassData({}); setForm(initialForm(campaign?.ability_score_method)); setStep('details'); }}
                className={cn(
                  'rounded-lg border-2 p-5 text-left transition-all hover:shadow-md',
                  CLASS_COLORS[cls]
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn('font-extrabold text-xl', CLASS_ACCENT[cls])}>{cls}</span>
                  <span className={cn('text-sm font-semibold', CLASS_ACCENT[cls])}>{HIT_DICE[cls]}</span>
                </div>
                <p className="text-sm text-foreground/70">{DESCRIPTIONS[cls]}</p>
                <div className={cn('mt-3 flex items-center text-sm font-semibold', CLASS_ACCENT[cls])}>
                  Select <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step: Character details */}
        {step === 'details' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="rounded-md bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 text-sm">
                {error}
              </div>
            )}

            {/* Core identity */}
            <section className="rounded-lg border bg-card p-4 space-y-4">
              <h2 className="font-semibold">Identity</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <Label>Character Name <span className="text-destructive">*</span></Label>
                  <Input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Enter a name…"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Race / Species</Label>
                  <Input
                    value={form.race}
                    onChange={e => setForm(f => ({ ...f, race: e.target.value }))}
                    placeholder="e.g. Human, Elf…"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Background</Label>
                  <select
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                    value={form.background}
                    onChange={e => setForm(f => ({ ...f, background: e.target.value }))}
                    data-testid="background-select"
                  >
                    <option value="">Select background…</option>
                    {BACKGROUNDS_5E.map(bg => (
                      <option key={bg.name} value={bg.name}>{bg.name}</option>
                    ))}
                  </select>
                  {selectedBackground && (
                    <div className="rounded-md bg-muted/50 px-3 py-2 text-xs space-y-1 mt-1">
                      <div>
                        <span className="font-medium">Skill Proficiencies:</span>
                        {' '}{selectedBackground.skills.join(', ')}
                      </div>
                      {selectedBackground.tools && (
                        <div>
                          <span className="font-medium">Tool Proficiencies:</span>
                          {' '}{selectedBackground.tools}
                        </div>
                      )}
                      <div>
                        <span className="font-medium">Feature:</span>
                        {' '}{selectedBackground.feature}
                      </div>
                    </div>
                  )}
                </div>
                {campaign?.use_alignment !== false && (
                  <div className="space-y-1">
                    <Label>Alignment</Label>
                    <select
                      className="w-full rounded-md border bg-background px-3 py-2 text-sm"
                      value={form.alignment}
                      onChange={e => setForm(f => ({ ...f, alignment: e.target.value }))}
                    >
                      <option value="">Select alignment…</option>
                      {ALIGNMENTS.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                )}
              </div>
            </section>

            {/* Class proficiencies */}
            <ProficienciesCard cls={selectedClass} />

            {/* Ability scores */}
            <section className="rounded-lg border bg-card p-4 space-y-4">
              <h2 className="font-semibold">Ability Scores</h2>
              <AbilityScoreSection
                method={campaign?.ability_score_method ?? 'standard_spread'}
                allowRerollOnes={campaign?.allow_reroll_ones ?? false}
                scores={{
                  strength: form.strength,
                  dexterity: form.dexterity,
                  constitution: form.constitution,
                  intelligence: form.intelligence,
                  wisdom: form.wisdom,
                  charisma: form.charisma,
                }}
                onChange={updated => setForm(f => ({ ...f, ...updated }))}
              />
            </section>

            {/* Class-specific section */}
            {ClassSheet && (
              <section className="rounded-lg border bg-card p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold">{selectedClass} Features</h2>
                  {(() => {
                    const numericHitDice = is2024 ? HIT_DICE_2024 : HIT_DICE_5E;
                    const hitDieVal = numericHitDice[selectedClass] ?? 8;
                    const conMod = Math.floor((form.constitution - 10) / 2);
                    const startingHp = hitDieVal + Math.max(0, conMod);
                    const formula = conMod > 0 ? `d${hitDieVal} + ${conMod} CON` : `d${hitDieVal}`;
                    return (
                      <div className="text-sm text-muted-foreground">
                        Starting HP:{' '}
                        <span className="font-bold text-foreground">{startingHp}</span>
                        <span className="ml-1 text-xs">({formula})</span>
                      </div>
                    );
                  })()}
                </div>
                <ClassSheet
                  data={classData}
                  onChange={handleClassDataChange}
                  readOnly={false}
                  level={1}
                  creation={true}
                  scores={form}
                  backgroundSkills={selectedBackground?.skills ?? []}
                />
              </section>
            )}

            {/* Notes */}
            <section className="rounded-lg border bg-card p-4 space-y-3">
              <h2 className="font-semibold">Personal Notes</h2>
              <Textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Personal notes…"
                rows={4}
              />
            </section>

            {/* Actions */}
            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/campaigns/${campaignId}/characters`)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? 'Creating…' : 'Create Character'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </MainLayout>
  );
}
