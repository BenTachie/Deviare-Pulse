import { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react'
import { LEARNERS, DASHBOARD_STATS, MILESTONE_FUNNEL } from '../data/learners'
import { mapSheetToLearners } from '../utils/mapLearner'
import { computeDashboardStats, computeMilestoneFunnel, computeReportStats } from '../utils/computeStats'
import { computeQueue } from '../utils/computeNotifications'
import { dbGet, dbSet } from '../utils/db'

const STORAGE_KEY = 'deviare_pulse_learners'
const HISTORY_KEY = 'deviare_pulse_upload_history'

const DEFAULT_HISTORY = [
  { file: 'progress_oct2022.csv', date: 'Oct 15, 2022', records: 26, status: 'success' },
  { file: 'sept_update.xlsx',     date: 'Sep 30, 2022', records: 26, status: 'success' },
  { file: 'initial_enroll.csv',   date: 'Sep 1, 2022',  records: 26, status: 'success' },
]

// One-time migration: move data out of localStorage into IndexedDB then clean up
async function migrateFromLocalStorage() {
  const results = {}
  for (const key of [STORAGE_KEY, HISTORY_KEY]) {
    const raw = localStorage.getItem(key)
    if (raw) {
      try {
        const parsed = JSON.parse(raw)
        await dbSet(key, parsed)
        localStorage.removeItem(key)
        results[key] = parsed
      } catch {}
    }
  }
  return results
}

const AppCtx = createContext(null)

export function AppProvider({ children }) {
  const [selectedScheduleId, setSelectedScheduleId] = useState(null)

  // Start with null / defaults — no synchronous storage read on the main thread
  const [importedLearners, setImportedLearners] = useState(null)
  const [uploadHistory, setUploadHistory]       = useState(DEFAULT_HISTORY)
  const [isDbReady, setIsDbReady]               = useState(false)

  // Load persisted data from IndexedDB after mount (non-blocking)
  useEffect(() => {
    async function load() {
      try {
        // Check IndexedDB first
        let [stored, history] = await Promise.all([
          dbGet(STORAGE_KEY),
          dbGet(HISTORY_KEY),
        ])

        // If IndexedDB is empty, migrate whatever is still in localStorage
        if (!stored || !history) {
          const migrated = await migrateFromLocalStorage()
          if (!stored  && migrated[STORAGE_KEY]) stored  = migrated[STORAGE_KEY]
          if (!history && migrated[HISTORY_KEY]) history = migrated[HISTORY_KEY]
        }

        if (stored)  setImportedLearners(stored)
        if (history) setUploadHistory(history)
      } catch (err) {
        console.error('IndexedDB load failed:', err)
      } finally {
        setIsDbReady(true)
      }
    }
    load()
  }, [])

  // ── Import ───────────────────────────────────────────────────────
  const importLearners = useCallback((rawRows) => {
    const mapped = mapSheetToLearners(rawRows)
    setImportedLearners(mapped)
    dbSet(STORAGE_KEY, mapped).catch(console.error)
    return mapped
  }, [])

  // ── Clear ────────────────────────────────────────────────────────
  // Set to [] (empty array) rather than null so the ?? operator in the
  // learners memo does NOT fall back to the seed LEARNERS — empty array
  // is truthy and yields an empty dataset across the whole app.
  const clearImportedLearners = useCallback(() => {
    setImportedLearners([])
    dbSet(STORAGE_KEY, []).catch(console.error)
  }, [])

  // ── Upload history ───────────────────────────────────────────────
  const addUploadRecord = useCallback((record) => {
    setUploadHistory((prev) => {
      const next = [record, ...prev]
      dbSet(HISTORY_KEY, next).catch(console.error)
      return next
    })
  }, [])

  const removeUploadRecord = useCallback((index) => {
    setUploadHistory((prev) => {
      const next = prev.filter((_, i) => i !== index)
      dbSet(HISTORY_KEY, next).catch(console.error)
      return next
    })
  }, [])

  // ── Derived data ─────────────────────────────────────────────────
  // null  → never uploaded: show zero/placeholder states on dashboard
  // []    → explicitly cleared: same zero/placeholder states
  // [...] → real uploaded data: compute everything from live records
  const hasImportedData = Array.isArray(importedLearners) && importedLearners.length > 0

  const learners = useMemo(() => {
    const raw = importedLearners ?? LEARNERS
    return raw.map((l) => {
      if (l.clientName) return l
      if (l.projectName?.includes(' — ')) {
        return { ...l, clientName: l.projectName.split(' — ')[0].trim() }
      }
      return l
    })
  }, [importedLearners])

  // All metrics are zero when no dataset has been uploaded.
  // Once real data exists, compute everything from live learner records.
  const dashboardStats = useMemo(
    () => hasImportedData
      ? computeDashboardStats(learners)
      : { totalLearners: 0, enrolledThisMonth: 0, activeSchedules: 0, activeCohorts: 0, atRisk: 0, pendingReminders: 0 },
    [hasImportedData, learners]
  )

  const milestoneFunnel = useMemo(
    () => hasImportedData
      ? computeMilestoneFunnel(learners)
      : MILESTONE_FUNNEL.map((s) => ({ ...s, count: 0, pct: 0 })),
    [hasImportedData, learners]
  )

  const reportStats = useMemo(
    () => computeReportStats(learners),
    [learners]
  )

  // ── Notification count (derived from live queue) ─────────────────
  const notificationCount = useMemo(
    () => hasImportedData ? computeQueue(learners).length : 0,
    [hasImportedData, learners]
  )
  const decrementNotifCount = useCallback(() => {}, [])
  const clearNotifCount     = useCallback(() => {}, [])

  return (
    <AppCtx.Provider value={{
      notificationCount, decrementNotifCount, clearNotifCount,
      selectedScheduleId, setSelectedScheduleId,
      learners, hasImportedData, isDbReady,
      importLearners, clearImportedLearners,
      dashboardStats, milestoneFunnel, reportStats,
      uploadHistory, addUploadRecord, removeUploadRecord,
    }}>
      {children}
    </AppCtx.Provider>
  )
}

export const useApp = () => {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
