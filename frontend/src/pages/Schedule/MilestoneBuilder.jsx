import { useState, useCallback, useMemo, useEffect } from 'react'
import { MILESTONE_TYPES, FREQ_OPTIONS, POST_OPTIONS } from '../../data/schedules'
import styles from './Schedule.module.css'

/* ── Helpers ─────────────────────────────────────────────────────── */
function buildInitialMilestones(scheduleMilestones) {
  return MILESTONE_TYPES.map((mt) => {
    const base = scheduleMilestones?.find((m) => m.key === mt.key)
    const m = {
      key: mt.key,
      enabled: true,
      dueDate: '',
      windowStart: 7,
      frequency: 'Every 2 days',
      postDeadline: 'No post-deadline reminders',
      ...base,
    }
    if (mt.key === 'osl' && !m.thresholds) {
      m.thresholds = [
        { pct: 50, dueDate: m.dueDate, windowStart: 7,  frequency: 'Every 2 days', postDeadline: '3 reminders after deadline' },
        { pct: 85, dueDate: m.dueDate, windowStart: 7,  frequency: 'Every 2 days', postDeadline: '5 reminders after deadline' },
      ]
    }
    if (mt.key === 'lvc' && !m.thresholds) {
      m.thresholds = [
        { pct: 50, dueDate: m.dueDate, windowStart: 7, frequency: 'Weekly', postDeadline: '3 reminders after deadline' },
        { pct: 80, dueDate: m.dueDate, windowStart: 7, frequency: 'Weekly', postDeadline: '3 reminders after deadline' },
      ]
    }
    return m
  })
}

function addDays(dateStr, n) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

function fmtDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

/* ── Standard 4-field row ────────────────────────────────────────── */
function StandardFields({ data, onChange }) {
  return (
    <>
      <div className={styles.msField}>
        <div className={styles.msFieldLabel}>Due Date</div>
        <input
          type="date"
          className={`${styles.msInput} ${styles.msInputDate}`}
          value={data.dueDate}
          onChange={(e) => onChange({ ...data, dueDate: e.target.value })}
        />
      </div>

      <div className={styles.msField}>
        <div className={styles.msFieldLabel}>Reminder starts</div>
        <div className={styles.reminderStartWrap}>
          <input
            type="number"
            min="1"
            max="365"
            className={`${styles.msInput} ${styles.msInputNum}`}
            value={data.windowStart}
            onChange={(e) => onChange({ ...data, windowStart: +e.target.value })}
          />
          <span className={styles.reminderStartLabel}>days before</span>
        </div>
      </div>

      <div className={styles.msField}>
        <div className={styles.msFieldLabel}>Frequency</div>
        <select
          className={`${styles.msInput} ${styles.msInputSelect}`}
          value={data.frequency}
          onChange={(e) => onChange({ ...data, frequency: e.target.value })}
        >
          {FREQ_OPTIONS.map((f) => <option key={f}>{f}</option>)}
        </select>
      </div>

      <div className={`${styles.msField} ${styles.msFieldNoShrink}`}>
        <div className={styles.msFieldLabel}>Post-deadline</div>
        <select
          className={`${styles.msInput} ${styles.msInputSelectWide}`}
          value={data.postDeadline}
          onChange={(e) => onChange({ ...data, postDeadline: e.target.value })}
        >
          {POST_OPTIONS.map((p) => <option key={p}>{p}</option>)}
        </select>
      </div>
    </>
  )
}

/* ── One threshold row (OSL / LVC) ───────────────────────────────── */
function ThresholdRow({ threshold, onUpdate, onRemove }) {
  return (
    <div className={styles.thresholdRow}>
      <div className={styles.thresholdPctWrap}>
        <input
          type="number"
          min="1"
          max="100"
          className={styles.thresholdPctInput}
          value={threshold.pct}
          onChange={(e) => onUpdate({ ...threshold, pct: +e.target.value })}
        />
        <span className={styles.thresholdPctSym}>%</span>
      </div>

      <StandardFields data={threshold} onChange={onUpdate} />

      <button
        className={styles.thresholdRemove}
        onClick={onRemove}
        title="Remove target"
      >×</button>
    </div>
  )
}

