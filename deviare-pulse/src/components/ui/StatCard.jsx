import styles from './StatCard.module.css'

const deltaClass = { up: styles.up, down: styles.down, neutral: styles.neutral }

export default function StatCard({ label, value, suffix, delta, deltaDir = 'neutral', accentColor }) {
  return (
    <div className={styles.card} style={{ '--accent-color': accentColor }}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value}>
        {value}
        {suffix && <span className={styles.suffix}>{suffix}</span>}
      </div>
      {delta && (
        <div className={`${styles.delta} ${deltaClass[deltaDir]}`}>
          {deltaDir === 'up' && '↑ '}
          {deltaDir === 'down' && '↓ '}
          {delta}
        </div>
      )}
    </div>
  )
}