import styles from './Schedule.module.css'

const TYPE_COLOR = {
  success: 'var(--success)',
  info:    'var(--info)',
  warning: 'var(--warning)',
  danger:  'var(--danger)',
}
const TYPE_BG = {
  success: 'var(--success-bg)',
  info:    'var(--info-bg)',
  warning: 'var(--warning-bg)',
  danger:  'var(--danger-bg)',
}

export default function AutomationLog({ log = [] }) {
  if (log.length === 0) {
    return (
      <div className={styles.logEmpty}>
        <div className={styles.logEmptyIcon}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
              stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/>
            <rect x="9" y="3" width="6" height="4" rx="1" stroke="var(--text-muted)" strokeWidth="1.5"/>
            <path d="M9 12h6M9 16h4" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div className={styles.logEmptyTitle}>No automation activity yet</div>
        <div className={styles.logEmptyDesc}>
          Entries will appear here as reminders are dispatched, milestones are updated, and schedule actions are performed.
        </div>
      </div>
    )
  }

  return (
    <div className={styles.logList}>
      {log.map((entry) => (
        <div key={entry.id} className={styles.logItem}>
          <div
            className={styles.logDot}
            style={{ background: TYPE_BG[entry.type] ?? TYPE_BG.info, color: TYPE_COLOR[entry.type] ?? TYPE_COLOR.info }}
          >
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'currentColor' }} />
          </div>
          <div className={styles.logContent}>
            <div className={styles.logTitle}>{entry.title}</div>
            <div className={styles.logDesc}>{entry.desc}</div>
            <div className={styles.logTime}>{entry.time}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
