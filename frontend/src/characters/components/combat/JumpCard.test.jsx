import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import JumpCard from '@/characters/components/combat/JumpCard';

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useParams: () => ({ campaignId: '7' }),
}));

function renderCard(props) {
  return render(
    <MemoryRouter>
      <JumpCard {...props} />
    </MemoryRouter>
  );
}

describe('JumpCard', () => {
  it('shows the four computed jump distances for the character STR', () => {
    renderCard({ strength: 16, feats: [] }); // mod +3
    expect(screen.getByTestId('jump-long-running')).toHaveTextContent('16 ft');
    expect(screen.getByTestId('jump-long-standing')).toHaveTextContent('8 ft');
    expect(screen.getByTestId('jump-high-running')).toHaveTextContent('6 ft');
    expect(screen.getByTestId('jump-high-standing')).toHaveTextContent('3 ft');
  });

  it('links to the encyclopedia jump page with the campaign id', () => {
    renderCard({ strength: 10 });
    expect(screen.getByTestId('jump-learn-more')).toHaveAttribute(
      'href',
      '/campaigns/7/encyclopedia/mechanics/jump'
    );
  });

  it('applies the Athlete feat to the distances (running long jump = STR)', () => {
    renderCard({ strength: 14, feats: [{ name: 'Athlete' }] });
    expect(screen.getByTestId('jump-long-running')).toHaveTextContent('14 ft');
  });

  it('shows an Athlete note (5 ft running start) only when the feat is present', () => {
    const { rerender } = renderCard({ strength: 14 });
    expect(screen.queryByTestId('jump-feat-note')).not.toBeInTheDocument();
    rerender(
      <MemoryRouter>
        <JumpCard strength={14} feats={[{ name: 'Athlete' }]} />
      </MemoryRouter>
    );
    const note = screen.getByTestId('jump-feat-note');
    expect(note).toHaveTextContent('Athlete');
    expect(note).toHaveTextContent('5 ft');
  });

  it('applies Remarkable Athlete (+STR mod) to the running long jump for a Champion Fighter L7', () => {
    renderCard({ strength: 16, charClass: 'Fighter', subclass: 'Champion', level: 7 }); // mod +3
    expect(screen.getByTestId('jump-long-running')).toHaveTextContent('19 ft'); // 16 + 3
    expect(screen.getByTestId('jump-long-standing')).toHaveTextContent('8 ft'); // standing unchanged
    expect(screen.getByTestId('jump-high-running')).toHaveTextContent('6 ft'); // high unchanged
    const note = screen.getByTestId('jump-remarkable-athlete-note');
    expect(note).toHaveTextContent('Remarkable Athlete');
    expect(note).toHaveTextContent('+3 ft');
  });

  it('does not apply Remarkable Athlete below level 7 or for other subclasses', () => {
    renderCard({ strength: 16, charClass: 'Fighter', subclass: 'Champion', level: 6 });
    expect(screen.getByTestId('jump-long-running')).toHaveTextContent('16 ft');
    expect(screen.queryByTestId('jump-remarkable-athlete-note')).not.toBeInTheDocument();
  });

  it('does not add a jump bonus for a 2024 Champion (that version grants advantage, not a jump bonus)', () => {
    renderCard({ strength: 16, charClass: 'Fighter', subclass: 'Champion', level: 7, edition: '5.5e' });
    expect(screen.getByTestId('jump-long-running')).toHaveTextContent('16 ft');
    expect(screen.queryByTestId('jump-remarkable-athlete-note')).not.toBeInTheDocument();
  });

  it('renders no calculation details (those live on the mechanics page)', () => {
    renderCard({ strength: 12 });
    expect(screen.queryByTestId('jump-details-toggle')).not.toBeInTheDocument();
    expect(screen.queryByTestId('jump-details')).not.toBeInTheDocument();
  });
});
