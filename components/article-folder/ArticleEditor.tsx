"use client";

import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import { Extension } from "@tiptap/core";

import ImageUploader from "@/components/ImageUploader";

/* =========================
   Font Size Extension
========================= */

const FontSize = Extension.create({
  name: "fontSize",

  addGlobalAttributes() {
    return [
      {
        types: ["textStyle"],
        attributes: {
          fontSize: {
            default: null,

            parseHTML: (element: HTMLElement) =>
              element.style.fontSize || null,

            renderHTML: (
              attributes: {
                fontSize?: string | null;
              }
            ) => {
              if (!attributes.fontSize) {
                return {};
              }

              return {
                style: `font-size: ${attributes.fontSize}`,
              };
            },
          },
        },
      },
    ];
  },
});

/* =========================
   Toolbar Button
========================= */

function ToolbarButton({
  children,
  onClick,
  active = false,
  disabled = false,
  title,
}: {
  children: ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  title?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onMouseDown={(event) => {
        event.preventDefault();

        if (!disabled) {
          onClick();
        }
      }}
      style={{
        ...styles.toolbarButton,
        ...(active ? styles.toolbarButtonActive : {}),
        ...(disabled ? styles.toolbarButtonDisabled : {}),
      }}
    >
      {children}
    </button>
  );
}

/* =========================
   Props
========================= */

type ArticleEditorProps = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

/* =========================
   Article Editor
========================= */

