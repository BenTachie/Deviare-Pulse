export const REMINDER_TEMPLATES = [
  {
    key: 'activation',
    name: 'Course Activation Reminder',
    color: '#1D4ED8',
    subject: 'Action Required: Please Activate Your Course — {{CourseName}}',
    body: `<p>Hello <strong>{{LearnerName}}</strong>,</p>
<p>Welcome to the <strong>{{CourseName}}</strong> programme. We're excited to have you on board.</p>
<p>Our records show that your course has not yet been activated. To begin your learning journey, please log in to the Deviare LMS and click the <strong>Play</strong> button to activate your course.</p>
<ul>
  <li>Activation deadline: <strong>{{DueDate}}</strong></li>
  <li>Days remaining: <strong>{{DaysRemaining}}</strong></li>
</ul>
<p>If you need assistance logging in or activating your course, please don't hesitate to reach out to your Customer Success Manager.</p>
<p>We look forward to supporting your success.</p>`,
  },
  {
    key: 'osl',
    name: 'OSL Progress Reminder',
    color: '#166534',
    subject: 'Progress Update: Your Online Self-Learning Completion — {{CourseName}}',
    body: `<p>Hello <strong>{{LearnerName}}</strong>,</p>
<p>We wanted to check in on your progress in <strong>{{CourseName}}</strong>.</p>
<p>Your current Online Self-Learning (OSL) completion is <strong>{{CurrentProgress}}</strong>. To stay on track for certification, you'll need to reach at least <strong>{{RequiredTarget}}</strong> by <strong>{{DueDate}}</strong>.</p>
<ul>
  <li>Current progress: <strong>{{CurrentProgress}}</strong></li>
  <li>Required target: <strong>{{RequiredTarget}}</strong></li>
  <li>Due date: <strong>{{DueDate}}</strong></li>
  <li>Days remaining: <strong>{{DaysRemaining}}</strong></li>
</ul>
<p>We encourage you to log in and continue watching the course videos at your earliest convenience. Every session counts toward your certification.</p>`,
  },
  {
    key: 'lvc',
    name: 'LVC Attendance Reminder',
    color: '#9A3412',
    subject: 'Reminder: Live Virtual Class Attendance — {{CourseName}}',
    body: `<p>Hello <strong>{{LearnerName}}</strong>,</p>
<p>This is a reminder about your <strong>Live Virtual Class (LVC)</strong> attendance for <strong>{{CourseName}}</strong>.</p>
<p>You are approaching the attendance requirement for your course. To receive your certification, you must attend a minimum of 80% of all scheduled LVC sessions.</p>
<ul>
  <li>Current attendance: <strong>{{CurrentProgress}}</strong></li>
  <li>Required attendance: <strong>{{RequiredTarget}}</strong></li>
  <li>Attendance deadline: <strong>{{DueDate}}</strong></li>
</ul>
<p>Please ensure you attend the remaining scheduled sessions. Your Webex or Zoom join link is available in the Deviare LMS under your course dashboard.</p>`,
  },
  {
    key: 'assessment',
    name: 'Assessment Submission Reminder',
    color: '#5B21B6',
    subject: 'Action Required: Assessment Submission Due — {{CourseName}}',
    body: `<p>Hello <strong>{{LearnerName}}</strong>,</p>
<p>Your assessment submission deadline for <strong>{{CourseName}}</strong> is approaching.</p>
<p>Please ensure you complete and submit your assessment before the deadline. Assessments that are not submitted on time may affect your eligibility for certification.</p>
<ul>
  <li>Milestone: <strong>{{MilestoneName}}</strong></li>
  <li>Submission deadline: <strong>{{DueDate}}</strong></li>
  <li>Days remaining: <strong>{{DaysRemaining}}</strong></li>
</ul>
<p>If you have any questions about the assessment criteria or submission process, please contact your Customer Success Manager immediately.</p>`,
  },
  {
    key: 'project',
    name: 'Project Submission Reminder',
    color: '#9F1239',
    subject: 'Urgent: Project Submission Deadline Approaching — {{CourseName}}',
    body: `<p>Hello <strong>{{LearnerName}}</strong>,</p>
<p>This is an important reminder that your <strong>Project Submission</strong> for <strong>{{CourseName}}</strong> is due soon.</p>
<p>Your project case study and virtual lab work must be submitted by the deadline below. Late submissions may not be accepted.</p>
<ul>
  <li>Project submission deadline: <strong>{{DueDate}}</strong></li>
  <li>Days remaining: <strong>{{DaysRemaining}}</strong></li>
</ul>
<p>Please log in to the Deviare LMS and navigate to the Project section to complete your submission. If you have already submitted, please disregard this message.</p>`,
  },
  {
    key: 'completion',
    name: 'Course Completion & Congratulations',
    color: '#0F766E',
    subject: 'Congratulations! You Have Completed {{CourseName}} 🎉',
    body: `<p>Hello <strong>{{LearnerName}}</strong>,</p>
<p>Congratulations! We are thrilled to inform you that you have successfully completed <strong>{{CourseName}}</strong>.</p>
<p>Your dedication and commitment throughout this programme have been outstanding. You have met all the requirements for certification.</p>
<p>Your completion certificate will be available in your Deviare LMS dashboard within 24 hours. We encourage you to share this achievement with your network.</p>
<p>Thank you for your hard work and commitment. We wish you all the best as you apply your new skills.</p>
<p>Well done — this is a great achievement!</p>`,
  },
]

