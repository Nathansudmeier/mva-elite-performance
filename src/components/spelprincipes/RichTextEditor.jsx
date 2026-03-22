import React, { useRef, useEffect } from "react";

export default function RichTextEditor({ value, onChange, placeholder }) {
  const editorRef = useRef(null);
  const isInitialized = useRef(false);

  // Set initial HTML only once — never on subsequent renders to avoid cursor jumping
  useEffect(() => {
    if (editorRef.current && !isInitialized.current) {
      editorRef.current.innerHTML = value || "";
      isInitialized.current = true;
    }
  }, []);

  const exec = (cmd) => {
    document.execCommand(cmd, false, null);
    editorRef.current?.focus();
    emitChange();
  };

  const execBlock = (tag) => {
    document.execCommand("formatBlock", false, tag);
    editorRef.current?.focus();
    emitChange();
  };

  const emitChange = () => {
    setTimeout(() => {
      if (editorRef.current) onChange(editorRef.current.innerHTML);
    }, 0);
  };

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "0.5px solid rgba(255,255,255,0.12)",
        borderRadius: "14px",
        overflow: "hidden",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          display: "flex",
          gap: "4px",
          padding: "8px 10px",
          borderBottom: "0.5px solid rgba(255,255,255,0.10)",
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        {TOOLS.map((t) => (
          <button
            key={t.cmd}
            type="button"
            title={t.title}
            onMouseDown={(e) => { e.preventDefault(); exec(t.cmd); }}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.08)",
              border: "0.5px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.75)",
              fontSize: "13px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              ...t.style,
            }}
          >
            {t.icon}
          </button>
        ))}

        {/* Divider */}
        <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.12)", margin: "0 4px" }} />

        {/* Heading buttons */}
        {[["H2", "h2"], ["H3", "h3"], ["P", "p"]].map(([label, tag]) => (
          <button
            key={tag}
            type="button"
            title={label}
            onMouseDown={(e) => { e.preventDefault(); execBlock(tag); }}
            style={{
              padding: "0 10px",
              height: "32px",
              borderRadius: "8px",
              background: "rgba(255,255,255,0.08)",
              border: "0.5px solid rgba(255,255,255,0.12)",
              color: "rgba(255,255,255,0.75)",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Editable area */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={emitChange}
        data-placeholder={placeholder}
        style={{
          minHeight: "180px",
          padding: "14px 16px",
          color: "#ffffff",
          fontSize: "15px",
          lineHeight: 1.7,
          outline: "none",
          fontFamily: "inherit",
        }}
      />

      <style>{`
        [contenteditable][data-placeholder]:empty:before {
          content: attr(data-placeholder);
          color: rgba(255,255,255,0.30);
          pointer-events: none;
        }
        [contenteditable] h2 { font-size: 18px; font-weight: 700; margin: 8px 0 4px; }
        [contenteditable] h3 { font-size: 15px; font-weight: 700; margin: 6px 0 3px; }
        [contenteditable] p  { margin: 0 0 6px; }
        [contenteditable] ul { padding-left: 20px; margin: 4px 0; list-style: disc; }
        [contenteditable] li { margin-bottom: 3px; }
      `}</style>
    </div>
  );
}