import { memo } from 'react'
import Badge from '../../components/ui/Badge'
import ProgressBar from '../../components/ui/ProgressBar'
import styles from './Learners.module.css'

const statusVariant = {
  Certified: 'success',
  'In Progress': 'info',
  'At Risk': 'danger',
  'Not Certified': 'warning',
}

const projectResultVariant = {
  Passed:  { bg: '#DCFCE7', color: '#15803D' },
  Pending: { bg: '#FEF9C3', color: '#A16207' },
  Failed:  { bg: '#FEE2E2', color: '#B91C1C' },
}

function ProgressCell({ value }) {
  if (value == null) return <span className={styles.scoreEmpty}>—</span>
  return (
    <div className={styles.progressCell}>
      <div className={styles.progressBarWrap}>
        <ProgressBar value={value} autoColor />
      </div>
      <span className={styles.progressPct}>{value}%</span>
    </div>
  )
}

function TestCell({ value }) {
  if (value == null) return <span className={styles.scoreEmpty}>—</span>
  const color = value >= 80 ? '#15803D' : value >= 60 ? '#A16207' : '#B91C1C'
  return <span className={styles.testScore} style={{ color }}>{value}%</span>
}

function ProjectResultCell({ value }) {
  if (!value) return <span className={styles.scoreEmpty}>—</span>
  const style = projectResultVariant[value] ?? { bg: '#F3F4F6', color: '#6B7280' }
  return (
    <span
      className={styles.projectResultTag}
      style={{ background: style.bg, color: style.color }}
    >
      {value}
    </span>
  )
}

function LearnerRow({ learner, isSelected, onSelect, onRemind, onClick }) {
  return (
    <tr
      className={`${styles.row} ${isSelected ? styles.rowSelected : ''}`}
      onClick={() => onClick(learner)}
    >
      <td className={styles.checkboxCell} onClick={(e) => e.stopPropagation()}>
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={isSelected}
          onChange={(e) => onSelect(learner.id, e.target.checked)}
          aria-label={`Select ${learner.name}`}
        />
      </td>
      <td className={styles.learnerTd}>
        <div className={styles.learnerCell}>
          <div className={styles.avatar} style={{ background: learner.avatarColor }}>
            {learner.initials}
          </div>
          <div>
            <div className={styles.learnerName}>{learner.name}</div>
            <div className={styles.learnerEmail}>{learner.email}</div>
          </div>
        </div>
      </td>
      <td><span className={styles.courseCell}>{learner.course}</span></td>
      <td><ProgressCell value={learner.oslProgress} /></td>
      <td><ProgressCell value={learner.lvcProgress} /></td>
      <td><TestCell value={learner.testScore} /></td>
      <td><ProjectResultCell value={learner.projectResult} /></td>
      <td>
        <Badge variant={statusVariant[learner.status] ?? 'neutral'}>{learner.status}</Badge>
      </td>
      <td>
        <button
          className={styles.remindBtn}
          onClick={(e) => { e.stopPropagation(); onRemind(learner) }}
        >
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
            <path d="M10 2a6 6 0 0 0-6 6v3l-1.5 2.5h15L16 11V8a6 6 0 0 0-6-6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M8 16.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Remind
        </button>
      </td>
    </tr>
  )
}

export default memo(LearnerRow)
