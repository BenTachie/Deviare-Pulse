const db              = require('../models/db')
const { listTemplates, getTemplateByKey } = require('../services/templateService')
const { sendEmail, sendBulkEmails }       = require('../services/emailService')
const sgApi                               = require('../services/sendgridApiService')

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
async function sendReminder(req, res) {
  const { recipientEmail, recipientName, templateKey, subject, bodyHtml, variables } = req.body

  try {
    const result = await sendEmail({ recipientEmail, recipientName, templateKey, subject, bodyHtml, variables })
    res.status(200).json({ success: true, ...result })
  } catch (err) {
    res.status(err.status || 500).json({ success: false, error: err.message, logId: err.logId })
  }
}

/* ── POST /api/email/send-reminders ───────────────────────────────── */
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

module.exports = { getTemplates, getTemplate, sendReminder, sendReminders, getLogs, getSgTemplates, getSgTemplateContent, updateSgTemplate }
