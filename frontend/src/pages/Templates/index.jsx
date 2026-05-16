import { useState, useRef, useCallback, useEffect } from 'react'
import Button from '../../components/ui/Button'
import TemplateList from './TemplateList'
import RichEditor from './RichEditor'
import EmailPreview from './EmailPreview'
import { fetchSgTemplates, fetchSgTemplateContent, saveSgTemplate } from '../../services/emailApi'
import { useToast } from '../../components/context/ToastContext'
import styles from './Templates.module.css'

const TEMPLATE_VARIABLES = [
  'LearnerName', 'CourseName', 'MilestoneName',
  'CurrentProgress', 'RequiredTarget', 'DueDate', 'DaysRemaining',
]

function fmtDate(dateStr) {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export default function TemplatesPage() {
  const { showToast } = useToast()

  const [templates,       setTemplates]       = useState([])
  const [listLoading,     setListLoading]     = useState(true)
  const [listError,       setListError]       = useState(null)

  const [selected,        setSelected]        = useState(null)
  const [contentLoading,  setContentLoading]  = useState(false)

  const [subject,         setSubject]         = useState('')
  const [isDirty,         setIsDirty]         = useState(false)
  const [saving,          setSaving]          = useState(false)
  const [showPreview,     setShowPreview]     = useState(false)

  const editorRef = useRef(null)

  /* ── Load template list from SendGrid on mount ── */
  useEffect(() => {
    setListLoading(true)
    fetchSgTemplates()
      .then((tpls) => { setTemplates(tpls); setListLoading(false) })
      .catch((err) => { setListError(err.message); setListLoading(false) })
  }, [])

  /* ── Load full content when a template is selected ── */
  const handleSelect = useCallback(async (tpl) => {
    if (selected?.id === tpl.id) return
    setSelected({ ...tpl, subject: '', htmlContent: '' })
    setSubject('')
    setIsDirty(false)
    setContentLoading(true)

    try {
      const content = await fetchSgTemplateContent(tpl.id)
      setSelected(content)
      setSubject(content.subject)
      setTimeout(() => editorRef.current?.setHTML(content.htmlContent), 0)
    } catch (err) {
      showToast(`Could not load template: ${err.message}`, 'error')
    } finally {
      setContentLoading(false)
    }
  }, [selected, showToast])

  /* ── Save back to SendGrid ── */
  const handleSave = async () => {
    if (!selected) { showToast('Select a template first', 'info'); return }
    const htmlContent = editorRef.current?.getHTML() ?? ''
    setSaving(true)
    try {
      await saveSgTemplate(selected.id, { subject, htmlContent })
      setSelected((s) => s ? { ...s, subject, htmlContent, updatedAt: new Date().toISOString() } : s)
      setTemplates((prev) =>
        prev.map((t) => t.id === selected.id ? { ...t, updatedAt: new Date().toISOString() } : t)
      )
      setIsDirty(false)
      showToast('Template saved to SendGrid.', 'success')
    } catch (err) {
      showToast(`Save failed: ${err.message}`, 'error')
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = () => {
    if (!selected) { showToast('Select a template to preview', 'info'); return }
    setShowPreview(true)
  }

  const insertVariable = (v) => {
    if (!selected) return
    const editorEl = document.querySelector('[contenteditable]')
    if (editorEl) {
      editorEl.focus()
      document.execCommand('insertHTML', false,
        `<span class="tpl-var-inline">{{${v}}}</span>&nbsp;`
      )
      setIsDirty(true)
    }
  }

  const currentBody = editorRef.current?.getHTML() ?? selected?.htmlContent ?? ''

  return (
    <div>
      {/* Page header */}
      <div className={styles.pageHeader}>
        <div>
          <h2 className={styles.pageTitle}>Notification Templates</h2>
          <p className={styles.pageSub}>Templates are stored in SendGrid — changes here update the live email immediately</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Button variant="secondary" size="lg" onClick={handlePreview} disabled={!selected || contentLoading}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M1 10s4-7 9-7 9 7 9 7-4 7-9 7-9-7-9-7z" stroke="currentColor" strokeWidth="1.5"/>
              <circle cx="10" cy="10" r="2.5" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
            Preview Email
          </Button>
          <Button variant="primary" size="lg" onClick={handleSave} disabled={!selected || saving || contentLoading}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M4 2h9l3 3v13H4V2z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M7 2v5h6V2M7 12h6M7 15h4" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            {saving ? 'Saving…' : 'Save to SendGrid'}
          </Button>
        </div>
      </div>

      {listError && (
        <div style={{ margin: '16px 0', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, color: '#991b1b', fontSize: 14 }}>
          Could not load templates from SendGrid: {listError}
        </div>
      )}

      <div className={styles.layout}>
        {/* Left panel */}
        <div>
          <div className={styles.panelLabel}>Milestone Templates</div>

          {listLoading ? (
            <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Loading from SendGrid…
            </div>
          ) : (
            <TemplateList
              templates={templates}
              selectedId={selected?.id}
              onSelect={handleSelect}
            />
          )}

          {/* Available Variables */}
          <div className={styles.varsCard}>
            <div className={styles.varsCardHeader}>
              <div className={styles.varsCardTitle}>Available Variables</div>
            </div>
            <div className={styles.varsCardBody}>
              <div className={styles.varsCardHint}>Click to insert into template body</div>
              <div className={styles.varChipList}>
                {TEMPLATE_VARIABLES.map((v) => (
                  <button
                    key={v}
                    className={styles.varChip}
                    type="button"
                    onClick={() => insertVariable(v)}
                    title={`Insert {{${v}}}`}
                  >
                    {`{{${v}}}`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right panel */}
        <div>
          {!selected ? (
            <div className={styles.emptyEditor}>
              <div className={styles.emptyIcon}>
                <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
                  <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" stroke="var(--text-muted)" strokeWidth="1.5"/>
                  <path d="M2 8h20M6 12h4M6 15h8" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <div className={styles.emptyTitle}>Select a template to edit</div>
              <div className={styles.emptySub}>Choose a milestone from the left panel</div>
            </div>
          ) : contentLoading ? (
            <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
              Loading template from SendGrid…
            </div>
          ) : (
            <div>
              {/* Stage strip */}
              <div className={styles.stageStrip} style={{ background: `${selected.color}12` }}>
                <span className={styles.stageDot} style={{ background: selected.color }} />
                <span className={styles.stageLabel} style={{ color: selected.color }}>{selected.name}</span>
                <span className={styles.stageLastEdited}>· Last edited {fmtDate(selected.updatedAt)}</span>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isDirty && (
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>Unsaved changes</span>
                  )}
                </div>
              </div>

              {/* Subject */}
              <div className={styles.subjectCard}>
                <span className={styles.subjectLabel}>Subject</span>
                <input
                  className={styles.subjectInput}
                  type="text"
                  value={subject}
                  placeholder="Email subject line…"
                  onChange={(e) => { setSubject(e.target.value); setIsDirty(true) }}
                />
              </div>

              {/* Body editor */}
              <div className={styles.bodyCard}>
                <RichEditor
                  key={selected.id}
                  ref={editorRef}
                  initialContent={selected.htmlContent}
                  onContentChange={() => {}}
                  onDirty={() => setIsDirty(true)}
                  isDirty={isDirty}
                />
              </div>

              {/* Notification Stages info */}
              <div className={styles.notifStagesCard}>
                <div className={styles.notifStagesHeader}>
                  <div className={styles.notifStagesTitle}>Notification Stages</div>
                  <div className={styles.notifStagesSub}>This template is used across all three automation stages</div>
                </div>
                <div className={styles.notifStagesGrid}>
                  <div className={`${styles.notifStageBox} ${styles.notifStageBoxPre}`}>
                    <div className={styles.notifStageTag}>Pre-deadline</div>
                    <div className={styles.notifStageQuote}>"Your deadline is approaching."</div>
                    <div className={styles.notifStageDesc}>Sent during reminder window at configured frequency</div>
                  </div>
                  <div className={`${styles.notifStageBox} ${styles.notifStageBoxDue}`}>
                    <div className={styles.notifStageTag}>Due-date</div>
                    <div className={styles.notifStageQuote}>"Today is the final day."</div>
                    <div className={styles.notifStageDesc}>Single notification sent on the exact due date</div>
                  </div>
                  <div className={`${styles.notifStageBox} ${styles.notifStageBoxPost}`}>
                    <div className={styles.notifStageTag}>Post-deadline</div>
                    <div className={styles.notifStageQuote}>"You have missed the deadline."</div>
                    <div className={styles.notifStageDesc}>Escalation based on post-deadline frequency setting</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {showPreview && selected && (
        <EmailPreview
          subject={subject}
          body={currentBody || selected.htmlContent}
          onClose={() => setShowPreview(false)}
        />
      )}

      <style>{`
        .tpl-var-inline {
          display: inline;
          padding: 1px 5px;
          background: rgba(45,125,210,0.12);
          color: var(--info, #2D7DD2);
          border-radius: 3px;
          font-family: var(--font-mono);
          font-size: 0.9em;
        }
      `}</style>
    </div>
  )
}
