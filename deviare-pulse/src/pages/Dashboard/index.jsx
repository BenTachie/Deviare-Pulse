import { useNavigate } from 'react-router-dom'
import CommandCard from './CommandCard'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useModal } from '../../components/context/ModalContext'
import { useApp } from '../../context/AppContext'
import { PROGRAM_HEALTH_ALERTS } from '../../data/learners'
import { SCHEDULES, MILESTONE_TYPES } from '../../data/schedules'
import styles from './Dashboard.module.css'

const DEMO_TODAY = new Date('2022-10-10')

/* ── Shared: info note shown at the bottom of empty-state cards ──── */
function EmptyNote({ children }) {
  return (
    <div className={styles.emptyNote}>
      <svg width="11" height="11" viewBox="0 0 20 20" fill="none" style={{ flexShrink: 0 }}>
        <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
        <path d="M10 6v4M10 13v1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      {children}
    </div>
  )
}

/* ── Health icon per key ─────────────────────────────────────────── */
function HealthIcon({ iconKey, color }) {
  if (iconKey === 'triangle')
    return (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
        <path d="M10 3L2 17h16L10 3z" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
        <path d="M10 8v4M10 14v1" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  if (iconKey === 'doc')
    return (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
        <path d="M6 2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" stroke={color} strokeWidth="1.5"/>
        <path d="M10 7v4M10 13v1" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  if (iconKey === 'calendar')
    return (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
        <rect x="2" y="4" width="16" height="14" rx="2" stroke={color} strokeWidth="1.5"/>
        <path d="M6 2v4M14 2v4M2 9h16" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    )
  if (iconKey === 'circleCheck')
    return (
      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
        <circle cx="10" cy="10" r="7" stroke={color} strokeWidth="1.5"/>
        <path d="M6.5 10l2.5 2.5 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    )
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7" stroke={color} strokeWidth="1.5"/>
      <path d="M7 10l2 2 4-4" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

/* ── Program Health ──────────────────────────────────────────────── */
function ProgramHealth({ hasData }) {
  const navigate = useNavigate()
  const alerts = PROGRAM_HEALTH_ALERTS.map((a) => ({
    ...a,
    count: hasData ? a.count : 0,
  }))

  return (
    <div>
      {alerts.map((h) => (
        <div
          key={h.id}
          className={`${styles.healthRow} ${!hasData ? styles.healthRowEmpty : ''}`}
          onClick={() => navigate(h.navTo)}
        >
          <div className={styles.healthIcon} style={{ background: h.bg }}>
            <HealthIcon iconKey={h.iconKey} color={hasData ? h.countColor : 'var(--text-muted)'} />
          </div>
          <div className={styles.healthText}>
            <div className={styles.healthTitle}>{h.title}</div>
            <div className={styles.healthSub}>{h.sub}</div>
          </div>
          <div
            className={styles.healthCount}
            style={{ color: hasData ? h.countColor : 'var(--text-muted)' }}
          >
            {h.count}
          </div>
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" className={styles.healthChevron}>
            <path d="M7 5l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      ))}
      {!hasData && (
        <EmptyNote>Counts will update automatically once a dataset is uploaded</EmptyNote>
      )}
    </div>
  )
}

/* ── Milestone Funnel ────────────────────────────────────────────── */
function MilestoneFunnel({ hasData }) {
  const { milestoneFunnel } = useApp()
  return (
    <div className={styles.funnelList}>
      {milestoneFunnel.map((step) => (
        <div key={step.stage}>
          <div className={styles.funnelRow}>
            <div className={styles.funnelLabelWrap}>
              <span className={styles.funnelDot} style={{ background: hasData ? step.color : 'var(--border)' }} />
              <span className={styles.funnelLabel}>{step.stage}</span>
            </div>
            <div className={styles.funnelRight}>
              <span
                className={styles.funnelCount}
                style={{ color: hasData ? step.color : 'var(--text-muted)' }}
              >
                {step.count}
              </span>
              <span className={styles.funnelPct}>{step.pct}%</span>
            </div>
          </div>
          <div className={styles.funnelBarWrap}>
            {hasData
              ? <div className={styles.funnelBarFill} style={{ width: `${step.pct}%`, background: step.color }} />
              : <div className={styles.funnelBarEmpty} />
            }
          </div>
        </div>
      ))}
      {!hasData && (
        <EmptyNote>Upload a dataset to see learner progression across milestones</EmptyNote>
      )}
    </div>
  )
}

/* ── At-Risk Learners ────────────────────────────────────────────── */
function AtRiskList({ hasData }) {
  const navigate = useNavigate()
  const { openModal } = useModal()
  const { learners } = useApp()

  if (!hasData) {
    return (
      <div>
        <div className={`${styles.riskRow} ${styles.demoEntry}`}>
          <div className={styles.riskAvatar} style={{ background: '#94a3b8' }}>DL</div>
          <div className={styles.riskInfo}>
            <div className={styles.riskName}>
              Demo Learner
              <span className={styles.demoBadge}>SAMPLE</span>
            </div>
            <div className={styles.riskSub}>.NET Programming</div>
          </div>
          <div className={styles.riskProgress}>
            <div className={styles.riskBarRow}>
              <div className={styles.riskBarWrap}>
                <div className={styles.riskBarFill} style={{ width: '0%', background: '#D63C3C' }} />
              </div>
              <span className={styles.riskPct} style={{ color: 'var(--text-muted)' }}>0%</span>
            </div>
            <div className={styles.riskPctLabel}>OSL</div>
          </div>
          <button className={styles.remindBtn} disabled>
            <svg width="10" height="10" viewBox="0 0 20 20" fill="none">
              <path d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15h14a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            Remind
          </button>
        </div>
        <EmptyNote>Upload a dataset to identify learners falling behind on milestones</EmptyNote>
      </div>
    )
  }

  const atRisk = learners.filter((l) => l.status !== 'Certified' || l.oslProgress < 85).slice(0, 6)
  return (
    <div>
      {atRisk.map((l) => {
        const pct = Math.round(l.oslProgress)
        const barColor = pct >= 85 ? '#0CA678' : pct >= 50 ? '#E8890C' : '#D63C3C'
        return (
          <div key={l.id} className={styles.riskRow} onClick={() => navigate('/learners')}>
            <div className={styles.riskAvatar} style={{ background: l.avatarColor }}>
              {l.initials}
            </div>
            <div className={styles.riskInfo}>
              <div className={styles.riskName}>{l.name}</div>
              <div className={styles.riskSub}>{l.course}</div>
            </div>
            <div className={styles.riskProgress}>
              <div className={styles.riskBarRow}>
                <div className={styles.riskBarWrap}>
                  <div className={styles.riskBarFill} style={{ width: `${pct}%`, background: barColor }} />
                </div>
                <span className={styles.riskPct} style={{ color: barColor }}>{pct}%</span>
              </div>
              <div className={styles.riskPctLabel}>OSL</div>
            </div>
            <button
              className={styles.remindBtn}
              onClick={(e) => { e.stopPropagation(); openModal('send-reminders') }}
            >
              <svg width="10" height="10" viewBox="0 0 20 20" fill="none">
                <path d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15h14a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" stroke="currentColor" strokeWidth="1.5"/>
              </svg>
              Remind
            </button>
          </div>
        )
      })}
    </div>
  )
}

/* ── Schedule Snapshot ───────────────────────────────────────────── */
function ScheduleSnapshot({ hasData }) {
  const navigate = useNavigate()

  if (!hasData) {
    return (
      <div>
        <div className={`${styles.schedRow} ${styles.demoEntry}`}>
          <div className={styles.schedIcon} style={{ background: 'var(--info-bg)' }}>
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="3" width="16" height="15" rx="2" stroke="var(--info)" strokeWidth="1.5"/>
              <path d="M6 1v4M14 1v4M2 8h16" stroke="var(--info)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className={styles.schedInfo}>
            <div className={styles.schedName}>
              Microsoft · .NET Programming
              <span className={styles.demoBadge}>SAMPLE</span>
            </div>
            <div className={styles.schedSub}>Microsoft .NET Programming</div>
          </div>
          <div className={styles.schedProg}>
            <div className={styles.schedBarRow}>
              <div className={styles.schedBarWrap}>
                <div className={styles.schedBarFill} style={{ width: '0%', background: '#2D7DD2' }} />
              </div>
              <span className={styles.schedPct} style={{ color: 'var(--text-muted)' }}>0%</span>
            </div>
            <span className={styles.schedMilestone} style={{ background: '#1D4ED818', color: '#1D4ED8' }}>
              Activation · 09/04
            </span>
          </div>
        </div>
        <EmptyNote>Set up a training schedule to track program timelines here</EmptyNote>
      </div>
    )
  }

  const rows = SCHEDULES.map((s) => {
    const start   = new Date(s.startDate)
    const end     = s.endDate ? new Date(s.endDate) : new Date(start.getTime() + 30 * 86400000)
    const totalMs = end - start
    const elapsed = Math.min(DEMO_TODAY - start, totalMs)
    const pct     = Math.max(0, Math.min(100, Math.round((elapsed / totalMs) * 100)))
    const barColor = pct >= 80 ? '#0CA678' : pct >= 50 ? '#E8890C' : '#2D7DD2'

    const upcoming = s.milestones
      .filter((m) => new Date(m.dueDate) >= DEMO_TODAY)
      .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0]
    const nextMt = upcoming ? MILESTONE_TYPES.find((t) => t.key === upcoming.key) : null

    const courseList = s.courses?.length
      ? s.courses.slice(0, 2).join(', ') + (s.courses.length > 2 ? ` +${s.courses.length - 2}` : '')
      : s.cohort
    const clientPrefix = s.client ? `${s.client} · ` : ''
    const displayName  = s.name.split(' — ')[0] || s.name

    return { s, pct, barColor, upcoming, nextMt, courseList, clientPrefix, displayName }
  })

  return (
    <div>
      {rows.map(({ s, pct, barColor, upcoming, nextMt, courseList, clientPrefix, displayName }) => (
        <div key={s.id} className={styles.schedRow} onClick={() => navigate('/schedule')}>
          <div
            className={styles.schedIcon}
            style={{ background: s.status === 'Active' ? 'var(--info-bg)' : 'var(--surface)' }}
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="3" width="16" height="15" rx="2"
                stroke={s.status === 'Active' ? 'var(--info)' : 'var(--text-muted)'} strokeWidth="1.5"/>
              <path d="M6 1v4M14 1v4M2 8h16"
                stroke={s.status === 'Active' ? 'var(--info)' : 'var(--text-muted)'} strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <div className={styles.schedInfo}>
            <div className={styles.schedName}>{clientPrefix}{displayName}</div>
            <div className={styles.schedSub}>{courseList}</div>
          </div>
          <div className={styles.schedProg}>
            <div className={styles.schedBarRow}>
              <div className={styles.schedBarWrap}>
                <div className={styles.schedBarFill} style={{ width: `${pct}%`, background: barColor }} />
              </div>
              <span className={styles.schedPct} style={{ color: barColor }}>{pct}%</span>
            </div>
            {nextMt ? (
              <span
                className={styles.schedMilestone}
                style={{ background: `${nextMt.color}18`, color: nextMt.color }}
              >
                {nextMt.label.split(' ')[0]} · {upcoming.dueDate.slice(5).replace('-', '/')}
              </span>
            ) : (
              <span className={`${styles.schedMilestone} ${styles.schedMilestoneComplete}`}>
                Complete
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

/* ── Page ────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { dashboardStats, hasImportedData } = useApp()
  const s = dashboardStats
  const navigate = useNavigate()
  const hasData = hasImportedData

  return (
    <div className={styles.page}>

      {/* ── Row 1: Command Cards ── */}
      <div className={styles.cmdGrid}>
        <CommandCard
          label="Total Learners" value={s.totalLearners}
          sub={hasData ? `+${s.enrolledThisMonth} enrolled this month` : 'Upload data to populate'}
          accent="#2D7DD2" iconBg="#EAF3FF" navTo="/learners" navLabel="View all learners"
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="6" r="3.5" stroke="#2D7DD2" strokeWidth="1.5"/>
              <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="#2D7DD2" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          }
        />
        <CommandCard
          label="Active Schedules" value={s.activeSchedules}
          sub={hasData ? `Across ${s.activeCohorts} cohorts` : 'No schedules configured'}
          accent="#0CA678" iconBg="#E6F9F3" navTo="/schedule" navLabel="Manage schedules"
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <rect x="2" y="4" width="16" height="14" rx="2" stroke="#0CA678" strokeWidth="1.5"/>
              <path d="M6 2v4M14 2v4M2 9h16" stroke="#0CA678" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          }
        />
        <CommandCard
          label="At Risk" value={s.atRisk}
          sub={hasData ? 'Behind on milestones' : 'Upload data to identify'}
          accent="#E8890C" iconBg="#FFF4E0" navTo="/learners" navLabel="Review at-risk"
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 3L2 17h16L10 3z" stroke="#E8890C" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M10 8v4M10 14v1" stroke="#E8890C" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          }
        />
        <CommandCard
          label="Pending Reminders" value={s.pendingReminders}
          sub={hasData ? 'Awaiting dispatch' : 'No reminders queued'}
          accent="#D63C3C" iconBg="#FDEAEA" navTo="/notifications" navLabel="Send reminders"
          icon={
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15h14a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" stroke="#D63C3C" strokeWidth="1.5"/>
              <path d="M8 16a2 2 0 104 0" stroke="#D63C3C" strokeWidth="1.5"/>
            </svg>
          }
        />
      </div>

      {/* ── Row 2: Program Health + Milestone Funnel ── */}
      <div className={styles.twoCol}>
        <Card>
          <CardHeader title="Program Health" subtitle="Actionable alerts requiring CSM attention" />
          <ProgramHealth hasData={hasData} />
        </Card>
        <Card>
          <CardHeader title="Milestone Funnel" subtitle="Learners at each stage" />
          <CardBody>
            <MilestoneFunnel hasData={hasData} />
          </CardBody>
        </Card>
      </div>

      {/* ── Row 3: At-Risk + Schedule Snapshot ── */}
      <div className={styles.twoCol}>
        <Card>
          <CardHeader
            title="At-Risk Learners"
            subtitle="Behind on one or more milestones"
            action={<Button variant="secondary" size="sm" onClick={() => navigate('/learners')}>View all</Button>}
          />
          <AtRiskList hasData={hasData} />
        </Card>
        <Card>
          <CardHeader
            title="Schedule Snapshot"
            subtitle="Active training programs"
            action={<Button variant="secondary" size="sm" onClick={() => navigate('/schedule')}>Manage</Button>}
          />
          <ScheduleSnapshot hasData={hasData} />
        </Card>
      </div>

    </div>
  )
}
