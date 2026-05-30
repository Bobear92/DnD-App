import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TraitBadgeList from './TraitBadge';

describe('TraitBadgeList', () => {
  it('renders all trait names', () => {
    render(<TraitBadgeList traits={['Darkvision', 'Dwarven Armor Training']} />);
    expect(screen.getByText('Darkvision')).toBeInTheDocument();
    expect(screen.getByText('Dwarven Armor Training')).toBeInTheDocument();
  });

  it('does not show description panel by default', () => {
    render(<TraitBadgeList traits={['Darkvision']} />);
    expect(screen.queryByTestId('trait-description-panel')).not.toBeInTheDocument();
  });

  it('shows description panel when a known trait is clicked', () => {
    render(<TraitBadgeList traits={['Darkvision']} />);
    fireEvent.click(screen.getByText('Darkvision'));
    expect(screen.getByTestId('trait-description-panel')).toBeInTheDocument();
    expect(screen.getByText(/You can see in dim light/)).toBeInTheDocument();
  });

  it('shows Dwarven Armor Training description when clicked', () => {
    render(<TraitBadgeList traits={['Dwarven Armor Training']} />);
    fireEvent.click(screen.getByText('Dwarven Armor Training'));
    expect(screen.getByText(/light and medium armor/)).toBeInTheDocument();
  });

  it('hides description when the same trait is clicked again', () => {
    render(<TraitBadgeList traits={['Darkvision']} />);
    fireEvent.click(screen.getByText('Darkvision'));
    expect(screen.getByTestId('trait-description-panel')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Darkvision'));
    expect(screen.queryByTestId('trait-description-panel')).not.toBeInTheDocument();
  });

  it('replaces description when a different trait is clicked', () => {
    render(<TraitBadgeList traits={['Darkvision', 'Dwarven Armor Training']} />);
    fireEvent.click(screen.getByText('Darkvision'));
    expect(screen.getByText(/You can see in dim light/)).toBeInTheDocument();
    fireEvent.click(screen.getByText('Dwarven Armor Training'));
    expect(screen.queryByText(/You can see in dim light/)).not.toBeInTheDocument();
    expect(screen.getByText(/light and medium armor/)).toBeInTheDocument();
  });

  it('does not show description panel for a trait with no known description', () => {
    render(<TraitBadgeList traits={['Unknown Custom Trait']} />);
    fireEvent.click(screen.getByText('Unknown Custom Trait'));
    expect(screen.queryByTestId('trait-description-panel')).not.toBeInTheDocument();
  });

  it('shows Dwarven Toughness description for Hill Dwarf', () => {
    render(<TraitBadgeList traits={['Dwarven Toughness']} />);
    fireEvent.click(screen.getByText('Dwarven Toughness'));
    expect(screen.getByText(/hit point maximum increases/)).toBeInTheDocument();
  });

  it('shows Fey Ancestry description when clicked', () => {
    render(<TraitBadgeList traits={['Fey Ancestry']} />);
    fireEvent.click(screen.getByText('Fey Ancestry'));
    expect(screen.getByText(/charmed/)).toBeInTheDocument();
  });

  it('sets role=button on clickable traits only', () => {
    render(<TraitBadgeList traits={['Darkvision', 'Unknown Custom Trait']} />);
    expect(screen.getByText('Darkvision').closest('[role="button"]')).toBeInTheDocument();
    expect(screen.getByText('Unknown Custom Trait').closest('[role="button"]')).toBeNull();
  });
});
