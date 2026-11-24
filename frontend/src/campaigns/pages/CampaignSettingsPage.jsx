import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Settings, Users,
  ToggleLeft, ToggleRight, Save, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MainLayout from '../../shared/components/layout/MainLayout';
import campaignService from '../campaignService';
import { useCampaign } from '../CampaignContext';
import { campaignFeatures } from '../campaignFeatures';
import MembersPanel from '../components/MembersPanel';

// ─── General Tab ─────────────────────────────────────────────────────────────

function GeneralTab({ campaignId }) {
  const { campaign, enterCampaign } = useCampaign();
  const isGm = campaign?.userRole === 'gm';

  const [settings, setSettings] = useState({
    name: campaign?.name ?? '',
    description: campaign?.description ?? '',
    edition: campaign?.edition ?? '5e',
    use_alignment: campaign?.use_alignment ?? true,
    ability_score_method: campaign?.ability_score_method ?? 'standard_spread',
    allow_reroll_ones: campaign?.allow_reroll_ones ?? false,
    leveling_type: campaign?.leveling_type ?? 'milestone',
    currency_type: campaign?.currency_type ?? 'standard',
    starting_equipment: campaign?.starting_equipment ?? 'equipment',
    asi_feat_mode: campaign?.asi_feat_mode ?? 'asi_or_feat',
    campaign_mode: campaign?.campaign_mode ?? 'full',
  });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const isDirty =
    settings.name !== (campaign?.name ?? '') ||
    settings.description !== (campaign?.description ?? '') ||
    settings.edition !== (campaign?.edition ?? '5e') ||
    settings.use_alignment !== (campaign?.use_alignment ?? true) ||
    settings.ability_score_method !== (campaign?.ability_score_method ?? 'standard_spread') ||
    settings.allow_reroll_ones !== (campaign?.allow_reroll_ones ?? false) ||
    settings.leveling_type !== (campaign?.leveling_type ?? 'milestone') ||
    settings.currency_type !== (campaign?.currency_type ?? 'standard') ||
    settings.starting_equipment !== (campaign?.starting_equipment ?? 'equipment') ||
    settings.asi_feat_mode !== (campaign?.asi_feat_mode ?? 'asi_or_feat') ||
    settings.campaign_mode !== (campaign?.campaign_mode ?? 'full');

  // The rules settings only affect character sheets; a world-building campaign has none,
  // so they are hidden (never cleared — switching back to full restores them as they were).
  // The GM's DRAFT mode drives it, so picking world-building previews the trimmed page.
  const showRules = campaignFeatures({ campaign_mode: settings.campaign_mode }).ruleSettings;

  const handleSave = async () => {
    setSaving(true);
    setError('');
    const result = await campaignService.updateCampaign(campaignId, settings);
    setSaving(false);
    if (result.success) {
      enterCampaign({ ...campaign, ...result.data, userRole: campaign.userRole });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } else {
      setError(result.error);
    }
  };

  const handleReset = () => {
    setSettings({
      name: campaign?.name ?? '',
      description: campaign?.description ?? '',
      edition: campaign?.edition ?? '5e',
      use_alignment: campaign?.use_alignment ?? true,
      ability_score_method: campaign?.ability_score_method ?? 'standard_spread',
      allow_reroll_ones: campaign?.allow_reroll_ones ?? false,
      leveling_type: campaign?.leveling_type ?? 'milestone',
      currency_type: campaign?.currency_type ?? 'standard',
      starting_equipment: campaign?.starting_equipment ?? 'equipment',
      asi_feat_mode: campaign?.asi_feat_mode ?? 'asi_or_feat',
      campaign_mode: campaign?.campaign_mode ?? 'full',
    });
    setError('');
  };

  if (!isGm) {
    const playerShowsRules = campaignFeatures(campaign).ruleSettings;
    return (
      <div className="space-y-4">
        <SettingRow label="Campaign Mode">
          <span className="text-sm" data-testid="campaign-mode-readonly">{campaignModeLabel(campaign?.campaign_mode)}</span>
        </SettingRow>
        {playerShowsRules && <>
        <SettingRow label="Edition">
          <span className="text-sm">{campaign?.edition === '5.5e' ? 'D&D 2024 (5.5e)' : 'D&D 5th Edition (5e)'}</span>
        </SettingRow>
        <SettingRow label="Alignment">
          <span className="text-sm">{campaign?.use_alignment ? 'Enabled' : 'Disabled'}</span>
        </SettingRow>
        <SettingRow label="Ability Score Method">
          <span className="text-sm">{methodLabel(campaign?.ability_score_method)}</span>
        </SettingRow>
        <SettingRow label="Leveling">
          <span className="text-sm">{campaign?.leveling_type === 'experience' ? 'Experience Points' : 'Milestone'}</span>
        </SettingRow>
        <SettingRow label="Currency">
          <span className="text-sm">{campaign?.currency_type === 'full' ? 'CP, SP, EP, GP, PP' : 'CP, SP, GP, PP'}</span>
        </SettingRow>
        <SettingRow label="Starting Equipment">
          <span className="text-sm">{
            campaign?.starting_equipment === 'none' ? 'None'
            : campaign?.starting_equipment === 'equipment_or_gold' ? 'Equipment or starting gold'
            : 'Class & background equipment'
          }</span>
        </SettingRow>
        <SettingRow label="Ability Score Improvements">
          <span className="text-sm" data-testid="asi-feat-mode-readonly">{asiFeatModeLabel(campaign?.asi_feat_mode)}</span>
        </SettingRow>
        </>}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Campaign Identity */}
      <Section title="Campaign Identity">
        <SettingRow label="Name">
          <Input
            value={settings.name}
            onChange={e => setSettings(s => ({ ...s, name: e.target.value }))}
            className="max-w-sm"
          />
        </SettingRow>
        <SettingRow label="Description">
          <Input
            value={settings.description ?? ''}
            onChange={e => setSettings(s => ({ ...s, description: e.target.value }))}
            className="max-w-sm"
            placeholder="Optional campaign description"
          />
        </SettingRow>
      </Section>

      {/* Campaign Mode */}
      <Section title="Campaign Mode">
        <SettingRow
          label="Mode"
          description="World-building only hides character sheets, encounters, the encyclopedia, NPC combat stats and these rules settings. Nothing is deleted — switch back any time to bring it all back."
        >
          <Select
            value={settings.campaign_mode}
            onValueChange={v => setSettings(s => ({ ...s, campaign_mode: v }))}
          >
            <SelectTrigger className="w-60" data-testid="campaign-mode-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Full D&amp;D campaign</SelectItem>
              <SelectItem value="worldbuilding">World-building only</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
      </Section>

      {showRules && <>
      {/* Rules */}
      <Section title="Rules">
        <SettingRow label="Edition">
          <Select
            value={settings.edition}
            onValueChange={v => setSettings(s => ({ ...s, edition: v }))}
          >
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5e">D&D 5th Edition (5e)</SelectItem>
              <SelectItem value="5.5e">D&D 2024 (5.5e)</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
      </Section>

      {/* Roleplaying */}
      <Section title="Roleplaying Options">
        <SettingRow
          label="Alignment"
          description="Show alignment field on character sheets. Disable for campaigns that don't track alignment."
        >
          <button
            type="button"
            onClick={() => setSettings(s => ({ ...s, use_alignment: !s.use_alignment }))}
            className="flex items-center gap-2 text-sm"
          >
            {settings.use_alignment ? (
              <ToggleRight className="h-6 w-10 text-primary" />
            ) : (
              <ToggleLeft className="h-6 w-10 text-muted-foreground" />
            )}
            <span className={settings.use_alignment ? 'text-foreground' : 'text-muted-foreground'}>
              {settings.use_alignment ? 'Enabled' : 'Disabled'}
            </span>
          </button>
        </SettingRow>
      </Section>

      {/* Ability Scores */}
      <Section title="Ability Score Assignment">
        <SettingRow
          label="Method"
          description="How players assign ability scores when creating a character."
        >
          <Select
            value={settings.ability_score_method}
            onValueChange={v => setSettings(s => ({ ...s, ability_score_method: v }))}
          >
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard_spread">Standard Array (15,14,13,12,10,8)</SelectItem>
              <SelectItem value="point_buy">Point Buy (27 pts)</SelectItem>
              <SelectItem value="roll">Dice Roll (4d6 drop lowest)</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        {settings.ability_score_method === 'roll' && (
          <SettingRow
            label="Reroll 1s"
            description="Allow players to reroll any 1s from their dice rolls before keeping the result."
          >
            <button
              type="button"
              onClick={() => setSettings(s => ({ ...s, allow_reroll_ones: !s.allow_reroll_ones }))}
              className="flex items-center gap-2 text-sm"
            >
              {settings.allow_reroll_ones ? (
                <ToggleRight className="h-6 w-10 text-primary" />
              ) : (
                <ToggleLeft className="h-6 w-10 text-muted-foreground" />
              )}
              <span className={settings.allow_reroll_ones ? 'text-foreground' : 'text-muted-foreground'}>
                {settings.allow_reroll_ones ? 'Enabled' : 'Disabled'}
              </span>
            </button>
          </SettingRow>
        )}
      </Section>

      {/* Leveling */}
      <Section title="Leveling">
        <SettingRow
          label="Leveling Type"
          description="Milestone: GM manually levels up characters. Experience: XP tracking with automatic level-up triggers."
        >
          <Select
            value={settings.leveling_type}
            onValueChange={v => setSettings(s => ({ ...s, leveling_type: v }))}
          >
            <SelectTrigger className="w-52">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="milestone">Milestone</SelectItem>
              <SelectItem value="experience">Experience Points</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>

        <SettingRow
          label="Ability Score Improvements"
          description="What a character gets at Ability Score Improvement levels (4, 8, 12, 16, 19). 'ASI or feat' is the standard 5e choice; 'both' is a generous homebrew option."
        >
          <Select
            value={settings.asi_feat_mode}
            onValueChange={v => setSettings(s => ({ ...s, asi_feat_mode: v }))}
          >
            <SelectTrigger className="w-60" data-testid="asi-feat-mode-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asi_only">Ability score increase only</SelectItem>
              <SelectItem value="asi_or_feat">Ability score increase or a feat</SelectItem>
              <SelectItem value="asi_and_feat">Ability score increase and a feat</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
      </Section>

      {/* Currency */}
      <Section title="Currency">
        <SettingRow
          label="Coin Types"
          description="Which coins characters' wallets track. Standard omits the rarely-used Electrum piece."
        >
          <Select
            value={settings.currency_type}
            onValueChange={v => setSettings(s => ({ ...s, currency_type: v }))}
          >
            <SelectTrigger className="w-52" data-testid="currency-type-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="standard">Copper, Silver, Gold, Platinum</SelectItem>
              <SelectItem value="full">All five (adds Electrum)</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
      </Section>

      {/* Starting Equipment */}
      <Section title="Starting Equipment">
        <SettingRow
          label="New Characters Begin With"
          description="What characters receive at creation. 'Equipment + gold option' lets players take their class's starting gold instead of class equipment. 'Nothing' starts them empty (no equipment or gold)."
        >
          <Select
            value={settings.starting_equipment}
            onValueChange={v => setSettings(s => ({ ...s, starting_equipment: v }))}
          >
            <SelectTrigger className="w-60" data-testid="starting-equipment-select">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="equipment">Class &amp; background equipment</SelectItem>
              <SelectItem value="equipment_or_gold">Equipment, or take starting gold</SelectItem>
              <SelectItem value="none">Nothing (no equipment or gold)</SelectItem>
            </SelectContent>
          </Select>
        </SettingRow>
      </Section>
      </>}

      {/* Save bar */}
      {isDirty && (
        <div className="flex items-center gap-3">
          <Button onClick={handleSave} disabled={saving} className="gap-2">
            <Save className="h-4 w-4" />
            {saving ? 'Saving…' : 'Save Changes'}
          </Button>
          <Button variant="ghost" onClick={handleReset} disabled={saving}>
            Reset
          </Button>
        </div>
      )}
      {saved && !isDirty && (
        <p className="text-sm text-green-600">Settings saved.</p>
      )}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CampaignSettingsPage() {
  const { campaignId } = useParams();
  const { campaign } = useCampaign();

  return (
    <MainLayout>
      <div className="p-6 max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Campaign Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">{campaign?.name}</p>
        </div>

        <Tabs defaultValue="general">
          <TabsList>
            <TabsTrigger value="general" className="gap-2">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="members" className="gap-2">
              <Users className="h-4 w-4" />
              Members
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="mt-6">
            <GeneralTab campaignId={campaignId} />
          </TabsContent>

          <TabsContent value="members" className="mt-6">
            <MembersPanel campaignId={campaignId} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function campaignModeLabel(mode) {
  return mode === 'worldbuilding' ? 'World-building only' : 'Full D&D campaign';
}

function Section({ title, children }) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b bg-muted/30">
        <h2 className="font-semibold text-sm">{title}</h2>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );
}

function SettingRow({ label, description, children }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex-1">
        <p className="text-sm font-medium">{label}</p>
        {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function methodLabel(method) {
  switch (method) {
    case 'point_buy': return 'Point Buy (27 pts)';
    case 'roll': return 'Dice Roll (4d6 drop lowest)';
    default: return 'Standard Array (15,14,13,12,10,8)';
  }
}

function asiFeatModeLabel(mode) {
  switch (mode) {
    case 'asi_only': return 'Ability score increase only';
    case 'asi_and_feat': return 'Ability score increase and a feat';
    default: return 'Ability score increase or a feat';
  }
}
