const db = require('../models/db')

/* ── Prepared statements ─────────────────────────────────────────── */
const stmtUpsert = db.prepare(`
  INSERT INTO schedules (id, name, client, project, cohort, courses, milestones, status, start_date, end_date, updated_at)
  VALUES (@id, @name, @client, @project, @cohort, @courses, @milestones, @status, @start_date, @end_date, @updated_at)
  ON CONFLICT(id) DO UPDATE SET
    name       = excluded.name,
    client     = excluded.client,
    project    = excluded.project,
    cohort     = excluded.cohort,
    courses    = excluded.courses,
    milestones = excluded.milestones,
    status     = excluded.status,
    start_date = excluded.start_date,
    end_date   = excluded.end_date,
    updated_at = excluded.updated_at
`)

const stmtAll    = db.prepare('SELECT * FROM schedules')
const stmtDelete = db.prepare('DELETE FROM schedules WHERE id = ?')

/* ── Helpers ─────────────────────────────────────────────────────── */
function deserialise(row) {
  return {
    ...row,
    courses:    JSON.parse(row.courses    || '[]'),
    milestones: JSON.parse(row.milestones || '[]'),
  }
}

function serialise(schedule) {
  return {
    id:         schedule.id,
    name:       schedule.name  || '',
    client:     schedule.client || '',
    project:    schedule.project || null,
    cohort:     schedule.cohort  || null,
    courses:    JSON.stringify(Array.isArray(schedule.courses)    ? schedule.courses    : []),
    milestones: JSON.stringify(Array.isArray(schedule.milestones) ? schedule.milestones : []),
    status:     schedule.status || 'Draft',
    start_date: schedule.startDate || schedule.start_date || null,
    end_date:   schedule.endDate   || schedule.end_date   || null,
    updated_at: schedule.updatedAt || schedule.updated_at || new Date().toISOString().slice(0, 16).replace('T', ' '),
  }
}

/* ── Public API ──────────────────────────────────────────────────── */

/** Bulk upsert — idempotent, called whenever the frontend saves. */
function upsertSchedules(schedules) {
  const upsertAll = db.transaction((rows) => {
    for (const s of rows) upsertStmt(s)
  })

  function upsertStmt(s) {
    stmtUpsert.run(serialise(s))
  }

  upsertAll(schedules)
}

/** Return all schedules with parsed JSON arrays. */
function listSchedules() {
  return stmtAll.all().map(deserialise)
}

/** Delete one schedule by id. */
function deleteSchedule(id) {
  stmtDelete.run(id)
}

/**
 * Find the best-matching schedule for a learner using a three-step cascade:
 *   1. Exact cohort match
 *   2. Client + course match
 *   3. Client-only fallback
 *
 * Returns the schedule object (with parsed milestones) or null.
 */
function findScheduleForLearner({ clientName, projectName, courseName, cohort }) {
  const all = listSchedules()

  // 1. Exact cohort match
  if (cohort) {
    const byCohor = all.find((s) => s.cohort && s.cohort === cohort)
    if (byCohor) return byCohor
  }

  // 2. Client + course match
  if (clientName) {
    const byClientCourse = all.find((s) =>
      s.client === clientName &&
      (!s.courses.length || s.courses.includes(courseName))
    )
    if (byClientCourse) return byClientCourse
  }

  // 3. Client + project match
  if (clientName && projectName) {
    const byClientProject = all.find((s) =>
      s.client === clientName && s.project === projectName
    )
    if (byClientProject) return byClientProject
  }

  // 4. Client-only fallback
  if (clientName) {
    const byClient = all.find((s) => s.client === clientName)
    if (byClient) return byClient
  }

  return null
}

module.exports = { upsertSchedules, listSchedules, deleteSchedule, findScheduleForLearner }
