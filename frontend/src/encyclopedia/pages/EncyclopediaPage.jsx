import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCampaign } from '../../campaigns/CampaignContext';
import classService from '../../characters/classService';
import ClassOverview from '../../characters/components/ClassOverview';
import { SUPPORTED_CLASSES_5E, CLASS_DESCRIPTIONS, CLASS_HIT_DICE } from '../../characters/components/index';
import SpellsTab from './SpellsTab';
import CampaignSpellsTab from './CampaignSpellsTab';
import SkillsTab from './SkillsTab';
import FeatsTab from './FeatsTab';
import ItemsTab from './ItemsTab';
import CampaignItemsTab from './CampaignItemsTab';
import { ITEM_CATEGORIES } from '../data/itemCategories';

const CLASS_ACCENT_BG = {
  Barbarian: 'bg-orange-500', Bard: 'bg-pink-500', Cleric: 'bg-yellow-500',
  Druid: 'bg-green-500', Fighter: 'bg-red-500', Monk: 'bg-cyan-500',
  Paladin: 'bg-amber-500', Ranger: 'bg-emerald-500', Rogue: 'bg-purple-500',
  Sorcerer: 'bg-rose-500', Warlock: 'bg-violet-500', Wizard: 'bg-blue-500',
};

const CLASS_ACCENT_RING = {
  Barbarian: 'ring-orange-500', Bard: 'ring-pink-500', Cleric: 'ring-yellow-500',
  Druid: 'ring-green-500', Fighter: 'ring-red-500', Monk: 'ring-cyan-500',
  Paladin: 'ring-amber-500', Ranger: 'ring-emerald-500', Rogue: 'ring-purple-500',
  Sorcerer: 'ring-rose-500', Warlock: 'ring-violet-500', Wizard: 'ring-blue-500',
};

const CLASSES = SUPPORTED_CLASSES_5E;

const TABS = [
  { id: 'classes', label: 'Classes' },
  { id: 'skills', label: 'Skills' },
  { id: 'spells', label: 'Spells' },
  { id: 'items', label: 'Items' },
  { id: 'feats', label: 'Feats' },
];

// Tabs whose content is edition-aware (the edition toggle is shown for these).
const EDITION_AWARE_TABS = ['classes', 'feats'];

