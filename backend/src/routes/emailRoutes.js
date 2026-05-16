const { Router }   = require('express')
const rateLimit    = require('express-rate-limit')
const ctrl         = require('../controllers/emailController')
const { sendReminderRules, sendBulkRules, validate } = require('../middleware/validateRequest')

const router = Router()

/* 60 send requests per CSM per 15 minutes — blocks runaway loops, not normal use */
const sendLimiter = rateLimit({
  windowMs:        15 * 60 * 1000,
  max:             60,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Too many email requests. Please wait before sending more.' },
})

router.get('/templates',      ctrl.getTemplates)
router.get('/templates/:key', ctrl.getTemplate)

router.post('/send-reminder',  sendLimiter, sendReminderRules, validate, ctrl.sendReminder)
router.post('/send-reminders', sendLimiter, sendBulkRules,     validate, ctrl.sendReminders)

router.get('/logs', ctrl.getLogs)

/* ── SendGrid template management (proxied) ─────────────────────── */
router.get('/sg-templates',                   ctrl.getSgTemplates)
router.get('/sg-templates/:templateId/content', ctrl.getSgTemplateContent)
router.patch('/sg-templates/:templateId',     ctrl.updateSgTemplate)

module.exports = router
