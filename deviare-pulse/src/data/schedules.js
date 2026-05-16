export const MILESTONE_TYPES = [
  { key: 'activation', label: 'Course Activation',  color: '#1D4ED8' },
  { key: 'osl',        label: 'OSL Target (≥ 85%)', color: '#166534' },
  { key: 'lvc',        label: 'LVC Attendance',      color: '#9A3412' },
  { key: 'assessment', label: 'Assessment Deadline', color: '#5B21B6' },
  { key: 'project',    label: 'Project Submission',  color: '#9F1239' },
  { key: 'completion', label: 'Course Completion',   color: '#0F766E' },
]

export const FREQ_OPTIONS = ['Daily', 'Every 2 days', 'Weekly']

export const POST_OPTIONS = [
  'No post-deadline reminders',
  '3 reminders after deadline',
  '5 reminders after deadline',
  'Daily for 7 days after deadline',
]

export const AVAILABLE_PROJECTS = [
  'Microsoft 25 · Data Analyst 2022',
  'Microsoft 25 · .NET Programming 2022',
  'Microsoft 25 · PowerBI 2022',
  'MS Fundamentals · Aug 2022',
]

export const AVAILABLE_COURSES = [
  'Microsoft Azure Fundamentals',
  'Data Analytics with Python',
  'PowerBI for Business Intelligence',
  'Microsoft .NET Programming',
  'Cybersecurity Essentials',
  'Cloud Architecture Fundamentals',
  '.NET Programming',
  'Data Analytics Foundations',
  'Power BI',
  'SQL Fundamentals',
  'Python for Data Science',
  'Microsoft 365',
]

// Single example schedule shown on first load (before any user-created schedules)
export const DEMO_SCHEDULE = {
  id: 'demo-s1',
  name: '.NET Programming — Sep 2022',
  client: 'Microsoft',
  project: 'Microsoft 25 · .NET Programming 2022',
  cohort: 'NET-SEP22',
  courses: ['Microsoft .NET Programming'],
  status: 'Active',
  startDate: '2022-09-01',
  endDate: '2022-10-01',
  updatedAt: '2022-08-28',
  learnersCount: 26,
  overallProgress: 75,
  currentMilestone: { label: 'LVC', variant: 'info' },
  isDemo: true,
  automationLog: [
    { id: 'al1', type: 'success', title: 'Batch reminder triggered', desc: '14 OSL reminders dispatched', time: '2022-10-15 09:00' },
    { id: 'al2', type: 'info',    title: 'LVC window opened',        desc: 'Reminder window active for cohort NET-SEP22', time: '2022-10-12 08:00' },
    { id: 'al3', type: 'warning', title: 'Deadline override applied', desc: 'Project deadline extended by 5 days', time: '2022-10-10 14:30' },
    { id: 'al4', type: 'success', title: 'Certificate auto-sent',    desc: '3 learners received completion emails', time: '2022-10-08 17:00' },
  ],
  milestones: [
    { key: 'activation', dueDate: '2022-09-04', windowStart: 3,  frequency: 'Daily',        postDeadline: 'Daily for 7 days after deadline' },
    { key: 'osl',        dueDate: '2022-09-15', windowStart: 14, frequency: 'Every 2 days', postDeadline: '5 reminders after deadline',
      thresholds: [
        { pct: 50, dueDate: '2022-09-10', windowStart: 7,  frequency: 'Every 2 days', postDeadline: '3 reminders after deadline' },
        { pct: 85, dueDate: '2022-09-15', windowStart: 14, frequency: 'Every 2 days', postDeadline: '5 reminders after deadline' },
      ],
    },
    { key: 'lvc',        dueDate: '2022-09-22', windowStart: 10, frequency: 'Weekly',       postDeadline: '3 reminders after deadline',
      thresholds: [
        { pct: 50, dueDate: '2022-09-18', windowStart: 7,  frequency: 'Weekly', postDeadline: '3 reminders after deadline' },
        { pct: 80, dueDate: '2022-09-22', windowStart: 10, frequency: 'Weekly', postDeadline: '3 reminders after deadline' },
      ],
    },
    { key: 'assessment', dueDate: '2022-09-26', windowStart: 7, frequency: 'Every 2 days', postDeadline: '3 reminders after deadline' },
    { key: 'project',    dueDate: '2022-09-29', windowStart: 7, frequency: 'Daily',        postDeadline: '5 reminders after deadline' },
    { key: 'completion', dueDate: '2022-10-01', windowStart: 7, frequency: 'Every 2 days', postDeadline: 'No post-deadline reminders' },
  ],
}

