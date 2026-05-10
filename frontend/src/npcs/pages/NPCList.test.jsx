import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../shared/components/layout/MainLayout', () => ({
  default: ({ children }) => <div data-testid="layout">{children}</div>,
}));
vi.mock('../../campaigns/CampaignContext', () => ({ useCampaign: vi.fn() }));
vi.mock('react-router-dom', async () => ({
  ...await vi.importActual('react-router-dom'),
  useParams: () => ({ campaignId: '1' }),
  useNavigate: () => vi.fn(),
}));
vi.mock('../npcService', () => ({
  default: { getNpcs: vi.fn(), toggleVisibility: vi.fn(), deleteNpc: vi.fn(), createNpc: vi.fn() },
  mapNpcImageUrl: () => null,
}));
vi.mock('../../locations/locationService', () => ({
  default: { getLocations: vi.fn() },
}));

import { useCampaign } from '../../campaigns/CampaignContext';
import npcService from '../npcService';
import locationService from '../../locations/locationService';
import NPCList from './NPCList';

const GM_CAMPAIGN = { id: 1, name: 'Test Campaign', userRole: 'gm', created_by: 1 };
const PLAYER_CAMPAIGN = { id: 1, name: 'Test Campaign', userRole: 'player', created_by: 99 };

const makeNpc = (overrides) => ({
  id: 1, name: 'Gareth', race: 'Human', occupation: 'Blacksmith',
  status: 'alive', summary: 'A burly smith.', image_path: null,
  is_visible_to_players: true, last_known_location_id: null,
  ...overrides,
});

function renderList() {
  return render(<MemoryRouter><NPCList /></MemoryRouter>);
}

beforeEach(() => {
  vi.clearAllMocks();
  useCampaign.mockReturnValue({ campaign: GM_CAMPAIGN });
  npcService.getNpcs.mockResolvedValue([]);
  locationService.getLocations.mockResolvedValue([]);
});

describe('NPCList — render', () => {
  it('renders NPC cards after loading', async () => {
    npcService.getNpcs.mockResolvedValue([makeNpc({ name: 'Elara' })]);
    renderList();
    await waitFor(() => expect(screen.getByText('Elara')).toBeTruthy());
  });

  it('shows empty state when no NPCs', async () => {
    renderList();
    await waitFor(() => expect(screen.getByText('No NPCs Yet')).toBeTruthy());
  });
});

describe('NPCList — search', () => {
  it('filters by summary text — regression: search was name/race/occupation only', async () => {
    npcService.getNpcs.mockResolvedValue([
      makeNpc({ id: 1, name: 'Gareth', summary: 'A burly blacksmith.' }),
      makeNpc({ id: 2, name: 'Elara', summary: 'A quiet herbalist.' }),
    ]);
    renderList();
    await waitFor(() => expect(screen.getByText('Gareth')).toBeTruthy());

    const input = screen.getByPlaceholderText(/search name/i);
    fireEvent.change(input, { target: { value: 'herbalist' } });

    await waitFor(() => {
      expect(screen.queryByText('Gareth')).toBeNull();
      expect(screen.getByText('Elara')).toBeTruthy();
    });
  });

  it('filters by occupation', async () => {
    npcService.getNpcs.mockResolvedValue([
      makeNpc({ id: 1, name: 'Gareth', occupation: 'Blacksmith' }),
      makeNpc({ id: 2, name: 'Elara', occupation: 'Innkeeper' }),
    ]);
    renderList();
    await waitFor(() => expect(screen.getByText('Gareth')).toBeTruthy());

    fireEvent.change(screen.getByPlaceholderText(/search name/i), { target: { value: 'innkeeper' } });

    await waitFor(() => {
      expect(screen.queryByText('Gareth')).toBeNull();
      expect(screen.getByText('Elara')).toBeTruthy();
    });
  });
});

