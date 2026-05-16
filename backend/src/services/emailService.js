const sgMail = require('@sendgrid/mail')
const db     = require('../models/db')
const { buildEmail } = require('./templateService')
const { getTemplateId } = require('../config/sendgridTemplates')
const { resolveReminderContext } = require('./reminderResolver')

sgMail.setApiKey(process.env.SENDGRID_API_KEY || '')

const FROM = {
  email: process.env.SENDGRID_FROM_EMAIL || 'noreply@deviare.africa',
  name:  process.env.SENDGRID_FROM_NAME  || 'Deviare Customer Success',
}

const stmtLog = db.prepare(`
  INSERT INTO email_logs (recipient, template_key, subject, status, message_id, error)
  VALUES (@recipient, @template_key, @subject, @status, @message_id, @error)
`)

/** Escape characters that are unsafe inside HTML text nodes */
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

/** Strip HTML tags for the plain-text fallback */
function htmlToText(html) {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<li>/gi, '• ')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/**
 * Send a single email via raw HTML + SendGrid.
 * Calls buildEmail() which substitutes {{Placeholder}} tokens in the stored template.
 * Pass bodyHtml=null to force use of the stored SQLite template body.
 */
async function sendEmail({ recipientEmail, recipientName, templateKey, subject, bodyHtml, variables }) {
  const { subject: finalSubject, bodyHtml: finalBody } = buildEmail(templateKey, {
    subject,
    bodyHtml,
    variables,
  })

  const message = {
    to:      { email: recipientEmail, name: recipientName || recipientEmail },
    from:    FROM,
    subject: finalSubject,
    html:    finalBody,
    text:    htmlToText(finalBody),
  }

  let messageId = null
  let status    = 'sent'
  let error     = null

  try {
    const [response] = await sgMail.send(message)
    messageId = response.headers['x-message-id'] || null
  } catch (err) {
    status = 'failed'
    error  = err?.response?.body?.errors?.[0]?.message || err.message || 'SendGrid error'
    console.error('[emailService] SendGrid error:', error)
    const apiError    = new Error(error)
    apiError.status   = 502
    const result      = stmtLog.run({
      recipient:    recipientEmail,
      template_key: templateKey || null,
      subject:      finalSubject,
      status,
      message_id:   null,
      error,
    })
    apiError.logId = result.lastInsertRowid
    throw apiError
  }

  const result = stmtLog.run({
    recipient:    recipientEmail,
    template_key: templateKey || null,
    subject:      finalSubject,
    status,
    message_id:   messageId,
    error:        null,
  })

  return { logId: result.lastInsertRowid, messageId }
}

/**
 * Send a single email via a SendGrid Dynamic Template.
 * All personalisation is passed through dynamicTemplateData.
 */
async function sendTemplateEmail({ recipientEmail, recipientName, templateId, templateKey, dynamicTemplateData }) {
  const message = {
    to:   { email: recipientEmail, name: recipientName || recipientEmail },
    from: FROM,
    templateId,
    dynamicTemplateData,
  }

  let messageId = null
  let status    = 'sent'
  let error     = null

  try {
    const [response] = await sgMail.send(message)
    messageId = response.headers['x-message-id'] || null
  } catch (err) {
    status = 'failed'
    error  = err?.response?.body?.errors?.[0]?.message || err.message || 'SendGrid error'
    console.error('[emailService] SendGrid template error:', error)
    const apiError    = new Error(error)
    apiError.status   = 502
    const result      = stmtLog.run({
      recipient:    recipientEmail,
      template_key: templateKey || null,
      subject:      null,
      status,
      message_id:   null,
      error,
    })
    apiError.logId = result.lastInsertRowid
    throw apiError
  }

  const result = stmtLog.run({
    recipient:    recipientEmail,
    template_key: templateKey || null,
    subject:      null,
    status,
    message_id:   messageId,
    error:        null,
  })

  return { logId: result.lastInsertRowid, messageId }
}

/**
 * Send bulk emails sequentially, resolving each recipient's DueDate and
 * DaysRemaining from the backend schedule database using the server clock.
 *
 * Each recipient object may carry:
 *   { email, name, clientName, projectName, courseName, cohort, variables }
 *
 * Uses a SendGrid Dynamic Template when a template ID is configured for
 * the given milestone key; falls back to raw-HTML sending otherwise.
 * Never throws — per-recipient failures are captured in the results array.
 */
async function sendBulkEmails({ recipients, templateKey, subject, bodyHtml, additionalNote }) {
  const results    = []
  const templateId = getTemplateId(templateKey)
  const lmsUrl     = process.env.LMS_URL || 'https://platform.deviare.africa'

  for (const r of recipients) {
    try {
      // ── Resolve dates for this recipient from the backend schedule store ──
      const resolved = resolveReminderContext({
        clientName:  r.clientName,
        projectName: r.projectName,
        courseName:  r.courseName,
        cohort:      r.cohort,
        milestoneKey: templateKey,
      })

      if (!resolved._scheduleFound) {
        console.warn(`[sendBulkEmails] No matching schedule for ${r.email} (client=${r.clientName}, course=${r.courseName})`)
      }

      const { _scheduleFound, _milestoneFound, _scheduleId, ...resolvedVars } = resolved

      // Merge: resolver values override anything the frontend may have supplied
      const enrichedVars = {
        ...(r.variables || {}),
        ...resolvedVars,   // DueDate, DueDateISO, DaysRemaining, MilestoneName
        LMSLoginUrl: lmsUrl,
        ...(additionalNote?.trim() ? { AdditionalNote: escapeHtml(additionalNote.trim()) } : {}),
      }

      let out

      if (templateId) {
        out = await sendTemplateEmail({
          recipientEmail: r.email,
          recipientName:  r.name,
          templateId,
          templateKey,
          dynamicTemplateData: enrichedVars,
        })
      } else {
        // Raw-HTML path: pass bodyHtml=null so buildEmail uses the stored template,
        // ensuring {{DueDate}} / {{DaysRemaining}} placeholders are still present
        // for substitution with the freshly resolved values.
        let rawBody = null
        if (additionalNote?.trim() && bodyHtml) {
          rawBody = bodyHtml + `<hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;"><p style="font-size:13px;color:#6b7280;font-style:italic;">${escapeHtml(additionalNote.trim())}</p>`
        }
        out = await sendEmail({
          recipientEmail: r.email,
          recipientName:  r.name,
          templateKey,
          subject,
          bodyHtml: rawBody,
          variables: enrichedVars,
        })
      }

      results.push({ email: r.email, status: 'sent', logId: out.logId })
    } catch (err) {
      results.push({ email: r.email, status: 'failed', error: err.message, logId: err.logId })
    }
  }

  return results
}

module.exports = { sendEmail, sendTemplateEmail, sendBulkEmails }
