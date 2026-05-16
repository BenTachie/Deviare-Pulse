import { useState, useEffect, useRef } from 'react'
import Modal from '../ui/Modal'
import { useToast } from '../context/ToastContext'
import {
  REMINDER_TEMPLATES,
  getMilestoneKey,
  substituteVars,
  MILESTONE_LABELS,
  TEMPLATE_VARS,
} from '../../data/reminderTemplates'
import { sendReminder, sendReminders } from '../../services/emailApi'
import styles from './Modals.module.css'

/**
 * SendReminderModal — individual or bulk reminder preview.
 *
 * Props:
 *   preselectedLearner  – single learner object (Remind button on a row)
 *   preselectedLearners – array of learner objects (Remind All with selection)
 */
export default function SendReminderModal({ onClose, preselectedLearner, preselectedLearners }) {
  const { showToast } = useToast()

  const isBulk         = !preselectedLearner && Array.isArray(preselectedLearners) && preselectedLearners.length > 0
  const primaryLearner = preselectedLearner ?? preselectedLearners?.[0] ?? null

  const defaultKey = primaryLearner ? getMilestoneKey(primaryLearner) : REMINDER_TEMPLATES[0].key
  const [templateKey, setTemplateKey] = useState(defaultKey)
  const [subject, setSubject]         = useState('')
  const [sending, setSending]         = useState(false)
  const [sent, setSent]               = useState(false)
  const [apiError, setApiError]       = useState(null)

  const msgRef = useRef(null)

  /* ── Apply template content whenever key changes ── */
  useEffect(() => {
    const tpl           = REMINDER_TEMPLATES.find((t) => t.key === templateKey) ?? REMINDER_TEMPLATES[0]
    const milestoneLabel = MILESTONE_LABELS[templateKey] ?? ''
    const subst          = !isBulk && primaryLearner
      ? (str) => substituteVars(str, primaryLearner, milestoneLabel)
      : (str) => str

    setSubject(subst(tpl.subject))
    if (msgRef.current) msgRef.current.innerHTML = subst(tpl.body)
    setApiError(null)
  }, [templateKey]) // primaryLearner and isBulk are stable over modal lifetime

  /* ── Formatting commands ── */
  const execCmd = (cmd) => { msgRef.current?.focus(); document.execCommand(cmd, false) }

  const handleReset = () => {
    const tpl           = REMINDER_TEMPLATES.find((t) => t.key === templateKey) ?? REMINDER_TEMPLATES[0]
    const milestoneLabel = MILESTONE_LABELS[templateKey] ?? ''
    const subst          = !isBulk && primaryLearner
      ? (str) => substituteVars(str, primaryLearner, milestoneLabel)
      : (str) => str
    setSubject(subst(tpl.subject))
    if (msgRef.current) msgRef.current.innerHTML = subst(tpl.body)
    setApiError(null)
  }

  /* ── Send ── */
  const handleSend = async () => {
    if (sending || sent) return
    setApiError(null)
    setSending(true)

    const bodyHtml = msgRef.current?.innerHTML || ''

    try {
      if (isBulk) {
        const recipients = preselectedLearners
          .filter((l) => l.email)
          .map((l) => {
            const milestoneLabel = MILESTONE_LABELS[templateKey] ?? ''
            return {
              email: l.email,
              name:  l.name,
              variables: {
                LearnerName:     l.name?.split(' ')[0] || l.name || '',
                CourseName:      l.course || '',
                MilestoneName:   milestoneLabel,
                CurrentProgress: templateKey === 'lvc'
                  ? `${Math.round(l.lvcProgress ?? 0)}%`
                  : `${Math.round(l.oslProgress ?? 0)}%`,
                RequiredTarget:  templateKey === 'lvc' ? '80%' : '85%',
                DueDate:         l.completionDate || 'your programme deadline',
                DaysRemaining:   '7',
              },
            }
          })

        const result = await sendReminders({ recipients, templateKey, subject, bodyHtml })
        setSent(true)
        showToast(
          result.failed > 0
            ? `${result.sent} sent, ${result.failed} failed`
            : `${result.sent} reminder${result.sent !== 1 ? 's' : ''} sent`,
          result.failed > 0 ? 'warning' : 'success',
        )
      } else {
        if (!primaryLearner?.email) throw new Error('Learner has no email address on record')
        const milestoneLabel = MILESTONE_LABELS[templateKey] ?? ''
        await sendReminder({
          recipientEmail: primaryLearner.email,
          recipientName:  primaryLearner.name,
          templateKey,
          subject,
          bodyHtml,
          variables: {
            LearnerName:     primaryLearner.name?.split(' ')[0] || primaryLearner.name || '',
            CourseName:      primaryLearner.course || '',
            MilestoneName:   milestoneLabel,
            CurrentProgress: templateKey === 'lvc'
              ? `${Math.round(primaryLearner.lvcProgress ?? 0)}%`
              : `${Math.round(primaryLearner.oslProgress ?? 0)}%`,
            RequiredTarget:  templateKey === 'lvc' ? '80%' : '85%',
            DueDate:         primaryLearner.completionDate || 'your programme deadline',
            DaysRemaining:   '7',
          },
        })
        setSent(true)
        showToast(`Reminder sent to ${primaryLearner.name}`, 'success')
      }

      setTimeout(onClose, 900)
    } catch (err) {
      setApiError(err.message || 'Failed to send email. Please try again.')
    } finally {
      setSending(false)
    }
  }

  /* ── Derived display values ── */
  const milestoneLabel = MILESTONE_LABELS[templateKey] ?? '—'
  const recipientName  = isBulk
    ? `${preselectedLearners.length} learners selected`
    : primaryLearner?.name ?? '—'
  const recipientEmail = isBulk ? null : primaryLearner?.email ?? ''
  const courseName     = isBulk ? 'Multiple courses' : primaryLearner?.course ?? '—'

  const sendLabel = sent
    ? 'Sent!'
    : sending
    ? 'Sending…'
    : isBulk
    ? `Send to ${preselectedLearners.length} Learners`
    : 'Send Reminder'

  return (
    <Modal
      title="Send Reminder"
      subtitle="Preview and edit before sending"
      onClose={onClose}
      width={620}
      footer={
        <div className={styles.reminderFooter}>
          <button className={styles.cancelBtn} onClick={onClose} disabled={sending}>Cancel</button>
          <button
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={sending || sent}
          >
            {!sending && (
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                <path d="M17.5 2.5L2.5 9.17l5.83 2.5 2.5 5.83 6.67-15Z"
                  stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M8.33 11.67L17.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )}
            {sending && <span className={styles.sendingSpinner} />}
            {sendLabel}
          </button>
        </div>
      }
    >
      <div className={styles.reminderForm}>

        {/* ── Error banner ── */}
        {apiError && (
          <div className={styles.errorBanner}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 6v5M10 14h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {apiError}
          </div>
        )}

        {/* ── Recipient info card ── */}
        <div className={styles.infoCard}>
          <div className={styles.infoCol}>
            <div className={styles.infoLabel}>Recipient</div>
            <div className={styles.infoName}>{recipientName}</div>
            {recipientEmail && <div className={styles.infoEmail}>{recipientEmail}</div>}
          </div>

          <div className={styles.infoDivider} />

          <div className={styles.infoCol}>
            <div className={styles.infoLabel}>Course</div>
            <div className={styles.infoValue}>{courseName}</div>
          </div>

          <div className={styles.infoDivider} />

          <div className={styles.infoCol}>
            <div className={styles.infoLabel}>Milestone</div>
            <div className={styles.infoValue}>{milestoneLabel}</div>
          </div>
        </div>

        {/* ── Template selector ── */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Template</label>
          <select
            className={styles.fieldSelect}
            value={templateKey}
            onChange={(e) => setTemplateKey(e.target.value)}
            disabled={sending}
          >
            {REMINDER_TEMPLATES.map((t) => (
              <option key={t.key} value={t.key}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* ── Subject ── */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Subject</label>
          <input
            className={styles.fieldInput}
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={sending}
          />
        </div>

        {/* ── Message body ── */}
        <div className={styles.field}>
          <div className={styles.msgHeader}>
            <label className={styles.fieldLabel}>Message</label>
            <div className={styles.msgTools}>
              <button
                type="button"
                className={styles.msgToolBtn}
                onMouseDown={(e) => { e.preventDefault(); execCmd('bold') }}
                disabled={sending}
              >
                <strong>B</strong>
              </button>
              <button
                type="button"
                className={styles.msgToolBtn}
                onMouseDown={(e) => { e.preventDefault(); execCmd('italic') }}
                disabled={sending}
              >
                <em>I</em>
              </button>
              <button
                type="button"
                className={styles.msgToolBtnReset}
                onMouseDown={(e) => { e.preventDefault(); handleReset() }}
                disabled={sending}
              >
                Reset
              </button>
            </div>
          </div>
          <div
            ref={msgRef}
            className={`${styles.msgBody} ${sending ? styles.msgBodyDisabled : ''}`}
            contentEditable={!sending}
            suppressContentEditableWarning
          />
        </div>

        {/* ── Variable chips — shown in bulk mode ── */}
        {isBulk && (
          <div className={styles.variables}>
            <div className={styles.variablesLabel}>
              Placeholders are auto-personalized per learner on dispatch:
            </div>
            <div className={styles.variableChips}>
              {TEMPLATE_VARS.map((v) => (
                <span key={v} className={styles.varChip}>{v}</span>
              ))}
            </div>
          </div>
        )}

      </div>
    </Modal>
  )
}
