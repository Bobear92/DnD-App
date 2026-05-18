import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockChain = {
  focus: vi.fn(() => mockChain),
  toggleBold: vi.fn(() => mockChain),
  toggleItalic: vi.fn(() => mockChain),
  toggleUnderline: vi.fn(() => mockChain),
  toggleHeading: vi.fn(() => mockChain),
  toggleBulletList: vi.fn(() => mockChain),
  toggleOrderedList: vi.fn(() => mockChain),
  toggleBlockquote: vi.fn(() => mockChain),
  setImage: vi.fn(() => mockChain),
  setLink: vi.fn(() => mockChain),
  unsetLink: vi.fn(() => mockChain),
  run: vi.fn(),
};

const mockEditor = {
  isActive: vi.fn(() => false),
  chain: vi.fn(() => mockChain),
  getHTML: vi.fn(() => '<p>test content</p>'),
  commands: { setContent: vi.fn() },
};

vi.mock('@tiptap/react', () => ({
  useEditor: vi.fn(() => mockEditor),
  EditorContent: ({ className }) => <div data-testid="editor-content" className={className} />,
}));

vi.mock('@tiptap/starter-kit', () => ({ default: {} }));
vi.mock('@tiptap/extension-image', () => ({ default: { configure: vi.fn(() => ({})) } }));
vi.mock('@tiptap/extension-link', () => ({ default: { configure: vi.fn(() => ({})) } }));
vi.mock('@tiptap/extension-placeholder', () => ({ default: { configure: vi.fn(() => ({})) } }));
vi.mock('@tiptap/extension-underline', () => ({ default: {} }));

import RichTextEditor from './RichTextEditor';

beforeEach(() => {
  vi.clearAllMocks();
  mockEditor.isActive.mockReturnValue(false);
  mockEditor.chain.mockReturnValue(mockChain);
  mockChain.focus.mockReturnValue(mockChain);
  mockChain.run.mockReturnValue(undefined);
});

describe('RichTextEditor — edit mode', () => {
  it('renders toolbar buttons', () => {
    render(<RichTextEditor content="" onChange={vi.fn()} />);
    expect(screen.getByTitle('Bold')).toBeTruthy();
    expect(screen.getByTitle('Italic')).toBeTruthy();
    expect(screen.getByTitle('Underline')).toBeTruthy();
    expect(screen.getByTitle('Heading 1')).toBeTruthy();
    expect(screen.getByTitle('Heading 2')).toBeTruthy();
    expect(screen.getByTitle('Heading 3')).toBeTruthy();
    expect(screen.getByTitle('Bullet List')).toBeTruthy();
    expect(screen.getByTitle('Numbered List')).toBeTruthy();
    expect(screen.getByTitle('Blockquote')).toBeTruthy();
    expect(screen.getByTitle('Add Link')).toBeTruthy();
  });

  it('shows Insert Image button when onImageUpload provided', () => {
    render(<RichTextEditor content="" onChange={vi.fn()} onImageUpload={vi.fn()} />);
    expect(screen.getByTitle('Insert Image')).toBeTruthy();
  });

  it('does not show Insert Image button without onImageUpload', () => {
    render(<RichTextEditor content="" onChange={vi.fn()} />);
    expect(screen.queryByTitle('Insert Image')).toBeNull();
  });

  it('renders editor content area', () => {
    render(<RichTextEditor content="" onChange={vi.fn()} />);
    expect(screen.getByTestId('editor-content')).toBeTruthy();
  });

  it('calls toggleBold on Bold button click', () => {
    render(<RichTextEditor content="" onChange={vi.fn()} />);
    fireEvent.mouseDown(screen.getByTitle('Bold'));
    expect(mockChain.toggleBold).toHaveBeenCalled();
    expect(mockChain.run).toHaveBeenCalled();
  });

  it('calls toggleHeading level 2 on H2 button click', () => {
    render(<RichTextEditor content="" onChange={vi.fn()} />);
    fireEvent.mouseDown(screen.getByTitle('Heading 2'));
    expect(mockChain.toggleHeading).toHaveBeenCalledWith({ level: 2 });
    expect(mockChain.run).toHaveBeenCalled();
  });
});

describe('RichTextEditor — read-only mode', () => {
  it('renders HTML content without toolbar', () => {
    render(<RichTextEditor content="<p>Hello world</p>" readOnly />);
    expect(screen.getByText('Hello world')).toBeTruthy();
    expect(screen.queryByTitle('Bold')).toBeNull();
    expect(screen.queryByTestId('editor-content')).toBeNull();
  });

  it('renders empty hint when no content', () => {
    render(<RichTextEditor content="" readOnly />);
    const div = document.querySelector('.rich-content');
    expect(div).toBeTruthy();
  });
});
