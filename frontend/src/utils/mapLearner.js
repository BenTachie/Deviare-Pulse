const AVATAR_COLORS = [
  '#2D7DD2', '#0CA678', '#E8890C', '#7C3AED',
  '#D63C3C', '#00C2CB', '#1B4F8A', '#BE123C',
  '#0D9488', '#C2410C', '#15803D', '#1D4ED8',
]

function getInitials(name = '') {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase() || '??'
}

// Handles both 0-1 fractions and 0-100 percentages
function parseProgress(val) {
  if (val == null || val === '') return null
  const n = parseFloat(String(val).replace('%', '').trim())
  if (isNaN(n)) return null
  // If the value is a fraction (0–1), convert to percentage
  return n <= 1 && n >= 0 ? Math.round(n * 100) : Math.round(n)
}

function parseScore(val) {
  if (val == null || val === '') return null
  const n = parseFloat(String(val).replace('%', '').trim())
  if (isNaN(n) || n === 0) return null
  return n <= 1 ? Math.round(n * 100) : Math.round(n)
}

// Pick first non-empty value from a list of candidate keys
function pick(row, ...keys) {
  for (const k of keys) {
    const v = row[k]
    if (v != null && v !== '') return String(v).trim()
  }
  return ''
}

function deriveStatus(explicitStatus, osl, lvc) {
  const s = String(explicitStatus || '').toLowerCase().trim()
  if (s === 'certified') return 'Certified'
  if (s === 'not certified') return 'Not Certified'
  // No explicit status — derive from progress
  if ((osl !== null && osl < 50) || (lvc !== null && lvc < 40)) return 'At Risk'
  return 'In Progress'
}

function deriveMilestone(status, osl, lvc, testScore, projectResult) {
  if (status === 'Certified') {
    return { stage: 'Certificate', label: 'Certified', variant: 'success' }
  }
  if (osl === null || osl < 85) {
    const variant = (osl === null || osl < 50) ? 'danger' : 'warning'
    return { stage: 'OSL', label: 'OSL ≥ 85%', variant }
  }
  if (lvc === null || lvc < 80) {
    return { stage: 'LVC', label: 'LVC ≥ 80%', variant: 'info' }
  }
  if (testScore === null) {
    return { stage: 'Assessment', label: 'Assessment', variant: 'info' }
  }
  if (!projectResult || projectResult === 'Pending') {
    return { stage: 'Project', label: 'Project', variant: 'info' }
  }
  return { stage: 'Certificate', label: 'Certified', variant: 'success' }
}

function normalizeProjectResult(val) {
  if (!val) return null
  const v = String(val).toLowerCase().trim()
  if (v === 'pass' || v === 'passed') return 'Passed'
  if (v === 'fail' || v === 'failed') return 'Failed'
  if (v === 'pending') return 'Pending'
  return null
}

function normalizeActivity(val) {
  if (!val) return 'Passive'
  const v = String(val).toLowerCase().trim()
  if (v.includes('super') || v === 'active') return 'Super Active'
  return 'Passive'
}

function normalizeEmail(raw, index) {
  const s = String(raw || '').trim()
  if (!s) return `learner${index + 1}@example.com`
  return s.includes('@') ? s : `${s}@example.com`
}

export function mapRowToLearner(row, index) {
  // ── Column resolution: real file names first, legacy names as fallback ──
  const name    = pick(row, 'Full Name', 'user', 'name')
  const email   = normalizeEmail(pick(row, 'Email', 'Username', 'email'), index)
  const course  = pick(row, 'Course Name', 'course')
  const cohort  = pick(row, 'Project', 'cohort')
  const client  = pick(row, 'Client Name', 'client')

  // Progress values — real file uses 0-1 fractions; legacy uses 0-100
  const osl  = parseProgress(row.OSL  ?? row.self_learning)
  const lvc  = parseProgress(row.LVC  ?? row.live_class)

  // Test score — real file uses 0-1 (0 means not taken); legacy 0-100
  const testScore = parseScore(row.Test ?? row.course_score ?? row['Assessment Test'])

  // Project result — note the typo "Resullt" in the real file
  const projectResult = normalizeProjectResult(
    pick(row, 'Project Resullt', 'Project Result', 'Project Status')
  )

  const activityLevel  = normalizeActivity(row.activity_level)
  const completionDate = pick(row, 'completion_date') || null

  const explicitStatus = pick(row, 'Status', 'certification_status', 'completion_status')
  const status         = deriveStatus(explicitStatus, osl, lvc)
  const milestone      = deriveMilestone(status, osl, lvc, testScore, projectResult)

  // projectName: prefer "Client — Project", fall back to project/course
  const projectName = client && cohort
    ? `${client} — ${cohort}`
    : cohort || course

  return {
    id:               `imp-${index}-${Date.now()}`,
    name,
    email,
    initials:         getInitials(name),
    avatarColor:      AVATAR_COLORS[index % AVATAR_COLORS.length],
    course,
    projectName,
    cohort,
    clientName:       client,
    status,
    oslProgress:      osl  ?? 0,
    lvcProgress:      lvc  ?? 0,
    testScore,
    projectResult,
    currentMilestone: milestone,
    completionDate,
    activityLevel,
  }
}

export function mapSheetToLearners(rows) {
  return rows
    .filter((r) => r['Full Name'] || r.user || r.name)
    .map((r, i) => mapRowToLearner(r, i))
}
