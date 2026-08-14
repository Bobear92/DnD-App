import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CompanionPanel from './CompanionPanel';

const echoKnight = (level) => ({
  charClass: 'Fighter', subclass: 'Echo Knight', edition: '5e', level,
});

describe('CompanionPanel', () => {
  it('renders nothing for a character with no companion', () => {
    const { container } = render(<CompanionPanel charClass="Fighter" subclass="Champion" edition="5e" level={10} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing below the unlock level', () => {
    const { container } = render(<CompanionPanel {...echoKnight(2)} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the echo's statblock for an Echo Knight", () => {
    render(<CompanionPanel {...echoKnight(5)} />);
    expect(screen.getByTestId('companion-echo')).toBeInTheDocument();
    expect(screen.getByText('Manifest Echo')).toBeInTheDocument();
    expect(screen.getByTestId('companion-echo-stat-ac')).toHaveTextContent('17');
    expect(screen.getByTestId('companion-echo-stat-hp')).toHaveTextContent('1');
  });

  it('expands the AC arithmetic on click', async () => {
    const user = userEvent.setup();
    render(<CompanionPanel {...echoKnight(5)} />);
    expect(screen.queryByTestId('companion-echo-stat-ac-breakdown')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('companion-echo-stat-ac'));
    const panel = screen.getByTestId('companion-echo-stat-ac-breakdown');
    expect(panel).toHaveTextContent('Proficiency bonus');
    expect(panel).toHaveTextContent('14');
  });

  it('shows the AC unsigned — it is an armor class, not a modifier', () => {
    render(<CompanionPanel {...echoKnight(5)} />);
    expect(screen.getByTestId('companion-echo-stat-ac')).not.toHaveTextContent('+17');
  });

  it('collapses each trait to its name until clicked', async () => {
    const user = userEvent.setup();
    render(<CompanionPanel {...echoKnight(5)} />);
    expect(screen.getByTestId('companion-echo-trait-swap')).toBeInTheDocument();
    expect(screen.queryByTestId('companion-echo-trait-swap-text')).not.toBeInTheDocument();
    await user.click(screen.getByTestId('companion-echo-trait-swap'));
    expect(screen.getByTestId('companion-echo-trait-swap-text')).toHaveTextContent('15 feet of your movement');
  });

  it('titles the card for two echoes at level 18 and explains the limit', () => {
    render(<CompanionPanel {...echoKnight(18)} />);
    expect(screen.getByText('2 Echoes')).toBeInTheDocument();
    expect(screen.getByTestId('companion-echo-count-note')).toHaveTextContent(/third/i);
  });

  it('titles the card for one echo below level 18', () => {
    render(<CompanionPanel {...echoKnight(17)} />);
    expect(screen.getByText('Echo')).toBeInTheDocument();
    expect(screen.queryByTestId('companion-echo-count-note')).not.toBeInTheDocument();
  });
});