export const SCHEDULES = [
  {
    id: 's1',
    name: '.NET Programming — Sep 2022',
    client: 'Microsoft',
    project: 'Microsoft 25 · .NET Programming 2022',
    cohort: 'NET-SEP22',
    courses: ['Microsoft .NET Programming'],
    status: 'Active',
    startDate: '2022-09-01',
    endDate: '2022-10-01',
    updatedAt: '2022-08-28',
    learnersCount: 26,
    overallProgress: 75,
    currentMilestone: { label: 'LVC', variant: 'info' },
    milestones: [
      { key: 'activation', dueDate: '2022-09-04', windowStart: 3,  frequency: 'Daily',        postDeadline: 'Daily for 7 days after deadline' },
      { key: 'osl',        dueDate: '2022-09-15', windowStart: 14, frequency: 'Every 2 days', postDeadline: '5 reminders after deadline',
        thresholds: [
          { pct: 50, dueDate: '2022-09-10', windowStart: 7,  frequency: 'Every 2 days', postDeadline: '3 reminders after deadline' },
          { pct: 85, dueDate: '2022-09-15', windowStart: 14, frequency: 'Every 2 days', postDeadline: '5 reminders after deadline' },
        ],
      },
      { key: 'lvc',        dueDate: '2022-09-22', windowStart: 10, frequency: 'Weekly',       postDeadline: '3 reminders after deadline',
        thresholds: [
          { pct: 50, dueDate: '2022-09-18', windowStart: 7,  frequency: 'Weekly', postDeadline: '3 reminders after deadline' },
          { pct: 80, dueDate: '2022-09-22', windowStart: 10, frequency: 'Weekly', postDeadline: '3 reminders after deadline' },
        ],
      },
      { key: 'assessment', dueDate: '2022-09-26', windowStart: 7, frequency: 'Every 2 days', postDeadline: '3 reminders after deadline' },
      { key: 'project',    dueDate: '2022-09-29', windowStart: 7, frequency: 'Daily',        postDeadline: '5 reminders after deadline' },
      { key: 'completion', dueDate: '2022-10-01', windowStart: 7, frequency: 'Every 2 days', postDeadline: 'No post-deadline reminders' },
    ],
  },
  {
    id: 's2',
    name: 'Data Analyst — Sep 2022',
    client: 'Microsoft',
    project: 'Microsoft 25 · Data Analyst 2022',
    cohort: 'DA-SEP22',
    courses: ['Data Analytics with Python'],
    status: 'Active',
    startDate: '2022-09-05',
    endDate: '2022-10-20',
    updatedAt: '2022-09-02',
    learnersCount: 18,
    overallProgress: 62,
    currentMilestone: { label: 'OSL', variant: 'warning' },
    milestones: [
      { key: 'activation', dueDate: '2022-09-10', windowStart: 5,  frequency: 'Daily',        postDeadline: 'Daily for 7 days after deadline' },
      { key: 'osl',        dueDate: '2022-09-25', windowStart: 14, frequency: 'Every 2 days', postDeadline: '5 reminders after deadline',
        thresholds: [
          { pct: 50, dueDate: '2022-09-18', windowStart: 7,  frequency: 'Every 2 days', postDeadline: '3 reminders after deadline' },
          { pct: 85, dueDate: '2022-09-25', windowStart: 14, frequency: 'Every 2 days', postDeadline: '5 reminders after deadline' },
        ],
      },
      { key: 'lvc',        dueDate: '2022-10-05', windowStart: 10, frequency: 'Weekly',       postDeadline: '3 reminders after deadline',
        thresholds: [
          { pct: 50, dueDate: '2022-10-01', windowStart: 7,  frequency: 'Weekly', postDeadline: '3 reminders after deadline' },
          { pct: 80, dueDate: '2022-10-05', windowStart: 10, frequency: 'Weekly', postDeadline: '3 reminders after deadline' },
        ],
      },
      { key: 'assessment', dueDate: '2022-10-13', windowStart: 7, frequency: 'Every 2 days', postDeadline: '3 reminders after deadline' },
      { key: 'project',    dueDate: '2022-10-17', windowStart: 7, frequency: 'Daily',        postDeadline: '5 reminders after deadline' },
      { key: 'completion', dueDate: '2022-10-20', windowStart: 7, frequency: 'Every 2 days', postDeadline: 'No post-deadline reminders' },
    ],
  },
  {
    id: 's3',
    name: 'PowerBI — Sep 2022',
    client: 'Microsoft',
    project: 'Microsoft 25 · PowerBI 2022',
    cohort: 'PBI-SEP22',
    courses: ['PowerBI for Business Intelligence'],
    status: 'Active',
    startDate: '2022-09-01',
    endDate: '2022-10-01',
    updatedAt: '2022-08-30',
    learnersCount: 22,
    overallProgress: 48,
    currentMilestone: { label: 'OSL', variant: 'danger' },
    milestones: [
      { key: 'activation', dueDate: '2022-09-04', windowStart: 3,  frequency: 'Daily',        postDeadline: 'Daily for 7 days after deadline' },
      { key: 'osl',        dueDate: '2022-09-14', windowStart: 11, frequency: 'Every 2 days', postDeadline: '5 reminders after deadline',
        thresholds: [
          { pct: 50, dueDate: '2022-09-09', windowStart: 7,  frequency: 'Every 2 days', postDeadline: '3 reminders after deadline' },
          { pct: 85, dueDate: '2022-09-14', windowStart: 11, frequency: 'Every 2 days', postDeadline: '5 reminders after deadline' },
        ],
      },
      { key: 'lvc',        dueDate: '2022-09-21', windowStart: 8,  frequency: 'Weekly',       postDeadline: '3 reminders after deadline',
        thresholds: [
          { pct: 50, dueDate: '2022-09-17', windowStart: 5,  frequency: 'Weekly', postDeadline: '3 reminders after deadline' },
          { pct: 80, dueDate: '2022-09-21', windowStart: 8,  frequency: 'Weekly', postDeadline: '3 reminders after deadline' },
        ],
      },
      { key: 'assessment', dueDate: '2022-09-26', windowStart: 5, frequency: 'Every 2 days', postDeadline: '3 reminders after deadline' },
      { key: 'project',    dueDate: '2022-09-29', windowStart: 5, frequency: 'Daily',        postDeadline: '5 reminders after deadline' },
      { key: 'completion', dueDate: '2022-10-01', windowStart: 5, frequency: 'Every 2 days', postDeadline: 'No post-deadline reminders' },
    ],
  },
]

export const AUTOMATION_LOG = [
  { id: 'al1', type: 'success', title: 'Batch reminder triggered', desc: '14 OSL reminders dispatched', time: '2022-10-15 09:00' },
  { id: 'al2', type: 'info',    title: 'LVC window opened',        desc: 'Reminder window active for cohort NET-SEP22', time: '2022-10-12 08:00' },
  { id: 'al3', type: 'warning', title: 'Deadline override applied', desc: 'Project deadline extended by 5 days', time: '2022-10-10 14:30' },
  { id: 'al4', type: 'success', title: 'Certificate auto-sent',    desc: '3 learners received completion emails', time: '2022-10-08 17:00' },
]
