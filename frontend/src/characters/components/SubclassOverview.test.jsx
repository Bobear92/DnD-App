import React from 'react';
import { render, screen } from '@testing-library/react';
import SubclassOverview from './SubclassOverview';

describe('SubclassOverview', () => {
  it('renders subclass name and badges', () => {
    render(<SubclassOverview className="Barbarian" subclassName="Path of the Berserker" edition="5e" />);
    expect(screen.getByText('Path of the Berserker')).toBeInTheDocument();
    expect(screen.getByText('Subclass of Barbarian')).toBeInTheDocument();
    expect(screen.getByText('5e (2014)')).toBeInTheDocument();
  });

  it('renders 2024 edition badge for 5.5e', () => {
    render(<SubclassOverview className="Barbarian" subclassName="Path of the Berserker" edition="5.5e" />);
    expect(screen.getByText('2024 Rules')).toBeInTheDocument();
  });

  it('renders flavor text section header for a known subclass', () => {
    render(<SubclassOverview className="Barbarian" subclassName="Path of the Berserker" edition="5e" />);
    expect(screen.getByText('About this Subclass')).toBeInTheDocument();
  });

  it('renders feature names and levels for Barbarian Path of the Berserker', () => {
    render(<SubclassOverview className="Barbarian" subclassName="Path of the Berserker" edition="5e" />);
    expect(screen.getByText('Subclass Features')).toBeInTheDocument();
    expect(screen.getByText('Frenzy')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders Cleric Life Domain for 5e', () => {
    render(<SubclassOverview className="Cleric" subclassName="Life Domain" edition="5e" />);
    expect(screen.getByText('Life Domain')).toBeInTheDocument();
    expect(screen.getByText('Subclass of Cleric')).toBeInTheDocument();
    expect(screen.getByText('Disciple of Life')).toBeInTheDocument();
  });

  it('renders Warlock The Fiend for 5e', () => {
    render(<SubclassOverview className="Warlock" subclassName="The Fiend" edition="5e" />);
    expect(screen.getByText('The Fiend')).toBeInTheDocument();
    expect(screen.getByText("Dark One's Blessing")).toBeInTheDocument();
  });

  it('renders Wizard Abjurer for 5.5e', () => {
    render(<SubclassOverview className="Wizard" subclassName="Abjurer" edition="5.5e" />);
    expect(screen.getByText('Abjurer')).toBeInTheDocument();
    expect(screen.getByText('Arcane Ward')).toBeInTheDocument();
    expect(screen.getByText('2024 Rules')).toBeInTheDocument();
  });

  it('renders Fighter Champion for 5e', () => {
    render(<SubclassOverview className="Fighter" subclassName="Champion" edition="5e" />);
    expect(screen.getByText('Champion')).toBeInTheDocument();
    expect(screen.getByText('Improved Critical')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('renders Wizard School of Abjuration for 5e', () => {
    render(<SubclassOverview className="Wizard" subclassName="School of Abjuration" edition="5e" />);
    expect(screen.getByText('School of Abjuration')).toBeInTheDocument();
    expect(screen.getByText('Arcane Ward')).toBeInTheDocument();
  });

  it('shows unavailable message for unknown subclass', () => {
    render(<SubclassOverview className="Barbarian" subclassName="Nonexistent Path" edition="5e" />);
    expect(screen.getByText('Subclass details not available.')).toBeInTheDocument();
  });

  it('shows unavailable message for unknown class', () => {
    render(<SubclassOverview className="Beastmaster" subclassName="Path of the Berserker" edition="5e" />);
    expect(screen.getByText('Subclass details not available.')).toBeInTheDocument();
  });

  it('groups features by level with level dividers', () => {
    render(<SubclassOverview className="Fighter" subclassName="Champion" edition="5e" />);
    // Champion gains features at multiple levels; L3 circle appears
    expect(screen.getByText('Improved Critical')).toBeInTheDocument();
    expect(screen.getByText('Remarkable Athlete')).toBeInTheDocument();
  });
});
