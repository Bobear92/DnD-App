import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import SpellEditPage from './SpellEditPage';

vi.mock('../encyclopediaService', () => ({
  default: {
    getSpell: vi.fn(),
    createSpell: vi.fn(),
    updateSpell: vi.fn(),
    deleteSpell: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => ({
  ...await vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

import encyclopediaService from '../encyclopediaService';

const EXISTING_SPELL = {
  id: 42,
  name: 'Shadow Bolt',
  level: 2,
  school: 'Necromancy',
  casting_time: '1 action',
  range: '60 feet',
  components: 'V, S',
  duration: 'Instantaneous',
  description: 'A bolt of shadowy energy.',
  higher_level: 'Deals extra 1d6 per slot level above 2nd.',
  ritual: false,
  concentration: false,
  classes: 'Wizard',
  owner_type: 'campaign',
  owner_id: 1,
};

function renderNew(campaignId = '1') {
  return render(
    <MemoryRouter initialEntries={[`/campaigns/${campaignId}/encyclopedia/spells/new`]}>
      <Routes>
        <Route
          path="/campaigns/:campaignId/encyclopedia/spells/:spellId"
          element={<SpellEditPage />}
        />
      </Routes>
    </MemoryRouter>
  );
}

function renderEdit(spellId = '42', campaignId = '1') {
  return render(
    <MemoryRouter initialEntries={[`/campaigns/${campaignId}/encyclopedia/spells/${spellId}`]}>
      <Routes>
        <Route
          path="/campaigns/:campaignId/encyclopedia/spells/:spellId"
          element={<SpellEditPage />}
        />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  encyclopediaService.getSpell.mockResolvedValue(EXISTING_SPELL);
  encyclopediaService.createSpell.mockResolvedValue({ id: 99 });
  encyclopediaService.updateSpell.mockResolvedValue(EXISTING_SPELL);
  encyclopediaService.deleteSpell.mockResolvedValue({ message: 'Deleted' });
  vi.spyOn(window, 'confirm').mockReturnValue(true);
});

describe('SpellEditPage — new spell', () => {
  it('shows "New Homebrew Spell" title for new route', () => {
    renderNew();
    expect(screen.getByText('New Homebrew Spell')).toBeInTheDocument();
  });

  it('does not call getSpell for new route', () => {
    renderNew();
    expect(encyclopediaService.getSpell).not.toHaveBeenCalled();
  });

  it('renders empty form for new spell', () => {
    renderNew();
    expect(screen.getByTestId('spell-name-input').value).toBe('');
  });

  it('shows "Create Spell" on save button for new route', () => {
    renderNew();
    expect(screen.getByTestId('save-spell-btn')).toHaveTextContent('Create Spell');
  });

  it('does not show delete button for new spell', () => {
    renderNew();
    expect(screen.queryByTestId('delete-spell-page-btn')).not.toBeInTheDocument();
  });

  it('calls createSpell with owner_type campaign and navigates on save', async () => {
    renderNew();
    fireEvent.change(screen.getByTestId('spell-name-input'), { target: { value: 'My Spell' } });
    fireEvent.click(screen.getByTestId('save-spell-btn'));
    await waitFor(() =>
      expect(encyclopediaService.createSpell).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'My Spell',
          owner_type: 'campaign',
          owner_id: 1,
        })
      )
    );
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith(
      '/campaigns/1/encyclopedia/spells/99',
      { replace: true }
    ));
  });

  it('shows error and does not call createSpell when name is empty', async () => {
    renderNew();
    fireEvent.click(screen.getByTestId('save-spell-btn'));
    expect(screen.getByText('Spell name is required.')).toBeInTheDocument();
    expect(encyclopediaService.createSpell).not.toHaveBeenCalled();
  });

  it('shows error message when createSpell fails', async () => {
    encyclopediaService.createSpell.mockRejectedValue({
      response: { data: { detail: 'A spell with this name already exists.' } },
    });
    renderNew();
    fireEvent.change(screen.getByTestId('spell-name-input'), { target: { value: 'Bad Spell' } });
    fireEvent.click(screen.getByTestId('save-spell-btn'));
    await waitFor(() =>
      expect(screen.getByText('A spell with this name already exists.')).toBeInTheDocument()
    );
  });

  it('shows generic error when createSpell fails without detail', async () => {
    encyclopediaService.createSpell.mockRejectedValue(new Error('Network error'));
    renderNew();
    fireEvent.change(screen.getByTestId('spell-name-input'), { target: { value: 'My Spell' } });
    fireEvent.click(screen.getByTestId('save-spell-btn'));
    await waitFor(() =>
      expect(screen.getByText('Save failed. Please try again.')).toBeInTheDocument()
    );
  });
});

describe('SpellEditPage — edit existing spell', () => {
  it('shows loading state while fetching', () => {
    encyclopediaService.getSpell.mockReturnValue(new Promise(() => {}));
    renderEdit();
    expect(screen.getByText('Loading spell…')).toBeInTheDocument();
  });

  it('shows "Edit: Shadow Bolt" title after load', async () => {
    renderEdit();
    await waitFor(() => expect(screen.getByText('Edit: Shadow Bolt')).toBeInTheDocument());
  });

  it('populates form fields from loaded spell', async () => {
    renderEdit();
    await waitFor(() => expect(screen.getByTestId('spell-name-input').value).toBe('Shadow Bolt'));
    expect(screen.getByTestId('spell-range-input').value).toBe('60 feet');
    expect(screen.getByTestId('spell-description-input').value).toBe('A bolt of shadowy energy.');
    expect(screen.getByTestId('spell-higher-level-input').value).toBe(
      'Deals extra 1d6 per slot level above 2nd.'
    );
  });

  it('shows "Save Changes" on save button for edit route', async () => {
    renderEdit();
    await waitFor(() => screen.getByText('Edit: Shadow Bolt'));
    expect(screen.getByTestId('save-spell-btn')).toHaveTextContent('Save Changes');
  });

  it('shows delete button for existing spell', async () => {
    renderEdit();
    await waitFor(() => screen.getByText('Edit: Shadow Bolt'));
    expect(screen.getByTestId('delete-spell-page-btn')).toBeInTheDocument();
  });

  it('calls updateSpell (not createSpell) on save', async () => {
    renderEdit();
    await waitFor(() => screen.getByTestId('spell-name-input'));
    fireEvent.change(screen.getByTestId('spell-range-input'), { target: { value: '90 feet' } });
    fireEvent.click(screen.getByTestId('save-spell-btn'));
    await waitFor(() =>
      expect(encyclopediaService.updateSpell).toHaveBeenCalledWith(
        '42',
        expect.objectContaining({ range: '90 feet' })
      )
    );
    expect(encyclopediaService.createSpell).not.toHaveBeenCalled();
  });

  it('does not call updateSpell when form is unchanged (save button disabled)', async () => {
    renderEdit();
    await waitFor(() => screen.getByTestId('spell-name-input'));
    expect(screen.getByTestId('save-spell-btn')).toBeDisabled();
  });

  it('calls deleteSpell and navigates to encyclopedia on confirm', async () => {
    renderEdit();
    await waitFor(() => screen.getByTestId('delete-spell-page-btn'));
    fireEvent.click(screen.getByTestId('delete-spell-page-btn'));
    await waitFor(() =>
      expect(encyclopediaService.deleteSpell).toHaveBeenCalledWith('42')
    );
    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/campaigns/1/encyclopedia', { replace: true }));
  });

  it('does not call deleteSpell when confirm is cancelled', async () => {
    window.confirm.mockReturnValue(false);
    renderEdit();
    await waitFor(() => screen.getByTestId('delete-spell-page-btn'));
    fireEvent.click(screen.getByTestId('delete-spell-page-btn'));
    expect(encyclopediaService.deleteSpell).not.toHaveBeenCalled();
  });

  it('shows error message when getSpell fails', async () => {
    encyclopediaService.getSpell.mockRejectedValue(new Error('Not found'));
    renderEdit();
    await waitFor(() => expect(screen.getByText('Spell not found.')).toBeInTheDocument());
  });
});

describe('SpellEditPage — navigation', () => {
  it('back button navigates to encyclopedia', async () => {
    renderNew();
    fireEvent.click(screen.getByText('Encyclopedia'));
    expect(mockNavigate).toHaveBeenCalledWith('/campaigns/1/encyclopedia');
  });

  it('renders ritual and concentration checkboxes', () => {
    renderNew();
    expect(screen.getByTestId('ritual-checkbox')).toBeInTheDocument();
    expect(screen.getByTestId('concentration-checkbox')).toBeInTheDocument();
  });

  it('toggling ritual checkbox updates form', () => {
    renderNew();
    const checkbox = screen.getByTestId('ritual-checkbox');
    expect(checkbox.checked).toBe(false);
    fireEvent.click(checkbox);
    expect(checkbox.checked).toBe(true);
  });
});
