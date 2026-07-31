import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SpellsTab from './SpellsTab';

vi.mock('../encyclopediaService', () => ({
  default: {
    getSpells: vi.fn(),
    createSpell: vi.fn(),
  },
}));

// navigate mock
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...await vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

import encyclopediaService from '../encyclopediaService';

const SPELLS = [
  {
    id: 1, name: 'Fireball', level: 3, school: 'Evocation',
    casting_time: '1 action', range: '150 feet', components: 'V, S, M',
    duration: 'Instantaneous', description: 'A bright streak flashes…',
    higher_level: 'When cast at 4th level, deals extra 1d6.',
    ritual: false, concentration: false,
    classes: 'Sorcerer, Wizard', owner_type: 'system', owner_id: null,
  },
  {
    id: 2, name: 'Detect Magic', level: 1, school: 'Divination',
    casting_time: '1 action', range: 'Self', components: 'V, S',
    duration: '10 minutes', description: 'Sense magic within 30 feet.',
    higher_level: null,
    ritual: true, concentration: true,
    classes: 'Bard, Cleric, Druid, Paladin, Ranger, Sorcerer, Wizard', owner_type: 'system', owner_id: null,
  },
  {
    id: 3, name: 'Custom Blast', level: 2, school: 'Evocation',
    casting_time: '1 action', range: '60 feet', components: 'V',
    duration: 'Instantaneous', description: 'Custom campaign spell.',
    higher_level: null, ritual: false, concentration: false,
    classes: 'Sorcerer', owner_type: 'campaign', owner_id: 1,
  },
];

function renderTab(props = {}) {
  return render(
    <MemoryRouter initialEntries={['/campaigns/1/encyclopedia']}>
      <Routes>
        <Route path="/campaigns/:campaignId/encyclopedia" element={
          <SpellsTab campaignId="1" isGm={false} {...props} />
        } />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  encyclopediaService.getSpells.mockResolvedValue(SPELLS);
});

