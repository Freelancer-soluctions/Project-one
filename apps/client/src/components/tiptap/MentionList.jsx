import React from "react"
import {
  AtSign,
} from "lucide-react"
import { cn } from "@/lib/utils"

import PropTypes from "prop-types"

// Componente para renderizar la lista de sugerencias
export const MentionList = React.forwardRef(({ items, command }, ref) => {
  const [selectedIndex, setSelectedIndex] = React.useState(0)
  const listRef = React.useRef(null)

  const selectItem = (index) => {
    const item = items[index]
    if (item) {
      command(item)
    }
  }

  React.useEffect(() => {
    setSelectedIndex(0)
  }, [items])

  React.useEffect(() => {
    // Focus the list container when it opens
    if (listRef.current) {
      listRef.current.focus({ preventScroll: true })
    }
  }, [])

  React.useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((prev) => (prev + items.length - 1) % items.length)
        return true
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((prev) => (prev + 1) % items.length)
        return true
      }
      if (event.key === "Enter") {
        selectItem(selectedIndex)
        return true
      }
      return false
    },
  }))

  if (items.length === 0) {
    return (
      <div className="rounded-md border border-border bg-popover p-2 text-sm text-muted-foreground shadow-md">
        No se encontraron resultados
      </div>
    )
  }

  return (
    <div 
      ref={listRef}
      className="rounded-md border border-border bg-popover shadow-md"
      tabIndex={-1}
    >
      {items.map((item, index) => (
        <button
          key={item.id}
          onClick={() => selectItem(index)}
          onMouseDown={(e) => {
            // Prevent default to avoid editor losing focus
            e.preventDefault()
            selectItem(index)
          }}
          className={cn(
            "flex w-full items-center gap-2 px-3 py-2 text-sm text-left",
            "hover:bg-accent hover:text-accent-foreground",
            index === selectedIndex && "bg-accent text-accent-foreground"
          )}
        >
          <AtSign className="h-4 w-4 text-muted-foreground" />
          {item.label}
        </button>
      ))}
    </div>
  )
})

MentionList.displayName = "MentionList"

MentionList.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      label: PropTypes.string.isRequired,
    })
  ).isRequired,
  command: PropTypes.func.isRequired,
}