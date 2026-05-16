export function computeDashboardStats(learners) {
  const total = learners.length
  if (total === 0) return {
    totalLearners: 0, enrolledThisMonth: 0, activeSchedules: 0,
    activeCohorts:  0, atRisk: 0,           pendingReminders: 0,
  }

  const atRisk  = learners.filter((l) => l.status === 'At Risk').length
  const cohorts = new Set(learners.map((l) => l.cohort).filter(Boolean))
  return {
    totalLearners:     total,
    enrolledThisMonth: 0,
    activeSchedules:   3,
    activeCohorts:     cohorts.size,
    atRisk,
    pendingReminders:  7,
  }
}

export function computeMilestoneFunnel(learners) {
  const total = learners.length
  if (total === 0) return []

  const pct = (n) => Math.round((n / total) * 100)

  const osl85    = learners.filter((l) => l.oslProgress >= 85).length
  const lvc80    = learners.filter((l) => l.lvcProgress >= 80).length
  const assessed = learners.filter((l) => l.testScore !== null && l.testScore >= 50).length
  const projPass = learners.filter((l) => l.projectResult === 'Passed').length
  const certified = learners.filter((l) => l.status === 'Certified').length

  return [
    { stage: 'Course Activated',  count: total,     pct: 100,          color: '#1D4ED8' },
    { stage: 'OSL ≥ 85%',         count: osl85,     pct: pct(osl85),   color: '#15803D' },
    { stage: 'LVC ≥ 80%',         count: lvc80,     pct: pct(lvc80),   color: '#C2410C' },
    { stage: 'Assessment Passed', count: assessed,   pct: pct(assessed),  color: '#7C3AED' },
    { stage: 'Project Passed',    count: projPass,   pct: pct(projPass),  color: '#BE123C' },
    { stage: 'Certified',         count: certified,  pct: pct(certified), color: '#0D9488' },
  ]
}

export function computeReportStats(learners) {
  const total     = learners.length
  const withOsl   = learners.filter((l) => l.oslProgress > 0)
  const withLvc   = learners.filter((l) => l.lvcProgress > 0)
  const withScore = learners.filter((l) => l.testScore !== null)

  const avg = (arr, key) =>
    arr.length ? Math.round(arr.reduce((s, l) => s + l[key], 0) / arr.length) : 0

  const avgOsl    = avg(withOsl, 'oslProgress')
  const avgLvc    = avg(withLvc, 'lvcProgress')
  const passRate  = withScore.length
    ? Math.round((withScore.filter((l) => l.testScore >= 50).length / withScore.length) * 100)
    : 0
  const certYield = total
    ? Math.round((learners.filter((l) => l.status === 'Certified').length / total) * 100)
    : 0

  const superActiveCount = learners.filter((l) => l.activityLevel === 'Super Active').length
  const superActivePct   = total ? Math.round((superActiveCount / total) * 100) : 0
  const passivePct       = total ? 100 - superActivePct : 0

  // Score buckets: <50, 50–60, 60–70, 70–80, 80–90, 90–100
  const buckets = [0, 0, 0, 0, 0]
  withScore.forEach((l) => {
    const s = l.testScore
    if (s >= 90)      buckets[4]++
    else if (s >= 80) buckets[3]++
    else if (s >= 70) buckets[2]++
    else if (s >= 60) buckets[1]++
    else              buckets[0]++
  })

  return { avgOsl, avgLvc, passRate, certYield, superActivePct, passivePct, scoreBuckets: buckets }
}