export default function ArticleEditor({
  value,
  onChange,
  placeholder = "Write your article here...",
}: ArticleEditorProps) {
  const [fontSize, setFontSize] =
    useState("16px");

  const [showImageUploader, setShowImageUploader] =
    useState(false);

  const editor = useEditor({
    immediatelyRender: false,

    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),

      TextStyle,

      FontSize,

      Underline,

      Image.configure({
        inline: false,
        allowBase64: false,
      }),

      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
      }),

      TextAlign.configure({
        types: [
          "heading",
          "paragraph",
        ],
      }),
    ],

    content: value || "",

    editorProps: {
      attributes: {
        class: "article-editor-content",
        spellcheck: "true",
      },
    },

    onUpdate({ editor: updatedEditor }) {
      onChange(updatedEditor.getHTML());
    },
  });

  /* =========================
     Sync external value
  ========================= */

  useEffect(() => {
    if (!editor) {
      return;
    }

    const currentHTML = editor.getHTML();

    if (value !== currentHTML) {
      editor.commands.setContent(value || "");
    }
  }, [editor, value]);

  /* =========================
     Loading
  ========================= */

  if (!editor) {
    return (
      <div style={styles.editorShell}>
        <div style={styles.loading}>
          Loading editor...
        </div>
      </div>
    );
  }

  /*
    ここより下では editor が null ではないことが
    TypeScript的にも保証されている
  */

  const e = editor;

  /* =========================
     Image
  ========================= */

  function insertUploadedImage(url: string) {
    if (!url.trim()) {
      return;
    }

    e.chain()
      .focus()
      .setImage({
        src: url.trim(),
        alt: "",
      })
      .run();

    setShowImageUploader(false);
  }

  /* =========================
     Render
  ========================= */

  return (
    <div style={styles.editorShell}>
      {/* =====================
          Toolbar
      ===================== */}

      <div style={styles.toolbar}>
        {/* Undo / Redo */}

        <div style={styles.toolbarGroup}>
          <ToolbarButton
            title="Undo"
            disabled={!e.can().undo()}
            onClick={() =>
              e.chain()
                .focus()
                .undo()
                .run()
            }
          >
            ↶
          </ToolbarButton>

          <ToolbarButton
            title="Redo"
            disabled={!e.can().redo()}
            onClick={() =>
              e.chain()
                .focus()
                .redo()
                .run()
            }
          >
            ↷
          </ToolbarButton>
        </div>

        <div style={styles.divider} />

        {/* Bold / Italic / Underline */}

        <div style={styles.toolbarGroup}>
          <ToolbarButton
            title="Bold"
            active={e.isActive("bold")}
            onClick={() =>
              e.chain()
                .focus()
                .toggleBold()
                .run()
            }
          >
            <strong>B</strong>
          </ToolbarButton>

          <ToolbarButton
            title="Italic"
            active={e.isActive("italic")}
            onClick={() =>
              e.chain()
                .focus()
                .toggleItalic()
                .run()
            }
          >
            <em>I</em>
          </ToolbarButton>

          <ToolbarButton
            title="Underline"
            active={e.isActive("underline")}
            onClick={() =>
              e.chain()
                .focus()
                .toggleUnderline()
                .run()
            }
          >
            <u>U</u>
          </ToolbarButton>
        </div>

        <div style={styles.divider} />

        {/* Heading */}

        <div style={styles.toolbarGroup}>
          <select
            value={
              e.isActive("heading", {
                level: 1,
              })
                ? "h1"
                : e.isActive("heading", {
                      level: 2,
                    })
                  ? "h2"
                  : e.isActive("heading", {
                        level: 3,
                      })
                    ? "h3"
                    : "paragraph"
            }
            onChange={(event) => {
              const next =
                event.target.value;

              if (next === "paragraph") {
                e.chain()
                  .focus()
                  .setParagraph()
                  .run();

                return;
              }

              const level = Number(
                next.replace("h", "")
              ) as 1 | 2 | 3;

              e.chain()
                .focus()
                .setHeading({
                  level,
                })
                .run();
            }}
            style={styles.select}
          >
            <option value="paragraph">
              Normal
            </option>

            <option value="h1">
              Heading 1
            </option>

            <option value="h2">
              Heading 2
            </option>

            <option value="h3">
              Heading 3
            </option>
          </select>
        </div>

        {/* Font Size */}

        <div style={styles.toolbarGroup}>
          <select
            value={fontSize}
            onChange={(event) => {
              const size =
                event.target.value;

              setFontSize(size);

              e.chain()
                .focus()
                .setMark("textStyle", {
                  fontSize: size,
                })
                .run();
            }}
            style={styles.select}
          >
            <option value="14px">
              14 px
            </option>

            <option value="16px">
              16 px
            </option>

            <option value="18px">
              18 px
            </option>

            <option value="20px">
              20 px
            </option>

            <option value="24px">
              24 px
            </option>

            <option value="28px">
              28 px
            </option>

            <option value="32px">
              32 px
            </option>

            <option value="40px">
              40 px
            </option>
          </select>
        </div>

        <div style={styles.divider} />

        {/* Alignment */}

        <div style={styles.toolbarGroup}>
          <ToolbarButton
            title="Align left"
            active={e.isActive({
              textAlign: "left",
            })}
            onClick={() =>
              e.chain()
                .focus()
                .setTextAlign("left")
                .run()
            }
          >
            ←
          </ToolbarButton>

          <ToolbarButton
            title="Align center"
            active={e.isActive({
              textAlign: "center",
            })}
            onClick={() =>
              e.chain()
                .focus()
                .setTextAlign("center")
                .run()
            }
          >
            ↔
          </ToolbarButton>

          <ToolbarButton
            title="Align right"
            active={e.isActive({
              textAlign: "right",
            })}
            onClick={() =>
              e.chain()
                .focus()
                .setTextAlign("right")
                .run()
            }
          >
            →
          </ToolbarButton>
        </div>

        <div style={styles.divider} />

        {/* Lists */}

        <div style={styles.toolbarGroup}>
          <ToolbarButton
            title="Bullet list"
            active={e.isActive("bulletList")}
            onClick={() =>
              e.chain()
                .focus()
                .toggleBulletList()
                .run()
            }
          >
            •
          </ToolbarButton>

          <ToolbarButton
            title="Numbered list"
            active={e.isActive("orderedList")}
            onClick={() =>
              e.chain()
                .focus()
                .toggleOrderedList()
                .run()
            }
          >
            1.
          </ToolbarButton>

          <ToolbarButton
            title="Quote"
            active={e.isActive("blockquote")}
            onClick={() =>
              e.chain()
                .focus()
                .toggleBlockquote()
                .run()
            }
          >
            “
          </ToolbarButton>
        </div>

        <div style={styles.divider} />

        {/* Other */}

        <div style={styles.toolbarGroup}>
          <ToolbarButton
            title="Horizontal line"
            onClick={() =>
              e.chain()
                .focus()
                .setHorizontalRule()
                .run()
            }
          >
            ―
          </ToolbarButton>

          <ToolbarButton
            title="Add link"
            active={e.isActive("link")}
            onClick={() => {
              const currentUrl =
                e.getAttributes("link").href ||
                "";

              const url = window.prompt(
                "Enter URL",
                currentUrl
              );

              if (url === null) {
                return;
              }

              if (!url.trim()) {
                e.chain()
                  .focus()
                  .unsetLink()
                  .run();

                return;
              }

              e.chain()
                .focus()
                .extendMarkRange("link")
                .setLink({
                  href: url.trim(),
                  target: "_blank",
                  rel: "noopener noreferrer",
                })
                .run();
            }}
          >
            🔗
          </ToolbarButton>

          <ToolbarButton
            title="Upload image"
            active={showImageUploader}
            onClick={() =>
              setShowImageUploader(
                (current) => !current
              )
            }
          >
            🖼
          </ToolbarButton>
        </div>
      </div>

      {/* =====================
          Image Upload
      ===================== */}

      {showImageUploader && (
        <div style={styles.imagePanel}>
          <div style={styles.imagePanelHeader}>
            <div>
              <strong>
                Insert Image
              </strong>

              <p style={styles.imagePanelText}>
                Upload an image to insert it into
                the article.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowImageUploader(false)
              }
              style={styles.closeButton}
            >
              ×
            </button>
          </div>

          <ImageUploader
            value=""
            onChange={insertUploadedImage}
            folder="article-images"
            label="Article Image"
          />
        </div>
      )}

      {/* =====================
          Editor
      ===================== */}

      <div style={styles.editorArea}>
        {!e.getText().trim() && (
          <div style={styles.placeholder}>
            {placeholder}
          </div>
        )}

        <EditorContent editor={e} />
      </div>

      {/* =====================
          Bottom
      ===================== */}

      <div style={styles.bottomBar}>
        <span>
          Rich text editor
        </span>

        <span>
          Article content
        </span>
      </div>
    </div>
  );
}

