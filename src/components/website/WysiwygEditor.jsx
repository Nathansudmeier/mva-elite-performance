import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';

const editorStyles = `
  .wysiwyg-editor .ProseMirror { outline: none; min-height: 400px; }
  .wysiwyg-editor .ProseMirror p { margin-bottom: 16px; }
  .wysiwyg-editor .ProseMirror h1 { font-family: 'Bebas Neue', serif; font-size: 36px; font-weight: 700; color: #fff; margin: 28px 0 12px; }
  .wysiwyg-editor .ProseMirror h2 { font-family: 'Bebas Neue', serif; font-size: 28px; font-weight: 700; color: #fff; margin: 24px 0 10px; }
  .wysiwyg-editor .ProseMirror h3 { font-family: 'Bebas Neue', serif; font-size: 22px; color: #FF6800; margin: 20px 0 8px; }
  .wysiwyg-editor .ProseMirror strong { color: #fff; font-weight: 700; }
  .wysiwyg-editor .ProseMirror em { color: rgba(255,255,255,0.7); font-style: italic; }
  .wysiwyg-editor .ProseMirror ul { list-style: disc; margin-left: 24px; margin-bottom: 16px; }
  .wysiwyg-editor .ProseMirror ol { list-style: decimal; margin-left: 24px; margin-bottom: 16px; }
  .wysiwyg-editor .ProseMirror li { margin-bottom: 6px; color: rgba(255,255,255,0.7); }
  .wysiwyg-editor .ProseMirror blockquote { border-left: 3px solid #FF6800; background: rgba(255,104,0,0.05); padding: 12px 20px; border-radius: 0 4px 4px 0; margin: 20px 0; color: rgba(255,255,255,0.7); font-style: italic; }
  .wysiwyg-editor .ProseMirror a { color: #FF6800; text-decoration: underline; cursor: pointer; }
  .wysiwyg-editor .ProseMirror img { max-width: 100%; border-radius: 6px; margin: 16px 0; }
  .wysiwyg-editor .ProseMirror hr { border: none; border-top: 1px solid rgba(255,255,255,0.1); margin: 24px 0; }
  .wysiwyg-editor .ProseMirror mark { background: rgba(255,214,0,0.3); color: #fff; padding: 1px 3px; border-radius: 2px; }
  .wysiwyg-editor .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: rgba(255,255,255,0.2); pointer-events: none; float: left; height: 0; }
`;

const btnBase = {
  background: 'transparent',
  border: 'none',
  color: 'rgba(255,255,255,0.6)',
  padding: '6px 8px',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '13px',
  transition: 'all 0.15s',
  fontFamily: 'inherit',
  minWidth: '28px',
};

function ToolbarBtn({ onClick, active, title, children }) {
  const [hover, setHover] = useState(false);
  const style = {
    ...btnBase,
    background: active ? '#FF6800' : (hover ? 'rgba(255,255,255,0.1)' : 'transparent'),
    color: active || hover ? '#fff' : 'rgba(255,255,255,0.6)',
  };
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={title}
      style={style}
    >
      {children}
    </button>
  );
}

const Divider = () => (
  <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
);

export default function WysiwygEditor({ value, onChange, placeholder = 'Schrijf hier je artikel...' }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Highlight,
      Image,
      Link.configure({ openOnClick: false, autolink: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML());
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value && value !== current) {
      editor.commands.setContent(value, false);
    }
  }, [value, editor]);

  if (!editor) return null;

  const text = editor.getText();
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const setLink = () => {
    const previous = editor.getAttributes('link').href;
    const url = window.prompt('URL:', previous || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt('Afbeelding URL:');
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div className="wysiwyg-editor">
      <style>{editorStyles}</style>

      {/* Toolbar */}
      <div style={{
        background: '#1B2A5E',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: '6px 6px 0 0',
        padding: '8px 12px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '4px',
        alignItems: 'center',
      }}>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Vet"><b>B</b></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Cursief"><i>I</i></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Onderstreept"><u>U</u></ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Doorgehaald"><s>S</s></ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} title="Kop 1">H1</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Kop 2">H2</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Kop 3">H3</ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lijst">UL</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Genummerd">OL</ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Links">⯇</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Midden">≡</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Rechts">⯈</ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={setLink} active={editor.isActive('link')} title="Link">🔗</ToolbarBtn>
        <ToolbarBtn onClick={addImage} title="Afbeelding">🖼</ToolbarBtn>

        <Divider />

        <ToolbarBtn onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Citaat">❝</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().toggleHighlight().run()} active={editor.isActive('highlight')} title="Markeer">✦</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Lijn">―</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().undo().run()} title="Ongedaan maken">↺</ToolbarBtn>
        <ToolbarBtn onClick={() => editor.chain().focus().redo().run()} title="Opnieuw">↻</ToolbarBtn>
      </div>

      {/* Editor content */}
      <div style={{
        background: '#10121A',
        border: '1px solid rgba(255,255,255,0.1)',
        borderTop: 'none',
        padding: '20px 24px',
        minHeight: '400px',
        color: 'rgba(255,255,255,0.8)',
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '15px',
        lineHeight: 1.8,
      }}>
        <EditorContent editor={editor} />
      </div>

      {/* Counter */}
      <div style={{
        background: '#161A24',
        border: '1px solid rgba(255,255,255,0.06)',
        borderTop: 'none',
        borderRadius: '0 0 6px 6px',
        padding: '6px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: '11px',
        color: 'rgba(255,255,255,0.3)',
      }}>
        <span>{wordCount} woorden · {charCount} tekens</span>
        <span>HTML</span>
      </div>
    </div>
  );
}