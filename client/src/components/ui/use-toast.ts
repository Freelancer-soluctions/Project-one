// Inspired by react-hot-toast library
import * as React from 'react'

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ActionType =
  | { type: 'ADD_TOAST'; toast: Toast }
  | { type: 'UPDATE_TOAST'; toast: Toast }
  | { type: 'DISMISS_TOAST'; toastId?: string }
  | { type: 'REMOVE_TOAST'; toastId?: string }

interface Toast {
    id: string
    open: boolean
    onOpenChange?: (open: boolean) => void
    [key: string]: any // Para permitir propiedades adicionales
}


// Definición del estado
interface State {
  toasts: Toast[]
}
let count = 0

function genId():string {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

// const toastTimeouts = new Map<string>()
const toastTimeouts = new Map()

const addToRemoveQueue = (toastId:string) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: 'REMOVE_TOAST',
      toastId
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

export const reducer = (state:State, action:ActionType) => {
  switch (action.type) {
    case 'ADD_TOAST':
      return {
        ...state,
        toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT)
      }

    case 'UPDATE_TOAST':
      return {
        ...state,
        toasts: state.toasts.map(t =>
          t.id === action.toast.id ? { ...t, ...action.toast } : t
        )
      }

    case 'DISMISS_TOAST': {
      const { toastId } = action

      // ! Side effects ! - This could be extracted into a dismissToast() action,
      // but I'll keep it here for simplicity
      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map(t =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false
              }
            : t
        )
      }
    }
    case 'REMOVE_TOAST':
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: []
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter(t => t.id !== action.toastId)
      }
  }
}

const listeners: React.Dispatch<React.SetStateAction<State>>[] = []

let memoryState: State= { toasts: [] }

function dispatch(action:ActionType) {
  memoryState = reducer(memoryState, action)
  listeners.forEach(listener => {
    listener(memoryState)
  })
}

function toast(props: Omit<Toast, 'id' | 'open' | 'onOpenChange'>): { id: string; dismiss: () => void; update: (props: Partial<Toast>) => void } {
  const id = genId()

  const update = (props:Partial<Toast>) =>
    dispatch({
      type: 'UPDATE_TOAST',
      toast: { ...props, id, open: props.open ?? true }
    })
  const dismiss = () => dispatch({ type: 'DISMISS_TOAST', toastId: id })

  dispatch({
    type: 'ADD_TOAST',
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: open => {
        if (!open) dismiss()
      }
    }
  })

  return {
    id,
    dismiss,
    update
  }
}

function useToast() {
  const [state, setState] = React.useState(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (toastId:string) => dispatch({ type: 'DISMISS_TOAST', toastId })
  }
}

export { useToast, toast }
