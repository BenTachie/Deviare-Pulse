import styles from './Button.module.css'

const variantMap = {
  primary: styles.primary,
  secondary: styles.secondary,
  ghost: styles.ghost,
}

export default function Button({
  variant = 'primary',
  size = 'md',
  children,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
}) {
  return (
    <button
      type={type}
      className={`${styles.btn} ${variantMap[variant]} ${styles[size]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}