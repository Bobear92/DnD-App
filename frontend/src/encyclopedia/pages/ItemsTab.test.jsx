import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import ItemsTab from './ItemsTab';
import { ITEM_CATEGORY_MAP } from '../data/itemCategories';

vi.mock('../itemService', () => ({
  default: { getItems: vi.fn(), createItem: vi.fn() },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...await vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

import itemService from '../itemService';

const WEAPONS = [
  { id: 1, name: 'Longsword', weapon_category: 'Martial', weapon_type: 'Melee', damage: '1d8', damage_type: 'Slashing', properties: 'Versatile (1d10)', cost: '15 gp', weight: '3 lb.', description: 'A versatile blade.', owner_type: 'system', owner_id: null },
  { id: 2, name: 'Dagger', weapon_category: 'Simple', weapon_type: 'Melee', damage: '1d4', damage_type: 'Piercing', properties: 'Finesse, Light, Thrown', cost: '2 gp', weight: '1 lb.', description: 'A small knife.', owner_type: 'system', owner_id: null },
  { id: 3, name: 'Homebrew Blade', weapon_category: 'Martial', weapon_type: 'Melee', damage: '2d6', damage_type: 'Slashing', properties: 'Heavy', cost: '500 gp', weight: '5 lb.', description: 'A custom weapon.', owner_type: 'campaign', owner_id: 1 },
];

const weapons = ITEM_CATEGORY_MAP.weapons;

function renderTab(props = {}) {
  return render(
    <MemoryRouter initialEntries={['/campaigns/1/encyclopedia']}>
      <ItemsTab category={weapons} campaignId="1" isGm={false} {...props} />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  itemService.getItems.mockResolvedValue(WEAPONS);
});

describe('ItemsTab', () => {
  it('shows loading state initially', () => {
    itemService.getItems.mockReturnValue(new Promise(() => {}));
    renderTab();
    expect(screen.getByText('Loading weapons…')).toBeInTheDocument();
  });

  it('calls getItems with the category slug and campaignId', async () => {
    renderTab();
    await waitFor(() => expect(itemService.getItems).toHaveBeenCalledWith('weapons', '1'));
  });

  it('renders all items after load', async () => {
    renderTab();
    await waitFor(() => expect(screen.getByText('Longsword')).toBeInTheDocument());
    expect(screen.getByText('Dagger')).toBeInTheDocument();
    expect(screen.getByText('Homebrew Blade')).toBeInTheDocument();
  });

  it('shows item count', async () => {
    renderTab();
    await waitFor(() => expect(screen.getByText('3 weapons')).toBeInTheDocument());
  });

  it('filters by name search', async () => {
    renderTab();
    await waitFor(() => screen.getByTestId('item-search'));
    fireEvent.change(screen.getByTestId('item-search'), { target: { value: 'dag' } });
    expect(screen.getByText('Dagger')).toBeInTheDocument();
    expect(screen.queryByText('Longsword')).not.toBeInTheDocument();
  });

  it('filters by a config dropdown (weapon_category)', async () => {
    renderTab();
    await waitFor(() => screen.getByTestId('item-filter-weapon_category'));
    fireEvent.change(screen.getByTestId('item-filter-weapon_category'), { target: { value: 'Simple' } });
    await waitFor(() => expect(screen.queryByText('Longsword')).not.toBeInTheDocument());
    expect(screen.getByText('Dagger')).toBeInTheDocument();
  });

  it('marks campaign override items with (Campaign) label', async () => {
    renderTab();
    await waitFor(() => screen.getByText('Homebrew Blade'));
    expect(screen.getByText('(Campaign)')).toBeInTheDocument();
  });

  it('shows empty state when nothing matches', async () => {
    renderTab();
    await waitFor(() => screen.getByTestId('item-search'));
    fireEvent.change(screen.getByTestId('item-search'), { target: { value: 'zzzz' } });
    expect(screen.getByText('No weapons match your filters.')).toBeInTheDocument();
  });

  it('opens the detail dialog when a row is clicked', async () => {
    renderTab();
    await waitFor(() => screen.getByText('Longsword'));
    fireEvent.click(screen.getByTestId('item-row-1'));
    await waitFor(() => expect(screen.getByText('A versatile blade.')).toBeInTheDocument());
  });

  it('explains weapon attributes in the detail dialog', async () => {
    renderTab();
    await waitFor(() => screen.getByText('Longsword'));
    fireEvent.click(screen.getByTestId('item-row-1'));
    await waitFor(() => screen.getByText(/tap to learn what they mean/i));
    fireEvent.click(screen.getByTestId('weapon-prop-Versatile'));
    expect(screen.getByTestId('weapon-prop-description')).toHaveTextContent(/one or two hands/i);
  });

  it('shows Override button for system items when GM', async () => {
    renderTab({ isGm: true });
    await waitFor(() => screen.getByText('Longsword'));
    fireEvent.click(screen.getByTestId('item-row-1'));
    await waitFor(() => expect(screen.getByTestId('override-item-btn')).toBeInTheDocument());
  });

  it('hides Override button for players', async () => {
    renderTab({ isGm: false });
    await waitFor(() => screen.getByText('Longsword'));
    fireEvent.click(screen.getByTestId('item-row-1'));
    await waitFor(() => screen.getByText('A versatile blade.'));
    expect(screen.queryByTestId('override-item-btn')).not.toBeInTheDocument();
  });

  it('shows Edit Override button for campaign items when GM', async () => {
    renderTab({ isGm: true });
    await waitFor(() => screen.getByText('Homebrew Blade'));
    fireEvent.click(screen.getByTestId('item-row-3'));
    await waitFor(() => expect(screen.getByTestId('edit-override-btn')).toBeInTheDocument());
  });

  it('calls createItem and navigates on Override click', async () => {
    itemService.createItem.mockResolvedValue({ id: 99 });
    renderTab({ isGm: true });
    await waitFor(() => screen.getByText('Longsword'));
    fireEvent.click(screen.getByTestId('item-row-1'));
    await waitFor(() => screen.getByTestId('override-item-btn'));
    fireEvent.click(screen.getByTestId('override-item-btn'));
    await waitFor(() => expect(itemService.createItem).toHaveBeenCalledWith(
      'weapons',
      expect.objectContaining({ name: 'Longsword', owner_type: 'campaign', owner_id: 1 })
    ));
    expect(mockNavigate).toHaveBeenCalledWith('/campaigns/1/encyclopedia/items/weapons/99');
  });
});
