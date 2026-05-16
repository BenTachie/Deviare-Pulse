import { useState, useMemo, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import { useToast } from '../../components/context/ToastContext'
import { useModal } from '../../components/context/ModalContext'
import { useApp } from '../../context/AppContext'
import { computeQueue, computeLog } from '../../utils/computeNotifications'
import styles from './Notifications.module.css'

function NotifDotIcon({ type }) {
  const colors = {
    warning: 'var(--warning, #e8890c)',
    danger:  'var(--danger,  #d63c3c)',
    info:    'var(--info,    #2d7dd2)',
    success: 'var(--success, #0ca678)',
  }
  const c = colors[type] ?? colors.info
  return (
    <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="7" fill={c} opacity="0.22" />
      <circle cx="10" cy="10" r="3" fill={c} />
    </svg>
  )
}

function TimelineDotIcon({ type }) {
  const colors = {
    warning: 'var(--warning)',
    danger:  'var(--danger)',
    info:    'var(--info)',
    success: 'var(--success)',
  }
  return (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
      <circle cx="10" cy="10" r="5" fill={colors[type] ?? colors.info} />
    </svg>
  )
}

/* ── Queue item ──────────────────────────────────────────────────── */
function QueueItem({ notif, onSend, onDismiss, isSent }) {
  return (
    <div className={`${styles.notifItem} ${isSent ? styles.notifItemSent : ''}`}>
      <div
        className={styles.notifIconWrap}
        style={{ background: `var(--${notif.type}-bg)` }}
      >
        <NotifDotIcon type={notif.type} />
      </div>

      <div className={styles.notifBody}>
        <div className={styles.notifTitle}>{notif.title}</div>
        <div className={styles.notifDesc}>{notif.desc}</div>
        {notif.affectedLearners?.length > 0 && (
          <div className={styles.notifTime}>
            {notif.affectedLearners.length} learner{notif.affectedLearners.length !== 1 ? 's' : ''} affected
          </div>
        )}
      </div>

      <div className={styles.notifActions}>
        {isSent ? (
          <span className={styles.sentLabel}>Sent ✓</span>
        ) : (
          <>
            <button className={styles.sendBtn} onClick={() => onSend(notif)}>Send</button>
            <button className={styles.dismissBtn} onClick={() => onDismiss(notif.id)}>Dismiss</button>
          </>
        )}
      </div>
    </div>
  )
}

/* ── Page ────────────────────────────────────────────────────────── */
export default function NotificationsPage() {
  const { showToast }        = useToast()
  const { openModal }        = useModal()
  const { learners, importedLearners } = useApp()

  const fullQueue = useMemo(() => computeQueue(learners), [learners])
  const log       = useMemo(() => computeLog(learners),   [learners])

  const [dismissedIds, setDismissedIds] = useState(new Set())
  const [sentIds,      setSentIds]      = useState(new Set())

  // Reset local state when the learner dataset changes
  useEffect(() => {
    setDismissedIds(new Set())
    setSentIds(new Set())
  }, [importedLearners])

  const visibleQueue   = fullQueue.filter((n) => !dismissedIds.has(n.id))
  const pendingCount   = visibleQueue.filter((n) => !sentIds.has(n.id)).length

  const dismiss = (id) => setDismissedIds((prev) => new Set([...prev, id]))

  const send = (notif) => {
    setSentIds((prev) => new Set([...prev, notif.id]))
    if (notif.affectedLearners?.length > 0) {
      openModal('send-reminder', { preselectedLearners: notif.affectedLearners })
    } else {
      showToast(`${notif.title} — reminder sent`, 'success')
    }
  }

  const dispatchAll = () => {
    const ids = new Set(visibleQueue.map((n) => n.id))
    setSentIds(ids)
    showToast(`All ${visibleQueue.length} notifications dispatched`, 'success')
  }

  const isEmpty = learners.length === 0

  return (
    <div className={styles.stack}>
      {/* ── Notification Queue ── */}
      <Card>
        <CardHeader
          title="Notification Queue"
          subtitle={isEmpty ? 'No data imported yet' : 'Pending automated reminders'}
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={dispatchAll}
              disabled={visibleQueue.length === 0 || pendingCount === 0}
            >
              Dispatch All ({pendingCount})
            </Button>
          }
        />
        <CardBody noPadding>
          {visibleQueue.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                {isEmpty ? (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 13h6M9 17h3M7 3H4a1 1 0 00-1 1v16a1 1 0 001 1h16a1 1 0 001-1V8l-5-5H7z"
                      stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M9 12l2 2 4-4" stroke="var(--success)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="12" cy="12" r="9" stroke="var(--success)" strokeWidth="1.5"/>
                  </svg>
                )}
              </div>
              <div className={styles.emptyTitle}>
                {isEmpty ? 'No data imported' : 'All clear!'}
              </div>
              <div className={styles.emptyDesc}>
                {isEmpty
                  ? 'Upload a dataset on the Upload page to see live notifications.'
                  : 'No pending notifications in the queue.'}
              </div>
            </div>
          ) : (
            <div className={styles.notifList}>
              {visibleQueue.map((n) => (
                <QueueItem
                  key={n.id}
                  notif={n}
                  isSent={sentIds.has(n.id)}
                  onSend={send}
                  onDismiss={dismiss}
                />
              ))}
            </div>
          )}
        </CardBody>
      </Card>

      {/* ── Notification Log ── */}
      <Card>
        <CardHeader title="Notification Log" subtitle="Recent automation activity" />
        <CardBody>
          {log.length === 0 ? (
            <div className={styles.emptyState} style={{ padding: '32px 24px' }}>
              <div className={styles.emptyDesc}>
                {isEmpty
                  ? 'Activity log will populate once data is imported.'
                  : 'No recent activity to display.'}
              </div>
            </div>
          ) : (
            <div className={styles.timeline}>
              {log.map((entry) => (
                <div key={entry.id} className={styles.timelineItem}>
                  <div
                    className={styles.timelineDot}
                    style={{ background: `var(--${entry.type}-bg)` }}
                  >
                    <TimelineDotIcon type={entry.type} />
                  </div>
                  <div className={styles.timelineContent}>
                    <div className={styles.timelineTitle}>{entry.text}</div>
                    <div className={styles.timelineTime}>{entry.time}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  )
}
