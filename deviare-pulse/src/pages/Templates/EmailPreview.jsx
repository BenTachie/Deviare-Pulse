import styles from './Templates.module.css'
import { SAMPLE_PREVIEW_DATA } from '../../data/notifications'

function substituteVars(html) {
  let result = html ?? ''
  Object.entries(SAMPLE_PREVIEW_DATA).forEach(([key, val]) => {
    result = result.replace(
      new RegExp(key.replace(/[{}]/g, '\\$&'), 'g'),
      `<span class="tpl-preview-highlight">${val}</span>`
    )
  })
  return result
}

export default function EmailPreview({ subject, body, onClose }) {
  const renderedSubject = substituteVars(subject)
  const renderedBody    = substituteVars(body)

  return (
    <div className={styles.previewOverlay} onClick={onClose}>
      <div className={styles.previewModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.previewModalHeader}>
          <div>
            <div className={styles.previewModalTitle}>Email Preview</div>
            <div className={styles.previewModalSub}>Sample data substituted for variables</div>
          </div>
          <button className={styles.previewModalClose} onClick={onClose}>×</button>
        </div>

        <div className={styles.previewEmail}>
          <div className={styles.previewEmailHeader}>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5z" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5"/>
              <path d="M2 7l8 5 8-5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <div>
              <div className={styles.previewEmailLabel}>Subject</div>
              <div
                className={styles.previewEmailSubject}
                dangerouslySetInnerHTML={{ __html: renderedSubject }}
              />
            </div>
          </div>

          <div className={styles.previewEmailBody}>
            <style>{`
              .tpl-preview-highlight {
                background: rgba(45,125,210,0.12);
                border-radius: 3px;
                padding: 0 3px;
                color: var(--info, #2D7DD2);
                font-weight: 500;
              }
            `}</style>
            <div dangerouslySetInnerHTML={{ __html: renderedBody }} />
            <div className={styles.previewSignature}>
              Best regards,<br />
              <strong>Sarah Adeyemi</strong><br />
              Customer Success Manager · Deviare
            </div>
          </div>
        </div>

        <div className={styles.previewModalFooter}>
          <button className={styles.previewCancelBtn} onClick={onClose}>Close</button>
          <button className={styles.previewApproveBtn} onClick={onClose}>Approve &amp; Save</button>
        </div>
      </div>
    </div>
  )
}
