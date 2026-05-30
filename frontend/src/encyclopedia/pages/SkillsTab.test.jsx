import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SkillsTab from './SkillsTab';
import { SKILLS } from '../data/skillsData';

describe('SkillsTab', () => {
  it('renders all 18 D&D skills in the list', () => {
    render(<SkillsTab />);
    expect(SKILLS).toHaveLength(18);
    SKILLS.forEach((s) => {
      expect(screen.getByTestId(`skill-row-${s.name}`)).toBeInTheDocument();
    });
  });

  it('renders the detail panel for the first skill by default', () => {
    render(<SkillsTab />);
    const detail = screen.getByTestId('skill-detail');
    expect(detail).toBeInTheDocument();
    // First skill alphabetically is Acrobatics (the data is in this order)
    expect(detail).toHaveTextContent('Acrobatics');
    expect(detail).toHaveTextContent('Dexterity (DEX)');
  });

  it('switches the detail panel when a different skill is clicked', () => {
    render(<SkillsTab />);
    fireEvent.click(screen.getByTestId('skill-row-Stealth'));
    const detail = screen.getByTestId('skill-detail');
    expect(detail).toHaveTextContent('Stealth');
    expect(detail).toHaveTextContent('Dexterity (DEX)');
  });

  it('shows the skill flavor text in the detail header', () => {
    render(<SkillsTab />);
    fireEvent.click(screen.getByTestId('skill-row-Persuasion'));
    expect(screen.getByText(/Win hearts and change minds/)).toBeInTheDocument();
  });

  it('shows the full description for the selected skill', () => {
    render(<SkillsTab />);
    fireEvent.click(screen.getByTestId('skill-row-Arcana'));
    const detail = screen.getByTestId('skill-detail');
    expect(detail).toHaveTextContent(/knowledge of the magical fabric/);
  });

  it('shows at least three example checks for the selected skill', () => {
    render(<SkillsTab />);
    fireEvent.click(screen.getByTestId('skill-row-Athletics'));
    const detail = screen.getByTestId('skill-detail');
    expect(detail).toHaveTextContent('Example checks');
    // Spot-check a known example
    expect(detail).toHaveTextContent(/Climb a wet castle wall/);
    expect(detail).toHaveTextContent(/Shove a charging enemy off a cliff/);
  });

  it('shows the d20 + ability modifier rule reminder', () => {
    render(<SkillsTab />);
    fireEvent.click(screen.getByTestId('skill-row-Insight'));
    expect(screen.getByText(/d20 \+ WIS modifier/)).toBeInTheDocument();
  });

  it('filters the list by search', () => {
    render(<SkillsTab />);
    fireEvent.change(screen.getByTestId('skill-search'), { target: { value: 'stea' } });
    expect(screen.getByTestId('skill-row-Stealth')).toBeInTheDocument();
    expect(screen.queryByTestId('skill-row-Acrobatics')).not.toBeInTheDocument();
    expect(screen.queryByTestId('skill-row-Athletics')).not.toBeInTheDocument();
  });

  it('search is case-insensitive', () => {
    render(<SkillsTab />);
    fireEvent.change(screen.getByTestId('skill-search'), { target: { value: 'ARCANA' } });
    expect(screen.getByTestId('skill-row-Arcana')).toBeInTheDocument();
  });

  it('filters the list by ability', () => {
    render(<SkillsTab />);
    fireEvent.click(screen.getByTestId('ability-filter-CHA'));
    // CHA skills: Deception, Intimidation, Performance, Persuasion
    expect(screen.getByTestId('skill-row-Deception')).toBeInTheDocument();
    expect(screen.getByTestId('skill-row-Intimidation')).toBeInTheDocument();
    expect(screen.getByTestId('skill-row-Performance')).toBeInTheDocument();
    expect(screen.getByTestId('skill-row-Persuasion')).toBeInTheDocument();
    // STR/DEX/etc skills hidden
    expect(screen.queryByTestId('skill-row-Athletics')).not.toBeInTheDocument();
    expect(screen.queryByTestId('skill-row-Stealth')).not.toBeInTheDocument();
  });

  it('clicking the active ability filter clears it', () => {
    render(<SkillsTab />);
    fireEvent.click(screen.getByTestId('ability-filter-DEX'));
    expect(screen.queryByTestId('skill-row-Athletics')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('ability-filter-DEX'));
    // All 18 skills back
    expect(screen.getByTestId('skill-row-Athletics')).toBeInTheDocument();
    expect(screen.getByTestId('skill-row-Insight')).toBeInTheDocument();
  });

  it('"All" button resets the ability filter', () => {
    render(<SkillsTab />);
    fireEvent.click(screen.getByTestId('ability-filter-WIS'));
    expect(screen.queryByTestId('skill-row-Athletics')).not.toBeInTheDocument();
    fireEvent.click(screen.getByTestId('ability-filter-All'));
    expect(screen.getByTestId('skill-row-Athletics')).toBeInTheDocument();
  });

  it('shows the empty state message when no skills match', () => {
    render(<SkillsTab />);
    fireEvent.change(screen.getByTestId('skill-search'), { target: { value: 'zzzz' } });
    expect(screen.getByText(/No skills match your filters/)).toBeInTheDocument();
  });

  it('combines search and ability filters', () => {
    render(<SkillsTab />);
    fireEvent.click(screen.getByTestId('ability-filter-INT'));
    fireEvent.change(screen.getByTestId('skill-search'), { target: { value: 'hist' } });
    // History is INT, should show; Arcana is INT but doesn't match search
    expect(screen.getByTestId('skill-row-History')).toBeInTheDocument();
    expect(screen.queryByTestId('skill-row-Arcana')).not.toBeInTheDocument();
  });

  it('renders the ability sidebar entry for each skill (full ability name)', () => {
    render(<SkillsTab />);
    // Each skill row shows the full ability name as subtitle
    // Spot check: Athletics → Strength, Stealth → Dexterity, Insight → Wisdom
    const athleticsRow = screen.getByTestId('skill-row-Athletics');
    expect(athleticsRow).toHaveTextContent('Strength');
    const stealthRow = screen.getByTestId('skill-row-Stealth');
    expect(stealthRow).toHaveTextContent('Dexterity');
    const insightRow = screen.getByTestId('skill-row-Insight');
    expect(insightRow).toHaveTextContent('Wisdom');
  });

  it('every skill has flavor, description, and at least 3 examples', () => {
    SKILLS.forEach((s) => {
      expect(s.flavor.length).toBeGreaterThan(0);
      expect(s.description.length).toBeGreaterThan(20);
      expect(s.examples.length).toBeGreaterThanOrEqual(3);
    });
  });

  it('covers all six abilities across the skill set', () => {
    const abilities = new Set(SKILLS.map((s) => s.ability));
    // INT/WIS/CHA/DEX/STR all have skills; CON has none in 5e
    expect(abilities.has('STR')).toBe(true);
    expect(abilities.has('DEX')).toBe(true);
    expect(abilities.has('INT')).toBe(true);
    expect(abilities.has('WIS')).toBe(true);
    expect(abilities.has('CHA')).toBe(true);
    // CON has no skills in 5e
    expect(abilities.has('CON')).toBe(false);
  });
});
