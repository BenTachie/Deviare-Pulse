export const NOTIFICATION_QUEUE = [
  { id: 'n1', type: 'warning', title: 'Course not activated',  desc: 'Alred Matsau has not activated their .NET Programming course.', time: '2h ago' },
  { id: 'n2', type: 'danger',  title: 'Project overdue',       desc: '2 learners have missed the project submission deadline.', time: '4h ago' },
  { id: 'n3', type: 'info',    title: 'OSL milestone',         desc: '11 learners are below 85% OSL completion target.', time: '6h ago' },
  { id: 'n4', type: 'success', title: 'Certificate unlocked',  desc: 'Rofhiwa Mukoma completed .NET Programming and earned a certificate.', time: '8h ago' },
  { id: 'n5', type: 'info',    title: 'LVC attendance low',    desc: '3 learners below 80% LVC attendance threshold.', time: '1d ago' },
  { id: 'n6', type: 'warning', title: 'Assessment pending',    desc: 'Karabo Malibe has not submitted the final assessment.', time: '1d ago' },
  { id: 'n7', type: 'success', title: 'Batch certified',       desc: '14 learners in MS Fundamentals cohort have been certified.', time: '2d ago' },
]

export const NOTIFICATION_LOG = [
  { id: 'a1', type: 'success', text: 'Nomfundo Nkuta passed final assessment', time: '10m ago' },
  { id: 'a2', type: 'info',    text: 'New upload: progress_oct2022.csv (26 records)', time: '1h ago' },
  { id: 'a3', type: 'warning', text: 'Alred Matsau flagged — course not activated', time: '2h ago' },
  { id: 'a4', type: 'success', text: 'Rofhiwa Mukoma certified in .NET Programming', time: '3h ago' },
  { id: 'a5', type: 'info',    text: 'Reminder batch sent to 11 learners (OSL)', time: '5h ago' },
]

export const DEFAULT_NOTIFICATION_TEMPLATES = [
  {
    id: 'TPL001',
    key: 'activation',
    name: 'Course Activation Reminder',
    color: '#1D4ED8',
    lastEdited: '2022-08-28',
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
    id: 'TPL002',
    key: 'osl',
    name: 'OSL Progress Reminder',
    color: '#166534',
    lastEdited: '2022-08-28',
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
    id: 'TPL003',
    key: 'lvc',
    name: 'LVC Attendance Reminder',
    color: '#9A3412',
    lastEdited: '2022-08-28',
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
    id: 'TPL004',
    key: 'assessment',
    name: 'Assessment Submission Reminder',
    color: '#5B21B6',
    lastEdited: '2022-08-28',
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
    id: 'TPL005',
    key: 'project',
    name: 'Project Submission Reminder',
    color: '#9F1239',
    lastEdited: '2022-08-28',
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
    id: 'TPL006',
    key: 'completion',
    name: 'Course Completion & Congratulations',
    color: '#0F766E',
    lastEdited: '2022-08-28',
    subject: 'Congratulations! You Have Completed {{CourseName}} 🎉',
    body: `<p>Hello <strong>{{LearnerName}}</strong>,</p>
<p>Congratulations! We are thrilled to inform you that you have successfully completed <strong>{{CourseName}}</strong>.</p>
<p>Your dedication and commitment throughout this programme have been outstanding. You have met all the requirements for certification.</p>
<p>Your completion certificate will be available in your Deviare LMS dashboard within 24 hours. We encourage you to share this achievement with your network.</p>
<p>Thank you for your hard work and commitment. We wish you all the best as you apply your new skills.</p>
<p>Well done — this is a great achievement!</p>`,
  },
]

export const NOTIFICATION_TEMPLATES = JSON.parse(JSON.stringify(DEFAULT_NOTIFICATION_TEMPLATES))

export const TEMPLATE_VARIABLES = [
  'LearnerName', 'CourseName', 'DueDate', 'DaysRemaining',
  'CurrentProgress', 'RequiredTarget', 'MilestoneName', 'LMSUrl', 'CSMName',
]

export const SAMPLE_PREVIEW_DATA = {
  '{{LearnerName}}':     'Amahle Dlamini',
  '{{CourseName}}':      '.NET Programming',
  '{{DueDate}}':         'October 30, 2022',
  '{{DaysRemaining}}':   '8',
  '{{CurrentProgress}}': '78%',
  '{{RequiredTarget}}':  '85%',
  '{{MilestoneName}}':   'Assessment Submission',
  '{{LMSUrl}}':          'https://lms.deviare.co.za',
  '{{CSMName}}':         'Sarah Adeyemi',
}
