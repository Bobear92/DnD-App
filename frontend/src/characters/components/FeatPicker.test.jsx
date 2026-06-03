import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import FeatPicker from './FeatPicker';

const FEATS = [
  { id: 1, name: 'Alert', description: '+5 to initiative.', prerequisites: {}, source: 'PHB 2014', repeatable: false },
  { id: 2, name: 'Grappler', description: 'Advantage on grapple.', prerequisites: { text: 'Strength 13 or higher' }, source: 'PHB 2014', repeatable: false },
  { id: 3, name: 'Lucky', description: 'Reroll a d20.', prerequisites: {}, source: 'PHB 2014', repeatable: true },
];

describe('FeatPicker', () => {
  it('shows a placeholder when nothing is selected', () => {
    render(<FeatPicker feats={FEATS} value={null} onChange={vi.fn()} testIdPrefix="feat" />);
    expect(screen.getByTestId('feat-select')).toHaveTextContent('Select a feat…');
  });

  it('opens the dialog and lists every feat with its description', async () => {
    render(<FeatPicker feats={FEATS} value={null} onChange={vi.fn()} testIdPrefix="feat" />);
    fireEvent.click(screen.getByTestId('feat-select'));
    await waitFor(() => expect(screen.getByTestId('feat-option-1')).toBeInTheDocument());
    expect(screen.getByText('+5 to initiative.')).toBeInTheDocument();
    expect(screen.getByText('Advantage on grapple.')).toBeInTheDocument();
    expect(screen.getByText('Reroll a d20.')).toBeInTheDocument();
  });

  it('shows a prerequisite for feats that have one', async () => {
    render(<FeatPicker feats={FEATS} value={null} onChange={vi.fn()} testIdPrefix="feat" />);
    fireEvent.click(screen.getByTestId('feat-select'));
    await waitFor(() => expect(screen.getByTestId('feat-option-2')).toBeInTheDocument());
    expect(screen.getByText(/Prerequisite: Strength 13 or higher/)).toBeInTheDocument();
  });

  it('selects a feat and passes { id, name } to onChange', async () => {
    const onChange = vi.fn();
    render(<FeatPicker feats={FEATS} value={null} onChange={onChange} testIdPrefix="feat" />);
    fireEvent.click(screen.getByTestId('feat-select'));
    await waitFor(() => expect(screen.getByTestId('feat-option-1')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('feat-option-1'));
    expect(onChange).toHaveBeenCalledWith({ id: 1, name: 'Alert' });
  });

  it('renders the selected feat name and its description below the trigger', () => {
    render(<FeatPicker feats={FEATS} value={{ id: 1, name: 'Alert' }} onChange={vi.fn()} testIdPrefix="feat" />);
    expect(screen.getByTestId('feat-select')).toHaveTextContent('Alert');
    expect(screen.getByTestId('feat-detail')).toHaveTextContent('+5 to initiative.');
  });

  it('filters the list with the search box', async () => {
    render(<FeatPicker feats={FEATS} value={null} onChange={vi.fn()} testIdPrefix="feat" />);
    fireEvent.click(screen.getByTestId('feat-select'));
    await waitFor(() => expect(screen.getByTestId('feat-search')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('feat-search'), { target: { value: 'luck' } });
    expect(screen.getByTestId('feat-option-3')).toBeInTheDocument();
    expect(screen.queryByTestId('feat-option-1')).not.toBeInTheDocument();
  });

  it('shows an empty state when the search matches nothing', async () => {
    render(<FeatPicker feats={FEATS} value={null} onChange={vi.fn()} testIdPrefix="feat" />);
    fireEvent.click(screen.getByTestId('feat-select'));
    await waitFor(() => expect(screen.getByTestId('feat-search')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('feat-search'), { target: { value: 'zzzzz' } });
    expect(screen.getByText('No feats match your search.')).toBeInTheDocument();
  });
});
