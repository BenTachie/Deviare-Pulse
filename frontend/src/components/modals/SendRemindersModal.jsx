import { useState, useMemo, useCallback } from 'react'
import Modal from '../ui/Modal'
import { useToast } from '../context/ToastContext'
import { useApp } from '../../context/AppContext'
import { MultiSelectDropdown } from '../ui/MultiSelectDropdown'
import { sendReminders } from '../../services/emailApi'
import { MILESTONE_LABELS } from '../../data/reminderTemplates'
import styles from './Modals.module.css'

const MILESTONE_OPTIONS = [
  { key: 'activation', label: 'Course Activation' },
  { key: 'osl',        label: 'OSL Progress' },
  { key: 'lvc',        label: 'LVC Attendance' },
  { key: 'assessment', label: 'Assessment Deadline' },
  { key: 'project',    label: 'Project Submission' },
  { key: 'completion', label: 'Course Completion' },
]

const AUDIENCE_OPTIONS = [
  { key: 'overdue',   label: 'Overdue only',          defaultActive: true  },
  { key: 'upcoming',  label: 'Upcoming deadlines',    defaultActive: true  },
  { key: 'inactive',  label: 'Inactive learners',     defaultActive: false },
  { key: 'all',       label: 'All learners in scope', defaultActive: false },
]

/* ── Audience matcher ────────────────────────────────────────────── */
function matchesAudience(learner, audience) {
  if (audience.all)      return true
  if (audience.overdue   && (learner.status === 'At Risk' || learner.status === 'Not Certified')) return true
  if (audience.upcoming  && learner.status === 'In Progress')   return true
  if (audience.inactive  && learner.activityLevel === 'Passive') return true
  return false
}

/* ── Recipient count from live data ──────────────────────────────── */
function calcRecipients(learners, clients, programs, courses, audience) {
  if (!Object.values(audience).some(Boolean)) return 0

  let pool = learners
  if (clients.length)  pool = pool.filter((l) => clients.includes(l.clientName))
  if (programs.length) pool = pool.filter((l) => programs.includes(l.projectName))
  if (courses.length)  pool = pool.filter((l) => courses.includes(l.course))

  return pool.filter((l) => matchesAudience(l, audience)).length
}

/* ── Build recipients payload for a given milestone ─────────────── */
function buildRecipientsForMilestone(learners, clients, programs, courses, audience, milestoneKey) {
  let pool = learners
  if (clients.length)  pool = pool.filter((l) => clients.includes(l.clientName))
  if (programs.length) pool = pool.filter((l) => programs.includes(l.projectName))
  if (courses.length)  pool = pool.filter((l) => courses.includes(l.course))

  return pool
    .filter((l) => l.email && matchesAudience(l, audience))
    .map((l) => {
      const milestoneLabel = MILESTONE_LABELS[milestoneKey] ?? ''
      return {
        email: l.email,
        name:  l.name,
        variables: {
          LearnerName:     l.name?.split(' ')[0] || l.name || '',
          CourseName:      l.course || '',
          MilestoneName:   milestoneLabel,
          CurrentProgress: milestoneKey === 'lvc'
            ? `${Math.round(l.lvcProgress ?? 0)}%`
            : `${Math.round(l.oslProgress ?? 0)}%`,
          RequiredTarget:  milestoneKey === 'lvc' ? '80%' : '85%',
          DueDate:         l.completionDate || 'your programme deadline',
          DaysRemaining:   '7',
        },
      }
    })
}

