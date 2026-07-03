import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MaxHpValue, AcOptionsLine } from '@/characters/components/combat/CombatBonusInline';

describe('MaxHpValue', () => {
  it('shows the plain base HP when no bonus applies', () => {
    render(<MaxHpValue charClass="Wizard" subclass="School of Evocation" level={5} baseMaxHp={20} />);
    expect(screen.getByText('20')).toBeInTheDocument();
    expect(screen.queryByText(/Draconic Resilience/)).not.toBeInTheDocument();
  });

  it('shows the effective total with a source note for Draconic Resilience', () => {
    render(<MaxHpValue charClass="Sorcerer" subclass="Draconic Bloodline" level={5} baseMaxHp={20} />);
    // 20 base + 5 (1 per Sorcerer level) = 25, shown as the Max HP value itself
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('+5 Draconic Resilience')).toBeInTheDocument();
    expect(screen.queryByText('20')).not.toBeInTheDocument();
  });

  it('shows Dwarven Toughness for a Hill Dwarf of any class', () => {
    render(<MaxHpValue charClass="Fighter" subclass="Champion" level={6} raceTraits={['Dwarven Toughness']} baseMaxHp={50} />);
    expect(screen.getByText('56')).toBeInTheDocument();
    expect(screen.getByText('+6 Dwarven Toughness')).toBeInTheDocument();
  });

  it('shows the Tough feat (+2/level) folded into Max HP', () => {
    render(<MaxHpValue charClass="Fighter" subclass="Champion" level={4} feats={[{ id: 1, name: 'Tough' }]} baseMaxHp={40} />);
    expect(screen.getByText('48')).toBeInTheDocument(); // 40 + 2×4
    expect(screen.getByText('+8 Tough')).toBeInTheDocument();
  });

  it('folds CON × level into the number (roll base + conMod × level)', () => {
    // baseMaxHp is the CON-independent roll base; conMod +3 at level 4 adds 12.
    render(<MaxHpValue charClass="Fighter" subclass="Champion" level={4} baseMaxHp={26} conMod={3} />);
    expect(screen.getByText('38')).toBeInTheDocument(); // 26 + 3×4
  });

  it('combines CON and a passive bonus, annotating only the passive source', () => {
    render(<MaxHpValue charClass="Fighter" subclass="Champion" level={4} raceTraits={['Dwarven Toughness']} baseMaxHp={26} conMod={2} />);
    expect(screen.getByText('38')).toBeInTheDocument(); // 26 + 2×4 CON + 1×4 Dwarven Toughness
    expect(screen.getByText('+4 Dwarven Toughness')).toBeInTheDocument();
    // CON isn't annotated — it's part of the base number.
    expect(screen.queryByText(/CON/)).not.toBeInTheDocument();
  });

  it('renders an em dash when baseMaxHp is missing', () => {
    render(<MaxHpValue charClass="Sorcerer" subclass="Draconic Bloodline" level={3} />);
    expect(screen.getByText('—')).toBeInTheDocument();
  });
});

describe('AcOptionsLine', () => {
  it('renders nothing for a non-AC class', () => {
    const { container } = render(<AcOptionsLine charClass="Wizard" scores={{ dexterity: 14 }} />);
    expect(container.firstChild).toBeNull();
  });

  it('shows Barbarian unarmored defense = 10 + DEX + CON', () => {
    render(<AcOptionsLine charClass="Barbarian" scores={{ dexterity: 14, constitution: 16 }} />);
    expect(screen.getByText('Armor Class Options')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument(); // 10 + 2 + 3
  });

  it('shows Draconic Resilience = 13 + DEX', () => {
    render(<AcOptionsLine charClass="Sorcerer" subclass="Draconic Sorcery" scores={{ dexterity: 16 }} />);
    expect(screen.getByText('Armor Class Options')).toBeInTheDocument();
    expect(screen.getByText(/13 \+ DEX/)).toBeInTheDocument();
    expect(screen.getByText('16')).toBeInTheDocument(); // 13 + 3
  });
});
