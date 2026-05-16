const { findScheduleForLearner } = require('./scheduleService')

const MILESTONE_LABELS = {
  activation: 'Course Activation',
  osl:        'OSL Progress',
  lvc:        'LVC Attendance',
  assessment: 'Assessment',
  project:    'Project Submission',
  completion: 'Course Completion',
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
 * Steps:
 *   1. Find the matching schedule (cohort → client+course → client)
 *   2. Locate the milestone inside that schedule
 *   3. Extract the due date and calculate days remaining (server clock)
 *   4. Return a ready-to-spread variables object
 *
 * All returned fields are strings or null — never undefined — so they
 * spread cleanly into SendGrid dynamicTemplateData.
 */
function resolveReminderContext({ clientName, projectName, courseName, cohort, milestoneKey }) {
  const schedule  = findScheduleForLearner({ clientName, projectName, courseName, cohort })
  const milestone = schedule?.milestones?.find((m) => m.key === milestoneKey) ?? null

  const dueDateISO    = milestone?.dueDate ?? null
  const daysRemaining = calcDaysRemaining(dueDateISO)
  const formattedDate = dueDateISO ? (formatDate(dueDateISO) ?? 'your programme deadline') : 'your programme deadline'

  return {
    // Resolved dynamic values
    DueDate:        formattedDate,
    DueDateISO:     dueDateISO ?? '',
    DaysRemaining:  daysRemaining !== null ? String(daysRemaining) : 'N/A',
    MilestoneName:  MILESTONE_LABELS[milestoneKey] ?? milestoneKey,

    // Diagnostic metadata — not included in template data, useful for logging
    _scheduleFound:  !!schedule,
    _milestoneFound: !!milestone,
    _scheduleId:     schedule?.id ?? null,
  }
}

module.exports = { resolveReminderContext, calcDaysRemaining, formatDate }
