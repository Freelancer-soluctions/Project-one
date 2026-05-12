import * as React from "react"
import { useEditor, EditorContent, ReactRenderer } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import Subscript from "@tiptap/extension-subscript"
import Superscript from "@tiptap/extension-superscript"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Highlight from "@tiptap/extension-highlight"
import Mention from "@tiptap/extension-mention"
import CharacterCount from "@tiptap/extension-character-count"
import Link from "@tiptap/extension-link"

import { cn } from "@/lib/utils"
import tippy from "tippy.js"
import { MenuBar } from "./MenuBar"
import { MentionList } from "./MentionList"
import PropTypes from "prop-types"


export function TiptapEditor({
  value = "",
  onChange,
  placeholder,
  className,
  disabled = false,
  mentionSuggestions,
  characterLimit 
}) {

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
        emptyEditorClass:
          "before:content-[attr(data-placeholder)] before:text-muted-foreground before:float-left before:h-0 before:pointer-events-none",
      }),
      CharacterCount.configure({
        limit: characterLimit,
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      Highlight.configure({
        multicolor: false,
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline cursor-pointer hover:text-primary/80",
        },
      }),
      Subscript,
      Superscript,
      Mention.configure({
        HTMLAttributes: {
          class: "mention",
        },
        suggestion: {
          items: ({ query }) => {
            return mentionSuggestions
              .filter((item) =>
                item.label.toLowerCase().includes(query.toLowerCase())
              )
              .slice(0, 5)
          },
          render: () => {
            let component = null
            let popup = null

            return {
              onStart: (props) => {
                component = new ReactRenderer(MentionList, {
                  props,
                  editor: props.editor,
                })

                if (!props.clientRect) {
                  return
                }

                popup = tippy("body", {
                  getReferenceClientRect: props.clientRect,
                  appendTo: () => document.body,
                  content: component.element,
                  showOnCreate: true,
                  interactive: true,
                  trigger: "manual",
                  placement: "bottom-start",
                })
              },

              onUpdate(props) {
                component?.updateProps(props)

                if (!props.clientRect) {
                  return
                }

                popup?.[0]?.setProps({
                  getReferenceClientRect: props.clientRect,
                })
              },

              onKeyDown(props) {
                if (props.event.key === "Escape") {
                  popup?.[0]?.hide()
                  return true
                }

                return component?.ref?.onKeyDown(props) ?? false
              },

              onExit() {
                popup?.[0]?.destroy()
                component?.destroy()
              },
            }
          },
        },
      }),
    ],
    content: value,
    editable: !disabled,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: cn(
          "prose prose-sm dark:prose-invert max-w-none min-h-[120px] w-full px-3 py-2 focus:outline-none",
          "whitespace-pre-wrap break-all",
          "[overflow-wrap:anywhere]",
          "[word-break:break-word]",
          "[&_p]:my-1 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:my-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:my-2",
          "[&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4",
          "[&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground [&_blockquote]:pl-4 [&_blockquote]:italic",
          "[&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm",
          "[&_.mention]:bg-primary/10 [&_.mention]:text-primary [&_.mention]:px-1 [&_.mention]:py-0.5 [&_.mention]:rounded [&_.mention]:font-medium",
          "[&_mark]:bg-yellow-200 [&_mark]:dark:bg-yellow-800 [&_mark]:px-0.5 [&_mark]:rounded-sm",
          "[&_hr]:my-4 [&_hr]:border-border"
        ),
      },
    },
  })




  React.useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value)
    }
  }, [value, editor])

  const characterCount = editor?.storage.characterCount.characters() ?? 0
  const wordCount = editor?.storage.characterCount.words() ?? 0
  const percentage = characterLimit ? Math.round((100 / characterLimit) * characterCount) : 0

  return (
    <div
      className={cn(
        "rounded-md border border-input bg-background ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <MenuBar editor={editor} />
      <div className="max-h-[200px] overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
      <div className="flex items-center justify-between border-t border-border px-3 py-2 text-xs text-muted-foreground">
        <div className="flex items-center gap-4">
          <span>{wordCount} palabras</span>
          <span>{characterCount} / {characterLimit} caracteres</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-24 rounded-full bg-muted overflow-hidden">
            <div
              className={cn(
                "h-full transition-all duration-300",
                percentage < 80 ? "bg-primary" : percentage < 95 ? "bg-yellow-500" : "bg-destructive"
              )}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          <span>{percentage}%</span>
        </div>
      </div>
    </div>
  )
}

TiptapEditor.propTypes = {
  value: PropTypes.string,
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  mentionSuggestions: PropTypes.array
}