describe('SpellsTab', () => {
  it('shows loading state initially', () => {
    encyclopediaService.getSpells.mockReturnValue(new Promise(() => {}));
    renderTab();
    expect(screen.getByText('Loading spells…')).toBeInTheDocument();
  });

  it('renders all spells after load', async () => {
    renderTab();
    await waitFor(() => expect(screen.getByText('Fireball')).toBeInTheDocument());
    expect(screen.getByText('Detect Magic')).toBeInTheDocument();
    expect(screen.getByText('Custom Blast')).toBeInTheDocument();
  });

  it('shows spell count', async () => {
    renderTab();
    await waitFor(() => expect(screen.getByText('3 spells')).toBeInTheDocument());
  });

  it('shows search input', async () => {
    renderTab();
    await waitFor(() => expect(screen.getByTestId('spell-search')).toBeInTheDocument());
  });

  it('filters spells by name search', async () => {
    renderTab();
    // Gate on a loaded SPELL, not on the search box — the filter bar renders above the
    // loading branch, so waiting for it does not mean the fetch has resolved.
    await screen.findByText('Fireball');
    fireEvent.change(screen.getByTestId('spell-search'), { target: { value: 'fire' } });
    expect(screen.getByText('Fireball')).toBeInTheDocument();
    expect(screen.queryByText('Detect Magic')).not.toBeInTheDocument();
  });

  it('filters spells by school', async () => {
    renderTab();
    await screen.findByText('Detect Magic');
    fireEvent.click(screen.getByTestId('school-filter-Divination'));
    await waitFor(() => expect(screen.queryByText('Fireball')).not.toBeInTheDocument());
    expect(screen.getByText('Detect Magic')).toBeInTheDocument();
  });

  it('filters spells by level', async () => {
    renderTab();
    await screen.findByText('Fireball');
    fireEvent.change(screen.getByTestId('level-filter'), { target: { value: '3' } });
    await waitFor(() => expect(screen.queryByText('Detect Magic')).not.toBeInTheDocument());
    expect(screen.getByText('Fireball')).toBeInTheDocument();
  });

  it('filters spells by class', async () => {
    renderTab();
    await screen.findByText('Detect Magic');
    fireEvent.change(screen.getByTestId('class-filter'), { target: { value: 'Bard' } });
    await waitFor(() => expect(screen.queryByText('Fireball')).not.toBeInTheDocument());
    expect(screen.getByText('Detect Magic')).toBeInTheDocument();
  });

  it('shows "All Schools" button', async () => {
    renderTab();
    await waitFor(() => expect(screen.getByTestId('school-filter-All')).toBeInTheDocument());
  });

  it('shows ritual indicator for ritual spells', async () => {
    renderTab();
    await waitFor(() => screen.getByText('Detect Magic'));
    // Detect Magic is ritual=true, should have a ritual icon in its row
    const row = screen.getByTestId('spell-row-2');
    expect(row).toBeInTheDocument();
  });

  it('marks campaign override spells with (Campaign) label', async () => {
    renderTab();
    await waitFor(() => screen.getByText('Custom Blast'));
    expect(screen.getByText('(Campaign)')).toBeInTheDocument();
  });

  it('shows empty state when no spells match filters', async () => {
    renderTab();
    await screen.findByText('Fireball');
    fireEvent.change(screen.getByTestId('spell-search'), { target: { value: 'xyznonexistent' } });
    expect(screen.getByText('No spells match your filters.')).toBeInTheDocument();
  });

  it('opens detail dialog when spell row is clicked', async () => {
    renderTab();
    await waitFor(() => screen.getByText('Fireball'));
    fireEvent.click(screen.getByTestId('spell-row-1'));
    await waitFor(() => expect(screen.getByText('A bright streak flashes…')).toBeInTheDocument());
  });

  it('shows At Higher Levels section in detail when present', async () => {
    renderTab();
    await waitFor(() => screen.getByText('Fireball'));
    fireEvent.click(screen.getByTestId('spell-row-1'));
    await waitFor(() => expect(screen.getByText('At Higher Levels')).toBeInTheDocument());
    expect(screen.getByText('When cast at 4th level, deals extra 1d6.')).toBeInTheDocument();
  });

  it('hides At Higher Levels section when null', async () => {
    renderTab();
    await waitFor(() => screen.getByText('Detect Magic'));
    fireEvent.click(screen.getByTestId('spell-row-2'));
    await waitFor(() => expect(screen.queryByText('At Higher Levels')).not.toBeInTheDocument());
  });

  it('shows Override button for system spells when GM', async () => {
    renderTab({ isGm: true });
    await waitFor(() => screen.getByText('Fireball'));
    fireEvent.click(screen.getByTestId('spell-row-1'));
    await waitFor(() => expect(screen.getByTestId('override-spell-btn')).toBeInTheDocument());
  });

  it('hides Override button for players', async () => {
    renderTab({ isGm: false });
    await waitFor(() => screen.getByText('Fireball'));
    fireEvent.click(screen.getByTestId('spell-row-1'));
    await waitFor(() => expect(screen.queryByTestId('override-spell-btn')).not.toBeInTheDocument());
  });

  it('shows Edit Override button for campaign spells when GM', async () => {
    renderTab({ isGm: true });
    await waitFor(() => screen.getByText('Custom Blast'));
    fireEvent.click(screen.getByTestId('spell-row-3'));
    await waitFor(() => expect(screen.getByTestId('edit-override-btn')).toBeInTheDocument());
  });

  it('calls createSpell and navigates on Override click', async () => {
    encyclopediaService.createSpell.mockResolvedValue({ id: 99 });
    renderTab({ isGm: true });
    await waitFor(() => screen.getByText('Fireball'));
    fireEvent.click(screen.getByTestId('spell-row-1'));
    await waitFor(() => screen.getByTestId('override-spell-btn'));
    fireEvent.click(screen.getByTestId('override-spell-btn'));
    await waitFor(() => expect(encyclopediaService.createSpell).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Fireball', owner_type: 'campaign', owner_id: 1 })
    ));
    // navigate happens in createSpell's continuation — await it rather than asserting sync.
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/campaigns/1/encyclopedia/spells/99'));
  });
});
