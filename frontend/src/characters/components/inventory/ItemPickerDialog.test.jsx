import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ItemPickerDialog from '@/characters/components/inventory/ItemPickerDialog';
import { ITEM_CATEGORY_MAP } from '@/encyclopedia/data/itemCategories';

vi.mock('@/encyclopedia/itemService', () => ({
  default: { getItems: vi.fn() },
}));

import itemService from '@/encyclopedia/itemService';

const weapons = ITEM_CATEGORY_MAP.weapons;

function renderPicker(props = {}) {
  return render(
    <ItemPickerDialog
      category={weapons}
      campaignId="1"
      open={props.open ?? true}
      onClose={props.onClose ?? vi.fn()}
      onAdd={props.onAdd ?? vi.fn()}
    />
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  itemService.getItems.mockResolvedValue([
    { id: 1, name: 'Longsword', weapon_category: 'Martial', weapon_type: 'Melee' },
    { id: 2, name: 'Dagger', weapon_category: 'Simple', weapon_type: 'Melee' },
  ]);
});

describe('ItemPickerDialog', () => {
  it('loads items for the category when open', async () => {
    renderPicker();
    await waitFor(() => expect(itemService.getItems).toHaveBeenCalledWith('weapons', '1'));
    expect(await screen.findByText('Longsword')).toBeInTheDocument();
    expect(screen.getByText('Dagger')).toBeInTheDocument();
  });

  it('filters by search', async () => {
    renderPicker();
    await screen.findByText('Longsword');
    fireEvent.change(screen.getByTestId('item-picker-search'), { target: { value: 'dag' } });
    expect(screen.getByText('Dagger')).toBeInTheDocument();
    expect(screen.queryByText('Longsword')).not.toBeInTheDocument();
  });

  it('calls onAdd and onClose when an item is picked', async () => {
    const onAdd = vi.fn();
    const onClose = vi.fn();
    renderPicker({ onAdd, onClose });
    await screen.findByText('Longsword');
    fireEvent.click(screen.getByTestId('item-picker-option-1'));
    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ id: 1, name: 'Longsword' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('shows an empty state when no items exist', async () => {
    itemService.getItems.mockResolvedValue([]);
    renderPicker();
    await waitFor(() => expect(screen.getByText('No weapons found.')).toBeInTheDocument());
  });

  it('does not load when closed', () => {
    renderPicker({ open: false });
    expect(itemService.getItems).not.toHaveBeenCalled();
  });
});