export const MILESTONE_LABELS = {
  activation: 'Course Activation',
  osl:        'OSL Progress',
  lvc:        'LVC Attendance',
  assessment: 'Assessment',
  project:    'Project Submission',
  completion: 'Course Completion',
}

export const TEMPLATE_VARS = [
  '{{LearnerName}}',
  '{{CourseName}}',
  '{{MilestoneName}}',
  '{{CurrentProgress}}',
  '{{RequiredTarget}}',
  '{{DueDate}}',
  '{{DaysRemaining}}',
]

/** Pick the most relevant template key based on the learner's current state */
export function getMilestoneKey(learner) {
  if (learner.status === 'Certified')                                   return 'completion'
  if ((learner.oslProgress ?? 0) < 85)                                  return 'osl'
  if ((learner.lvcProgress ?? 0) < 80)                                  return 'lvc'
  if (learner.testScore === null)                                        return 'assessment'
  if (!learner.projectResult || learner.projectResult === 'Pending')    return 'project'
  return 'activation'
}

export const LMS_URL = 'https://platform.deviare.africa'

/**
 * Resolve a learner's milestone deadline from the loaded schedule list.
 * Matches learner.cohort → schedule.cohort → milestone.key.
 * Returns formatted dueDate string and daysRemaining count.
 */
export function getMilestoneDates(schedules, learner, milestoneKey) {
  let schedule = null

  if (Array.isArray(schedules) && learner) {
    // 1. Exact cohort match — new schedules store the raw cohort from the dataset
    schedule = schedules.find((s) => s.cohort && s.cohort === learner.cohort)

    // 2. Client + course match — older schedules stored client name as cohort
    if (!schedule && learner.clientName) {
      schedule = schedules.find((s) =>
        s.client === learner.clientName &&
        (!s.courses?.length || s.courses.some((c) => c === learner.course))
      )
    }

    // 3. Client-only fallback
    if (!schedule && learner.clientName) {
      schedule = schedules.find((s) => s.client === learner.clientName)
    }
  }

  const milestone = schedule?.milestones?.find((m) => m.key === milestoneKey)

  if (!milestone?.dueDate) {
    return {
      dueDate:       learner?.completionDate || 'your programme deadline',
      daysRemaining: '7',
    }
  }

  const due   = new Date(milestone.dueDate)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  due.setHours(0, 0, 0, 0)
  const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24))

  return {
    dueDate:       due.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    daysRemaining: diff > 0 ? String(diff) : '0',
  }
}

/**
 * Replace {{placeholders}} with real learner data.
 * Pass overrides.dueDate / overrides.daysRemaining to inject schedule-sourced dates.
 */
export function substituteVars(str, learner, milestoneLabel = '', overrides = {}) {
  const firstName = learner.name?.split(' ')[0] || learner.name || ''
  const map = {
    '{{LearnerName}}':     firstName,
    '{{CourseName}}':      learner.course || '',
    '{{MilestoneName}}':   milestoneLabel,
    '{{CurrentProgress}}': `${Math.round(learner.oslProgress ?? 0)}%`,
    '{{RequiredTarget}}':  '85%',
    '{{DueDate}}':         overrides.dueDate     ?? (learner?.completionDate || 'your programme deadline'),
    '{{DaysRemaining}}':   overrides.daysRemaining ?? '7',
    '{{LMSLoginUrl}}':     LMS_URL,
  }
  let result = str
  for (const [k, v] of Object.entries(map)) {
    result = result.replace(new RegExp(k.replace(/[{}]/g, '\\$&'), 'g'), v)
  }
  return result
}
