import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MechanicsTab from './MechanicsTab';

vi.mock('react-router-dom', async () => ({
  ...(await vi.importActual('react-router-dom')),
  useParams: () => ({ campaignId: '3' }),
}));

function renderTab() {
  return render(
    <MemoryRouter>
      <MechanicsTab />
    </MemoryRouter>
  );
}

describe('MechanicsTab', () => {
  it('renders an available Jumping card linking to its page', () => {
    renderTab();
    const card = screen.getByTestId('mechanic-card-jump');
    expect(card).toHaveTextContent('Jumping');
    expect(card).toHaveAttribute('href', '/campaigns/3/encyclopedia/mechanics/jump');
  });

  it('renders planned mechanics as non-linking "Coming soon" cards', () => {
    renderTab();
    const planned = screen.getByTestId('mechanic-card-conditions');
    expect(planned).toHaveTextContent('Coming soon');
    expect(planned).not.toHaveAttribute('href');
  });

  it('renders Armor Class as an available linking card', () => {
    renderTab();
    const ac = screen.getByTestId('mechanic-card-armor-class');
    expect(ac).toHaveAttribute('href', '/campaigns/3/encyclopedia/mechanics/armor-class');
  });
});
