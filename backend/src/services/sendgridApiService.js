const { TEMPLATE_IDS } = require('../config/sendgridTemplates')

const SG_BASE = 'https://api.sendgrid.com/v3'

// Reverse map: templateId → milestoneKey
const ID_TO_KEY = Object.fromEntries(
  Object.entries(TEMPLATE_IDS)
    .filter(([, v]) => v)
    .map(([k, v]) => [v, k])
)

const MILESTONE_COLORS = {
  activation: '#1D4ED8',
  osl:        '#166534',
  lvc:        '#9A3412',
  assessment: '#5B21B6',
  project:    '#9F1239',
  completion: '#0F766E',
}

async function sgFetch(path, method = 'GET', body = null) {
  const opts = {
    method,
    headers: {
      Authorization:  `Bearer ${process.env.SENDGRID_API_KEY}`,
      'Content-Type': 'application/json',
    },
  }
  if (body) opts.body = JSON.stringify(body)

  const res = await fetch(`${SG_BASE}${path}`, opts)
  if (!res.ok) {
    const data = await res.json().catch(() => ({}))
    const msg  = data?.errors?.[0]?.message || `SendGrid API error ${res.status}`
    throw Object.assign(new Error(msg), { status: res.status })
  }
  return res.json()
}

/**
 * List all dynamic templates, enriched with milestone key and colour.
 * Only returns templates that are mapped in .env (i.e. the 6 Pulse templates).
 */
async function listTemplates() {
  const data = await sgFetch('/templates?generations=dynamic&page_size=18')
  return (data.result || [])
    .map((t) => ({
      id:           t.id,
      name:         t.name,
      updatedAt:    t.updated_at,
      milestoneKey: ID_TO_KEY[t.id] || null,
      color:        MILESTONE_COLORS[ID_TO_KEY[t.id]] || '#6b7280',
    }))
    .filter((t) => t.milestoneKey) // only the 6 mapped templates
    .sort((a, b) => {
      const ORDER = ['activation', 'osl', 'lvc', 'assessment', 'project', 'completion']
      return ORDER.indexOf(a.milestoneKey) - ORDER.indexOf(b.milestoneKey)
    })
}

/**
 * Fetch the active version of a template: subject + full HTML.
 */
async function getTemplateContent(templateId) {
  const data    = await sgFetch(`/templates/${templateId}?versions=true`)
  const version = data.versions?.find((v) => v.active === 1) ?? data.versions?.[0]

  if (!version) throw new Error('No active version found for this template')

  return {
    id:           data.id,
    name:         data.name,
    versionId:    version.id,
    subject:      version.subject || '',
    htmlContent:  version.html_content || '',
    updatedAt:    version.updated_at,
    milestoneKey: ID_TO_KEY[data.id] || null,
    color:        MILESTONE_COLORS[ID_TO_KEY[data.id]] || '#6b7280',
  }
}

/**
 * Update the subject and/or HTML of the active template version in SendGrid.
 */
async function updateTemplate(templateId, { subject, htmlContent }) {
  const current = await getTemplateContent(templateId)
  await sgFetch(`/templates/${templateId}/versions/${current.versionId}`, 'PATCH', {
    subject:      subject      ?? current.subject,
    html_content: htmlContent  ?? current.htmlContent,
    active:       1,
  })
  return { success: true }
}

module.exports = { listTemplates, getTemplateContent, updateTemplate }