export default function EncyclopediaPage() {
  const { campaignId } = useParams();
  const { campaign } = useCampaign();

  const isGm = campaign?.userRole === 'gm';
  const campaignEdition = campaign?.edition === '5.5e' ? '5.5e' : '5e';

  const [activeTab, setActiveTab] = useState('classes');
  const [spellsSubTab, setSpellsSubTab] = useState('system');
  const [itemsCategoryId, setItemsCategoryId] = useState(ITEM_CATEGORIES[0].id);
  const [itemsSubTab, setItemsSubTab] = useState('system');
  const [edition, setEdition] = useState(campaignEdition);
  const [selectedClass, setSelectedClass] = useState(null);
  const [classData, setClassData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedClass || activeTab !== 'classes') return;
    let cancelled = false;
    setLoading(true);
    setClassData(null);
    classService.getClassByName(selectedClass, edition, campaignId).then((data) => {
      if (!cancelled) {
        setClassData(data);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [selectedClass, edition, campaignId, activeTab]);

  const handleEditionChange = (ed) => {
    setEdition(ed);
    setClassData(null);
  };

  const visibleTabs = TABS.filter((t) => !t.gmOnly || isGm);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
        <div>
          <h1 className="text-xl font-bold">Encyclopedia</h1>
          <p className="text-sm text-muted-foreground">Reference material for rules, classes, and more</p>
        </div>

        {/* Edition toggle — relevant for edition-aware tabs (Classes, Feats) */}
        {EDITION_AWARE_TABS.includes(activeTab) && (
          <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
            {['5e', '5.5e'].map((ed) => (
              <button
                key={ed}
                onClick={() => handleEditionChange(ed)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  edition === ed
                    ? 'bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {ed === '5.5e' ? '2024' : '5e'}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div className="flex gap-0 border-b border-border px-6 shrink-0">
        {visibleTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
              activeTab === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {/* Classes tab */}
        {activeTab === 'classes' && (
          <div className="flex h-full">
            {/* Class list sidebar */}
            <div className="w-56 shrink-0 border-r border-border overflow-y-auto">
              <div className="p-2 space-y-0.5">
                {CLASSES.map((cls) => {
                  const isSelected = selectedClass === cls;
                  const accentBg = CLASS_ACCENT_BG[cls] || 'bg-primary';
                  const accentRing = CLASS_ACCENT_RING[cls] || 'ring-primary';
                  return (
                    <button
                      key={cls}
                      onClick={() => setSelectedClass(cls)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors',
                        isSelected
                          ? cn('bg-muted ring-2', accentRing)
                          : 'hover:bg-muted/60'
                      )}
                    >
                      <div className={cn('w-2 h-2 rounded-full shrink-0', accentBg)} />
                      <div className="min-w-0">
                        <p className="text-sm font-semibold leading-tight">{cls}</p>
                        <p className="text-xs text-muted-foreground">{CLASS_HIT_DICE[cls]}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Detail panel */}
            <div className="flex-1 overflow-y-auto">
              {!selectedClass ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-12 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mb-4 opacity-30" />
                  <p className="text-lg font-medium">Select a class</p>
                  <p className="text-sm mt-1">Choose a class from the list to view its full overview, features, and subclasses.</p>
                </div>
              ) : (
                <div className="p-6">
                  <ClassOverview
                    classData={classData}
                    loading={loading}
                    maneuversTo={`/campaigns/${campaignId}/encyclopedia/maneuvers`}
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Skills tab */}
        {activeTab === 'skills' && (
          <SkillsTab />
        )}

        {/* Spells tab — with sub-tabs (System / Campaign for GMs) */}
        {activeTab === 'spells' && (
          <div className="flex flex-col h-full min-h-0">
            {isGm && (
              <div className="flex gap-1 border-b border-border px-4 py-2 shrink-0 bg-muted/30">
                <button
                  onClick={() => setSpellsSubTab('system')}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    spellsSubTab === 'system'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  System Spells
                </button>
                <button
                  onClick={() => setSpellsSubTab('campaign')}
                  className={cn(
                    'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                    spellsSubTab === 'campaign'
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  Campaign Spells
                </button>
              </div>
            )}
            <div className="flex-1 min-h-0 overflow-hidden">
              {(!isGm || spellsSubTab === 'system') && (
                <SpellsTab isGm={isGm} campaignId={campaignId} />
              )}
              {isGm && spellsSubTab === 'campaign' && (
                <CampaignSpellsTab campaignId={campaignId} />
              )}
            </div>
          </div>
        )}

        {/* Items tab — category sub-tabs + per-category System/Campaign (GM) sub-tab */}
        {activeTab === 'items' && (() => {
          const activeCategory = ITEM_CATEGORIES.find((c) => c.id === itemsCategoryId) ?? ITEM_CATEGORIES[0];
          return (
            <div className="flex flex-col h-full min-h-0">
              {/* Category selector */}
              <div className="flex flex-wrap gap-1 border-b border-border px-4 py-2 shrink-0">
                {ITEM_CATEGORIES.map((c) => {
                  const Icon = c.icon;
                  const active = c.id === itemsCategoryId;
                  return (
                    <button
                      key={c.id}
                      onClick={() => setItemsCategoryId(c.id)}
                      className={cn(
                        'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                        active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'
                      )}
                      data-testid={`item-category-${c.id}`}
                    >
                      <Icon className="h-4 w-4" />
                      {c.label}
                    </button>
                  );
                })}
              </div>

              {/* System / Campaign sub-tab (GM only) */}
              {isGm && (
                <div className="flex gap-1 border-b border-border px-4 py-2 shrink-0 bg-muted/30">
                  <button
                    onClick={() => setItemsSubTab('system')}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                      itemsSubTab === 'system' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    System {activeCategory.label}
                  </button>
                  <button
                    onClick={() => setItemsSubTab('campaign')}
                    className={cn(
                      'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                      itemsSubTab === 'campaign' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
                    )}
                  >
                    Campaign {activeCategory.label}
                  </button>
                </div>
              )}

              <div className="flex-1 min-h-0 overflow-hidden">
                {(!isGm || itemsSubTab === 'system') && (
                  <ItemsTab category={activeCategory} isGm={isGm} campaignId={campaignId} />
                )}
                {isGm && itemsSubTab === 'campaign' && (
                  <CampaignItemsTab category={activeCategory} campaignId={campaignId} />
                )}
              </div>
            </div>
          );
        })()}

        {/* Feats tab — edition-aware (driven by the edition toggle) */}
        {activeTab === 'feats' && (
          <FeatsTab campaignId={campaignId} edition={edition} />
        )}
      </div>
    </div>
  );
}
