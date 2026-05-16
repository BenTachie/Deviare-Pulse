const { body, validationResult } = require('express-validator')

/** Validation rules for POST /send-reminder */
const sendReminderRules = [
  body('recipientEmail').isEmail().withMessage('recipientEmail must be a valid email'),

  // milestoneKey is the canonical field; templateKey is accepted as a backward-compat alias
  body('milestoneKey').optional().isString(),
  body('templateKey').optional().isString(),

  // Learner context used by the backend resolver to find the matching schedule
  body('clientName').optional().isString(),
  body('projectName').optional().isString(),
  body('courseName').optional().isString(),
  body('cohort').optional().isString(),

  // subject / bodyHtml are optional overrides; backend uses stored template when absent
  body('subject').optional().isString(),
  body('bodyHtml').optional().isString(),

  body('variables').optional().isObject(),
]

/** Validation rules for POST /send-reminders (bulk) */
const sendBulkRules = [
  body('recipients').isArray({ min: 1 }).withMessage('recipients must be a non-empty array'),
  body('recipients.*.email').isEmail().withMessage('each recipient must have a valid email'),

  // Learner context per recipient — used by the resolver
  body('recipients.*.clientName').optional().isString(),
  body('recipients.*.projectName').optional().isString(),
  body('recipients.*.courseName').optional().isString(),
  body('recipients.*.cohort').optional().isString(),

  body('templateKey').notEmpty().withMessage('templateKey is required'),
  body('subject').optional().isString(),
  body('bodyHtml').optional().isString(),
  body('additionalNote').optional().isString(),
]

/** Middleware that returns 422 if any rule failed */
function validate(req, res, next) {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() })
  }
  next()
}

module.exports = { sendReminderRules, sendBulkRules, validate }
