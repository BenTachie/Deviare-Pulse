/**
 * Maps internal milestone keys to SendGrid Dynamic Template IDs.
 * Set each SENDGRID_TEMPLATE_ID_* variable in your .env file.
 * Any key left unset falls back to raw-HTML sending automatically.
 */
const TEMPLATE_IDS = {
  activation: process.env.SENDGRID_TEMPLATE_ID_activation || null,
  osl:        process.env.SENDGRID_TEMPLATE_ID_osl        || null,
  lvc:        process.env.SENDGRID_TEMPLATE_ID_lvc        || null,
  assessment: process.env.SENDGRID_TEMPLATE_ID_assessment || null,
  project:    process.env.SENDGRID_TEMPLATE_ID_project    || null,
  completion: process.env.SENDGRID_TEMPLATE_ID_completion || null,
}

function getTemplateId(key) {
  return TEMPLATE_IDS[key] || null
}

module.exports = { TEMPLATE_IDS, getTemplateId }
