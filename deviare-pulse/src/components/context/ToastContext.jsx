import { createContext, useContext, useState, useCallback, useRef } from 'react'
import ReactDOM from 'react-dom'
import ToastContainer from '../ui/ToastContainer'

const ToastCtx = createContext(null)
let nextId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const timers = useRef({})

  const dismiss = useCallback((id) => {
    clearTimeout(timers.current[id])
    delete timers.current[id]
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = ++nextId
    setToasts((prev) => [...prev, { id, message, type }])
    timers.current[id] = setTimeout(() => dismiss(id), duration)
  }, [dismiss])

  return (
    <ToastCtx.Provider value={{ showToast }}>
      {children}
      {ReactDOM.createPortal(
        <ToastContainer toasts={toasts} onDismiss={dismiss} />,
        document.getElementById('modal-root')
      )}
    </ToastCtx.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastCtx)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}