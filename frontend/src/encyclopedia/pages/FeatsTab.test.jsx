import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import FeatsTab from './FeatsTab';

vi.mock('../featService', () => ({
  default: { getFeats: vi.fn() },
}));

import featService from '../featService';

const FEATS = [
  {
    id: 1, name: 'Alert', edition: '5e',
    description: 'You gain a +5 bonus to initiative.',
    prerequisites: {}, source: 'PHB 2014', repeatable: false,
  },
  {
    id: 2, name: 'Defensive Duelist', edition: '5e',
    description: 'Add your proficiency bonus to AC with a reaction.',
    prerequisites: { text: 'Dexterity 13 or higher' }, source: 'PHB 2014', repeatable: false,
  },
  {
    id: 3, name: 'Resilient', edition: '5e',
    description: 'Increase one ability score and gain its save proficiency.',
    prerequisites: {}, source: 'PHB 2014', repeatable: true,
  },
];

beforeEach(() => {
  vi.clearAllMocks();
  featService.getFeats.mockResolvedValue(FEATS);
});

describe('FeatsTab', () => {
  it('shows a loading state initially', () => {
    featService.getFeats.mockReturnValue(new Promise(() => {}));
    render(<FeatsTab campaignId="1" edition="5e" />);
    expect(screen.getByText('Loading feats…')).toBeInTheDocument();
  });

  it('calls getFeats with campaignId and edition', async () => {
    render(<FeatsTab campaignId="7" edition="5.5e" />);
    await waitFor(() => expect(featService.getFeats).toHaveBeenCalledWith('7', '5.5e'));
  });

  it('renders the feats returned by the service', async () => {
    render(<FeatsTab campaignId="1" edition="5e" />);
    await waitFor(() => expect(screen.getByText('Alert')).toBeInTheDocument());
    expect(screen.getByText('Defensive Duelist')).toBeInTheDocument();
    expect(screen.getByText('Resilient')).toBeInTheDocument();
  });

  it('shows the feat count', async () => {
    render(<FeatsTab campaignId="1" edition="5e" />);
    await waitFor(() => expect(screen.getByText('3 feats')).toBeInTheDocument());
  });

  it('filters feats by search', async () => {
    render(<FeatsTab campaignId="1" edition="5e" />);
    await waitFor(() => expect(screen.getByText('Alert')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('feat-search'), { target: { value: 'resil' } });
    expect(screen.getByText('Resilient')).toBeInTheDocument();
    expect(screen.queryByText('Alert')).not.toBeInTheDocument();
  });

  it('shows an empty state when no feats match the search', async () => {
    render(<FeatsTab campaignId="1" edition="5e" />);
    await waitFor(() => expect(screen.getByText('Alert')).toBeInTheDocument());
    fireEvent.change(screen.getByTestId('feat-search'), { target: { value: 'zzzz' } });
    expect(screen.getByText('No feats match your search.')).toBeInTheDocument();
  });

  it('opens a detail dialog with the full description on click', async () => {
    render(<FeatsTab campaignId="1" edition="5e" />);
    await waitFor(() => expect(screen.getByText('Defensive Duelist')).toBeInTheDocument());
    // Defensive Duelist has a prerequisite, so its row subtitle shows the prereq —
    // the description only appears once the dialog opens.
    expect(screen.queryByText('Add your proficiency bonus to AC with a reaction.')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('feat-row-2'));
    expect(await screen.findByText('Add your proficiency bonus to AC with a reaction.')).toBeInTheDocument();
  });

  it('shows the prerequisite in the detail dialog', async () => {
    render(<FeatsTab campaignId="1" edition="5e" />);
    await waitFor(() => expect(screen.getByText('Defensive Duelist')).toBeInTheDocument());
    fireEvent.click(screen.getByTestId('feat-row-2'));
    expect(await screen.findByText('Prerequisite')).toBeInTheDocument();
    expect(screen.getByText('Dexterity 13 or higher')).toBeInTheDocument();
  });

  it('re-fetches when the edition prop changes', async () => {
    const { rerender } = render(<FeatsTab campaignId="1" edition="5e" />);
    await waitFor(() => expect(featService.getFeats).toHaveBeenCalledWith('1', '5e'));
    rerender(<FeatsTab campaignId="1" edition="5.5e" />);
    await waitFor(() => expect(featService.getFeats).toHaveBeenCalledWith('1', '5.5e'));
  });

  it('shows an empty state when the service returns no feats', async () => {
    featService.getFeats.mockResolvedValue([]);
    render(<FeatsTab campaignId="1" edition="5e" />);
    await waitFor(() => expect(screen.getByText('No feats match your search.')).toBeInTheDocument());
  });
});
