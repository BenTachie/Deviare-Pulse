const { body, validationResult } = require('express-validator')

/** Validation rules for POST /send-reminder */
const sendReminderRules = [
  body('recipientEmail').isEmail().withMessage('recipientEmail must be a valid email'),
  body('templateKey').optional().isString(),
  body('subject').notEmpty().withMessage('subject is required'),
  body('bodyHtml').notEmpty().withMessage('bodyHtml is required'),
  body('variables').optional().isObject(),
]

/** Validation rules for POST /send-reminders (bulk) */
const sendBulkRules = [
  body('recipients').isArray({ min: 1 }).withMessage('recipients must be a non-empty array'),
  body('recipients.*.email').isEmail().withMessage('each recipient must have a valid email'),
  body('templateKey').optional().isString(),
  body('subject').notEmpty().withMessage('subject is required'),
  body('bodyHtml').notEmpty().withMessage('bodyHtml is required'),
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
