import { useState, useCallback, useEffect, useMemo } from 'react'
import SegmentedTabs from '../../components/ui/SegmentedTabs'
import Button from '../../components/ui/Button'
import ScheduleCard from './ScheduleCard'
import MilestoneBuilder from './MilestoneBuilder'
import CalendarView from './CalendarView'
import AutomationLog from './AutomationLog'
import NewScheduleModal from '../../components/modals/NewScheduleModal'
import { DEMO_SCHEDULE, MILESTONE_TYPES } from '../../data/schedules'
import { dbGet, dbSet } from '../../utils/db'
import { useToast } from '../../components/context/ToastContext'
import styles from './Schedule.module.css'

// Separate key from learner data — never cleared by "Clear Data"
const SCHEDULES_KEY = 'deviare_pulse_schedules'

function makeLogEntry(type, title, desc) {
  return {
    id:   `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    type,
    title,
    desc,
    time: new Date().toISOString().replace('T', ' ').slice(0, 16),
  }
}

function prependLog(schedule, entry) {
  return { ...schedule, automationLog: [entry, ...(schedule.automationLog ?? [])] }
}

const TABS = [
  { id: 'builder',  label: 'Reminder Windows' },
  { id: 'calendar', label: 'Calendar View'    },
  { id: 'log',      label: 'Automation Log'   },
]

/* ── Assign Cohort Modal ─────────────────────────────────────────── */
const SAMPLE_COHORTS = [
  'NET-SEP22', 'DA-SEP22', 'PBI-SEP22', 'AZ-OCT22', 'CS-OCT22',
]

function AssignCohortModal({ schedule, onClose, onAssign }) {
  const [cohort, setCohort] = useState(schedule.cohort || '')
  const [custom, setCustom]  = useState('')

  const value = cohort === '__custom__' ? custom : cohort

  return (
    <div className={styles.assignOverlay} onClick={onClose}>
      <div className={styles.assignModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.assignHeader}>
          <span className={styles.assignTitle}>Assign Cohort</span>
          <button className={styles.assignClose} onClick={onClose}>×</button>
        </div>
        <div className={styles.assignBody}>
          <div className={styles.assignScheduleName}>{schedule.name}</div>
          <label className={styles.assignLabel}>Select or enter cohort</label>
          <select
            className={styles.assignSelect}
            value={cohort}
            onChange={(e) => setCohort(e.target.value)}
          >
            <option value="">— Select cohort —</option>
            {SAMPLE_COHORTS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
            <option value="__custom__">+ Enter custom cohort…</option>
          </select>
          {cohort === '__custom__' && (
            <input
              className={styles.assignInput}
              type="text"
              placeholder="e.g. CLIENT-OCT22"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              autoFocus
            />
          )}
        </div>
        <div className={styles.assignFooter}>
          <button className={styles.assignCancel} onClick={onClose}>Cancel</button>
          <button
            className={styles.assignConfirm}
            disabled={!value.trim()}
            onClick={() => onAssign(value.trim())}
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── SchedulePage ────────────────────────────────────────────────── */
export default function SchedulePage() {
  const { showToast } = useToast()
  const [schedules, setSchedules]             = useState([])
  const [isReady, setIsReady]                 = useState(false)
  const [selectedId, setSelectedId]           = useState(null)
  const [activeTab, setActiveTab]             = useState('builder')
  const [showNewModal, setShowNewModal]       = useState(false)
  const [pendingMilestones, setPendingMilestones] = useState({})

  // Load persisted schedules from IndexedDB on mount; seed demo on first visit
  useEffect(() => {
    async function load() {
      try {
        const stored = await dbGet(SCHEDULES_KEY)
        if (Array.isArray(stored) && stored.length > 0) {
          setSchedules(stored)
        } else {
          const initial = [DEMO_SCHEDULE]
          setSchedules(initial)
          await dbSet(SCHEDULES_KEY, initial)
        }
      } catch (err) {
        console.error('Failed to load schedules:', err)
        setSchedules([DEMO_SCHEDULE])
      } finally {
        setIsReady(true)
      }
    }
    load()
  }, [])

  const persist = useCallback((next) => {
    dbSet(SCHEDULES_KEY, next).catch(console.error)
  }, [])

  const selectedSchedule = schedules.find((s) => s.id === selectedId)

  // Merge pending builder edits so CalendarView reflects them before Save is clicked
  const effectiveSchedule = useMemo(() => {
    if (!selectedSchedule) return null
    const dirty = pendingMilestones[selectedId]
    if (!dirty) return selectedSchedule
    return { ...selectedSchedule, milestones: dirty }
  }, [selectedSchedule, selectedId, pendingMilestones])

  const handleCreate = useCallback((newSchedule) => {
    const entry = makeLogEntry('success', 'Schedule created', `"${newSchedule.name}" configured and saved`)
    const withLog = { ...newSchedule, automationLog: [entry] }
    setSchedules((prev) => {
      const next = [...prev, withLog]
      persist(next)
      return next
    })
    setSelectedId(newSchedule.id)
    setActiveTab('builder')
    showToast('Schedule created successfully.', 'success')
  }, [persist, showToast])

  const handleSave = useCallback(() => {
    if (!selectedId) return
    const dirty = pendingMilestones[selectedId]
    const today = new Date().toISOString().split('T')[0]
    const entry = makeLogEntry('info', 'Schedule configuration saved', 'Milestone windows and reminder settings updated manually')
    setSchedules((prev) => {
      const next = prev.map((s) => {
        if (s.id !== selectedId) return s
        const updated = { ...s, ...(dirty ? { milestones: dirty } : {}), updatedAt: today }
        return prependLog(updated, entry)
      })
      persist(next)
      return next
    })
    showToast('Schedule saved.', 'success')
  }, [selectedId, pendingMilestones, persist, showToast])

  const handleDelete = useCallback((id, e) => {
    e.stopPropagation()
    setSchedules((prev) => {
      const next = prev.filter((s) => s.id !== id)
      persist(next)
      return next
    })
    if (selectedId === id) setSelectedId(null)
    showToast('Schedule and linked automation removed.', 'info')
  }, [selectedId, persist, showToast])

  const handleMilestonesChange = useCallback((courseKey, milestones) => {
    setPendingMilestones((prev) => ({ ...prev, [selectedId]: milestones }))
  }, [selectedId])

  // Calendar view: apply a date/reminder config directly to a milestone, persist immediately
  const handleCalendarUpdate = useCallback((msKey, thPct, fields) => {
    const today = new Date().toISOString().split('T')[0]
    const mt    = MILESTONE_TYPES.find((t) => t.key === msKey)
    const label = mt?.label ?? msKey
    const entry = makeLogEntry(
      'success',
      'Milestone date updated',
      `${label}${thPct != null ? ` (${thPct}%)` : ''} due date set to ${fields.dueDate}${
        fields.windowStart ? ` — reminders open ${fields.windowStart} days before` : ''
      }`
    )
    setSchedules((prev) => {
      const next = prev.map((s) => {
        if (s.id !== selectedId) return s
        const base = pendingMilestones[selectedId] ?? s.milestones ?? []
        const milestones = base.map((ms) => {
          if (ms.key !== msKey) return ms
          if (thPct !== null) {
            return {
              ...ms,
              thresholds: (ms.thresholds || []).map((th) =>
                th.pct === thPct ? { ...th, ...fields } : th
              ),
            }
          }
          return { ...ms, ...fields }
        })
        return prependLog({ ...s, milestones, updatedAt: today }, entry)
      })
      persist(next)
      return next
    })
    setPendingMilestones((prev) => { const n = { ...prev }; delete n[selectedId]; return n })
    showToast('Milestone date updated and saved.', 'success')
  }, [selectedId, pendingMilestones, persist, showToast])

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Training Schedule</h2>
          <p className={styles.pageSub}>Configure milestone deadlines and automated reminder windows for each cohort</p>
        </div>
        <Button variant="primary" size="lg" onClick={() => setShowNewModal(true)}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <path d="M10 4v12M4 10h12" stroke="white" strokeWidth="2" strokeLinecap="round" />
          </svg>
          New Schedule
        </Button>
      </div>

      <div className={`${styles.layout} ${activeTab === 'calendar' && selectedSchedule ? styles.layoutCalendar : ''}`}>
        {/* Left: schedule list — hidden in calendar focus mode */}
        <div className={activeTab === 'calendar' && selectedSchedule ? styles.schedListHidden : ''}>
          <div className={styles.listLabel}>Saved Schedules</div>
          {isReady && schedules.length === 0 && (
            <div className={styles.emptySchedules}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="4" width="18" height="17" rx="2" stroke="var(--text-muted)" strokeWidth="1.5"/>
                <path d="M8 2v4M16 2v4M3 9h18" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <span>No schedules yet. Create one above.</span>
            </div>
          )}
          {schedules.map((s) => (
            <ScheduleCard
              key={s.id}
              schedule={s}
              isSelected={s.id === selectedId}
              onClick={() => { setSelectedId(s.id); setActiveTab('builder') }}
              onDelete={handleDelete}
            />
          ))}
        </div>

        {/* Right: detail */}
        <div>
          {!selectedSchedule ? (
            <div className={styles.emptyDetail}>
              <div className={styles.emptyIcon}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <rect x="3" y="4" width="18" height="17" rx="2" stroke="var(--text-muted)" strokeWidth="1.5" />
                  <path d="M8 2v4M16 2v4M3 9h18" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </div>
              <div className={styles.emptyTitle}>Select a schedule to configure</div>
              <div className={styles.emptySub}>or create a new one with the button above</div>
            </div>
          ) : (
            <div>
              <div className={styles.detailControls}>
                <SegmentedTabs tabs={TABS} activeTab={activeTab} onChange={setActiveTab} />
                <Button variant="primary" size="sm" onClick={handleSave}>Save Schedule</Button>
              </div>

              {activeTab === 'builder'  && (
                <MilestoneBuilder
                  schedule={selectedSchedule}
                  onMilestonesChange={handleMilestonesChange}
                />
              )}
              {activeTab === 'calendar' && effectiveSchedule && (
                <CalendarView
                  schedule={effectiveSchedule}
                  onMilestoneUpdate={handleCalendarUpdate}
                />
              )}
              {activeTab === 'log'      && <AutomationLog log={selectedSchedule.automationLog ?? []} />}
            </div>
          )}
        </div>
      </div>

      {showNewModal && (
        <NewScheduleModal
          onClose={() => setShowNewModal(false)}
          onCreate={handleCreate}
        />
      )}

    </div>
  )
}
