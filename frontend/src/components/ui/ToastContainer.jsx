import styles from './ToastContainer.module.css'

const toastIcons = {
  success: (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
      <path d="M6.5 10l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  danger: (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
      <path d="M7 7l6 6M13 7l-6 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <path d="M10 3L2 17h16L10 3z" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M10 8v4M10 14v1" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="8" stroke="rgba(255,255,255,0.7)" strokeWidth="1.5" />
      <path d="M10 9v5M10 6.5v1" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
}

const toastBg = {
  success: 'var(--success)',
  danger:  'var(--danger)',
  warning: 'var(--warning)',
  info:    'var(--blue-dark)',
}

function Toast({ toast, onDismiss }) {
  return (
    <div
      className={styles.toast}
      style={{ background: toastBg[toast.type] ?? toastBg.info }}
      role="alert"
      aria-live="polite"
    >
      <span className={styles.toastIcon}>{toastIcons[toast.type]}</span>
      <span className={styles.toastMessage}>{toast.message}</span>
      <button className={styles.toastClose} onClick={() => onDismiss(toast.id)} aria-label="Dismiss">
        <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
          <path d="M4 4l12 12M16 4L4 16" stroke="rgba(255,255,255,0.7)" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      </button>
    </div>
  )
}

export default function ToastContainer({ toasts, onDismiss }) {
  if (!toasts.length) return null
  return (
    <div className={styles.container}>
      {toasts.map((t) => (
        <Toast key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}