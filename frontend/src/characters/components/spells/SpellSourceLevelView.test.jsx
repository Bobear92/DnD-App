import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SpellSourceLevelView from '@/characters/components/spells/SpellSourceLevelView';

// The component fetches the catalog (via encyclopediaService) to learn class spell levels.
let mockCatalog = [];
vi.mock('@/encyclopedia/encyclopediaService', () => ({
  default: { getSpells: vi.fn(() => Promise.resolve(mockCatalog)) },
}));

// The inner SpellList fetches via global fetch for its detail dialog — stub it empty.
beforeEach(() => {
  mockCatalog = [];
  vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve([]) }));
});

// Class content just echoes the level it was asked to render (null = the flat "all levels" view).
const renderClass = (l) => <div data-testid="class-content">{l == null ? 'CLASS-ALL' : `CLASS-L${l}`}</div>;

const CATALOG = [{ name: 'Shield', level: 1 }, { name: 'Mirror Image', level: 2 }];

function view(props = {}) {
  return render(
    <SpellSourceLevelView
      campaignId={1}
      classCantrips={['Fire Bolt']}
      classLeveledNames={['Shield', 'Mirror Image']}
      racialCantrips={['Prestidigitation']}
      featCantrips={['Guidance']}
      featLeveled={[{ name: 'Bless', level: 1 }]}
      featTrackers={<div data-testid="trackers">trackers</div>}
      characterLevel={7}
      renderClass={renderClass}
      {...props}
    />
  );
}

