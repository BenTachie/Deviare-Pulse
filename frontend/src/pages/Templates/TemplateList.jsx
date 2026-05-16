import styles from './Templates.module.css'

function fmtDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function TemplateList({ templates, selectedId, onSelect }) {
  return (
    <div className={styles.tplList}>
      {templates.map((tpl) => (
        <div
          key={tpl.id}
          className={`${styles.tplCard} ${selectedId === tpl.id ? styles.tplCardSelected : ''}`}
          onClick={() => onSelect(tpl)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onSelect(tpl)}
        >
          <div className={styles.tplCardRow}>
            <span className={styles.tplDot} style={{ background: tpl.color }} />
            <div className={styles.tplCardInfo}>
              <div className={styles.tplName}>{tpl.name}</div>
              <div className={styles.tplMeta}>Last edited: {fmtDate(tpl.lastEdited)}</div>
            </div>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
              <path d="M8 5l5 5-5 5" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>
      ))}
    </div>
  )
}
