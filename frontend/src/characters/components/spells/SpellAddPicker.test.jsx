import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import SpellAddPicker from '@/characters/components/spells/SpellAddPicker';

// The picker's whole job is to open a scoped ClassSpellBrowser — assert what it hands it.
vi.mock('@/characters/components/spells/ClassSpellBrowser', () => ({
  default: ({ className, minSpellLevel, maxSpellLevel, schools, ritualOnly, prepareLimit, onAdd }) => (
    <div
      data-testid="browser"
      data-class={className}
      data-min={String(minSpellLevel)}
      data-max={String(maxSpellLevel)}
      data-schools={(schools ?? []).join(',')}
      data-ritual={String(!!ritualOnly)}
      data-limit={String(prepareLimit)}
    >
      <button type="button" onClick={() => onAdd('Shield')}>pick</button>
    </div>
  ),
}));

const picker = (props = {}) => render(
  <SpellAddPicker className="Wizard" campaignId={1} onAdd={vi.fn()} {...props} />
);

describe('SpellAddPicker', () => {
  it('starts collapsed — the catalog only opens on request', () => {
    picker();
    expect(screen.queryByTestId('browser')).not.toBeInTheDocument();
    expect(screen.getByTestId('spell-add-picker-toggle')).toBeInTheDocument();
  });

  it('opens and closes the compendium browser', () => {
    picker();
    fireEvent.click(screen.getByTestId('spell-add-picker-toggle'));
    expect(screen.getByTestId('browser')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('spell-add-picker-toggle'));
    expect(screen.queryByTestId('browser')).not.toBeInTheDocument();
  });

  it('scopes the browser to the class list and spell levels', () => {
    picker({ className: 'Cleric', minSpellLevel: 0, maxSpellLevel: 0 });
    fireEvent.click(screen.getByTestId('spell-add-picker-toggle'));
    const b = screen.getByTestId('browser');
    expect(b).toHaveAttribute('data-class', 'Cleric');
    expect(b).toHaveAttribute('data-min', '0'); // cantrips only
    expect(b).toHaveAttribute('data-max', '0');
  });

  it('passes a school restriction through (5e Eldritch Knight)', () => {
    picker({ schools: ['Abjuration', 'Evocation'] });
    fireEvent.click(screen.getByTestId('spell-add-picker-toggle'));
    expect(screen.getByTestId('browser')).toHaveAttribute('data-schools', 'Abjuration,Evocation');
  });

  it('passes ritualOnly through (Ritual Caster book)', () => {
    picker({ ritualOnly: true });
    fireEvent.click(screen.getByTestId('spell-add-picker-toggle'));
    expect(screen.getByTestId('browser')).toHaveAttribute('data-ritual', 'true');
  });

  it('reports the picked spell name', () => {
    const onAdd = vi.fn();
    picker({ onAdd });
    fireEvent.click(screen.getByTestId('spell-add-picker-toggle'));
    fireEvent.click(screen.getByText('pick'));
    expect(onAdd).toHaveBeenCalledWith('Shield');
  });

  it('renders nothing without a class list or campaign — there is no free-text fallback', () => {
    const { container: a } = render(<SpellAddPicker campaignId={1} onAdd={vi.fn()} />);
    expect(a).toBeEmptyDOMElement();
    const { container: b } = render(<SpellAddPicker className="Wizard" onAdd={vi.fn()} />);
    expect(b).toBeEmptyDOMElement();
  });
});
