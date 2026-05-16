const BASE = '/api/email'

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg = data?.errors?.[0]?.msg || data?.error || `HTTP ${res.status}`
    throw Object.assign(new Error(msg), { status: res.status, data })
  }
  return data
}

/** Fetch lightweight template list [{key, name, subject}] */
export async function fetchTemplates() {
  const { templates } = await request('/templates')
  return templates
}

/** Fetch full template including body_html */
export async function fetchTemplateByKey(key) {
  const { template } = await request(`/templates/${key}`)
  return template
}

/**
 * Send a single reminder.
 * @param {{
 *   recipientEmail: string,
 *   recipientName?: string,
 *   templateKey?: string,
 *   subject: string,
 *   bodyHtml: string,
 *   variables?: Record<string, string>
 * }} payload
 */
export async function sendReminder(payload) {
  return request('/send-reminder', { method: 'POST', body: JSON.stringify(payload) })
}

/**
 * Send bulk reminders.
 * @param {{
 *   recipients: Array<{email: string, name?: string, variables?: Record<string,string>}>,
 *   templateKey?: string,
 *   subject: string,
 *   bodyHtml: string,
 *   additionalNote?: string
 * }} payload
 */
export async function sendReminders(payload) {
  return request('/send-reminders', { method: 'POST', body: JSON.stringify(payload) })
}

/** Fetch last 200 email log entries */
export async function fetchLogs() {
  const { logs } = await request('/logs')
  return logs
}

/** Fetch all mapped SendGrid dynamic templates (name, milestoneKey, colour) */
export async function fetchSgTemplates() {
  const { templates } = await request('/sg-templates')
  return templates
}

/** Fetch full content (subject + htmlContent) for one SendGrid template */
export async function fetchSgTemplateContent(templateId) {
  return request(`/sg-templates/${templateId}/content`)
}

/** Save subject and/or HTML back to SendGrid */
export async function saveSgTemplate(templateId, { subject, htmlContent }) {
  return request(`/sg-templates/${templateId}`, {
    method: 'PATCH',
    body:   JSON.stringify({ subject, htmlContent }),
  })
}
