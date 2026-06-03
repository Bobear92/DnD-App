import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import CampaignItemsTab from './CampaignItemsTab';
import { ITEM_CATEGORY_MAP } from '../data/itemCategories';

vi.mock('../itemService', () => ({
  default: { getItems: vi.fn(), deleteItem: vi.fn() },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...await vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

import itemService from '../itemService';

const WEAPONS = [
  { id: 1, name: 'Longsword', weapon_category: 'Martial', weapon_type: 'Melee', owner_type: 'system', owner_id: null },
  { id: 3, name: 'Homebrew Blade', weapon_category: 'Martial', weapon_type: 'Melee', owner_type: 'campaign', owner_id: 1 },
];

const weapons = ITEM_CATEGORY_MAP.weapons;

function renderTab() {
  return render(
    <MemoryRouter>
      <CampaignItemsTab category={weapons} campaignId="1" />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  itemService.getItems.mockResolvedValue(WEAPONS);
});

describe('CampaignItemsTab', () => {
  it('calls getItems with the category slug and campaignId', async () => {
    renderTab();
    await waitFor(() => expect(itemService.getItems).toHaveBeenCalledWith('weapons', '1'));
  });

  it('shows only campaign-owned items', async () => {
    renderTab();
    await waitFor(() => expect(screen.getByText('Homebrew Blade')).toBeInTheDocument());
    expect(screen.queryByText('Longsword')).not.toBeInTheDocument();
  });

  it('shows empty state when there are no campaign items', async () => {
    itemService.getItems.mockResolvedValue([WEAPONS[0]]);
    renderTab();
    await waitFor(() => expect(screen.getByText('No campaign weapons yet.')).toBeInTheDocument());
  });

  it('navigates to the new homebrew form', async () => {
    renderTab();
    await waitFor(() => screen.getByTestId('new-homebrew-btn'));
    fireEvent.click(screen.getByTestId('new-homebrew-btn'));
    expect(mockNavigate).toHaveBeenCalledWith('/campaigns/1/encyclopedia/items/weapons/new');
  });

  it('navigates to edit on the edit button', async () => {
    renderTab();
    await waitFor(() => screen.getByTestId('edit-item-3'));
    fireEvent.click(screen.getByTestId('edit-item-3'));
    expect(mockNavigate).toHaveBeenCalledWith('/campaigns/1/encyclopedia/items/weapons/3');
  });

  it('filters by name search', async () => {
    renderTab();
    await waitFor(() => screen.getByTestId('campaign-item-search'));
    fireEvent.change(screen.getByTestId('campaign-item-search'), { target: { value: 'nomatch' } });
    expect(screen.queryByText('Homebrew Blade')).not.toBeInTheDocument();
  });

  it('opens a delete confirmation and deletes on confirm', async () => {
    itemService.deleteItem.mockResolvedValue({});
    renderTab();
    await waitFor(() => screen.getByTestId('delete-item-3'));
    fireEvent.click(screen.getByTestId('delete-item-3'));
    await waitFor(() => expect(screen.getByText('Delete Campaign Weapon')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(itemService.deleteItem).toHaveBeenCalledWith('weapons', 3));
  });

  it('cancel does not delete', async () => {
    renderTab();
    await waitFor(() => screen.getByTestId('delete-item-3'));
    fireEvent.click(screen.getByTestId('delete-item-3'));
    await waitFor(() => screen.getByText('Delete Campaign Weapon'));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(itemService.deleteItem).not.toHaveBeenCalled();
  });
});
