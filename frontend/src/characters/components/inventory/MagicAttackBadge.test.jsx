import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MagicAttackBadge from '@/characters/components/inventory/MagicAttackBadge';

const MAGICAL = { source: 'Magic Arrow', note: 'Arrows you fire from this bow become magical.' };

function renderBadge(props = {}) {
  return render(
    <MemoryRouter>
      <MagicAttackBadge magical={MAGICAL} testId="magic-tag" campaignId="3" {...props} />
    </MemoryRouter>
  );
}

describe('MagicAttackBadge', () => {
  it('names the source on the tag', () => {
    renderBadge();
    expect(screen.getByTestId('magic-tag')).toHaveTextContent('Magic · Magic Arrow');
  });

  it('renders nothing at all for a non-magical weapon', () => {
    const { container } = render(
      <MemoryRouter><MagicAttackBadge magical={null} testId="magic-tag" campaignId="3" /></MemoryRouter>
    );
    expect(container).toBeEmptyDOMElement();
  });

  // Click, not hover — a title tooltip is unreachable on touch.
  it('toggles the rule text on click', () => {
    renderBadge();
    const tag = screen.getByTestId('magic-tag');
    expect(tag).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('magic-tag-note')).not.toBeInTheDocument();
    fireEvent.click(tag);
    expect(tag).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('magic-tag-note')).toHaveTextContent(MAGICAL.note);
    fireEvent.click(tag);
    expect(screen.queryByTestId('magic-tag-note')).not.toBeInTheDocument();
  });

  it('links to the magical-attacks mechanics page from inside the note', () => {
    renderBadge();
    fireEvent.click(screen.getByTestId('magic-tag'));
    expect(screen.getByTestId('magic-tag-learn-more')).toHaveAttribute(
      'href', '/campaigns/3/encyclopedia/mechanics/magical-attacks'
    );
  });

  // campaignId is a prop, not useParams() — so the component works anywhere, and simply
  // omits the link when there's no campaign to link into.
  it('renders the note without a link when no campaignId is given', () => {
    renderBadge({ campaignId: undefined });
    fireEvent.click(screen.getByTestId('magic-tag'));
    expect(screen.getByTestId('magic-tag-note')).toBeInTheDocument();
    expect(screen.queryByTestId('magic-tag-learn-more')).not.toBeInTheDocument();
  });
});
