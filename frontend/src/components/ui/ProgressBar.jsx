import styles from './ProgressBar.module.css'

const colorMap = {
  success: styles.success,
  warning: styles.warning,
  danger: styles.danger,
  info: styles.info,
}

function getAutoColor(pct) {
  if (pct >= 85) return 'success'
  if (pct >= 60) return 'warning'
  return 'danger'
}

export default function ProgressBar({ value, color, autoColor = false }) {
  const resolved = color ?? (autoColor ? getAutoColor(value) : 'info')
  return (
    <div className={styles.wrap}>
      <div
        className={`${styles.fill} ${colorMap[resolved]}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  )
}