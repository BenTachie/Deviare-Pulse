import { useState, useCallback, useEffect, useRef } from 'react'
import Modal from '../ui/Modal'
import { AVAILABLE_PROJECTS, AVAILABLE_COURSES } from '../../data/schedules'
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
  const [client, setClient]               = useState('')
  const [project, setProject]             = useState('')
  const [newProjectName, setNewProjectName] = useState('')
  const [courses, setCourses]             = useState([])
  const [courseSearch, setCourseSearch]   = useState('')
  const [dropdownOpen, setDropdownOpen]   = useState(false)
  const [startDate, setStartDate]         = useState('')
  const [endDate, setEndDate]             = useState('')
  const [template, setTemplate]           = useState('custom')

  const searchRef = useRef(null)
  const dropRef   = useRef(null)

  const duration = calcDuration(startDate, endDate)

  const filteredCourses = AVAILABLE_COURSES.filter(
    (c) =>
      !courses.includes(c) &&
      c.toLowerCase().includes(courseSearch.toLowerCase())
  )

  const addCourse = (course) => {
    setCourses((prev) => (prev.includes(course) ? prev : [...prev, course]))
    setCourseSearch('')
    setDropdownOpen(false)
    searchRef.current?.focus()
  }

  const removeCourse = (course) =>
    setCourses((prev) => prev.filter((c) => c !== course))

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target))
        setDropdownOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const [validationError, setValidationError] = useState('')

  const handleCreate = useCallback(() => {
    const trimmedClient = client.trim()
    if (!trimmedClient) {
      setValidationError('Please enter a client name.')
      return
    }
    if (courses.length === 0) {
      setValidationError('Please add at least one course.')
      return
    }
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      setValidationError('End date must be after start date.')
      return
    }
    setValidationError('')

    const projectName =
      project === '__new__' ? newProjectName.trim() : project

    const tpl = TEMPLATES[template]

    const buildMilestones = () => {
      if (!tpl.offsets || !startDate) return []
      return Object.entries(tpl.offsets).map(([key, offset]) => {
        const due = addDays(startDate, offset)
        const base = {
          key,
          dueDate: due,
          windowStart: 7,
          frequency: 'Every 2 days',
          postDeadline: 'No post-deadline reminders',
        }
        if (key === 'osl') {
          base.thresholds = [
            { pct: 50, dueDate: due, windowStart: 7,  frequency: 'Every 2 days', postDeadline: '3 reminders after deadline' },
            { pct: 85, dueDate: due, windowStart: 7,  frequency: 'Every 2 days', postDeadline: '5 reminders after deadline' },
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
      id: `s${Date.now()}`,
      name: trimmedClient + (projectName ? ` · ${projectName}` : ''),
      client: trimmedClient,
      project: projectName,
      cohort: trimmedClient,
      courses: courses.length > 0 ? [...courses] : [trimmedClient],
      status: 'Draft',
      startDate: startDate || new Date().toISOString().split('T')[0],
      endDate,
      learnersCount: 0,
      overallProgress: 0,
      currentMilestone: { label: 'Activation', variant: 'info' },
      milestones: buildMilestones(),
    }

    onCreate(newSchedule)
    onClose()
  }, [client, project, newProjectName, courses, startDate, endDate, template, onCreate, onClose])

  const isValid = client.trim().length > 0

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

        {/* ── Row 1: Client + Project ── */}
        <div className={styles.formRow}>
          <div className={styles.field}>
            <label className={styles.label}>Client</label>
            <input
              className={styles.input}
              type="text"
              placeholder="e.g. Vodacom, Standard Bank…"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              autoFocus
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Project</label>
            <select
              className={styles.input}
              value={project}
              onChange={(e) => setProject(e.target.value)}
            >
              <option value="">— Select project —</option>
              {AVAILABLE_PROJECTS.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
              <option value="__new__">+ Create new project…</option>
            </select>
            {project === '__new__' && (
              <input
                className={styles.input}
                style={{ marginTop: 6 }}
                type="text"
                placeholder="New project name…"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
              />
            )}
          </div>
        </div>

        {/* ── Courses tag-search ── */}
        <div className={styles.field}>
          <label className={styles.label}>Courses</label>
          <div
            className={styles.tagWrap}
            ref={dropRef}
            onClick={() => { setDropdownOpen(true); searchRef.current?.focus() }}
          >
            {courses.map((c) => (
              <span key={c} className={styles.tag}>
                {c}
                <button
                  className={styles.tagRemove}
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removeCourse(c) }}
                >×</button>
              </span>
            ))}
            <input
              ref={searchRef}
              className={styles.tagInput}
              type="text"
              placeholder={courses.length === 0 ? 'Search or add a course…' : ''}
              value={courseSearch}
              onChange={(e) => { setCourseSearch(e.target.value); setDropdownOpen(true) }}
              onFocus={() => setDropdownOpen(true)}
            />

            {dropdownOpen && (
              <div className={styles.dropdown}>
                {filteredCourses.map((c) => (
                  <div
                    key={c}
                    className={styles.dropdownItem}
                    onMouseDown={(e) => { e.preventDefault(); addCourse(c) }}
                  >
                    {c}
                  </div>
                ))}
                {courseSearch.trim() &&
                  !AVAILABLE_COURSES.map((x) => x.toLowerCase()).includes(courseSearch.trim().toLowerCase()) && (
                  <div
                    className={styles.dropdownItemNew}
                    onMouseDown={(e) => { e.preventDefault(); addCourse(courseSearch.trim()) }}
                  >
                    + Add "{courseSearch.trim()}"
                  </div>
                )}
                {filteredCourses.length === 0 && !courseSearch.trim() && (
                  <div className={styles.dropdownEmpty}>All available courses selected</div>
                )}
              </div>
            )}
          </div>
          <div className={styles.hint}>
            Select one or multiple courses. Type to search or add a new one.
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
