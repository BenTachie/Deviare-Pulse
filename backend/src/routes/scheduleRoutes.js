const { Router } = require('express')
const ctrl       = require('../controllers/scheduleController')

const router = Router()

router.get('/',          ctrl.getSchedules)
router.post('/sync',     ctrl.syncSchedules)
router.delete('/:id',    ctrl.removeSchedule)

module.exports = router
