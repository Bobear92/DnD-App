import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Bold, Italic, Underline as UnderlineIcon,
  List, ListOrdered, Quote, Link as LinkIcon,
  ImagePlus, Loader2,
} from 'lucide-react';

function ToolbarBtn({ onClick, active, disabled, title, children }) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick?.(); }}
      disabled={disabled}
      title={title}
      className={cn(
        'p-1.5 rounded transition-colors select-none',
        active
          ? 'bg-primary/20 text-primary'
          : 'text-muted-foreground hover:text-foreground hover:bg-muted',
        disabled && 'opacity-40 cursor-not-allowed',
      )}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <span className="w-px h-4 bg-border mx-0.5 shrink-0 self-center" />;
}

export default function RichTextEditor({
  content,
  onChange,
  onImageUpload,
  readOnly = false,
  placeholder = 'Write your session notes…',
}) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const prevContent = useRef(content);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Image.configure({ HTMLAttributes: { class: 'rich-img' } }),
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'rich-link' } }),
      Placeholder.configure({ placeholder }),
    ],
    content: content || '',
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
    editorProps: {
      handleKeyDown(view, event) {
        if (event.key === 'Tab') {
          // Let list-item Tab/Shift-Tab indentation pass through to StarterKit
          const { $from } = view.state.selection;
          for (let d = $from.depth; d > 0; d--) {
            if ($from.node(d).type.name === 'listItem') return false;
          }
          event.preventDefault();
          view.dispatch(view.state.tr.insertText('    '));
          return true;
        }
        return false;
      },
    },
  });

  // Sync when content changes externally (e.g. Reset button in parent)
  useEffect(() => {
    if (!editor || content === prevContent.current) return;
    prevContent.current = content;
    if (editor.getHTML() !== (content || '')) {
      editor.commands.setContent(content || '', false);
    }
  }, [content, editor]);

  async function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      alert('Image must be under 10 MB');
      e.target.value = '';
      return;
    }
    setUploading(true);
    try {
      const url = await onImageUpload(file);
      editor.chain().focus().setImage({ src: url }).run();
    } catch {
      alert('Image upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  }

  function handleLink() {
    if (editor.isActive('link')) {
      editor.chain().focus().unsetLink().run();
    } else {
      const url = window.prompt('Enter URL');
      if (url) editor.chain().focus().setLink({ href: url }).run();
    }
  }

  if (readOnly) {
    return (
      <div
        className="rich-content min-h-[100px]"
        dangerouslySetInnerHTML={{
          __html: content || '<p class="empty-hint">No content yet.</p>',
        }}
      />
    );
  }

  return (
    <div className="border border-border rounded-md overflow-hidden">
      <div className="flex items-center flex-wrap gap-0.5 px-1.5 py-1 border-b border-border bg-muted/30">
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBold().run()}
          active={editor?.isActive('bold')}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleItalic().run()}
          active={editor?.isActive('italic')}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          active={editor?.isActive('underline')}
          title="Underline"
        >
          <UnderlineIcon className="w-4 h-4" />
        </ToolbarBtn>

        <Sep />

        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          active={editor?.isActive('heading', { level: 1 })}
          title="Heading 1"
        >
          <span className="text-xs font-bold leading-none w-4 text-center">H1</span>
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          active={editor?.isActive('heading', { level: 2 })}
          title="Heading 2"
        >
          <span className="text-xs font-bold leading-none w-4 text-center">H2</span>
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          active={editor?.isActive('heading', { level: 3 })}
          title="Heading 3"
        >
          <span className="text-xs font-bold leading-none w-4 text-center">H3</span>
        </ToolbarBtn>

        <Sep />

        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          active={editor?.isActive('bulletList')}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          active={editor?.isActive('orderedList')}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </ToolbarBtn>
        <ToolbarBtn
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          active={editor?.isActive('blockquote')}
          title="Blockquote"
        >
          <Quote className="w-4 h-4" />
        </ToolbarBtn>

        <Sep />

        <ToolbarBtn
          onClick={handleLink}
          active={editor?.isActive('link')}
          title="Add Link"
        >
          <LinkIcon className="w-4 h-4" />
        </ToolbarBtn>

        {onImageUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileSelect}
            />
            <ToolbarBtn
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              title="Insert Image"
            >
              {uploading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <ImagePlus className="w-4 h-4" />}
            </ToolbarBtn>
          </>
        )}
      </div>

      <EditorContent
        editor={editor}
        className="[&_.ProseMirror]:min-h-[280px] [&_.ProseMirror]:p-3 [&_.ProseMirror]:outline-none [&_.ProseMirror]:max-h-[600px] [&_.ProseMirror]:overflow-y-auto"
      />
    </div>
  );
}
