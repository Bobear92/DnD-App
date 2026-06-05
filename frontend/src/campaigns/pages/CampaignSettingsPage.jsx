import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  Settings, Users, Crown, User, UserPlus, Search, Trash2,
  ToggleLeft, ToggleRight, Save, ChevronDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import MainLayout from '../../shared/components/layout/MainLayout';
import campaignService from '../campaignService';
import { useCampaign } from '../CampaignContext';
import { useAuth } from '../../auth/AuthContext';

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
    settings.starting_equipment !== (campaign?.starting_equipment ?? 'equipment');

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
    });
    setError('');
  };

  if (!isGm) {
    return (
      <div className="space-y-4">
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

// ─── Members Tab ──────────────────────────────────────────────────────────────

function MembersTab({ campaignId }) {
  const { campaign } = useCampaign();
  const { user } = useAuth();
  const isGm = campaign?.userRole === 'gm';

  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [removingId, setRemovingId] = useState(null);
  const [removeError, setRemoveError] = useState('');

  const loadMembers = async () => {
    const result = await campaignService.getCampaignById(campaignId);
    if (result.success) {
      setMembers(result.data.members ?? []);
    } else {
      setError(result.error);
    }
    setLoading(false);
  };

  useEffect(() => { loadMembers(); }, [campaignId]);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    let cancelled = false;
    setSearching(true);
    campaignService.searchUsers(query).then((result) => {
      if (cancelled) return;
      setSearching(false);
      if (result.success) {
        const memberUserIds = new Set(members.map(m => m.user_id));
        setSearchResults(result.data.filter(u => !memberUserIds.has(u.id)));
        setShowDropdown(true);
      }
    });
    return () => { cancelled = true; };
  }, [query, members]);

  const handleSelectUser = (u) => {
    setSelectedUser(u);
    setQuery(u.username);
    setShowDropdown(false);
    setSearchResults([]);
    setAddError('');
  };

  const handleAddPlayer = async () => {
    if (!selectedUser) return;
    setAdding(true);
    setAddError('');
    const result = await campaignService.addPlayer(campaignId, selectedUser.id);
    setAdding(false);
    if (result.success) {
      setSelectedUser(null);
      setQuery('');
      await loadMembers();
    } else {
      setAddError(result.error);
    }
  };

  const handleRemove = async (userId) => {
    setRemovingId(userId);
    setRemoveError('');
    const result = await campaignService.removePlayer(campaignId, userId);
    setRemovingId(null);
    if (result.success) {
      await loadMembers();
    } else {
      setRemoveError(result.error);
    }
  };

  const players = members.filter(m => m.role === 'player');
  const gms = members.filter(m => m.role === 'gm');

  if (loading) return <div className="text-sm text-muted-foreground">Loading members…</div>;

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* GM section */}
      <section className="rounded-lg border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 flex items-center gap-2">
          <Crown className="h-4 w-4 text-amber-500" />
          <span className="font-semibold text-sm">Game Master</span>
        </div>
        <div className="divide-y">
          {gms.map(m => (
            <MemberRow
              key={m.id}
              member={m}
              isCurrentUser={m.user_id === user?.id}
              isGm={isGm}
              onRemove={null}
              removing={false}
            />
          ))}
        </div>
      </section>

      {/* Players section */}
      <section className="rounded-lg border bg-card overflow-hidden">
        <div className="px-4 py-3 border-b bg-muted/30 flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" />
          <span className="font-semibold text-sm">Players</span>
          <Badge variant="secondary" className="ml-auto text-xs">{players.length}</Badge>
        </div>
        {players.length === 0 ? (
          <div className="px-4 py-6 text-sm text-muted-foreground text-center">
            No players yet. {isGm && 'Invite someone below.'}
          </div>
        ) : (
          <div className="divide-y">
            {players.map(m => (
              <MemberRow
                key={m.id}
                member={m}
                isCurrentUser={m.user_id === user?.id}
                isGm={isGm}
                onRemove={() => handleRemove(m.user_id)}
                removing={removingId === m.user_id}
              />
            ))}
          </div>
        )}
      </section>

      {removeError && <p className="text-sm text-destructive">{removeError}</p>}

      {/* Invite panel — GM only */}
      {isGm && (
        <section className="rounded-lg border bg-card p-4 space-y-3">
          <div className="flex items-center gap-2">
            <UserPlus className="h-4 w-4 text-muted-foreground" />
            <h2 className="font-semibold text-sm">Invite Player</h2>
          </div>

          <div className="relative" ref={dropdownRef}>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  data-testid="invite-search"
                  placeholder="Search by username or email…"
                  value={query}
                  onChange={e => {
                    setQuery(e.target.value);
                    setSelectedUser(null);
                    setAddError('');
                  }}
                  className="pl-8"
                />
              </div>
              <Button
                type="button"
                disabled={!selectedUser || adding}
                onClick={handleAddPlayer}
              >
                {adding ? 'Adding…' : 'Add'}
              </Button>
            </div>

            {showDropdown && (
              <div
                data-testid="search-dropdown"
                className="absolute z-10 mt-1 w-full rounded-md border bg-popover shadow-md"
              >
                {searching ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">Searching…</div>
                ) : searchResults.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">No users found</div>
                ) : (
                  searchResults.map(u => (
                    <button
                      key={u.id}
                      data-testid={`search-result-${u.id}`}
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-muted text-sm flex items-center justify-between"
                      onClick={() => handleSelectUser(u)}
                    >
                      <span className="font-medium">{u.username}</span>
                      <span className="text-muted-foreground text-xs">{u.email}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {selectedUser && (
            <p className="text-xs text-muted-foreground">
              Ready to invite <span className="font-medium text-foreground">{selectedUser.username}</span> ({selectedUser.email})
            </p>
          )}

          {addError && <p className="text-sm text-destructive">{addError}</p>}
        </section>
      )}
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
            <MembersTab campaignId={campaignId} />
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

function MemberRow({ member, isCurrentUser, isGm, onRemove, removing }) {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center shrink-0">
        <span className="text-xs font-semibold text-muted-foreground uppercase">
          {member.user?.username?.[0] ?? '?'}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">{member.user?.username}</span>
          {isCurrentUser && <Badge variant="outline" className="text-xs">You</Badge>}
        </div>
        <p className="text-xs text-muted-foreground truncate">{member.user?.email}</p>
      </div>
      <div className="text-xs text-muted-foreground hidden sm:block">
        Joined {new Date(member.joined_at).toLocaleDateString()}
      </div>
      {isGm && onRemove && !isCurrentUser && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          disabled={removing}
          aria-label={`Remove ${member.user?.username}`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )}
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
