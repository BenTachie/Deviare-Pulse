import { useState, useMemo } from 'react'
import { MILESTONE_TYPES, FREQ_OPTIONS, POST_OPTIONS } from '../../data/schedules'
import styles from './Schedule.module.css'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']
const DEMO_TODAY = new Date('2022-10-10')

/* ── Date helpers ────────────────────────────────────────────────── */
function getCalendarDays(year, month) {
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days = []
  for (let i = firstDay - 1; i >= 0; i--) {
    days.push({ date: new Date(year, month, -i), isCurrentMonth: false })
  }
  for (let d = 1; d <= daysInMonth; d++) {
    days.push({ date: new Date(year, month, d), isCurrentMonth: true })
  }
  while (days.length < 42) {
    const d = days.length - firstDay - daysInMonth + 1
    days.push({ date: new Date(year, month + 1, d), isCurrentMonth: false })
  }
  return days
}

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth()    === b.getMonth()    &&
    a.getDate()     === b.getDate()
  )
}

function toDateKey(date) {
  return date.toISOString().split('T')[0]
}

function toInputDate(date) {
  return date instanceof Date
    ? date.toISOString().split('T')[0]
    : date
}

function addDaysToDate(dateStr, n) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d
}

function fmtDate(dateStr) {
  if (!dateStr) return '—'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

/* ── Build date → event/window map ──────────────────────────────── */
function buildDayMap(schedule) {
  const map = {}
  const ensure = (key) => {
    if (!map[key]) map[key] = { events: [], preColors: [], postColors: [] }
  }
  const markRange = (startDate, endDate, field, color) => {
    const cur = new Date(startDate)
    const end = new Date(endDate)
    while (cur <= end) {
      const k = toDateKey(cur)
      ensure(k)
      map[k][field] = true
      if (field === 'isPreDeadline'  && !map[k].preColors.includes(color))  map[k].preColors.push(color)
      if (field === 'isPostDeadline' && !map[k].postColors.includes(color)) map[k].postColors.push(color)
      cur.setDate(cur.getDate() + 1)
    }
  }
  const processMs = (ms, color) => {
    if (!ms.dueDate) return
    const dueKey = toDateKey(new Date(ms.dueDate))
    ensure(dueKey)
    if (ms.windowStart > 0) {
      const winStart  = addDaysToDate(ms.dueDate, -ms.windowStart)
      const dayBefore = addDaysToDate(ms.dueDate, -1)
      markRange(winStart, dayBefore, 'isPreDeadline', color)
    }
    if (ms.postDeadline && ms.postDeadline !== 'No post-deadline reminders') {
      const postDays = ms.postDeadline.includes('7') ? 7 : ms.postDeadline.includes('5') ? 5 : 3
      markRange(addDaysToDate(ms.dueDate, 1), addDaysToDate(ms.dueDate, postDays), 'isPostDeadline', color)
    }
  }
  if (!schedule.milestones) return map
  schedule.milestones.forEach((ms) => {
    const mt    = MILESTONE_TYPES.find((t) => t.key === ms.key)
    const color = mt?.color ?? '#888'
    const isThreshold = ms.key === 'osl' || ms.key === 'lvc'
    if (isThreshold && ms.thresholds?.length) {
      ms.thresholds.forEach((th) => processMs(th, color))
    } else {
      processMs(ms, color)
    }
  })
  return map
}

/* ── Flatten all assignable milestone entries ────────────────────── */
function buildMilestonePills(schedule) {
  if (!schedule.milestones) return []
  const pills = []
  schedule.milestones.forEach((ms) => {
    const mt    = MILESTONE_TYPES.find((t) => t.key === ms.key)
    const color = mt?.color ?? '#888'
    const isThreshold = ms.key === 'osl' || ms.key === 'lvc'
    if (isThreshold && ms.thresholds?.length) {
      ms.thresholds.forEach((th) => {
        pills.push({
          id:      `${ms.key}-${th.pct}`,
          msKey:   ms.key,
          thPct:   th.pct,
          label:   `${mt?.label ?? ms.key} (${th.pct}%)`,
          color,
          dueDate:     th.dueDate,
          windowStart: th.windowStart,
          frequency:   th.frequency,
          postDeadline: th.postDeadline,
        })
      })
    } else {
      pills.push({
        id:      ms.key,
        msKey:   ms.key,
        thPct:   null,
        label:   mt?.label ?? ms.key,
        color,
        dueDate:     ms.dueDate,
        windowStart: ms.windowStart,
        frequency:   ms.frequency,
        postDeadline: ms.postDeadline,
      })
    }
  })
  return pills
}

/* ── Config drawer ───────────────────────────────────────────────── */
function ReminderConfigDrawer({ pill, date, onApply, onCancel }) {
  const [dueDate,      setDueDate]      = useState(date ?? pill.dueDate ?? '')
  const [windowStart,  setWindowStart]  = useState(pill.windowStart ?? 7)
  const [frequency,    setFrequency]    = useState(pill.frequency   ?? 'Every 2 days')
  const [postDeadline, setPostDeadline] = useState(pill.postDeadline ?? 'No post-deadline reminders')

  const reminderOpens = dueDate
    ? fmtDate(toInputDate(addDaysToDate(dueDate, -windowStart)))
    : '—'

  return (
    <div className={styles.calDrawer}>
      <div className={styles.calDrawerHeader}>
        <span className={styles.calDrawerDot} style={{ background: pill.color }} />
        <span className={styles.calDrawerTitle}>{pill.label}</span>
        <button className={styles.calDrawerClose} onClick={onCancel} aria-label="Close">
          <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
            <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      <div className={styles.calDrawerBody}>
        <div className={styles.calDrawerGrid}>
          <div className={styles.calDrawerField}>
            <label className={styles.calDrawerLabel}>Due Date</label>
            <input
              type="date"
              className={styles.calDrawerInput}
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <div className={styles.calDrawerField}>
            <label className={styles.calDrawerLabel}>Reminder opens</label>
            <div className={styles.calDrawerReminderRow}>
              <input
                type="number"
                min="1"
                max="365"
                className={`${styles.calDrawerInput} ${styles.calDrawerInputNum}`}
                value={windowStart}
                onChange={(e) => setWindowStart(+e.target.value)}
              />
              <span className={styles.calDrawerUnit}>days before</span>
              <span className={styles.calDrawerReminderDate}>({reminderOpens})</span>
            </div>
          </div>
          <div className={styles.calDrawerField}>
            <label className={styles.calDrawerLabel}>Frequency</label>
            <select
              className={styles.calDrawerInput}
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
            >
              {FREQ_OPTIONS.map((f) => <option key={f}>{f}</option>)}
            </select>
          </div>
          <div className={styles.calDrawerField}>
            <label className={styles.calDrawerLabel}>Post-deadline</label>
            <select
              className={`${styles.calDrawerInput} ${styles.calDrawerInputWide}`}
              value={postDeadline}
              onChange={(e) => setPostDeadline(e.target.value)}
            >
              {POST_OPTIONS.map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>
        </div>

        <div className={styles.calDrawerFooter}>
          <button className={styles.calDrawerCancelBtn} onClick={onCancel}>Cancel</button>
          <button
            className={styles.calDrawerApplyBtn}
            onClick={() => onApply({ dueDate, windowStart, frequency, postDeadline })}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── CalendarView ────────────────────────────────────────────────── */
export default function CalendarView({ schedule, onMilestoneUpdate }) {
  const startRef = schedule.startDate ? new Date(schedule.startDate) : DEMO_TODAY
  const [month, setMonth] = useState(startRef.getMonth())
  const [year,  setYear]  = useState(startRef.getFullYear())

  // Assign mode: which pill is selected
  const [activePillId, setActivePillId] = useState(null)
  // Config drawer: { pill, date }
  const [drawer, setDrawer] = useState(null)

  const calDays = useMemo(() => getCalendarDays(year, month), [year, month])
  const dayMap  = useMemo(() => buildDayMap(schedule), [schedule])
  const pills   = useMemo(() => buildMilestonePills(schedule), [schedule])

  const activePill = pills.find((p) => p.id === activePillId) ?? null

  // Flat milestone events for display
  const events = useMemo(() => {
    const result = []
    pills.forEach((p) => {
      if (p.dueDate) result.push({ key: p.id, label: p.label, color: p.color, date: new Date(p.dueDate) })
    })
    return result
  }, [pills])

  const eventsForDay = (date) => events.filter((ev) => isSameDay(ev.date, date))

  const prev = () => {
    if (month === 0) { setMonth(11); setYear((y) => y - 1) }
    else setMonth((m) => m - 1)
  }
  const next = () => {
    if (month === 11) { setMonth(0); setYear((y) => y + 1) }
    else setMonth((m) => m + 1)
  }

  const handleDayClick = (date, isCurrentMonth) => {
    if (!activePill || !isCurrentMonth) return
    setDrawer({ pill: activePill, date: toInputDate(date) })
  }

  const handleApply = (fields) => {
    if (!drawer) return
    onMilestoneUpdate?.(drawer.pill.msKey, drawer.pill.thPct, fields)
    setDrawer(null)
    setActivePillId(null)
  }

  const togglePill = (id) => {
    setActivePillId((prev) => (prev === id ? null : id))
    setDrawer(null)
  }

  return (
    <div className={styles.calWrap}>

      {/* ── Schedule context strip ── */}
      <div className={styles.calContextStrip}>
        {schedule.client && (
          <div className={styles.calContextItem}>
            <span className={styles.calContextLabel}>Client</span>
            <span className={styles.calContextValue}>{schedule.client}</span>
          </div>
        )}
        {(schedule.cohort || schedule.project) && (
          <div className={styles.calContextItem}>
            <span className={styles.calContextLabel}>Programme</span>
            <span className={styles.calContextValue}>{schedule.cohort ?? schedule.project}</span>
          </div>
        )}
        {schedule.courses?.length > 0 && (
          <div className={styles.calContextItem}>
            <span className={styles.calContextLabel}>Course{schedule.courses.length > 1 ? 's' : ''}</span>
            <span className={styles.calContextValue}>{schedule.courses.join(', ')}</span>
          </div>
        )}
      </div>

      {/* ── Milestone selector pills ── */}
      <div className={styles.calMsBar}>
        <span className={styles.calMsBarLabel}>Assign date to:</span>
        <div className={styles.calMsPills}>
          {pills.map((p) => (
            <button
              key={p.id}
              className={`${styles.calMsPill} ${activePillId === p.id ? styles.calMsPillActive : ''}`}
              style={activePillId === p.id
                ? { background: p.color, borderColor: p.color, color: '#fff' }
                : { borderColor: `${p.color}60`, color: p.color }
              }
              onClick={() => togglePill(p.id)}
              title={p.dueDate ? `Currently: ${fmtDate(p.dueDate)}` : 'No date set'}
            >
              <span className={styles.calMsPillDot} style={{ background: activePillId === p.id ? '#fff' : p.color }} />
              {p.label}
              {p.dueDate && (
                <span className={styles.calMsPillDate} style={{ opacity: activePillId === p.id ? 0.8 : 0.6 }}>
                  {p.dueDate}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Assign mode hint */}
      {activePill && !drawer && (
        <div className={styles.calAssignHint} style={{ borderColor: `${activePill.color}40`, background: `${activePill.color}0A` }}>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="7" stroke={activePill.color} strokeWidth="1.5"/>
            <path d="M10 6v5l3 2" stroke={activePill.color} strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span style={{ color: activePill.color }}>
            Click any date to set the <strong>{activePill.label}</strong> due date
          </span>
        </div>
      )}

      {/* ── Nav + legend row ── */}
      <div className={styles.calTopRow}>
        <div className={styles.calNav}>
          <button className={styles.calNavBtn} onClick={prev} aria-label="Previous month">‹</button>
          <div className={styles.calMonthLabel}>{MONTHS[month]} {year}</div>
          <button className={styles.calNavBtn} onClick={next} aria-label="Next month">›</button>
        </div>
        <div className={styles.calLegend}>
          <div className={styles.calLegendItem}>
            <span className={`${styles.calLegendSwatch} ${styles.calLegendSwatchPre}`} />
            <span>Reminder window (pre-deadline)</span>
          </div>
          <div className={styles.calLegendItem}>
            <span className={`${styles.calLegendSwatch} ${styles.calLegendSwatchPost}`} />
            <span>Post-deadline escalation</span>
          </div>
          <div className={styles.calLegendItem}>
            <span className={`${styles.calLegendSwatch} ${styles.calLegendSwatchEvent}`} />
            <span>Milestone due date</span>
          </div>
        </div>
      </div>

      {/* ── Calendar grid ── */}
      <div className={`${styles.calGrid} ${activePill ? styles.calGridAssign : ''}`}>
        {DAY_LABELS.map((d) => (
          <div key={d} className={styles.calHeaderCell}>{d}</div>
        ))}

        {calDays.map(({ date, isCurrentMonth }, i) => {
          const dayEvents = eventsForDay(date)
          const isToday   = isSameDay(date, DEMO_TODAY)
          const key       = toDateKey(date)
          const meta      = dayMap[key]
          const isDrawerDay = drawer && toInputDate(date) === drawer.date

          let bgStyle = {}
          if (meta?.isPostDeadline) {
            const color = meta.postColors[0] || '#9A3412'
            bgStyle = { background: `${color}14` }
          } else if (meta?.isPreDeadline) {
            const color = meta.preColors[0] || '#1D4ED8'
            bgStyle = {
              background: `repeating-linear-gradient(
                135deg,
                ${color}09 0px, ${color}09 4px,
                transparent 4px, transparent 8px
              )`,
            }
          }

          return (
            <div
              key={i}
              className={[
                styles.calDay,
                isToday          ? styles.calToday      : '',
                !isCurrentMonth  ? styles.calOtherMonth : '',
                activePill && isCurrentMonth ? styles.calDayAssignable : '',
                isDrawerDay      ? styles.calDaySelected : '',
              ].join(' ')}
              style={bgStyle}
              onClick={() => handleDayClick(date, isCurrentMonth)}
            >
              <div className={`${styles.calDayNum} ${isToday ? styles.calTodayNum : ''}`}>
                {date.getDate()}
              </div>
              {dayEvents.map((ev) => (
                <div
                  key={ev.key}
                  className={styles.calEvent}
                  style={{
                    background: `${ev.color}20`,
                    color:       ev.color,
                    borderLeft: `2px solid ${ev.color}`,
                  }}
                  title={ev.label}
                >
                  {ev.label}
                </div>
              ))}
            </div>
          )
        })}
      </div>

      {/* ── Reminder config drawer (appears below grid when day clicked) ── */}
      {drawer && (
        <ReminderConfigDrawer
          pill={drawer.pill}
          date={drawer.date}
          onApply={handleApply}
          onCancel={() => { setDrawer(null) }}
        />
      )}

    </div>
  )
}
