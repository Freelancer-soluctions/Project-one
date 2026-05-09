import * as React from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import Placeholder from "@tiptap/extension-placeholder"
import { cn } from "@/lib/utils"
import PropTypes from "prop-types"
import { MenuBar } from "./MenuBar"

export function TiptapEditor({
    value = "",
    onChange,
    placeholder = "Escribe algo...",
    className,
    disabled = false,
}) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder,
                emptyEditorClass:
                    "before:content-[attr(data-placeholder)] before:text-muted-foreground before:float-left before:h-0 before:pointer-events-none",
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
                    "[&_p]:my-1 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:my-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:my-2",
                    "[&_ul]:list-disc [&_ul]:pl-4 [&_ol]:list-decimal [&_ol]:pl-4",
                    "[&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground [&_blockquote]:pl-4 [&_blockquote]:italic",
                    "[&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm"
                ),
            },
        },
    })

    React.useEffect(() => {
        if (editor && value !== editor.getHTML()) {
            editor.commands.setContent(value)
        }
    }, [value, editor])

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
        </div>
    )
}


TiptapEditor.propTypes = {
    value: PropTypes.string,
    onChange: PropTypes.func,
    placeholder: PropTypes.string,
    className: PropTypes.string,
    disabled: PropTypes.bool
}
