import { useState, useCallback, useMemo } from 'react'
import { useApp } from '../context/AppContext'

function oslStatusMatch(learner, oslStatus) {
  if (!oslStatus) return true
  if (oslStatus === 'Completed')   return learner.oslProgress >= 85
  if (oslStatus === 'In Progress') return learner.oslProgress > 0 && learner.oslProgress < 85
  if (oslStatus === 'Not Started') return learner.oslProgress === 0
  return true
}

// Keys whose filter values are string arrays (multi-select)
const ARRAY_KEYS = new Set(['clientName', 'cohort', 'course', 'status'])

// Downstream keys to reset when an upstream key changes
const DOWNSTREAM = {
  clientName: ['cohort', 'course', 'status'],
  cohort:     ['course', 'status'],
  course:     ['status'],
}

export function useLearners() {
  const { learners } = useApp()

  const [filters, setFilters] = useState({
    clientName:  [],   // multi-select
    cohort:      [],   // multi-select
    course:      [],   // multi-select
    search:      '',   // text
    status:      [],   // multi-select
    activity:    '',   // single (internal)
    oslStatus:   '',   // segmented
    oslMaxPct:   '',   // number input
  })

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => {
      const next = { ...prev, [key]: value }
      // Reset all downstream multi-select filters when an upstream changes
      const downstream = DOWNSTREAM[key] ?? []
      for (const k of downstream) {
        next[k] = ARRAY_KEYS.has(k) ? [] : ''
      }
      return next
    })
  }, [])

  const { clientName, cohort, course, search, status, activity, oslStatus, oslMaxPct } = filters

  // ── Cascading option lists ────────────────────────────────────────

  const clientNames = useMemo(
    () => [...new Set(learners.map((l) => l.clientName))].filter(Boolean).sort(),
    [learners]
  )

  const projectNames = useMemo(() => {
    const pool = clientName.length
      ? learners.filter((l) => clientName.includes(l.clientName))
      : learners
    return [...new Set(pool.map((l) => l.cohort))].filter(Boolean).sort()
  }, [learners, clientName])

  const courseNames = useMemo(() => {
    let pool = learners
    if (clientName.length) pool = pool.filter((l) => clientName.includes(l.clientName))
    if (cohort.length)     pool = pool.filter((l) => cohort.includes(l.cohort))
    return [...new Set(pool.map((l) => l.course))].filter(Boolean).sort()
  }, [learners, clientName, cohort])

  const statusOptions = useMemo(() => {
    let pool = learners
    if (clientName.length) pool = pool.filter((l) => clientName.includes(l.clientName))
    if (cohort.length)     pool = pool.filter((l) => cohort.includes(l.cohort))
    if (course.length)     pool = pool.filter((l) => course.includes(l.course))
    if (search) {
      const q = search.toLowerCase()
      pool = pool.filter((l) =>
        l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)
      )
    }
    return [...new Set(pool.map((l) => l.status))].filter(Boolean).sort()
  }, [learners, clientName, cohort, course, search])

  // ── Filtered result set ───────────────────────────────────────────

  const filtered = useMemo(() => {
    const q      = search.toLowerCase()
    const maxPct = oslMaxPct !== '' ? Number(oslMaxPct) : null

    return learners.filter((l) =>
      (clientName.length === 0 || clientName.includes(l.clientName)) &&
      (cohort.length === 0     || cohort.includes(l.cohort)) &&
      (course.length === 0     || course.includes(l.course)) &&
      (!q          || l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)) &&
      (status.length === 0     || status.includes(l.status)) &&
      (!activity   || l.activityLevel === activity) &&
      (maxPct === null || l.oslProgress <= maxPct) &&
      oslStatusMatch(l, oslStatus)
    )
  }, [learners, clientName, cohort, course, search, status, activity, oslStatus, oslMaxPct])

  return {
    learners, filtered, filters, setFilter,
    clientNames, projectNames, courseNames, statusOptions,
  }
}
