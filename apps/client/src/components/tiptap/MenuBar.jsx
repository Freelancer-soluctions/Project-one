import PropTypes from "prop-types"
import * as React from "react"


import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Underline as UnderlineIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Highlighter,
  Link as LinkIcon,
  Unlink,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  RemoveFormatting,
  Minus,
} from "lucide-react"
import { Toggle } from "@/components/ui/toggle"


export const MenuBar = ({ editor }) => {
  if (!editor) {
    return null
  }

  const setLink = React.useCallback(() => {
    const previousUrl = editor.getAttributes("link").href
    const url = window.prompt("URL", previousUrl)

    if (url === null) {
      return
    }

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run()
      return
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run()
  }, [editor])

  return (
    <div className="flex flex-wrap gap-1 border-b border-border p-1">
      {/* Formato de texto básico */}
      <Toggle
        size="sm"
        pressed={editor.isActive("bold")}
        onPressedChange={() => editor.chain().focus().toggleBold().run()}
        aria-label="Toggle bold"
      >
        <Bold className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("italic")}
        onPressedChange={() => editor.chain().focus().toggleItalic().run()}
        aria-label="Toggle italic"
      >
        <Italic className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("underline")}
        onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
        aria-label="Toggle underline"
      >
        <UnderlineIcon className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("strike")}
        onPressedChange={() => editor.chain().focus().toggleStrike().run()}
        aria-label="Toggle strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("code")}
        onPressedChange={() => editor.chain().focus().toggleCode().run()}
        aria-label="Toggle code"
      >
        <Code className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("highlight")}
        onPressedChange={() => editor.chain().focus().toggleHighlight().run()}
        aria-label="Toggle highlight"
      >
        <Highlighter className="h-4 w-4" />
      </Toggle>

      <div className="mx-1 w-px bg-border" />

      {/* Superscript y Subscript */}
      <Toggle
        size="sm"
        pressed={editor.isActive("superscript")}
        onPressedChange={() => editor.chain().focus().toggleSuperscript().run()}
        aria-label="Toggle superscript"
      >
        <SuperscriptIcon className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("subscript")}
        onPressedChange={() => editor.chain().focus().toggleSubscript().run()}
        aria-label="Toggle subscript"
      >
        <SubscriptIcon className="h-4 w-4" />
      </Toggle>

      <div className="mx-1 w-px bg-border" />

      {/* Encabezados */}
      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 1 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 1 }).run()
        }
        aria-label="Toggle heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 2 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 2 }).run()
        }
        aria-label="Toggle heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("heading", { level: 3 })}
        onPressedChange={() =>
          editor.chain().focus().toggleHeading({ level: 3 }).run()
        }
        aria-label="Toggle heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </Toggle>

      <div className="mx-1 w-px bg-border" />

      {/* Alineación de texto */}
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: "left" })}
        onPressedChange={() => editor.chain().focus().setTextAlign("left").run()}
        aria-label="Align left"
      >
        <AlignLeft className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: "center" })}
        onPressedChange={() => editor.chain().focus().setTextAlign("center").run()}
        aria-label="Align center"
      >
        <AlignCenter className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: "right" })}
        onPressedChange={() => editor.chain().focus().setTextAlign("right").run()}
        aria-label="Align right"
      >
        <AlignRight className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive({ textAlign: "justify" })}
        onPressedChange={() => editor.chain().focus().setTextAlign("justify").run()}
        aria-label="Align justify"
      >
        <AlignJustify className="h-4 w-4" />
      </Toggle>

      <div className="mx-1 w-px bg-border" />

      {/* Listas y citas */}
      <Toggle
        size="sm"
        pressed={editor.isActive("bulletList")}
        onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
        aria-label="Toggle bullet list"
      >
        <List className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("orderedList")}
        onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
        aria-label="Toggle ordered list"
      >
        <ListOrdered className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={editor.isActive("blockquote")}
        onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
        aria-label="Toggle blockquote"
      >
        <Quote className="h-4 w-4" />
      </Toggle>

      <div className="mx-1 w-px bg-border" />

      {/* Links */}
      <Toggle
        size="sm"
        pressed={editor.isActive("link")}
        onPressedChange={setLink}
        aria-label="Add link"
      >
        <LinkIcon className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={false}
        onPressedChange={() => editor.chain().focus().unsetLink().run()}
        disabled={!editor.isActive("link")}
        aria-label="Remove link"
      >
        <Unlink className="h-4 w-4" />
      </Toggle>

      <div className="mx-1 w-px bg-border" />

      {/* Línea horizontal */}
      <Toggle
        size="sm"
        pressed={false}
        onPressedChange={() => editor.chain().focus().setHorizontalRule().run()}
        aria-label="Add horizontal rule"
      >
        <Minus className="h-4 w-4" />
      </Toggle>

      {/* Limpiar formato */}
      <Toggle
        size="sm"
        pressed={false}
        onPressedChange={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        aria-label="Clear formatting"
      >
        <RemoveFormatting className="h-4 w-4" />
      </Toggle>

      <div className="mx-1 w-px bg-border" />

      {/* Deshacer y rehacer */}
      <Toggle
        size="sm"
        pressed={false}
        onPressedChange={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        aria-label="Undo"
      >
        <Undo className="h-4 w-4" />
      </Toggle>
      <Toggle
        size="sm"
        pressed={false}
        onPressedChange={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        aria-label="Redo"
      >
        <Redo className="h-4 w-4" />
      </Toggle>
    </div>
  )
}

// export const MenuBar = ({ editor }) => {
//   if (!editor) {
//     return null
//   }

//   return (
//     <div className="flex flex-wrap gap-1 border-b border-border p-1">
//       <Toggle
//         size="sm"
//         pressed={editor.isActive("bold")}
//         onPressedChange={() => editor.chain().focus().toggleBold().run()}
//         aria-label="Toggle bold"
//       >
//         <Bold className="h-4 w-4" />
//       </Toggle>
//       <Toggle
//         size="sm"
//         pressed={editor.isActive("italic")}
//         onPressedChange={() => editor.chain().focus().toggleItalic().run()}
//         aria-label="Toggle italic"
//       >
//         <Italic className="h-4 w-4" />
//       </Toggle>
//       <Toggle
//         size="sm"
//         pressed={editor.isActive("strike")}
//         onPressedChange={() => editor.chain().focus().toggleStrike().run()}
//         aria-label="Toggle strikethrough"
//       >
//         <Strikethrough className="h-4 w-4" />
//       </Toggle>
//       <Toggle
//         size="sm"
//         pressed={editor.isActive("code")}
//         onPressedChange={() => editor.chain().focus().toggleCode().run()}
//         aria-label="Toggle code"
//       >
//         <Code className="h-4 w-4" />
//       </Toggle>
//       <div className="mx-1 w-px bg-border" />
//       <Toggle
//         size="sm"
//         pressed={editor.isActive("heading", { level: 1 })}
//         onPressedChange={() =>
//           editor.chain().focus().toggleHeading({ level: 1 }).run()
//         }
//         aria-label="Toggle heading 1"
//       >
//         <Heading1 className="h-4 w-4" />
//       </Toggle>
//       <Toggle
//         size="sm"
//         pressed={editor.isActive("heading", { level: 2 })}
//         onPressedChange={() =>
//           editor.chain().focus().toggleHeading({ level: 2 }).run()
//         }
//         aria-label="Toggle heading 2"
//       >
//         <Heading2 className="h-4 w-4" />
//       </Toggle>
//       <div className="mx-1 w-px bg-border" />
//       <Toggle
//         size="sm"
//         pressed={editor.isActive("bulletList")}
//         onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
//         aria-label="Toggle bullet list"
//       >
//         <List className="h-4 w-4" />
//       </Toggle>
//       <Toggle
//         size="sm"
//         pressed={editor.isActive("orderedList")}
//         onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
//         aria-label="Toggle ordered list"
//       >
//         <ListOrdered className="h-4 w-4" />
//       </Toggle>
//       <Toggle
//         size="sm"
//         pressed={editor.isActive("blockquote")}
//         onPressedChange={() => editor.chain().focus().toggleBlockquote().run()}
//         aria-label="Toggle blockquote"
//       >
//         <Quote className="h-4 w-4" />
//       </Toggle>
//       <div className="mx-1 w-px bg-border" />
//       <Toggle
//         size="sm"
//         pressed={false}
//         onPressedChange={() => editor.chain().focus().undo().run()}
//         disabled={!editor.can().undo()}
//         aria-label="Undo"
//       >
//         <Undo className="h-4 w-4" />
//       </Toggle>
//       <Toggle
//         size="sm"
//         pressed={false}
//         onPressedChange={() => editor.chain().focus().redo().run()}
//         disabled={!editor.can().redo()}
//         aria-label="Redo"
//       >
//         <Redo className="h-4 w-4" />
//       </Toggle>
//     </div>
//   )
// }

MenuBar.propTypes = {
  editor: PropTypes.any
};