describe('NPCList — location filter', () => {
  it('unplaced filter shows only NPCs with no last_known_location_id', async () => {
    npcService.getNpcs.mockResolvedValue([
      makeNpc({ id: 1, name: 'Wanderer', last_known_location_id: null }),
      makeNpc({ id: 2, name: 'Local', last_known_location_id: 10 }),
    ]);
    locationService.getLocations.mockResolvedValue([
      { id: 10, name: 'Ironhold', parent_location_id: null, pin_child_ids: [] },
    ]);
    renderList();
    await waitFor(() => expect(screen.getByText('Wanderer')).toBeTruthy());

    // Open location select and choose Unplaced
    const triggers = screen.getAllByRole('combobox');
    const locationTrigger = triggers[0]; // first select = location
    fireEvent.click(locationTrigger);
    const unplacedOption = await screen.findByText('Unplaced');
    fireEvent.click(unplacedOption);

    await waitFor(() => {
      expect(screen.getByText('Wanderer')).toBeTruthy();
      expect(screen.queryByText('Local')).toBeNull();
    });
  });

  it('location filter includes NPCs at child locations — hierarchy-aware', async () => {
    npcService.getNpcs.mockResolvedValue([
      makeNpc({ id: 1, name: 'CityNPC', last_known_location_id: 10 }),
      makeNpc({ id: 2, name: 'TownNPC', last_known_location_id: 11 }),
      makeNpc({ id: 3, name: 'Elsewhere', last_known_location_id: 99 }),
    ]);
    locationService.getLocations.mockResolvedValue([
      { id: 10, name: 'Kingdom', parent_location_id: null, pin_child_ids: [] },
      { id: 11, name: 'Ironhold', parent_location_id: 10, pin_child_ids: [] },
      { id: 99, name: 'Other Region', parent_location_id: null, pin_child_ids: [] },
    ]);
    renderList();
    await waitFor(() => expect(screen.getByText('CityNPC')).toBeTruthy());

    const triggers = screen.getAllByRole('combobox');
    fireEvent.click(triggers[0]);
    const kingdomOption = await screen.findByText('Kingdom');
    fireEvent.click(kingdomOption);

    await waitFor(() => {
      expect(screen.getByText('CityNPC')).toBeTruthy();
      expect(screen.getByText('TownNPC')).toBeTruthy();
      expect(screen.queryByText('Elsewhere')).toBeNull();
    });
  });
});

describe('NPCList — sort', () => {
  it('sort by name Z-A reverses alphabetical order', async () => {
    npcService.getNpcs.mockResolvedValue([
      makeNpc({ id: 1, name: 'Aaron' }),
      makeNpc({ id: 2, name: 'Zara' }),
    ]);
    renderList();
    await waitFor(() => expect(screen.getByText('Aaron')).toBeTruthy());

    const triggers = screen.getAllByRole('combobox');
    const sortTrigger = triggers[2]; // third select = sort
    fireEvent.click(sortTrigger);
    const zaOption = await screen.findByText('Name (Z–A)');
    fireEvent.click(zaOption);

    await waitFor(() => {
      const cards = screen.getAllByText(/Aaron|Zara/);
      expect(cards[0].textContent).toBe('Zara');
    });
  });

  it('sort by recently added orders by id descending', async () => {
    npcService.getNpcs.mockResolvedValue([
      makeNpc({ id: 1, name: 'OldNPC' }),
      makeNpc({ id: 5, name: 'NewNPC' }),
    ]);
    renderList();
    await waitFor(() => expect(screen.getByText('OldNPC')).toBeTruthy());

    const triggers = screen.getAllByRole('combobox');
    fireEvent.click(triggers[2]); // third select = sort
    const recentOption = await screen.findByText('Recently added');
    fireEvent.click(recentOption);

    await waitFor(() => {
      const cards = screen.getAllByText(/OldNPC|NewNPC/);
      expect(cards[0].textContent).toBe('NewNPC');
    });
  });
});

describe('NPCList — GM vs player view', () => {
  it('shows New NPC button for GM', async () => {
    renderList();
    await waitFor(() => expect(screen.getByText('New NPC')).toBeTruthy());
  });

  it('hides New NPC button for player', async () => {
    useCampaign.mockReturnValue({ campaign: PLAYER_CAMPAIGN });
    renderList();
    await waitFor(() => expect(screen.queryByText('No NPCs Yet')).toBeTruthy());
    expect(screen.queryByText('New NPC')).toBeNull();
  });
});
