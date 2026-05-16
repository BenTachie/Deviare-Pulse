export function computeQueue(learners) {
  if (!learners || learners.length === 0) return []

  const items = []

  // Course not activated: zero OSL, zero LVC, no test score, not yet certified
  const notActivated = learners.filter(
    (l) => l.oslProgress === 0 && l.lvcProgress === 0 && l.testScore === null && l.status !== 'Certified'
  )
  if (notActivated.length > 0) {
    const preview = notActivated.slice(0, 2).map((l) => l.name).join(', ')
    const extra   = notActivated.length > 2 ? ` and ${notActivated.length - 2} others` : ''
    items.push({
      id: 'q-activation',
      type: 'warning',
      title: 'Course not activated',
      desc: `${preview}${extra} ${notActivated.length === 1 ? 'has' : 'have'} not activated their course.`,
      affectedLearners: notActivated,
    })
  }

  // OSL below 85% (exclude zero-progress / not-activated learners)
  const lowOsl = learners.filter((l) => l.oslProgress > 0 && l.oslProgress < 85)
  if (lowOsl.length > 0) {
    items.push({
      id: 'q-osl',
      type: 'info',
      title: 'OSL milestone',
      desc: `${lowOsl.length} learner${lowOsl.length !== 1 ? 's' : ''} ${lowOsl.length === 1 ? 'is' : 'are'} below 85% OSL completion target.`,
      affectedLearners: lowOsl,
    })
  }

  // LVC attendance below 80% (exclude zero-progress learners)
  const lowLvc = learners.filter((l) => l.lvcProgress > 0 && l.lvcProgress < 80)
  if (lowLvc.length > 0) {
    items.push({
      id: 'q-lvc',
      type: 'warning',
      title: 'LVC attendance low',
      desc: `${lowLvc.length} learner${lowLvc.length !== 1 ? 's' : ''} below 80% LVC attendance threshold.`,
      affectedLearners: lowLvc,
    })
  }

  // Assessment not yet submitted (has OSL progress but no test score and not certified)
  const noAssessment = learners.filter(
    (l) => l.testScore === null && l.status !== 'Certified' && l.oslProgress > 0
  )
  if (noAssessment.length > 0) {
    const preview = noAssessment.slice(0, 2).map((l) => l.name).join(', ')
    const extra   = noAssessment.length > 2 ? ` and ${noAssessment.length - 2} others` : ''
    items.push({
      id: 'q-assessment',
      type: 'info',
      title: 'Assessment pending',
      desc: `${preview}${extra} ${noAssessment.length === 1 ? 'has' : 'have'} not submitted the final assessment.`,
      affectedLearners: noAssessment,
    })
  }

  // Project overdue: has a test score but no passing project result, not certified
  const noProject = learners.filter(
    (l) =>
      l.testScore !== null &&
      (!l.projectResult || l.projectResult === 'Not Submitted' || l.projectResult === 'Failed') &&
      l.status !== 'Certified'
  )
  if (noProject.length > 0) {
    items.push({
      id: 'q-project',
      type: 'danger',
      title: 'Project overdue',
      desc: `${noProject.length} learner${noProject.length !== 1 ? 's' : ''} ${noProject.length === 1 ? 'has' : 'have'} a pending or failed project submission.`,
      affectedLearners: noProject,
    })
  }

  // Certified — positive milestone notification
  const certified = learners.filter((l) => l.status === 'Certified')
  if (certified.length > 0) {
    items.push({
      id: 'q-certified',
      type: 'success',
      title: 'Batch certified',
      desc: `${certified.length} learner${certified.length !== 1 ? 's' : ''} ${certified.length === 1 ? 'has' : 'have'} completed all requirements and been certified.`,
      affectedLearners: certified,
    })
  }

  return items
}

export function computeLog(learners) {
  if (!learners || learners.length === 0) return []

  const entries = []

  const certified = learners.filter((l) => l.status === 'Certified')
  if (certified.length > 0) {
    const l = certified[0]
    entries.push({ id: 'log-cert', type: 'success', text: `${l.name} certified in ${l.course}`, time: 'Recently' })
  }

  if (certified.length > 1) {
    entries.push({
      id: 'log-cert-batch',
      type: 'success',
      text: `${certified.length} learners have completed all requirements for certification`,
      time: 'Recently',
    })
  }

  const lowOsl = learners.filter((l) => l.oslProgress > 0 && l.oslProgress < 85)
  if (lowOsl.length > 0) {
    entries.push({ id: 'log-osl', type: 'info', text: `Reminder batch sent to ${lowOsl.length} learners (OSL)`, time: 'Recently' })
  }

  const notActivated = learners.filter(
    (l) => l.oslProgress === 0 && l.lvcProgress === 0 && l.testScore === null && l.status !== 'Certified'
  )
  if (notActivated.length > 0) {
    const l = notActivated[0]
    entries.push({ id: 'log-activation', type: 'warning', text: `${l.name} flagged — course not activated`, time: 'Recently' })
  }

  const lowLvc = learners.filter((l) => l.lvcProgress > 0 && l.lvcProgress < 80)
  if (lowLvc.length > 0) {
    entries.push({ id: 'log-lvc', type: 'warning', text: `${lowLvc.length} learners below 80% LVC threshold`, time: 'Recently' })
  }

  return entries
}
