import { useState, useEffect, useRef } from 'react'
import Modal from '../ui/Modal'
import { useToast } from '../context/ToastContext'
import { getMilestoneKey, substituteVars, MILESTONE_LABELS, TEMPLATE_VARS, LMS_URL } from '../../data/reminderTemplates'
import { sendReminder, sendReminders, fetchSgTemplates, fetchSgTemplateContent } from '../../services/emailApi'
import styles from './Modals.module.css'

const MILESTONE_ORDER = ['activation', 'osl', 'lvc', 'assessment', 'project', 'completion']

/**
 * Remove Handlebars block helpers ({{#if ...}}...{{/if}}) from template HTML
 * before injecting into the editor. Single sends have no block-helper context.
 */
function stripHandlebarsBlocks(html) {
  return html
    .replace(/\{\{#if\s+\w+\}\}[\s\S]*?\{\{\/if\}\}/g, '')
    .replace(/\{\{[#/][^}]+\}\}/g, '')
    .trim()
}

export default function SendReminderModal({ onClose, preselectedLearner, preselectedLearners }) {
  const { showToast } = useToast()

  const isBulk         = !preselectedLearner && Array.isArray(preselectedLearners) && preselectedLearners.length > 0
  const primaryLearner = preselectedLearner ?? preselectedLearners?.[0] ?? null

  const [templates,     setTemplates]     = useState([])          // [{id, name, milestoneKey}]
  const [templateKey,   setTemplateKey]   = useState(null)        // selected milestone key
  const [subject,       setSubject]       = useState('')
  const [loadingTpl,    setLoadingTpl]    = useState(true)
  const [sending,       setSending]       = useState(false)
  const [sent,          setSent]          = useState(false)
  const [apiError,      setApiError]      = useState(null)

  const msgRef = useRef(null)

  /* ── Load template list from SendGrid on mount ── */
  useEffect(() => {
    fetchSgTemplates()
      .then((tpls) => {
        const sorted = [...tpls].sort((a, b) =>
          MILESTONE_ORDER.indexOf(a.milestoneKey) - MILESTONE_ORDER.indexOf(b.milestoneKey)
        )
        setTemplates(sorted)
        const defaultKey = primaryLearner
          ? getMilestoneKey(primaryLearner)
          : (sorted[0]?.milestoneKey ?? 'activation')
        setTemplateKey(defaultKey)
      })
      .catch(() => setLoadingTpl(false))
  }, []) // eslint-disable-line

  /* ── Fetch and populate editor when templateKey changes ── */
  useEffect(() => {
    if (!templateKey || templates.length === 0) return

    const tpl = templates.find((t) => t.milestoneKey === templateKey)
    if (!tpl) return

    setLoadingTpl(true)
    setApiError(null)

    fetchSgTemplateContent(tpl.id)
      .then((content) => {
        const milestoneLabel = MILESTONE_LABELS[templateKey] ?? ''
        const subst = !isBulk && primaryLearner
          ? (str) => substituteVars(str, primaryLearner, milestoneLabel)
          : (str) => str

        setSubject(subst(content.subject))
        if (msgRef.current) msgRef.current.innerHTML = subst(stripHandlebarsBlocks(content.htmlContent))
      })
      .catch((err) => setApiError(`Could not load template: ${err.message}`))
      .finally(() => setLoadingTpl(false))
  }, [templateKey, templates]) // eslint-disable-line

  /* ── Formatting commands ── */
  const execCmd = (cmd) => { msgRef.current?.focus(); document.execCommand(cmd, false) }

  const handleReset = () => {
    const tpl = templates.find((t) => t.milestoneKey === templateKey)
    if (!tpl) return
    setLoadingTpl(true)
    fetchSgTemplateContent(tpl.id)
      .then((content) => {
        const milestoneLabel = MILESTONE_LABELS[templateKey] ?? ''
        const subst = !isBulk && primaryLearner
          ? (str) => substituteVars(str, primaryLearner, milestoneLabel)
          : (str) => str
        setSubject(subst(content.subject))
        if (msgRef.current) msgRef.current.innerHTML = subst(stripHandlebarsBlocks(content.htmlContent))
        setApiError(null)
      })
      .finally(() => setLoadingTpl(false))
  }

  /* ── Send ── */
  const handleSend = async () => {
    if (sending || sent || loadingTpl) return
    setApiError(null)
    setSending(true)

    const bodyHtml = msgRef.current?.innerHTML || ''

    try {
      if (isBulk) {
        const milestoneLabel = MILESTONE_LABELS[templateKey] ?? ''
        const recipients = preselectedLearners
          .filter((l) => l.email)
          .map((l) => ({
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
          }))

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
            LMSLoginUrl:     LMS_URL,
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
    : loadingTpl
    ? 'Loading…'
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
            disabled={sending || sent || loadingTpl}
          >
            {!sending && !loadingTpl && (
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                <path d="M17.5 2.5L2.5 9.17l5.83 2.5 2.5 5.83 6.67-15Z"
                  stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M8.33 11.67L17.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            )}
            {(sending || loadingTpl) && <span className={styles.sendingSpinner} />}
            {sendLabel}
          </button>
        </div>
      }
    >
      <div className={styles.reminderForm}>

        {/* Error banner */}
        {apiError && (
          <div className={styles.errorBanner}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 6v5M10 14h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {apiError}
          </div>
        )}

        {/* Recipient info card */}
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

        {/* Template selector — built from live SendGrid list */}
        <div className={styles.field}>
          <label className={styles.fieldLabel}>Template</label>
          <select
            className={styles.fieldSelect}
            value={templateKey ?? ''}
            onChange={(e) => setTemplateKey(e.target.value)}
            disabled={sending || templates.length === 0}
          >
            {templates.length === 0 && (
              <option value="">Loading templates…</option>
            )}
            {templates.map((t) => (
              <option key={t.milestoneKey} value={t.milestoneKey}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Subject */}
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

        {/* Message body */}
        <div className={styles.field}>
          <div className={styles.msgHeader}>
            <label className={styles.fieldLabel}>Message</label>
            <div className={styles.msgTools}>
              <button
                type="button"
                className={styles.msgToolBtn}
                onMouseDown={(e) => { e.preventDefault(); execCmd('bold') }}
                disabled={sending || loadingTpl}
              ><strong>B</strong></button>
              <button
                type="button"
                className={styles.msgToolBtn}
                onMouseDown={(e) => { e.preventDefault(); execCmd('italic') }}
                disabled={sending || loadingTpl}
              ><em>I</em></button>
              <button
                type="button"
                className={styles.msgToolBtnReset}
                onMouseDown={(e) => { e.preventDefault(); handleReset() }}
                disabled={sending || loadingTpl}
              >Reset</button>
            </div>
          </div>
          <div
            ref={msgRef}
            className={`${styles.msgBody} ${(sending || loadingTpl) ? styles.msgBodyDisabled : ''}`}
            contentEditable={!sending && !loadingTpl}
            suppressContentEditableWarning
          />
        </div>

        {/* Variable chips in bulk mode */}
        {isBulk && (
          <div className={styles.variables}>
            <div className={styles.variablesLabel}>
              Placeholders are auto-personalised per learner on dispatch:
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