/* ── Single milestone group ──────────────────────────────────────── */
function MilestoneRow({ ms, mt, onChange }) {
  const isThreshold = ms.key === 'osl' || ms.key === 'lvc'
  const pctLabel    = ms.key === 'osl' ? 'Completion %' : 'Attendance %'

  const updateThreshold = (i, updated) =>
    onChange({ ...ms, thresholds: ms.thresholds.map((t, idx) => idx === i ? updated : t) })

  const removeThreshold = (i) =>
    onChange({ ...ms, thresholds: ms.thresholds.filter((_, idx) => idx !== i) })

  const addThreshold = () =>
    onChange({
      ...ms,
      thresholds: [
        ...(ms.thresholds || []),
        { pct: 75, dueDate: ms.dueDate || '', windowStart: 7, frequency: 'Every 2 days', postDeadline: 'No post-deadline reminders' },
      ],
    })

  return (
    <div className={`${styles.msGroup} ${!ms.enabled ? styles.msDisabled : ''}`}>
      <div className={styles.msGroupHeader}>
        <label className={styles.msToggle}>
          <input
            type="checkbox"
            checked={ms.enabled}
            onChange={(e) => onChange({ ...ms, enabled: e.target.checked })}
          />
          <div className={styles.msToggleTrack} />
          <div className={styles.msToggleThumb} />
        </label>
        <span className={styles.msDot} style={{ background: mt.color }} />
        <span className={styles.msLabel}>{mt.label}</span>
      </div>

      {ms.enabled && (
        <div className={styles.msGroupBody}>
          {isThreshold ? (
            <div style={{ width: '100%' }}>
              <div className={`${styles.msFieldLabel} ${styles.thresholdSectionLabel}`}>
                {pctLabel} — targets
              </div>
              <div className={styles.thresholdList}>
                {(ms.thresholds || []).map((th, i) => (
                  <ThresholdRow
                    key={i}
                    threshold={th}
                    onUpdate={(updated) => updateThreshold(i, updated)}
                    onRemove={() => removeThreshold(i)}
                  />
                ))}
              </div>
              <button className={styles.addThresholdBtn} onClick={addThreshold}>
                <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                  <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                Add target
              </button>
            </div>
          ) : (
            <StandardFields data={ms} onChange={onChange} />
          )}
        </div>
      )}
    </div>
  )
}

/* ── Notification Stage Logic info card ─────────────────────────── */
function StageLogicCard() {
  return (
    <div className={styles.stageLogicCard}>
      <div className={styles.stageLogicTitle}>Notification Stage Logic</div>
      <div className={styles.stageLogicGrid}>
        <div className={`${styles.stageBox} ${styles.stageBoxPre}`}>
          <div className={styles.stageBoxIcon}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 6v5l3 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className={styles.stageBoxLabel}>Pre-Deadline</div>
          <div className={styles.stageBoxDesc}>Reminder window opens N days before due date. Reminders fire at the chosen frequency until the deadline.</div>
        </div>
        <div className={`${styles.stageBox} ${styles.stageBoxDue}`}>
          <div className={styles.stageBoxIcon}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <rect x="3" y="4" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M7 2v4M13 2v4M3 9h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className={styles.stageBoxLabel}>Due-Date Alert</div>
          <div className={styles.stageBoxDesc}>A single final reminder fires on the milestone due date itself, regardless of the reminder window setting.</div>
        </div>
        <div className={`${styles.stageBox} ${styles.stageBoxPost}`}>
          <div className={styles.stageBoxIcon}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M10 3v14M3 10h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </div>
          <div className={styles.stageBoxLabel}>Post-Deadline</div>
          <div className={styles.stageBoxDesc}>Escalation reminders fire after the deadline for learners who have not yet met the milestone target.</div>
        </div>
      </div>
    </div>
  )
}

