const { Router } = require('express')
const ctrl = require('../controllers/emailController')
const { sendReminderRules, sendBulkRules, validate } = require('../middleware/validateRequest')

const router = Router()

router.get('/templates',      ctrl.getTemplates)
router.get('/templates/:key', ctrl.getTemplate)

router.post('/send-reminder',  sendReminderRules, validate, ctrl.sendReminder)
router.post('/send-reminders', sendBulkRules,     validate, ctrl.sendReminders)

router.get('/logs', ctrl.getLogs)

module.exports = router
