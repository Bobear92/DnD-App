import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import MainLayout from '../../shared/components/layout/MainLayout';
import characterService from '../characterService';
import { useCampaign } from '../../campaigns/CampaignContext';
import {
  BarbarianSheet, BardSheet, ClericSheet, DruidSheet,
  FighterSheet, MonkSheet, PaladinSheet, RangerSheet,
  RogueSheet, SorcererSheet, WarlockSheet, WizardSheet,
  SUPPORTED_CLASSES_5E, CLASS_DESCRIPTIONS, CLASS_HIT_DICE,
} from '../components';
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
import { cn } from '@/lib/utils';

const ALIGNMENTS = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil',
];

const CLASS_COLORS = {
  Barbarian: 'border-orange-400 bg-orange-50 dark:bg-orange-950/20',
  Bard:      'border-pink-400 bg-pink-50 dark:bg-pink-950/20',
  Cleric:    'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20',
  Druid:     'border-green-400 bg-green-50 dark:bg-green-950/20',
  Fighter:   'border-red-400 bg-red-50 dark:bg-red-950/20',
  Monk:      'border-cyan-400 bg-cyan-50 dark:bg-cyan-950/20',
  Paladin:   'border-amber-400 bg-amber-50 dark:bg-amber-950/20',
  Ranger:    'border-emerald-400 bg-emerald-50 dark:bg-emerald-950/20',
  Rogue:     'border-purple-400 bg-purple-50 dark:bg-purple-950/20',
  Sorcerer:  'border-rose-400 bg-rose-50 dark:bg-rose-950/20',
  Warlock:   'border-violet-400 bg-violet-50 dark:bg-violet-950/20',
  Wizard:    'border-blue-400 bg-blue-50 dark:bg-blue-950/20',
};

function AbilityScoreInput({ label, abbrev, value, onChange }) {
  const mod = Math.floor((value - 10) / 2);
  const modStr = mod >= 0 ? `+${mod}` : `${mod}`;
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs font-medium text-muted-foreground uppercase">{abbrev}</span>
      <Input
        type="number"
        min={1}
        max={30}
        value={value}
        onChange={e => onChange(parseInt(e.target.value) || 10)}
        className="w-16 text-center font-bold text-lg h-12"
      />
      <span className="text-xs text-muted-foreground">{modStr}</span>
    </div>
  );
}

export default function CharacterCreate() {
  const navigate = useNavigate();
  const { campaignId } = useParams();
  const { campaign } = useCampaign();

  const [step, setStep] = useState('class'); // 'class' | 'details'
  const [selectedClass, setSelectedClass] = useState('');

  const [form, setForm] = useState({
    name: '',
    race: '',
    level: 1,
    background: '',
    alignment: '',
    strength: 10,
    dexterity: 10,
    constitution: 10,
    intelligence: 10,
    wisdom: 10,
    charisma: 10,
    notes: '',
  });
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

    const result = await characterService.createCharacter({
      ...form,
      char_class: selectedClass,
      campaign_id: parseInt(campaignId),
      character_data: classData,
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
                onClick={() => { setSelectedClass(cls); setStep('details'); }}
                className={cn(
                  'rounded-lg border-2 p-5 text-left transition-all hover:shadow-md',
                  CLASS_COLORS[cls]
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-lg">{cls}</span>
                  <span className="text-sm text-muted-foreground">{HIT_DICE[cls]}</span>
                </div>
                <p className="text-sm text-muted-foreground">{DESCRIPTIONS[cls]}</p>
                <div className="mt-3 flex items-center text-sm font-medium text-primary">
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
                  <Label>Level</Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={form.level}
                    onChange={e => setForm(f => ({ ...f, level: parseInt(e.target.value) || 1 }))}
                    className="text-center"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Background</Label>
                  <Input
                    value={form.background}
                    onChange={e => setForm(f => ({ ...f, background: e.target.value }))}
                    placeholder="e.g. Soldier, Sage…"
                  />
                </div>
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
              </div>
            </section>

            {/* Ability scores */}
            <section className="rounded-lg border bg-card p-4 space-y-4">
              <h2 className="font-semibold">Ability Scores</h2>
              <div className="flex justify-between gap-2 flex-wrap">
                {[
                  ['Strength', 'STR', 'strength'],
                  ['Dexterity', 'DEX', 'dexterity'],
                  ['Constitution', 'CON', 'constitution'],
                  ['Intelligence', 'INT', 'intelligence'],
                  ['Wisdom', 'WIS', 'wisdom'],
                  ['Charisma', 'CHA', 'charisma'],
                ].map(([label, abbrev, key]) => (
                  <AbilityScoreInput
                    key={key}
                    label={label}
                    abbrev={abbrev}
                    value={form[key]}
                    onChange={v => setForm(f => ({ ...f, [key]: v }))}
                  />
                ))}
              </div>
            </section>

            {/* Class-specific section */}
            {ClassSheet && (
              <section className="rounded-lg border bg-card p-4 space-y-4">
                <h2 className="font-semibold">{selectedClass} Features</h2>
                <ClassSheet
                  data={classData}
                  onChange={handleClassDataChange}
                  readOnly={false}
                  level={form.level}
                />
              </section>
            )}

            {/* Notes */}
            <section className="rounded-lg border bg-card p-4 space-y-3">
              <h2 className="font-semibold">Notes</h2>
              <Textarea
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Personal notes, backstory, equipment…"
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
