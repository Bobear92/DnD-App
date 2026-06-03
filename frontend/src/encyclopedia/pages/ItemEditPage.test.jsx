import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ItemEditPage from './ItemEditPage';

vi.mock('../itemService', () => ({
  default: { getItem: vi.fn(), createItem: vi.fn(), updateItem: vi.fn(), deleteItem: vi.fn() },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...await vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

import itemService from '../itemService';

const ROUTE = '/campaigns/:campaignId/encyclopedia/items/:category/:itemId';

function renderAt(path) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path={ROUTE} element={<ItemEditPage />} />
      </Routes>
    </MemoryRouter>
  );
}

const WEAPON = {
  id: 3, name: 'Homebrew Blade', weapon_category: 'Martial', weapon_type: 'Melee',
  damage: '2d6', damage_type: 'Slashing', properties: 'Heavy', cost: '500 gp',
  weight: '5 lb.', description: 'A custom weapon.', owner_type: 'campaign', owner_id: 1,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('ItemEditPage — new', () => {
  it('shows the New Homebrew title and Create button, no delete', () => {
    renderAt('/campaigns/1/encyclopedia/items/weapons/new');
    expect(screen.getByText('New Homebrew Weapon')).toBeInTheDocument();
    expect(screen.getByTestId('save-item-btn')).toHaveTextContent('Create Weapon');
    expect(screen.queryByTestId('delete-item-page-btn')).not.toBeInTheDocument();
    expect(itemService.getItem).not.toHaveBeenCalled();
  });

  it('blocks save when a required field is empty', () => {
    renderAt('/campaigns/1/encyclopedia/items/weapons/new');
    fireEvent.click(screen.getByTestId('save-item-btn'));
    expect(screen.getByText('Name is required.')).toBeInTheDocument();
    expect(itemService.createItem).not.toHaveBeenCalled();
  });

  it('creates and navigates when required fields are filled', async () => {
    itemService.createItem.mockResolvedValue({ id: 99 });
    renderAt('/campaigns/1/encyclopedia/items/weapons/new');
    fireEvent.change(screen.getByTestId('item-name-input'), { target: { value: 'Test Blade' } });
    fireEvent.change(screen.getByTestId('item-damage-input'), { target: { value: '1d6' } });
    fireEvent.change(screen.getByTestId('item-damage_type-input'), { target: { value: 'Slashing' } });
    fireEvent.change(screen.getByTestId('item-cost-input'), { target: { value: '5 gp' } });
    fireEvent.change(screen.getByTestId('item-weight-input'), { target: { value: '2 lb.' } });
    fireEvent.click(screen.getByTestId('save-item-btn'));
    await waitFor(() => expect(itemService.createItem).toHaveBeenCalledWith(
      'weapons',
      expect.objectContaining({ name: 'Test Blade', owner_type: 'campaign', owner_id: 1 })
    ));
    expect(mockNavigate).toHaveBeenCalledWith('/campaigns/1/encyclopedia/items/weapons/99', { replace: true });
  });

  it('coerces number fields (armor) to integers in the payload', async () => {
    itemService.createItem.mockResolvedValue({ id: 12 });
    renderAt('/campaigns/1/encyclopedia/items/armor/new');
    fireEvent.change(screen.getByTestId('item-name-input'), { target: { value: 'Plate' } });
    fireEvent.change(screen.getByTestId('item-armor_class-input'), { target: { value: '18' } });
    fireEvent.change(screen.getByTestId('item-cost-input'), { target: { value: '1500 gp' } });
    fireEvent.change(screen.getByTestId('item-weight-input'), { target: { value: '65 lb.' } });
    fireEvent.click(screen.getByTestId('save-item-btn'));
    await waitFor(() => expect(itemService.createItem).toHaveBeenCalledWith(
      'armor',
      expect.objectContaining({ armor_class: 18 })
    ));
  });
});

describe('ItemEditPage — edit', () => {
  beforeEach(() => {
    itemService.getItem.mockResolvedValue(WEAPON);
  });

  it('loads and populates the form', async () => {
    renderAt('/campaigns/1/encyclopedia/items/weapons/3');
    await waitFor(() => expect(itemService.getItem).toHaveBeenCalledWith('weapons', '3'));
    await waitFor(() => expect(screen.getByText('Edit: Homebrew Blade')).toBeInTheDocument());
    expect(screen.getByTestId('item-name-input')).toHaveValue('Homebrew Blade');
    expect(screen.getByTestId('save-item-btn')).toHaveTextContent('Save Changes');
    expect(screen.getByTestId('delete-item-page-btn')).toBeInTheDocument();
  });

  it('disables Save until the form is dirty, then updates', async () => {
    itemService.updateItem.mockResolvedValue(WEAPON);
    renderAt('/campaigns/1/encyclopedia/items/weapons/3');
    await waitFor(() => screen.getByTestId('item-name-input'));
    expect(screen.getByTestId('save-item-btn')).toBeDisabled();
    fireEvent.change(screen.getByTestId('item-name-input'), { target: { value: 'Renamed Blade' } });
    expect(screen.getByTestId('save-item-btn')).not.toBeDisabled();
    fireEvent.click(screen.getByTestId('save-item-btn'));
    await waitFor(() => expect(itemService.updateItem).toHaveBeenCalledWith(
      'weapons', '3', expect.objectContaining({ name: 'Renamed Blade' })
    ));
  });

  it('deletes and navigates on confirm', async () => {
    itemService.deleteItem.mockResolvedValue({});
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderAt('/campaigns/1/encyclopedia/items/weapons/3');
    await waitFor(() => screen.getByTestId('delete-item-page-btn'));
    fireEvent.click(screen.getByTestId('delete-item-page-btn'));
    await waitFor(() => expect(itemService.deleteItem).toHaveBeenCalledWith('weapons', '3'));
    expect(mockNavigate).toHaveBeenCalledWith('/campaigns/1/encyclopedia', { replace: true });
    window.confirm.mockRestore();
  });
});

describe('ItemEditPage — unknown category', () => {
  it('renders a fallback for an unknown category slug', () => {
    renderAt('/campaigns/1/encyclopedia/items/bogus/new');
    expect(screen.getByText('Unknown item category.')).toBeInTheDocument();
  });
});
