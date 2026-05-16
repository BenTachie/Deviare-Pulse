const { findScheduleForLearner } = require('./scheduleService')

const MILESTONE_LABELS = {
  activation: 'Course Activation',
  osl:        'OSL Progress',
  lvc:        'LVC Attendance',
  assessment: 'Assessment',
  project:    'Project Submission',
  completion: 'Course Completion',
}

// Milestones that have per-percentage thresholds rather than a single due date
const THRESHOLD_MILESTONES = new Set(['osl', 'lvc'])

/**
 * For OSL/LVC milestones, find the next unmet threshold based on the learner's
 * current progress. Returns { dueDate, requiredTarget } for that threshold,
 * or null if no thresholds are configured.
 *
 * Logic:
 *   - Sort thresholds ascending by pct
 *   - Return the first threshold the learner hasn't reached yet (pct > currentProgress)
 *   - If the learner has cleared all thresholds, fall back to the milestone's final dueDate
 *     and the highest threshold pct (they still need the nudge to complete)
 */
function resolveThreshold(milestone, currentProgress) {
  const thresholds = milestone?.thresholds
  if (!thresholds || thresholds.length === 0) return null

  const sorted = [...thresholds].sort((a, b) => a.pct - b.pct)
  const next   = sorted.find((t) => t.pct > currentProgress)

  if (next) {
    return { dueDate: next.dueDate ?? null, requiredTarget: `${next.pct}%` }
  }

  // Learner has passed every threshold — point at the final due date
  const last = sorted[sorted.length - 1]
  return { dueDate: milestone.dueDate ?? last.dueDate ?? null, requiredTarget: `${last.pct}%` }
}

/**
 * Format an ISO date string as "DD Mon YYYY" (e.g. "04 Sep 2022").
 * Uses explicit string construction to avoid locale inconsistencies across Node versions.
 */
function formatDate(iso) {
  const d = new Date(iso)
  if (isNaN(d.getTime())) return null
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  const day   = String(d.getUTCDate()).padStart(2, '0')
  const month = months[d.getUTCMonth()]
  const year  = d.getUTCFullYear()
  return `${day} ${month} ${year}`
}

/**
 * Calculate days remaining from an ISO due date using the server clock.
 * Positive  = days left before deadline
 * Zero      = due today
 * Negative  = days overdue
 * Returns null if the date is missing or unparseable.
 */
function calcDaysRemaining(dueDateISO) {
  if (!dueDateISO) return null
  try {
    const due   = new Date(dueDateISO)
    const today = new Date()
    // Normalise both to midnight UTC for a whole-day diff
    due.setUTCHours(0, 0, 0, 0)
    today.setUTCHours(0, 0, 0, 0)
    return Math.ceil((due - today) / (1000 * 60 * 60 * 24))
  } catch {
    return null
  }
}

/**
 * Resolve all dynamic email variables for one learner + milestone.
 *
 * @param {object} params
 * @param {string} params.clientName
 * @param {string} params.projectName
 * @param {string} params.courseName
 * @param {string} params.cohort
 * @param {string} params.milestoneKey
 * @param {number|null} [params.currentProgress] — learner's current % (0-100, no % sign).
 *   Required for OSL/LVC threshold resolution; ignored for other milestones.
 */
function resolveReminderContext({ clientName, projectName, courseName, cohort, milestoneKey, currentProgress = null }) {
  const schedule  = findScheduleForLearner({ clientName, projectName, courseName, cohort })
  const milestone = schedule?.milestones?.find((m) => m.key === milestoneKey) ?? null

  let dueDateISO             = milestone?.dueDate ?? null
  let requiredTargetOverride = null

  // For OSL/LVC, find the specific threshold the learner needs to hit next
  if (THRESHOLD_MILESTONES.has(milestoneKey) && currentProgress != null) {
    const th = resolveThreshold(milestone, currentProgress)
    if (th) {
      dueDateISO             = th.dueDate
      requiredTargetOverride = th.requiredTarget
    }
  }

  const daysRemaining = calcDaysRemaining(dueDateISO)
  const formattedDate = dueDateISO ? (formatDate(dueDateISO) ?? 'your programme deadline') : 'your programme deadline'

  console.log(
    `[resolver] milestone=${milestoneKey} scheduleFound=${!!schedule} milestoneFound=${!!milestone}` +
    ` progress=${currentProgress ?? 'n/a'} requiredTarget=${requiredTargetOverride ?? 'n/a'}` +
    ` dueDate=${dueDateISO ?? 'none'} daysRemaining=${daysRemaining ?? 'null'}`
  )

  return {
    DueDate:       formattedDate,
    DueDateISO:    dueDateISO ?? '',
    DaysRemaining: daysRemaining !== null ? String(daysRemaining) : 'N/A',
    MilestoneName: MILESTONE_LABELS[milestoneKey] ?? milestoneKey,
    // Override RequiredTarget for threshold milestones so the email shows the correct next target
    ...(requiredTargetOverride ? { RequiredTarget: requiredTargetOverride } : {}),

    _scheduleFound:  !!schedule,
    _milestoneFound: !!milestone,
    _scheduleId:     schedule?.id ?? null,
  }
}

module.exports = { resolveReminderContext, calcDaysRemaining, formatDate }
