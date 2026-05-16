import { useState, useMemo, useCallback } from 'react'
import Modal from '../ui/Modal'
import { MultiSelectDropdown } from '../ui/MultiSelectDropdown'
import { useApp } from '../../context/AppContext'
import styles from './NewScheduleModal.module.css'

/* ── Milestone template presets ─────────────────────────────────── */
const TEMPLATES = {
  custom: {
    label: 'Custom — fill in manually',
    offsets: null,
  },
  sprint30: {
    label: '30-Day Sprint  (Activation D+3, OSL D+14, LVC D+21, Assessment D+25, Project D+28, Cert D+30)',
    offsets: { activation: 3, osl: 14, lvc: 21, assessment: 25, project: 28, completion: 30 },
  },
  sprint45: {
    label: '45-Day Standard  (Activation D+5, OSL D+20, LVC D+30, Assessment D+38, Project D+42, Cert D+45)',
    offsets: { activation: 5, osl: 20, lvc: 30, assessment: 38, project: 42, completion: 45 },
  },
}

function addDays(dateStr, days) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function calcDuration(start, end) {
  if (!start || !end) return null
  const diff = Math.round((new Date(end) - new Date(start)) / 86400000)
  return diff > 0 ? diff : null
}

/* ── Component ──────────────────────────────────────────────────── */
export default function NewScheduleModal({ onClose, onCreate }) {
  const { learners } = useApp()

  const [selectedClients,  setSelectedClients]  = useState([])
  const [selectedProjects, setSelectedProjects] = useState([])
  const [selectedCourses,  setSelectedCourses]  = useState([])
  const [startDate,        setStartDate]        = useState('')
  const [endDate,          setEndDate]          = useState('')
  const [template,         setTemplate]         = useState('custom')
  const [validationError,  setValidationError]  = useState('')

  const duration = calcDuration(startDate, endDate)

  /* ── Cascade option lists derived from uploaded learner data ── */
  const allClients = useMemo(
    () => [...new Set(learners.map((l) => l.clientName).filter(Boolean))].sort(),
    [learners]
  )

  const availableProjects = useMemo(() => {
    const pool = selectedClients.length
      ? learners.filter((l) => selectedClients.includes(l.clientName))
      : learners
    return [...new Set(pool.map((l) => l.projectName).filter(Boolean))].sort()
  }, [learners, selectedClients])

  const availableCourses = useMemo(() => {
    let pool = selectedClients.length
      ? learners.filter((l) => selectedClients.includes(l.clientName))
      : learners
    if (selectedProjects.length)
      pool = pool.filter((l) => selectedProjects.includes(l.projectName))
    return [...new Set(pool.map((l) => l.course).filter(Boolean))].sort()
  }, [learners, selectedClients, selectedProjects])

  /* ── Cascade reset handlers ── */
  const handleClientsChange = useCallback((vals) => {
    setSelectedClients(vals)
    if (vals.length > 0) {
      const pool            = learners.filter((l) => vals.includes(l.clientName))
      const reachableProj   = new Set(pool.map((l) => l.projectName))
      const reachableCourse = new Set(pool.map((l) => l.course))
      setSelectedProjects((prev) => prev.filter((p) => reachableProj.has(p)))
      setSelectedCourses((prev)  => prev.filter((c) => reachableCourse.has(c)))
    }
  }, [learners])

  const handleProjectsChange = useCallback((vals) => {
    setSelectedProjects(vals)
    if (vals.length > 0) {
      const clientPool = selectedClients.length
        ? learners.filter((l) => selectedClients.includes(l.clientName))
        : learners
      const reachable = new Set(
        clientPool.filter((l) => vals.includes(l.projectName)).map((l) => l.course)
      )
      setSelectedCourses((prev) => prev.filter((c) => reachable.has(c)))
    }
  }, [learners, selectedClients])

  /* ── Build & emit schedule ── */
  const handleCreate = useCallback(() => {
    if (selectedClients.length === 0) {
      setValidationError('Please select a client.')
      return
    }
    if (selectedCourses.length === 0) {
      setValidationError('Please select at least one course.')
      return
    }
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      setValidationError('End date must be after start date.')
      return
    }
    setValidationError('')

    const clientName  = selectedClients.join(', ')
    const projectName = selectedProjects.join(', ')

    // Derive cohort from the first learner matching the selection
    const cohortLearner = learners.find((l) =>
      selectedClients.includes(l.clientName) &&
      (selectedProjects.length === 0 || selectedProjects.includes(l.projectName))
    )
    const cohort = cohortLearner?.cohort || selectedClients[0]

    const tpl = TEMPLATES[template]

    const buildMilestones = () => {
      if (!tpl.offsets || !startDate) return []
      return Object.entries(tpl.offsets).map(([key, offset]) => {
        const due  = addDays(startDate, offset)
        const base = {
          key,
          dueDate:     due,
          windowStart: 7,
          frequency:   'Every 2 days',
          postDeadline: 'No post-deadline reminders',
        }
        if (key === 'osl') {
          base.thresholds = [
            { pct: 50, dueDate: due, windowStart: 7, frequency: 'Every 2 days', postDeadline: '3 reminders after deadline' },
            { pct: 85, dueDate: due, windowStart: 7, frequency: 'Every 2 days', postDeadline: '5 reminders after deadline' },
          ]
        }
        if (key === 'lvc') {
          base.thresholds = [
            { pct: 50, dueDate: due, windowStart: 7, frequency: 'Weekly', postDeadline: '3 reminders after deadline' },
            { pct: 80, dueDate: due, windowStart: 7, frequency: 'Weekly', postDeadline: '3 reminders after deadline' },
          ]
        }
        return base
      })
    }

    const newSchedule = {
      id:               `s${Date.now()}`,
      name:             clientName + (projectName ? ` · ${projectName}` : ''),
      client:           clientName,
      project:          projectName,
      cohort,
      courses:          [...selectedCourses],
      status:           'Draft',
      startDate:        startDate || new Date().toISOString().split('T')[0],
      endDate,
      learnersCount:    0,
      overallProgress:  0,
      currentMilestone: { label: 'Activation', variant: 'info' },
      milestones:       buildMilestones(),
    }

    onCreate(newSchedule)
    onClose()
  }, [selectedClients, selectedProjects, selectedCourses, startDate, endDate, template, learners, onCreate, onClose])

  const isValid = selectedClients.length > 0

  const noData = learners.length === 0

  return (
    <Modal
      title="Create Training Schedule"
      subtitle="Client → Project → Course hierarchy"
      onClose={onClose}
      width={600}
      footer={
        <div className={styles.footer}>
          <div className={styles.validationMsg}>{validationError}</div>
          <div className={styles.footerBtns}>
            <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button
              className={styles.createBtn}
              onClick={handleCreate}
              disabled={!isValid}
            >
              Create Schedule
            </button>
          </div>
        </div>
      }
    >
      <div className={styles.form}>

        {noData && (
          <div className={styles.noDataBanner}>
            No learner data imported yet — upload a spreadsheet on the Upload Data page to populate these lists.
          </div>
        )}

        {/* ── Row 1: Client + Project ── */}
        <div className={styles.formRow}>
          <div className={styles.field}>
            <label className={styles.label}>Client</label>
            <MultiSelectDropdown
              options={allClients}
              selected={selectedClients}
              onChange={handleClientsChange}
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Project</label>
            <MultiSelectDropdown
              options={availableProjects}
              selected={selectedProjects}
              onChange={handleProjectsChange}
            />
          </div>
        </div>

        {/* ── Courses ── */}
        <div className={styles.field}>
          <label className={styles.label}>Courses</label>
          <MultiSelectDropdown
            options={availableCourses}
            selected={selectedCourses}
            onChange={setSelectedCourses}
          />
          <div className={styles.hint}>
            Select one or more courses. Narrow options by choosing a client or project first.
          </div>
        </div>

        {/* ── Row 2: Start + End dates ── */}
        <div className={styles.formRow}>
          <div className={styles.field}>
            <label className={styles.label}>Activation / Start Date</label>
            <input
              className={styles.input}
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Completion / End Date</label>
            <input
              className={styles.input}
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {/* ── Duration badge ── */}
        {duration !== null && (
          <div className={styles.durationWrap}>
            <span className={styles.durationBadge}>
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
                <path d="M10 7v4l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              {duration} day{duration !== 1 ? 's' : ''} programme
            </span>
          </div>
        )}

        {/* ── Milestone Template ── */}
        <div className={styles.field}>
          <label className={styles.label}>Milestone Template</label>
          <select
            className={styles.input}
            value={template}
            onChange={(e) => setTemplate(e.target.value)}
          >
            {Object.entries(TEMPLATES).map(([k, t]) => (
              <option key={k} value={k}>{t.label}</option>
            ))}
          </select>
        </div>

      </div>
    </Modal>
  )
}
