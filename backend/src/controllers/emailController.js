const db              = require('../models/db')
const { listTemplates, getTemplateByKey } = require('../services/templateService')
const { sendEmail, sendTemplateEmail, sendBulkEmails } = require('../services/emailService')
const { getTemplateId }            = require('../config/sendgridTemplates')
const { resolveReminderContext }   = require('../services/reminderResolver')
const sgApi                        = require('../services/sendgridApiService')

/* ── GET /api/email/templates ─────────────────────────────────────── */
function getTemplates(_req, res) {
  try {
    const templates = listTemplates()
    res.json({ templates })
  } catch (err) {
    console.error('[getTemplates]', err)
    res.status(500).json({ error: 'Failed to fetch templates' })
  }
}

/* ── GET /api/email/templates/:key ────────────────────────────────── */
function getTemplate(req, res) {
  try {
    const tpl = getTemplateByKey(req.params.key)
    if (!tpl) return res.status(404).json({ error: 'Template not found' })
    res.json({ template: tpl })
  } catch (err) {
    console.error('[getTemplate]', err)
    res.status(500).json({ error: 'Failed to fetch template' })
  }
}

/* ── POST /api/email/send-reminder ────────────────────────────────── */
/**
 * Single-recipient reminder.
 *
 * Request body:
 *   recipientEmail  — required
 *   recipientName   — optional
 *   milestoneKey    — milestone to remind about (also accepted as templateKey)
 *   clientName      — learner's client  (used by resolver)
 *   projectName     — learner's project (used by resolver)
 *   courseName      — learner's course  (used by resolver)
 *   cohort          — learner's cohort  (used by resolver)
 *   subject         — optional subject override
 *   variables       — partial variables; resolver fills DueDate/DaysRemaining/MilestoneName
 *
 * The backend resolves DueDate and DaysRemaining from the saved schedule database
 * using the server's clock — no frontend date is trusted for the actual send.
 */
async function sendReminder(req, res) {
  const {
    recipientEmail,
    recipientName,
    milestoneKey: milestoneKeyField,
    templateKey,          // alias kept for backward-compat
    clientName,
    projectName,
    courseName,
    cohort,
    subject,
    variables,
  } = req.body

  const milestoneKey = milestoneKeyField || templateKey || 'activation'

  // Parse numeric progress for OSL/LVC threshold resolution (e.g. "67%" → 67)
  const rawProgress   = variables?.CurrentProgress
  const currentProgress = rawProgress != null ? parseFloat(String(rawProgress)) : null

  // Resolve schedule → milestone → dates on the backend
  const resolved = resolveReminderContext({ clientName, projectName, courseName, cohort, milestoneKey, currentProgress })

  if (!resolved._scheduleFound) {
    console.warn(`[sendReminder] No matching schedule for ${recipientEmail} (client=${clientName}, course=${courseName}, cohort=${cohort})`)
  }

  // Strip internal diagnostics before building the email payload
  const { _scheduleFound, _milestoneFound, _scheduleId, ...resolvedVars } = resolved

  const enrichedVariables = {
    ...(variables || {}),
    ...resolvedVars,            // DueDate, DueDateISO, DaysRemaining, MilestoneName
  }

  const lmsUrl     = process.env.LMS_URL || 'https://platform.deviare.africa'
  const templateId = getTemplateId(milestoneKey)

  try {
    let result

    if (templateId) {
      // Send via SendGrid Dynamic Template — backend owns all variable values
      const dynamicTemplateData = {
        ...enrichedVariables,
        LMSLoginUrl: lmsUrl,
      }
      result = await sendTemplateEmail({
        recipientEmail,
        recipientName,
        templateId,
        templateKey: milestoneKey,
        dynamicTemplateData,
      })
    } else {
      // Raw-HTML fallback: use stored SQLite template so placeholders are still
      // in the body and get substituted with the resolver's fresh values.
      // bodyHtml from the frontend is intentionally ignored here — the stored
      // template is the authoritative source.
      result = await sendEmail({
        recipientEmail,
        recipientName,
        templateKey: milestoneKey,
        subject,
        bodyHtml: null,          // signals buildEmail to use stored template
        variables: enrichedVariables,
      })
    }

    res.status(200).json({ success: true, ...result })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message, logId: err.logId })
  }
}

/* ── POST /api/email/send-reminders ───────────────────────────────── */
/**
 * Bulk campaign send.
 *
 * Each recipient in the array may carry:
 *   email, name, clientName, projectName, courseName, cohort, variables
 *
 * The backend resolves DueDate/DaysRemaining per recipient from the schedule DB.
 */
async function sendReminders(req, res) {
  const { recipients, templateKey, subject, bodyHtml, additionalNote } = req.body

  try {
    const results = await sendBulkEmails({ recipients, templateKey, subject, bodyHtml, additionalNote })
    const sent   = results.filter((r) => r.status === 'sent').length
    const failed = results.filter((r) => r.status === 'failed').length
    res.status(200).json({ success: true, sent, failed, results })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

/* ── GET /api/email/logs ──────────────────────────────────────────── */
const stmtLogs = db.prepare(
  'SELECT * FROM email_logs ORDER BY sent_at DESC LIMIT 200'
)

function getLogs(_req, res) {
  try {
    const logs = stmtLogs.all()
    res.json({ logs })
  } catch (err) {
    console.error('[getLogs]', err)
    res.status(500).json({ error: 'Failed to fetch logs' })
  }
}

/* ── GET /api/email/sg-templates ──────────────────────────────────── */
async function getSgTemplates(_req, res) {
  try {
    const templates = await sgApi.listTemplates()
    res.json({ templates })
  } catch (err) {
    console.error('[getSgTemplates]', err)
    res.status(err.status || 500).json({ error: err.message })
  }
}

/* ── GET /api/email/sg-templates/:templateId/content ─────────────── */
async function getSgTemplateContent(req, res) {
  try {
    const content = await sgApi.getTemplateContent(req.params.templateId)
    res.json(content)
  } catch (err) {
    console.error('[getSgTemplateContent]', err)
    res.status(err.status || 500).json({ error: err.message })
  }
}

/* ── PATCH /api/email/sg-templates/:templateId ───────────────────── */
async function updateSgTemplate(req, res) {
  const { subject, htmlContent } = req.body
  if (!subject && !htmlContent) {
    return res.status(422).json({ error: 'subject or htmlContent is required' })
  }
  try {
    await sgApi.updateTemplate(req.params.templateId, { subject, htmlContent })
    res.json({ success: true })
  } catch (err) {
    console.error('[updateSgTemplate]', err)
    res.status(err.status || 500).json({ error: err.message })
  }
}

module.exports = {
  getTemplates, getTemplate,
  sendReminder, sendReminders,
  getLogs,
  getSgTemplates, getSgTemplateContent, updateSgTemplate,
}
