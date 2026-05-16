const { upsertSchedules, listSchedules, deleteSchedule } = require('../services/scheduleService')

/* ── POST /api/schedules/sync ────────────────────────────────────── */
function syncSchedules(req, res) {
  const { schedules } = req.body

  if (!Array.isArray(schedules)) {
    return res.status(422).json({ error: 'schedules must be an array' })
  }

  try {
    upsertSchedules(schedules)
    res.json({ success: true, count: schedules.length })
  } catch (err) {
    console.error('[syncSchedules]', err)
    res.status(500).json({ error: 'Failed to sync schedules' })
  }
}

/* ── GET /api/schedules ──────────────────────────────────────────── */
function getSchedules(_req, res) {
  try {
    const schedules = listSchedules()
    res.json({ schedules })
  } catch (err) {
    console.error('[getSchedules]', err)
    res.status(500).json({ error: 'Failed to fetch schedules' })
  }
}

/* ── DELETE /api/schedules/:id ───────────────────────────────────── */
function removeSchedule(req, res) {
  try {
    deleteSchedule(req.params.id)
    res.json({ success: true })
  } catch (err) {
    console.error('[removeSchedule]', err)
    res.status(500).json({ error: 'Failed to delete schedule' })
  }
}

module.exports = { syncSchedules, getSchedules, removeSchedule }
