import { memo } from 'react'
import { useNavigate } from 'react-router-dom'
import styles from './CommandCard.module.css'

function CommandCard({ label, value, sub, accent, iconBg, icon, navTo, navLabel }) {
  const navigate = useNavigate()

  return (
    <div
      className={styles.card}
      style={{ '--cmd-accent': accent }}
      onClick={() => navigate(navTo)}
      role="button"
      tabIndex={0}
      aria-label={`${label}: ${value}. ${navLabel}`}
      onKeyDown={(e) => e.key === 'Enter' && navigate(navTo)}
    >
      <div className={styles.cardTop}>
        <div>
          <div className={styles.label}>{label}</div>
          <div className={styles.value} style={{ color: accent }}>{value}</div>
          <div className={styles.sub}>{sub}</div>
        </div>
        <div className={styles.iconWrap} style={{ background: iconBg }}>
          {icon}
        </div>
      </div>
      <div className={styles.navHint} style={{ color: accent }}>
        {navLabel}
        <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
          <path d="M5 10h10M11 6l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  )
}

export default memo(CommandCard)