/* ── Derived Timeline Preview table ─────────────────────────────── */
function TimelinePreview({ milestones }) {
  const rows = useMemo(() => {
    const result = []
    milestones.forEach((ms) => {
      if (!ms.enabled || !ms.dueDate) return
      const mt = MILESTONE_TYPES.find((t) => t.key === ms.key)
      const isThreshold = ms.key === 'osl' || ms.key === 'lvc'

      if (isThreshold && ms.thresholds?.length) {
        ms.thresholds.forEach((th) => {
          result.push({
            key: ms.key,
            label: `${mt?.label} (${th.pct}%)`,
            color: mt?.color,
            dueDate: th.dueDate,
            windowStart: th.windowStart,
            frequency: th.frequency,
            postDeadline: th.postDeadline,
          })
        })
      } else {
        result.push({
          key: ms.key,
          label: mt?.label ?? ms.key,
          color: mt?.color,
          dueDate: ms.dueDate,
          windowStart: ms.windowStart,
          frequency: ms.frequency,
          postDeadline: ms.postDeadline,
        })
      }
    })
    return result.sort((a, b) => (a.dueDate > b.dueDate ? 1 : -1))
  }, [milestones])

  if (rows.length === 0) return null

  return (
    <div className={styles.timelinePreviewWrap}>
      <div className={styles.timelinePreviewTitle}>Derived Timeline Preview</div>
      <table className={styles.timelineTable}>
        <thead>
          <tr>
            <th>Milestone</th>
            <th>Due Date</th>
            <th>Reminder Opens</th>
            <th>Frequency</th>
            <th>Post-Deadline</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>
                <span className={styles.timelineDot} style={{ background: r.color }} />
                {r.label}
              </td>
              <td>{fmtDate(r.dueDate)}</td>
              <td>
                {r.dueDate
                  ? <span className={styles.timelinePre}>{addDays(r.dueDate, -r.windowStart)}</span>
                  : '—'}
              </td>
              <td>{r.frequency}</td>
              <td>
                <span className={
                  r.postDeadline === 'No post-deadline reminders'
                    ? styles.timelinePostNone
                    : styles.timelinePostActive
                }>
                  {r.postDeadline}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* ── MilestoneBuilder ────────────────────────────────────────────── */
export default function MilestoneBuilder({ schedule, onMilestonesChange }) {
  const courses = useMemo(
    () => schedule.courses?.length ? schedule.courses : [schedule.cohort || 'Default'],
    [schedule]
  )

  const [activeCourse, setActiveCourse] = useState(courses[0])

  const [courseMilestones, setCourseMilestones] = useState(() => {
    const init = {}
    courses.forEach((c) => {
      init[c] = buildInitialMilestones(schedule.milestones)
    })
    return init
  })

  const milestones = courseMilestones[activeCourse] || []

  const updateMilestone = useCallback((idx, updated) => {
    setCourseMilestones((prev) => {
      const next = {
        ...prev,
        [activeCourse]: prev[activeCourse].map((m, i) => (i === idx ? updated : m)),
      }
      onMilestonesChange?.(activeCourse, next[activeCourse])
      return next
    })
  }, [activeCourse, onMilestonesChange])

  // Sync course list when schedule changes
  useEffect(() => {
    setActiveCourse(courses[0])
  }, [schedule.id, courses])

  const statusVariants = {
    Active: styles.statusActive,
    Draft:  styles.statusDraft,
    Ended:  styles.statusEnded,
  }

  return (
    <div>
      {/* Header meta strip */}
      <div className={styles.builderMeta}>
        <div>
          <div className={styles.builderTitle}>{schedule.name}</div>
          <div className={styles.builderSub}>
            {schedule.client ? `${schedule.client} · ${schedule.cohort}` : schedule.cohort}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className={`${styles.statusBadge} ${statusVariants[schedule.status] || styles.statusDraft}`}>
            {schedule.status}
          </span>
          <div className={styles.builderDateRow}>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Start date:</span>
            <input
              type="date"
              className={styles.msInput}
              defaultValue={schedule.startDate}
              style={{ width: 148 }}
            />
          </div>
        </div>
      </div>

      {/* Notification Stage Logic card */}
      <StageLogicCard />

      {/* Course tabs — only shown when there are multiple courses */}
      {courses.length > 1 && (
        <div className={styles.courseTabBar}>
          {courses.map((c) => (
            <button
              key={c}
              className={`${styles.courseTab} ${c === activeCourse ? styles.courseTabActive : ''}`}
              onClick={() => setActiveCourse(c)}
            >
              <span className={styles.courseTabDot} />
              {c}
            </button>
          ))}
        </div>
      )}

      {/* Milestone rows */}
      <div className={styles.milestoneList}>
        {milestones.map((ms, idx) => {
          const mt = MILESTONE_TYPES.find((t) => t.key === ms.key) ?? { color: '#888', label: ms.key }
          return (
            <MilestoneRow
              key={ms.key}
              ms={ms}
              mt={mt}
              onChange={(updated) => updateMilestone(idx, updated)}
            />
          )
        })}
      </div>

      {/* Derived Timeline Preview */}
      <TimelinePreview milestones={milestones} />
    </div>
  )
}
