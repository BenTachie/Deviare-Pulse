const db = require('../models/db')
const { getTemplateId } = require('../config/sendgridTemplates')

const stmtAll = db.prepare('SELECT key, name, subject FROM email_templates ORDER BY rowid')
const stmtOne = db.prepare('SELECT * FROM email_templates WHERE key = ?')

/** Return lightweight list for dropdown, enriched with SendGrid template ID status */
function listTemplates() {
  return stmtAll.all().map((row) => ({
    ...row,
    sendgridTemplateId: getTemplateId(row.key),
  }))
}

/** Return full template or null */
function getTemplateByKey(key) {
  return stmtOne.get(key) || null
}

/**
 * Replace {{Placeholder}} tokens with values from the variables map.
 * Unknown placeholders are left as-is so editors can see them.
 */
function renderTemplate(html, variables = {}) {
  return html.replace(/\{\{(\w+)\}\}/g, (_match, key) =>
    Object.prototype.hasOwnProperty.call(variables, key) ? variables[key] : `{{${key}}}`
  )
}

/**
 * Build the final email.
 * Frontend-edited subject/bodyHtml take precedence over the stored template.
 * Variables are substituted ONLY in the template body — if the CSM already
 * edited the HTML themselves, we trust their version verbatim.
 */
function buildEmail(templateKey, { subject, bodyHtml, variables = {} }) {
  const tpl = getTemplateByKey(templateKey)

  const finalSubject = subject?.trim()
    || (tpl ? renderTemplate(tpl.subject, variables) : '(No subject)')

  const rawBody  = bodyHtml?.trim() || (tpl ? tpl.body_html : '')
  const finalBody = renderTemplate(rawBody, variables)

  return { subject: finalSubject, bodyHtml: finalBody }
}

module.exports = { listTemplates, getTemplateByKey, buildEmail }
