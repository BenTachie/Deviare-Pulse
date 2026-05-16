import { useState } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { useModal } from '../context/ModalContext'
import { useToast } from '../context/ToastContext'
import styles from './Layout.module.css'

export default function Layout({ children }) {
  const { openModal } = useModal()
  const { showToast } = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [syncing, setSyncing] = useState(false)

  const handleSync = () => {
    if (syncing) return
    setSyncing(true)
    showToast('Syncing learner data from LMS & Power BI…', 'info')
    setTimeout(() => {
      setSyncing(false)
      showToast('Learner data synced — all records up to date.', 'success')
    }, 2200)
  }

  return (
    <div className={styles.shell}>
      {sidebarOpen && (
        <div
          className={styles.mobileOverlay}
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside className={`${styles.sidebar} ${sidebarOpen ? styles.sidebarOpen : ''}`}>
        <Sidebar onNavClick={() => setSidebarOpen(false)} />
      </aside>

      <div className={styles.main}>
        <Topbar
          onSyncLearners={handleSync}
          syncing={syncing}
          onSendReminders={() => openModal('send-reminders')}
          onMenuToggle={() => setSidebarOpen((o) => !o)}
        />
        <div className={styles.pageContent}>{children}</div>
      </div>
    </div>
  )
}