/* =========================
   Styles
========================= */

const styles: Record<
  string,
  CSSProperties
> = {
  editorShell: {
    width: "100%",
    border: "1px solid #ddd",
    borderRadius: "14px",
    background: "#fff",
    overflow: "hidden",
  },

  loading: {
    padding: "40px",
    textAlign: "center",
    color: "#888",
  },

  toolbar: {
    display: "flex",
    flexWrap: "wrap",
    alignItems: "center",
    gap: "6px",
    padding: "10px",
    borderBottom: "1px solid #e8e8e8",
    background: "#fafafa",
    position: "sticky",
    top: 0,
    zIndex: 10,
  },

  toolbarGroup: {
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },

  toolbarButton: {
    minWidth: "34px",
    height: "34px",
    padding: "0 8px",
    border: "1px solid #ddd",
    borderRadius: "7px",
    background: "#fff",
    color: "#222",
    cursor: "pointer",
    fontSize: "14px",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  },

  toolbarButtonActive: {
    background: "#eee",
    borderColor: "#bbb",
  },

  toolbarButtonDisabled: {
    opacity: 0.45,
    cursor: "not-allowed",
  },

  divider: {
    width: "1px",
    height: "24px",
    background: "#ddd",
    margin: "0 3px",
  },

  select: {
    height: "34px",
    padding: "0 8px",
    border: "1px solid #ddd",
    borderRadius: "7px",
    background: "#fff",
    color: "#222",
    cursor: "pointer",
  },

  imagePanel: {
    padding: "16px 20px",
    borderBottom: "1px solid #e8e8e8",
    background: "#fcfbfa",
  },

  imagePanelHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "14px",
  },

  imagePanelText: {
    margin: "5px 0 0",
    color: "#888",
    fontSize: "12px",
    lineHeight: 1.6,
  },

  closeButton: {
    width: "30px",
    height: "30px",
    border: "1px solid #ddd",
    borderRadius: "7px",
    background: "#fff",
    cursor: "pointer",
    fontSize: "20px",
    lineHeight: 1,
  },

  editorArea: {
    position: "relative",
    minHeight: "650px",
    padding: "28px",
  },

  placeholder: {
    position: "absolute",
    top: "28px",
    left: "28px",
    color: "#aaa",
    pointerEvents: "none",
    lineHeight: 1.8,
  },

  bottomBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    padding: "8px 12px",
    borderTop: "1px solid #eee",
    background: "#fafafa",
    color: "#888",
    fontSize: "12px",
  },
};