import { useEffect } from 'react'
import styles from './DetailPanel.module.css'

export default function DetailPanel({ isOpen, onClose, title, subtitle, avatarText, avatarColor, children }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    if (isOpen) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  return (
    <>
      {isOpen && (
        <div
          className={styles.backdrop}
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        className={`${styles.panel} ${isOpen ? styles.open : ''}`}
        aria-hidden={!isOpen}
        role="complementary"
        aria-label="Learner detail"
      >
        <div className={styles.header}>
          <div
            className={styles.avatar}
            style={{ background: avatarColor ?? 'var(--blue-light)' }}
          >
            {avatarText}
          </div>
          <div className={styles.headerInfo}>
            <div className={styles.headerTitle}>{title}</div>
            <div className={styles.headerSub}>{subtitle}</div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close panel">
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </>
  )
}