import { createContext, useContext, useState, useCallback } from 'react'
import ReactDOM from 'react-dom'
import AddLearnerModal from '../modals/AddLearnerModal'
import SendRemindersModal from '../modals/SendRemindersModal'
import SendReminderModal from '../modals/SendReminderModal'

const ModalCtx = createContext(null)

const MODAL_MAP = {
  'add-learner':    AddLearnerModal,
  'send-reminders': SendRemindersModal,
  'send-reminder':  SendReminderModal,
}

export function ModalProvider({ children }) {
  const [active, setActive] = useState(null) // { type, props }

  const openModal  = useCallback((type, props = {}) => setActive({ type, props }), [])
  const closeModal = useCallback(() => setActive(null), [])

  const ModalComponent = active ? MODAL_MAP[active.type] : null

  return (
    <ModalCtx.Provider value={{ openModal, closeModal }}>
      {children}
      {ModalComponent &&
        ReactDOM.createPortal(
          <ModalComponent {...active.props} onClose={closeModal} />,
          document.getElementById('modal-root')
        )
      }
    </ModalCtx.Provider>
  )
}

export const useModal = () => {
  const ctx = useContext(ModalCtx)
  if (!ctx) throw new Error('useModal must be used within ModalProvider')
  return ctx
}