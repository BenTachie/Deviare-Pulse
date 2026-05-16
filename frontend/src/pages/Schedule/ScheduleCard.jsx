import Badge from '../../components/ui/Badge'
import styles from './Schedule.module.css'

function CalendarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <rect x="2" y="3" width="16" height="15" rx="2.5" stroke="#2D7DD2" strokeWidth="1.4"/>
      <path d="M2 7.5h16" stroke="#2D7DD2" strokeWidth="1.4"/>
      <path d="M6.5 2v3M13.5 2v3" stroke="#2D7DD2" strokeWidth="1.4" strokeLinecap="round"/>
      <rect x="5.5" y="10" width="3" height="2.5" rx="0.5" fill="#2D7DD2" opacity="0.5"/>
      <rect x="11.5" y="10" width="3" height="2.5" rx="0.5" fill="#2D7DD2" opacity="0.5"/>
    </svg>
  )
}

export default function ScheduleCard({ schedule, isSelected, onClick, onDelete }) {
  const milestoneCount = schedule.milestones?.length ?? 0

  return (
    <div
      className={`${styles.schedCard} ${isSelected ? styles.schedCardSelected : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className={styles.schedCardTop}>
        <div className={styles.schedCalIcon}>
          <CalendarIcon />
        </div>
        <div className={styles.schedCardInfo}>
          <div className={styles.schedCardClient}>{schedule.client}</div>
          <div className={styles.schedCardName}>{schedule.name}</div>
        </div>
        <div className={styles.schedCardActions}>
          <Badge variant={schedule.status === 'Active' ? 'success' : 'neutral'}>
            {schedule.status}
          </Badge>
          <button
            className={styles.schedDeleteBtn}
            onClick={(e) => onDelete(schedule.id, e)}
            aria-label={`Delete ${schedule.name}`}
            title="Remove schedule"
          >
            <svg width="10" height="10" viewBox="0 0 20 20" fill="none">
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
      </div>

      <div className={styles.schedCardMeta}>
        <div className={styles.schedMetaItem}>
          <span className={styles.schedMetaLabel}>Start</span>
          <span className={styles.schedMetaValue}>{schedule.startDate}</span>
        </div>
        <div className={styles.schedMetaDivider} />
        <div className={styles.schedMetaItem}>
          <span className={styles.schedMetaValue}>{milestoneCount}</span>
          <span className={styles.schedMetaLabel}>milestones</span>
        </div>
        <div className={styles.schedMetaDivider} />
        <div className={styles.schedMetaItem}>
          <span className={styles.schedMetaLabel}>Updated</span>
          <span className={styles.schedMetaValue}>{schedule.updatedAt ?? '—'}</span>
        </div>
      </div>
    </div>
  )
}
