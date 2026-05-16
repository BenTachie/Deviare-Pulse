import styles from './Badge.module.css'

const variantMap = {
  success: styles.success,
  warning: styles.warning,
  danger: styles.danger,
  info: styles.info,
  neutral: styles.neutral,
}

export default function Badge({ variant = 'neutral', children }) {
  return (
    <span className={`${styles.badge} ${variantMap[variant] ?? styles.neutral}`}>
      {children}
    </span>
  )
}