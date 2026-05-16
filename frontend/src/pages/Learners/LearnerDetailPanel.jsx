import DetailPanel from '../../components/ui/DetailPanel'
import Badge from '../../components/ui/Badge'
import ProgressBar from '../../components/ui/ProgressBar'
import Button from '../../components/ui/Button'
import { useModal } from '../../components/context/ModalContext'
import styles from './Learners.module.css'


const statusVariant = {
  Certified: 'success', 'In Progress': 'info', 'At Risk': 'danger', 'Not Certified': 'warning',
}

const MILESTONE_STAGES = [
  { key: 'activation', label: 'Course Activation' },
  { key: 'osl',        label: 'OSL ≥ 85%' },
  { key: 'lvc',        label: 'LVC ≥ 80%' },
  { key: 'assessment', label: 'Assessment' },
  { key: 'project',    label: 'Project' },
  { key: 'completion', label: 'Certificate' },
]

export default function LearnerDetailPanel({ learner, onClose }) {
  const { openModal } = useModal()

  const handleRemind = () => {
    onClose()
    openModal('send-reminder', { preselectedLearner: learner })
  }

  return (
    <DetailPanel
      isOpen={!!learner}
      onClose={onClose}
      title={learner?.name}
      subtitle={learner?.email}
      avatarText={learner?.initials}
      avatarColor={learner?.avatarColor}
    >
      {learner && (
        <>
          {/* Status + course */}
          <div className={styles.panelSection}>
            <div className={styles.panelSectionTitle}>Enrolment</div>
            <div className={styles.panelRow}>
              <span className={styles.panelKey}>Status</span>
              <Badge variant={statusVariant[learner.status]}>{learner.status}</Badge>
            </div>
            <div className={styles.panelRow}>
              <span className={styles.panelKey}>Course</span>
              <span className={styles.panelVal}>{learner.course}</span>
            </div>
            <div className={styles.panelRow}>
              <span className={styles.panelKey}>Cohort</span>
              <span className={styles.panelVal}>{learner.cohort}</span>
            </div>
            <div className={styles.panelRow}>
              <span className={styles.panelKey}>Activity</span>
              <span className={styles.panelVal}>{learner.activityLevel}</span>
            </div>
            {learner.completionDate && (
              <div className={styles.panelRow}>
                <span className={styles.panelKey}>Completed</span>
                <span className={styles.panelVal}>{learner.completionDate}</span>
              </div>
            )}
          </div>

          {/* Progress */}
          <div className={styles.panelSection}>
            <div className={styles.panelSectionTitle}>Progress</div>
            <div className={styles.progressItem}>
              <div className={styles.progressLabel}>
                <span>OSL Completion</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{learner.oslProgress}%</span>
              </div>
              <ProgressBar value={learner.oslProgress} autoColor />
            </div>
            <div className={styles.progressItem}>
              <div className={styles.progressLabel}>
                <span>LVC Attendance</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{learner.lvcProgress}%</span>
              </div>
              <ProgressBar value={learner.lvcProgress} autoColor />
            </div>
          </div>

          {/* Milestone journey */}
          <div className={styles.panelSection}>
            <div className={styles.panelSectionTitle}>Milestone Journey</div>
            <div className={styles.panelMilestones}>
              {MILESTONE_STAGES.map((stage, i) => {
                const isCurrent = learner.currentMilestone.label.toLowerCase().includes(stage.key)
                const isDone    = i < MILESTONE_STAGES.findIndex((s) =>
                  learner.currentMilestone.label.toLowerCase().includes(s.key)
                )
                return (
                  <div key={stage.key} className={styles.panelMsRow}>
                    <div className={`${styles.panelMsDot} ${isDone ? styles.msDotDone : isCurrent ? styles.msDotActive : styles.msDotPending}`}>
                      {isDone ? '✓' : i + 1}
                    </div>
                    <span className={styles.panelMsLabel}>{stage.label}</span>
                    {isCurrent && <Badge variant="info">Current</Badge>}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Actions */}
          <div className={styles.panelActions}>
            <Button variant="primary" onClick={handleRemind}>Send Reminder</Button>
            <Button variant="secondary">View Full Profile</Button>
          </div>
        </>
      )}
    </DetailPanel>
  )
}