/* ── Component ───────────────────────────────────────────────────── */
export default function SendRemindersModal({ onClose }) {
  const { showToast } = useToast()
  const { learners }  = useApp()

  /* ── Step 1: scope ── */
  const [clients,  setClients]  = useState([])
  const [programs, setPrograms] = useState([])
  const [courses,  setCourses]  = useState([])

  const allClients = useMemo(
    () => [...new Set(learners.map((l) => l.clientName).filter(Boolean))].sort(),
    [learners]
  )

  const handleClientsChange = useCallback((vals) => {
    setClients(vals)
    if (vals.length > 0) {
      const pool = learners.filter((l) => vals.includes(l.clientName))
      const reachablePrograms = new Set(pool.map((l) => l.projectName))
      const reachableCourses  = new Set(pool.map((l) => l.course))
      setPrograms((prev) => prev.filter((p) => reachablePrograms.has(p)))
      setCourses((prev)  => prev.filter((c) => reachableCourses.has(c)))
    }
  }, [learners])

  const handleProgramsChange = useCallback((vals) => {
    setPrograms(vals)
    if (vals.length > 0) {
      const clientPool = clients.length
        ? learners.filter((l) => clients.includes(l.clientName))
        : learners
      const reachable = new Set(
        clientPool.filter((l) => vals.includes(l.projectName)).map((l) => l.course)
      )
      setCourses((prev) => prev.filter((c) => reachable.has(c)))
    }
  }, [learners, clients])

  const availablePrograms = useMemo(() => {
    const pool = clients.length
      ? learners.filter((l) => clients.includes(l.clientName))
      : learners
    return [...new Set(pool.map((l) => l.projectName).filter(Boolean))].sort()
  }, [learners, clients])

  const availableCourses = useMemo(() => {
    let pool = clients.length
      ? learners.filter((l) => clients.includes(l.clientName))
      : learners
    if (programs.length) pool = pool.filter((l) => programs.includes(l.projectName))
    return [...new Set(pool.map((l) => l.course).filter(Boolean))].sort()
  }, [learners, clients, programs])

  /* ── Step 2: milestones ── */
  const [milestones, setMilestones] = useState(
    Object.fromEntries(
      MILESTONE_OPTIONS.map((m) => [m.key, ['activation', 'osl', 'assessment'].includes(m.key)])
    )
  )

  /* ── Step 3: audience ── */
  const [audience, setAudience] = useState(
    Object.fromEntries(AUDIENCE_OPTIONS.map((a) => [a.key, a.defaultActive]))
  )

  /* ── Optional note ── */
  const [additionalNote, setAdditionalNote] = useState('')

  /* ── Send state ── */
  const [sending,  setSending]  = useState(false)
  const [sent,     setSent]     = useState(false)
  const [apiError, setApiError] = useState(null)

  const toggleMilestone = (key) => setMilestones((prev) => ({ ...prev, [key]: !prev[key] }))

  const toggleAudience = (key) => {
    setAudience((prev) => {
      if (key === 'all') {
        const next = !prev.all
        return next
          ? { overdue: false, upcoming: false, inactive: false, all: true }
          : { ...prev, all: false }
      }
      return { ...prev, [key]: !prev[key], all: false }
    })
  }

  const selectedMsLabels = MILESTONE_OPTIONS.filter((m) => milestones[m.key]).map((m) => m.label)
  const selectedMsKeys   = MILESTONE_OPTIONS.filter((m) => milestones[m.key]).map((m) => m.key)
  const milestoneCount   = selectedMsKeys.length

  const recipientCount = useMemo(
    () => calcRecipients(learners, clients, programs, courses, audience),
    [learners, clients, programs, courses, audience]
  )

  const hasScope = clients.length > 0 || programs.length > 0 || courses.length > 0
  const isValid  = selectedMsKeys.length > 0 && recipientCount > 0

  /* ── Send handler ── */
  const handleSend = async () => {
    if (!isValid || sending || sent) return
    setApiError(null)
    setSending(true)

    let totalSent   = 0
    let totalFailed = 0

    try {
      for (const msKey of selectedMsKeys) {
        const recipients = buildRecipientsForMilestone(
          learners, clients, programs, courses, audience, msKey
        )
        if (recipients.length === 0) continue

        const result = await sendReminders({
          recipients,
          templateKey:    msKey,
          additionalNote: additionalNote.trim() || undefined,
        })
        totalSent   += result.sent   ?? 0
        totalFailed += result.failed ?? 0
      }

      setSent(true)
      const scopeLabel = [
        clients.length  ? clients.join(', ')  : 'All clients',
        programs.length ? programs.join(', ') : null,
        courses.length  ? courses.join(', ')  : null,
      ].filter(Boolean).join(' › ')

      showToast(
        totalFailed > 0
          ? `${totalSent} sent, ${totalFailed} failed — ${scopeLabel}`
          : `${totalSent} reminder${totalSent !== 1 ? 's' : ''} dispatched — ${scopeLabel}`,
        totalFailed > 0 ? 'warning' : 'success',
      )
      setTimeout(onClose, 900)
    } catch (err) {
      setApiError(err.message || 'Failed to dispatch reminders. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const validationMsg = selectedMsKeys.length === 0
    ? 'Select at least one milestone type.'
    : recipientCount === 0
    ? 'No learners match the current scope and audience filters.'
    : ''

  /* Summary display helpers */
  const sumClients  = clients.length  ? clients.join(', ')  : 'All'
  const sumPrograms = programs.length ? programs.join(', ') : 'All'
  const sumCourses  = courses.length  ? courses.join(', ')  : 'All'

  const sendLabel = sent
    ? 'Sent!'
    : sending
    ? 'Sending…'
    : `Send${recipientCount > 0 ? ` ${recipientCount}` : ''} Reminder${recipientCount !== 1 ? 's' : ''}`

  return (
    <Modal
      title="Send Reminders"
      subtitle="Filter by client, programme and course — then choose milestone types and audience"
      onClose={onClose}
      width={640}
      footer={
        <div className={styles.remindFooter}>
          <div className={styles.remindValidation}>{!isValid && !sending ? validationMsg : ''}</div>
          <div className={styles.remindFooterBtns}>
            <button className={styles.cancelBtn} onClick={onClose} disabled={sending}>Cancel</button>
            <button
              className={styles.sendBtn}
              onClick={handleSend}
              disabled={!isValid || sending || sent}
              style={isValid && !sending && !sent ? { animation: 'btn-ready 1.8s ease-in-out infinite' } : undefined}
            >
              {!sending && (
                <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                  <path d="M17.5 2.5L2.5 9.17l5.83 2.5 2.5 5.83 6.67-15Z"
                    stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                  <path d="M8.33 11.67L17.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )}
              {sending && <span className={styles.sendingSpinner} />}
              {sendLabel}
            </button>
          </div>
        </div>
      }
    >
      <div className={styles.remindBody}>

        {/* ── Error banner ── */}
        {apiError && (
          <div className={styles.errorBanner}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 6v5M10 14h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {apiError}
          </div>
        )}

        {/* ── STEP 1: Target Scope ── */}
        <div className={styles.remindStep}>
          <div className={styles.stepLabel}>
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
              <path d="M3 5h14M5 10h10M8 15h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Step 1 — Target Scope
          </div>
          <div className={styles.scopeGrid}>

            <div>
              <div className={styles.scopeColLabel}>Client</div>
              <div className={`${styles.scopeDropdownWrap} ${clients.length ? styles.scopeDropdownWrapActive : ''}`}>
                <MultiSelectDropdown
                  options={allClients}
                  selected={clients}
                  onChange={handleClientsChange}
                />
              </div>
            </div>

            <div>
              <div className={styles.scopeColLabel}>Programme</div>
              <div className={`${styles.scopeDropdownWrap} ${programs.length ? styles.scopeDropdownWrapActive : ''}`}>
                <MultiSelectDropdown
                  options={availablePrograms}
                  selected={programs}
                  onChange={handleProgramsChange}
                />
              </div>
            </div>

            <div>
              <div className={styles.scopeColLabel}>Course</div>
              <div className={`${styles.scopeDropdownWrap} ${courses.length ? styles.scopeDropdownWrapActive : ''}`}>
                <MultiSelectDropdown
                  options={availableCourses}
                  selected={courses}
                  onChange={setCourses}
                />
              </div>
            </div>

          </div>
        </div>

        {/* ── STEP 2: Milestone Types ── */}
        <div>
          <div className={styles.stepLabel}>
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 7v4l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Step 2 — Milestone Types
          </div>
          <div className={styles.msFilterGrid}>
            {MILESTONE_OPTIONS.map((m) => (
              <label
                key={m.key}
                className={`${styles.msCheck} ${milestones[m.key] ? styles.msCheckActive : ''}`}
              >
                <input
                  type="checkbox"
                  checked={milestones[m.key]}
                  onChange={() => toggleMilestone(m.key)}
                  disabled={sending}
                />
                <span>{m.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* ── STEP 3: Audience ── */}
        <div>
          <div className={styles.stepLabel}>
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            Step 3 — Audience
          </div>
          <div className={styles.audiencePillGroup}>
            {AUDIENCE_OPTIONS.map((a) => {
              const isActive  = audience[a.key]
              const isDimmed  = audience.all && a.key !== 'all'
              return (
                <button
                  key={a.key}
                  type="button"
                  className={`${styles.audiencePill} ${isActive ? styles.audiencePillActive : ''} ${isDimmed ? styles.audiencePillDimmed : ''}`}
                  onClick={() => toggleAudience(a.key)}
                  disabled={sending}
                >
                  <span className={styles.audiencePillDot} />
                  {a.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Summary Panel ── */}
        <div className={`${styles.remindSummary} ${hasScope ? styles.remindSummaryPopulated : ''}`}>
          <div className={styles.remindSummaryHeader}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15h14a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z"
                fill="rgba(0,194,203,0.25)"/>
              <path d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15h14a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z"
                stroke="#00C2CB" strokeWidth="1.5"/>
            </svg>
            <span className={styles.remindSummaryTitle}>Reminder Summary</span>
            <span className={`${styles.remindScopeTag} ${hasScope ? styles.remindScopeTagActive : ''}`}>
              {hasScope
                ? [clients.length && clients.join(', '), programs.length && programs.join(', '), courses.length && courses.join(', ')].filter(Boolean).join(' › ')
                : 'No scope selected'}
            </span>
          </div>

          <div className={`${styles.remindSummaryGrid} ${styles.remindSummaryGrid3}`}>
            <div className={styles.summaryCell}>
              <div className={styles.summaryCellLabel}>Client</div>
              <div className={`${styles.summaryCellValue} ${!clients.length ? styles.summaryCellMuted : ''}`}>{sumClients}</div>
            </div>
            <div className={styles.summaryCell}>
              <div className={styles.summaryCellLabel}>Programme</div>
              <div className={`${styles.summaryCellValue} ${!programs.length ? styles.summaryCellMuted : ''}`}>{sumPrograms}</div>
            </div>
            <div className={styles.summaryCell}>
              <div className={styles.summaryCellLabel}>Course</div>
              <div className={`${styles.summaryCellValue} ${!courses.length ? styles.summaryCellMuted : ''}`}>{sumCourses}</div>
            </div>
            <div className={`${styles.summaryCell} ${styles.summaryCellFull}`}>
              <div className={styles.summaryCellLabel}>Milestone types</div>
              <div className={`${styles.summaryCellValue} ${selectedMsLabels.length === 0 ? styles.summaryCellMuted : ''}`}>
                {selectedMsLabels.length > 0 ? selectedMsLabels.join(', ') : '—'}
              </div>
            </div>
          </div>

          <div className={styles.recipientCountBadge}>
            <div>
              <div className={`${styles.recipientBigNum} ${recipientCount > 0 ? styles.recipientBigNumActive : ''}`}>
                {recipientCount > 0 ? recipientCount : '—'}
              </div>
              <div className={styles.recipientSubLabel}>learners will receive reminders</div>
            </div>
            <div className={styles.milestoneCountWrap}>
              <div className={`${styles.milestoneNum} ${milestoneCount > 0 ? styles.milestoneNumActive : ''}`}>
                {milestoneCount > 0 ? milestoneCount : '—'}
              </div>
              <div className={styles.recipientSubLabel}>milestones affected</div>
            </div>
          </div>
        </div>

        {/* ── Optional Note ── */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>
            Additional note <span className={styles.optionalTag}>(optional)</span>
          </label>
          <textarea
            className={styles.fieldTextarea}
            rows={2}
            placeholder="Add a personal message appended to all outgoing reminders in this batch…"
            value={additionalNote}
            onChange={(e) => setAdditionalNote(e.target.value)}
            disabled={sending}
          />
        </div>

      </div>
    </Modal>
  )
}
