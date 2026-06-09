import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import FeatsSubTab from './FeatsSubTab';

// FeatPicker uses a Radix dialog — mock to a flat button list so we can pick directly.
vi.mock('./FeatPicker', () => ({
  default: ({ feats = [], onChange }) => (
    <div data-testid="feat-picker">
      {feats.map((f) => (
        <button key={f.id} type="button" data-testid={`add-pick-${f.id}`} onClick={() => onChange({ id: f.id, name: f.name })}>
          {f.name}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('../../encyclopedia/featService', () => ({
  default: { getFeats: vi.fn() },
}));
import featService from '../../encyclopedia/featService';

const CATALOGUE = [
  { id: 10, name: 'Alert', prerequisites: {}, repeatable: false, source: 'PHB', description: 'Always on guard.',
    effects: [{ kind: 'stat_mod', stat: 'initiative', amount: 5, label: '+5 initiative' }, { kind: 'note', text: 'No surprise.' }] },
  { id: 11, name: 'Grappler', prerequisites: { text: 'Strength 13 or higher' }, repeatable: false, description: 'Grab on.' },
  { id: 12, name: 'Tough', prerequisites: {}, repeatable: false, description: 'Hardy.' },
];

beforeEach(() => {
  vi.clearAllMocks();
  featService.getFeats.mockResolvedValue(CATALOGUE);
});
// Pending-async flush is handled globally in src/test/setup.js.

describe('FeatsSubTab', () => {
  it('shows an empty state when the character has no feats', async () => {
    render(<FeatsSubTab feats={[]} campaignId={1} edition="5e" />);
    expect(await screen.findByTestId('feats-empty')).toBeInTheDocument();
  });

  it('fetches the catalogue with campaignId + edition', async () => {
    render(<FeatsSubTab feats={[]} campaignId={7} edition="5.5e" />);
    await waitFor(() => expect(featService.getFeats).toHaveBeenCalledWith(7, '5.5e'));
  });

  it('renders an owned feat with its resolved description and prerequisite', async () => {
    render(<FeatsSubTab feats={[{ id: 11, name: 'Grappler' }]} campaignId={1} edition="5e" />);
    expect(await screen.findByTestId('feat-row-Grappler')).toBeInTheDocument();
    expect(screen.getByText('Grab on.')).toBeInTheDocument();
    expect(screen.getByText(/Strength 13 or higher/)).toBeInTheDocument();
  });

  it('renders structured effect chips (more than a description card)', async () => {
    render(<FeatsSubTab feats={[{ id: 10, name: 'Alert' }]} campaignId={1} edition="5e" />);
    const chips = await screen.findByTestId('feat-effects-Alert');
    expect(chips).toHaveTextContent('+5 initiative');
  });

  it('shows the resolved ability for an ability_choice effect', async () => {
    const cat = [{ id: 20, name: 'Tavern Brawler', prerequisites: {}, repeatable: false, description: 'Brawl.',
      effects: [{ kind: 'ability_choice', abilities: ['strength', 'constitution'], amount: 1 }] }];
    featService.getFeats.mockResolvedValue(cat);
    render(<FeatsSubTab feats={[{ id: 20, name: 'Tavern Brawler', choices: { ability: 'strength' } }]} campaignId={1} edition="5e" />);
    const chips = await screen.findByTestId('feat-effects-Tavern Brawler');
    expect(chips).toHaveTextContent('+1 Strength');
  });

  it('shows the level a feat was acquired', async () => {
    render(<FeatsSubTab feats={[{ id: 11, name: 'Grappler', level: 4 }]} campaignId={1} edition="5e" />);
    await screen.findByTestId('feat-row-Grappler');
    expect(screen.getByText('Lvl 4')).toBeInTheDocument();
  });

  it('hides Add and remove controls when not managing', async () => {
    render(<FeatsSubTab feats={[{ id: 11, name: 'Grappler' }]} campaignId={1} edition="5e" canManage={false} />);
    await screen.findByTestId('feat-row-Grappler');
    expect(screen.queryByTestId('feats-add-btn')).not.toBeInTheDocument();
    expect(screen.queryByTestId('feat-remove-Grappler')).not.toBeInTheDocument();
  });

  it('lets a manager add a feat (excluding already-owned, non-repeatable)', async () => {
    const onChange = vi.fn();
    render(<FeatsSubTab feats={[{ id: 11, name: 'Grappler' }]} campaignId={1} edition="5e" canManage onChange={onChange} />);
    fireEvent.click(await screen.findByTestId('feats-add-btn'));
    // Grappler already owned → not offered; Alert + Tough are.
    expect(screen.queryByTestId('add-pick-11')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('add-pick-10'));
    expect(onChange).toHaveBeenCalledWith({ feats: [{ id: 11, name: 'Grappler' }, { id: 10, name: 'Alert' }] });
  });

  it('renders a feat resource tracker and persists Use via onChange', async () => {
    const onChange = vi.fn();
    featService.getFeats.mockResolvedValue([]); // effects come from the snapshotted instance
    render(<FeatsSubTab
      feats={[{ id: 30, name: 'Lucky', effects: [{ kind: 'resource', key: 'luck_points', label: 'Luck Points', total: 3, recharge: 'long' }] }]}
      campaignId={1} edition="5e" characterData={{ luck_points_used: 1 }} onChange={onChange} />);
    const res = await screen.findByTestId('feat-resource-luck_points');
    expect(res).toHaveTextContent('2 / 3 remaining'); // 3 total − 1 used
    fireEvent.click(within(res).getByRole('button', { name: /Use Luck Points/i }));
    fireEvent.click(screen.getByTestId('feat-luck_points-use-confirm-button'));
    expect(onChange).toHaveBeenCalledWith({ luck_points_used: 2 });
  });

  it('scales a PB-total resource (2024 Lucky) by the pb prop', async () => {
    featService.getFeats.mockResolvedValue([]);
    render(<FeatsSubTab
      feats={[{ id: 31, name: 'Lucky', effects: [{ kind: 'resource', key: 'luck_points', label: 'Luck Points', total: 'pb', recharge: 'long' }] }]}
      campaignId={1} edition="5.5e" characterData={{}} pb={3} />);
    const res = await screen.findByTestId('feat-resource-luck_points');
    expect(res).toHaveTextContent('3 / 3 remaining'); // total = pb (3)
  });

  it('hides feat resource Use controls when readOnly', async () => {
    featService.getFeats.mockResolvedValue([]);
    render(<FeatsSubTab
      feats={[{ id: 30, name: 'Lucky', effects: [{ kind: 'resource', key: 'luck_points', label: 'Luck Points', total: 3, recharge: 'long' }] }]}
      campaignId={1} edition="5e" characterData={{ luck_points_used: 1 }} readOnly />);
    const res = await screen.findByTestId('feat-resource-luck_points');
    expect(res).toHaveTextContent('2 / 3 remaining');
    expect(within(res).queryByRole('button', { name: /Use Luck Points/i })).not.toBeInTheDocument();
  });

  it('lets a manager remove a feat', async () => {
    const onChange = vi.fn();
    render(<FeatsSubTab feats={[{ id: 11, name: 'Grappler' }, { id: 12, name: 'Tough' }]} campaignId={1} edition="5e" canManage onChange={onChange} />);
    fireEvent.click(await screen.findByTestId('feat-remove-Grappler'));
    expect(onChange).toHaveBeenCalledWith({ feats: [{ id: 12, name: 'Tough' }] });
  });
});
