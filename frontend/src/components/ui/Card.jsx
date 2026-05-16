import styles from './Card.module.css'

export function Card({ children, className = '' }) {
  return <div className={`${styles.card} ${className}`}>{children}</div>
}

export function CardHeader({ title, subtitle, action }) {
  return (
    <div className={styles.header}>
      <div>
        <div className={styles.title}>{title}</div>
        {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
      </div>
      {action && <div className={styles.headerAction}>{action}</div>}
    </div>
  )
}

export function CardBody({ children, noPadding = false }) {
  return (
    <div className={noPadding ? '' : styles.body}>
      {children}
    </div>
  )
}