describe('SpellSourceLevelView', () => {
  it('flat fallback (no catalog): stacks class + racial + feat content, no level strip', () => {
    view();
    expect(screen.queryByTestId('spell-level-tabs')).not.toBeInTheDocument();
    expect(screen.getByTestId('class-content')).toHaveTextContent('CLASS-ALL');
    expect(screen.getByTestId('spell-source-racial-content')).toBeInTheDocument();
    expect(screen.getByTestId('spell-source-feats-content')).toBeInTheDocument();
    expect(screen.getByTestId('trackers')).toBeInTheDocument();
  });

  it('with a catalog, shows one level strip with per-level counts', async () => {
    mockCatalog = CATALOG;
    view();
    await screen.findByTestId('spell-level-tabs');
    // Cantrips: Fire Bolt + Prestidigitation + Guidance = 3. 1st: Shield + Bless = 2. 2nd: Mirror Image = 1.
    expect(screen.getByTestId('spell-level-tab-0')).toHaveTextContent('Cantrips (3)');
    expect(screen.getByTestId('spell-level-tab-1')).toHaveTextContent('1st (2)');
    expect(screen.getByTestId('spell-level-tab-2')).toHaveTextContent('2nd (1)');
  });

  it('Cantrips tab shows a Class/Racial/Feats source toggle; Class content is the default', async () => {
    mockCatalog = CATALOG;
    view();
    await screen.findByTestId('spell-level-tabs');
    const tabs = screen.getByTestId('spell-source-tabs');
    expect(within(tabs).getByTestId('spell-source-class')).toBeInTheDocument();
    expect(within(tabs).getByTestId('spell-source-racial')).toBeInTheDocument();
    expect(within(tabs).getByTestId('spell-source-feats')).toBeInTheDocument();
    expect(screen.getByTestId('class-content')).toHaveTextContent('CLASS-L0');
  });

  it('switching the source shows racial / feat content at the active level', async () => {
    mockCatalog = CATALOG;
    view();
    await screen.findByTestId('spell-source-racial');
    fireEvent.click(screen.getByTestId('spell-source-racial'));
    expect(within(screen.getByTestId('spell-source-racial-content')).getByText('Prestidigitation')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('spell-source-feats'));
    expect(within(screen.getByTestId('spell-source-feats-content')).getByText('Guidance')).toBeInTheDocument();
  });

  it('clicking a level tab renders that level of class content + the right source set', async () => {
    mockCatalog = CATALOG;
    view();
    await screen.findByTestId('spell-level-tabs');
    fireEvent.click(screen.getByTestId('spell-level-tab-2'));
    // 2nd level: only Mirror Image (class) → single source, no toggle.
    expect(screen.getByTestId('class-content')).toHaveTextContent('CLASS-L2');
    expect(screen.queryByTestId('spell-source-tabs')).not.toBeInTheDocument();
    // 1st level: Shield (class) + Bless (feat) → Class/Feats toggle, no Racial.
    fireEvent.click(screen.getByTestId('spell-level-tab-1'));
    const tabs = screen.getByTestId('spell-source-tabs');
    expect(within(tabs).getByTestId('spell-source-class')).toBeInTheDocument();
    expect(within(tabs).getByTestId('spell-source-feats')).toBeInTheDocument();
    expect(within(tabs).queryByTestId('spell-source-racial')).not.toBeInTheDocument();
  });

  // Leveled racial spells (Infernal Legacy's Hellish Rebuke) must fold into the strip the way feat
  // spells do — the Racial source used to be pinned to level 0, so a Tiefling caster's Hellish
  // Rebuke had nowhere to appear.
  describe('leveled racial spells', () => {
    const racialProps = {
      racialLeveled: [{ name: 'Hellish Rebuke', level: 2 }],
      racialUseControls: { 'Hellish Rebuke': <div data-testid="racial-use-hr">1/1</div> },
    };

    it('counts a leveled racial spell in its level tab', async () => {
      mockCatalog = CATALOG;
      view(racialProps);
      await screen.findByTestId('spell-level-tabs');
      // 2nd: Mirror Image (class) + Hellish Rebuke (racial) = 2.
      expect(screen.getByTestId('spell-level-tab-2')).toHaveTextContent('2nd (2)');
    });

    // The use-counter rides ON the spell's row rather than in a tracker card below the list:
    // a card would list the spell a second time under the same source.
    it('offers a Racial source above level 0 and shows the spell with its use control on its row', async () => {
      mockCatalog = CATALOG;
      view(racialProps);
      await screen.findByTestId('spell-level-tabs');
      fireEvent.click(screen.getByTestId('spell-level-tab-2'));
      fireEvent.click(screen.getByTestId('spell-source-racial'));
      const content = screen.getByTestId('spell-source-racial-content');
      // Named exactly once — the row itself, not row + tracker.
      expect(within(content).getAllByText('Hellish Rebuke')).toHaveLength(1);
      expect(within(content).getByTestId('racial-use-hr')).toBeInTheDocument();
    });

    it('keeps the use control off the cantrip tab', async () => {
      mockCatalog = CATALOG;
      view(racialProps);
      await screen.findByTestId('spell-source-racial');
      fireEvent.click(screen.getByTestId('spell-source-racial'));
      const content = screen.getByTestId('spell-source-racial-content');
      expect(within(content).getByText('Prestidigitation')).toBeInTheDocument();
      expect(within(content).queryByText('Hellish Rebuke')).not.toBeInTheDocument();
      expect(within(content).queryByTestId('racial-use-hr')).not.toBeInTheDocument();
    });

    it('opens a level tab that only a racial spell occupies', async () => {
      mockCatalog = [{ name: 'Fire Bolt', level: 0 }];
      render(
        <SpellSourceLevelView
          campaignId={1}
          classCantrips={['Fire Bolt']}
          classLeveledNames={[]}
          racialLeveled={[{ name: 'Hellish Rebuke', level: 2 }]}
          renderClass={renderClass}
        />
      );
      await screen.findByTestId('spell-level-tabs');
      expect(screen.getByTestId('spell-level-tab-2')).toHaveTextContent('2nd (1)');
      fireEvent.click(screen.getByTestId('spell-level-tab-2'));
      // Racial is the only source at 2nd → renders directly, no toggle.
      expect(screen.queryByTestId('spell-source-tabs')).not.toBeInTheDocument();
      expect(within(screen.getByTestId('spell-source-racial-content')).getByText('Hellish Rebuke'))
        .toBeInTheDocument();
    });

    it('includes leveled racial spells in the flat fallback', () => {
      view(racialProps); // no catalog → flat
      const content = screen.getByTestId('spell-source-racial-content');
      expect(within(content).getByText('Prestidigitation')).toBeInTheDocument();
      expect(within(content).getByText('Hellish Rebuke')).toBeInTheDocument();
    });
  });

  it('does not tab when spells span only one level', async () => {
    mockCatalog = CATALOG;
    render(
      <SpellSourceLevelView
        campaignId={1}
        classCantrips={['Fire Bolt']}
        classLeveledNames={[]}
        renderClass={renderClass}
      />
    );
    // Only cantrips present → one level → flat, no strip.
    await screen.findByTestId('class-content');
    expect(screen.queryByTestId('spell-level-tabs')).not.toBeInTheDocument();
  });
});
