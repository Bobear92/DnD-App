import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import WalletCard from './WalletCard';
import { totalInGp, formatGp, startingGoldForBackground } from './currencyData';

describe('WalletCard', () => {
  it('renders 4 coins in standard mode (no electrum)', () => {
    render(<WalletCard currency={{ gp: 5 }} mode="standard" onChange={() => {}} />);
    ['pp', 'gp', 'sp', 'cp'].forEach((k) =>
      expect(screen.getByTestId(`wallet-coin-${k}`)).toBeInTheDocument()
    );
    expect(screen.queryByTestId('wallet-coin-ep')).not.toBeInTheDocument();
  });

  it('renders 5 coins in full mode (adds electrum)', () => {
    render(<WalletCard currency={{ gp: 5 }} mode="full" onChange={() => {}} />);
    ['pp', 'gp', 'ep', 'sp', 'cp'].forEach((k) =>
      expect(screen.getByTestId(`wallet-coin-${k}`)).toBeInTheDocument()
    );
  });

  it('defaults to standard mode when none given', () => {
    render(<WalletCard currency={{}} onChange={() => {}} />);
    expect(screen.queryByTestId('wallet-coin-ep')).not.toBeInTheDocument();
  });

  it('shows editable inputs for the owner', () => {
    render(<WalletCard currency={{ gp: 3 }} mode="standard" onChange={() => {}} />);
    expect(screen.getByTestId('wallet-coin-gp').tagName).toBe('INPUT');
  });

  it('renders read-only values (no inputs) when readOnly', () => {
    render(<WalletCard currency={{ gp: 7 }} mode="standard" readOnly onChange={() => {}} />);
    const gp = screen.getByTestId('wallet-coin-gp');
    expect(gp.tagName).not.toBe('INPUT');
    expect(gp).toHaveTextContent('7');
  });

  it('fires onChange with the full updated wallet when a coin changes', () => {
    const onChange = vi.fn();
    render(<WalletCard currency={{ gp: 1, sp: 2 }} mode="standard" onChange={onChange} />);
    fireEvent.change(screen.getByTestId('wallet-coin-gp'), { target: { value: '9' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ gp: 9, sp: 2 }));
  });

  it('clamps negative input to 0', () => {
    const onChange = vi.fn();
    render(<WalletCard currency={{ gp: 1 }} mode="standard" onChange={onChange} />);
    fireEvent.change(screen.getByTestId('wallet-coin-gp'), { target: { value: '-5' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ gp: 0 }));
  });

  it('shows the total value in gp', () => {
    render(<WalletCard currency={{ gp: 1, sp: 5, cp: 2 }} mode="standard" onChange={() => {}} />);
    expect(screen.getByTestId('wallet-total')).toHaveTextContent('1.52 gp');
  });
});

describe('currencyData helpers', () => {
  it('totalInGp sums every coin by gp value', () => {
    expect(totalInGp({ pp: 1, gp: 2, ep: 2, sp: 5, cp: 50 })).toBeCloseTo(10 + 2 + 1 + 0.5 + 0.5);
    expect(totalInGp({})).toBe(0);
    expect(totalInGp(null)).toBe(0);
  });

  it('formatGp trims trailing zeros and keeps integers clean', () => {
    expect(formatGp(10)).toBe('10');
    expect(formatGp(1.5)).toBe('1.5');
    expect(formatGp(1.52)).toBe('1.52');
  });

  it('startingGoldForBackground maps PHB backgrounds and falls back to 0', () => {
    expect(startingGoldForBackground('Noble')).toBe(25);
    expect(startingGoldForBackground('Acolyte')).toBe(15);
    expect(startingGoldForBackground('Hermit')).toBe(5);
    expect(startingGoldForBackground('Custom Homebrew')).toBe(0);
    expect(startingGoldForBackground(undefined)).toBe(0);
  });
});
