import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ClassSpellBrowser, { maxCastableLevel } from '@/characters/components/spells/ClassSpellBrowser';
import encyclopediaService from '@/encyclopedia/encyclopediaService';

vi.mock('react-router-dom', () => ({
  Link: ({ children, to, ...props }) => <a href={to} {...props}>{children}</a>,
}));

vi.mock('@/encyclopedia/encyclopediaService', () => ({
  default: { getSpells: vi.fn() },
}));

const MOCK_SPELLS = [
  { id: 1, name: 'Cure Wounds',   level: 1, classes: 'Cleric, Druid', ritual: false, concentration: false },
  { id: 2, name: 'Bless',         level: 1, classes: 'Cleric, Paladin', ritual: false, concentration: true },
  { id: 3, name: 'Zone of Truth', level: 2, classes: 'Cleric, Paladin', ritual: true, concentration: false },
  { id: 4, name: 'Fireball',      level: 3, classes: 'Sorcerer, Wizard', ritual: false, concentration: false },
  { id: 5, name: 'Detect Magic',  level: 1, classes: 'Cleric, Bard', ritual: true, concentration: false },
];

function browser(props = {}) {
  return render(<ClassSpellBrowser
    className="Cleric"
    campaignId={1}
    preparedSpells={[]}
    prepareLimit={5}
    onAdd={vi.fn()}
    onRemove={vi.fn()}
    {...props}
  />);
}

beforeEach(() => {
  encyclopediaService.getSpells.mockResolvedValue(MOCK_SPELLS);
});

describe('ClassSpellBrowser', () => {
  it('shows loading state initially', () => {
    browser();
    expect(screen.getByText('Loading spells…')).toBeInTheDocument();
  });

  it('filters spells to the specified class', async () => {
    browser({ className: 'Cleric' });
    // Cleric spells: Cure Wounds, Bless, Zone of Truth, Detect Magic (NOT Fireball)
    await waitFor(() => expect(screen.getByText('Cure Wounds')).toBeInTheDocument());
    expect(screen.getByText('Bless')).toBeInTheDocument();
    expect(screen.getByText('Zone of Truth')).toBeInTheDocument();
    expect(screen.queryByText('Fireball')).not.toBeInTheDocument();
  });

  it('filters spells to maxSpellLevel', async () => {
    browser({ className: 'Cleric', maxSpellLevel: 1 });
    await waitFor(() => expect(screen.getByText('Cure Wounds')).toBeInTheDocument());
    // Zone of Truth (level 2) should be hidden when maxSpellLevel=1
    expect(screen.queryByText('Zone of Truth')).not.toBeInTheDocument();
  });

  it('calls getSpells with the campaignId', async () => {
    browser({ campaignId: 42 });
    await waitFor(() => expect(encyclopediaService.getSpells).toHaveBeenCalledWith(42));
  });

  it('calls onAdd when + Prepare button clicked', async () => {
    const onAdd = vi.fn();
    browser({ onAdd });
    await waitFor(() => expect(screen.getAllByRole('button', { name: '+ Prepare' }).length).toBeGreaterThan(0));
    fireEvent.click(screen.getAllByRole('button', { name: '+ Prepare' })[0]);
    expect(onAdd).toHaveBeenCalledTimes(1);
  });

  it('calls onRemove when Remove button clicked for prepared spell', async () => {
    const onRemove = vi.fn();
    browser({ preparedSpells: ['Cure Wounds'], onRemove });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Remove' }));
    expect(onRemove).toHaveBeenCalledWith('Cure Wounds');
  });

  it('shows lock banner when player is locked', async () => {
    browser({ locked: true, isGm: false });
    await waitFor(() => expect(screen.getByText(/Spells prepared for today/)).toBeInTheDocument());
  });

  it('shows Prepare for Today when unlocked and not GM', async () => {
    browser({ locked: false, isGm: false });
    await waitFor(() => expect(screen.getByRole('button', { name: /Prepare for Today/ })).toBeInTheDocument());
  });

  it('calls onLock when Prepare for Today clicked', async () => {
    const onLock = vi.fn();
    browser({ locked: false, isGm: false, onLock });
    await waitFor(() => fireEvent.click(screen.getByRole('button', { name: /Prepare for Today/ })));
    expect(onLock).toHaveBeenCalled();
  });

  it('shows GM unlock button when locked', async () => {
    browser({ locked: true, isGm: true });
    await waitFor(() => expect(screen.getByRole('button', { name: /Unlock.*Long Rest/i })).toBeInTheDocument());
  });

  it('calls onUnlock when GM unlock button clicked', async () => {
    const onUnlock = vi.fn();
    browser({ locked: true, isGm: true, onUnlock });
    await waitFor(() => fireEvent.click(screen.getByRole('button', { name: /Unlock.*Long Rest/i })));
    expect(onUnlock).toHaveBeenCalled();
  });

  it('search filter narrows spell list', async () => {
    browser();
    await waitFor(() => expect(screen.getByText('Cure Wounds')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('Search spells…'), { target: { value: 'cure' } });
    expect(screen.getByText('Cure Wounds')).toBeInTheDocument();
    expect(screen.queryByText('Bless')).not.toBeInTheDocument();
  });

  it('shows encyclopedia link', async () => {
    browser({ campaignId: 7 });
    await waitFor(() => expect(screen.getByText(/Browse all spells in the Encyclopedia/)).toBeInTheDocument());
    expect(screen.getByRole('link', { name: /Browse all spells in the Encyclopedia/ })).toHaveAttribute('href', '/campaigns/7/encyclopedia');
  });

  it('+ Prepare buttons disabled when at limit', async () => {
    browser({ preparedSpells: ['Cure Wounds', 'Bless', 'Zone of Truth', 'Detect Magic', 'Fireball'], prepareLimit: 5 });
    await waitFor(() => expect(screen.getAllByRole('button', { name: /Prepare/ }).length).toBeGreaterThan(0));
    const prepareButtons = screen.queryAllByRole('button', { name: '+ Prepare' });
    prepareButtons.forEach(btn => expect(btn).toBeDisabled());
  });

  it('shows empty state when no spells match search', async () => {
    browser();
    await waitFor(() => expect(screen.getByText('Cure Wounds')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText('Search spells…'), { target: { value: 'zzznomatch' } });
    expect(screen.getByText('No spells match your search.')).toBeInTheDocument();
  });
});

describe('maxCastableLevel', () => {
  it('returns 0 for all-zero slot array', () => {
    expect(maxCastableLevel([0, 0, 0, 0, 0])).toBe(0);
  });

  it('returns highest level with at least one slot', () => {
    expect(maxCastableLevel([4, 3, 2, 0, 0])).toBe(3);
    expect(maxCastableLevel([4, 3, 3, 3, 1])).toBe(5);
  });

  it('returns 1 for only level 1 slots', () => {
    expect(maxCastableLevel([2, 0, 0, 0, 0])).toBe(1);
  });
});
