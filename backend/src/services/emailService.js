const sgMail = require('@sendgrid/mail')
const db     = require('../models/db')
const { buildEmail } = require('./templateService')
const { getTemplateId } = require('../config/sendgridTemplates')

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
 * Send a single email via SendGrid and log the outcome.
 * @returns {{ logId: number, messageId: string }}
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
    // Re-throw so the controller can return a proper 502
    const apiError = new Error(error)
    apiError.status = 502
    // Still log the failure before throwing
    const result = stmtLog.run({
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
 * Send a single email via a SendGrid Dynamic Template ID.
 * All personalisation is passed through dynamicTemplateData —
 * SendGrid renders the subject, HTML and plain-text from the stored template.
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
 * Send bulk emails sequentially, collecting per-recipient results.
 * Uses a SendGrid Dynamic Template when a template ID is configured for
 * the given key; falls back to raw-HTML sending if not.
 * Never throws — failures are captured in the results array.
 */
async function sendBulkEmails({ recipients, templateKey, subject, bodyHtml, additionalNote }) {
  const results    = []
  const templateId = getTemplateId(templateKey)
  const lmsUrl     = process.env.LMS_URL || 'https://platform.deviare.africa'

  for (const r of recipients) {
    try {
      let out

      if (templateId) {
        const dynamicTemplateData = {
          ...(r.variables || {}),
          LMSLoginUrl: lmsUrl,
          ...(additionalNote?.trim() ? { AdditionalNote: additionalNote.trim() } : {}),
        }
        out = await sendTemplateEmail({
          recipientEmail: r.email,
          recipientName:  r.name,
          templateId,
          templateKey,
          dynamicTemplateData,
        })
      } else {
        // Fallback: raw HTML (used when no SendGrid template ID is configured)
        let body = bodyHtml
        if (additionalNote?.trim()) {
          body = (body || '') + `<hr style="margin:24px 0;border:none;border-top:1px solid #e5e7eb;"><p style="font-size:13px;color:#6b7280;font-style:italic;">${escapeHtml(additionalNote.trim())}</p>`
        }
        out = await sendEmail({
          recipientEmail: r.email,
          recipientName:  r.name,
          templateKey,
          subject,
          bodyHtml: body,
          variables: r.variables || {},
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
