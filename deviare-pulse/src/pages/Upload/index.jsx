import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import Badge from '../../components/ui/Badge'
import { useToast } from '../../components/context/ToastContext'
import { useApp } from '../../context/AppContext'
import styles from './Upload.module.css'

const EXPECTED_COLUMNS = `Full Name, Email, Course Name, Project, Client Name,
OSL, LVC, Test, Status, Project Resullt`

export default function UploadPage() {
  const { showToast } = useToast()
  const {
    importLearners, clearImportedLearners, hasImportedData,
    uploadHistory, addUploadRecord, removeUploadRecord, isDbReady,
  } = useApp()

  const [isDragging, setIsDragging]       = useState(false)
  const [uploadedFile, setUploadedFile]   = useState(null)
  const [processed, setProcessed]         = useState(false)
  const [isProcessing, setIsProcessing]   = useState(false)
  const [confirmClear, setConfirmClear]   = useState(false)
  const fileInputRef = useRef(null)
  const rawFileRef   = useRef(null)

  const handleFile = (file) => {
    if (!file) return
    rawFileRef.current = file
    setUploadedFile({ name: file.name, rows: '—' })
    setProcessed(false)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb   = XLSX.read(e.target.result, { type: 'array' })
        const ws   = wb.Sheets[wb.SheetNames[0]]
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' })
        setUploadedFile({ name: file.name, rows: rows.length })
      } catch { /* leave rows as '—' */ }
    }
    reader.readAsArrayBuffer(file)
  }

  const onDrop = (e) => {
    e.preventDefault()
    setIsDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  const handleProcess = () => {
    const file = rawFileRef.current
    if (!file) return
    setIsProcessing(true)

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const wb      = XLSX.read(e.target.result, { type: 'array' })
        const ws      = wb.Sheets[wb.SheetNames[0]]
        const rawRows = XLSX.utils.sheet_to_json(ws, { defval: '' })
        const imported = importLearners(rawRows)
        const count    = imported.length

        const now = new Date()
        addUploadRecord({
          file:    file.name,
          date:    now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
          records: count,
          status:  'success',
        })

        setUploadedFile((prev) => ({ ...prev, rows: count }))
        setProcessed(true)
        showToast(`${count} learner records imported successfully.`, 'success')
      } catch (err) {
        showToast('Failed to process file. Check the format and try again.', 'error')
        console.error(err)
      } finally {
        setIsProcessing(false)
      }
    }
    reader.readAsArrayBuffer(file)
  }

  /* ── Clear data — two-step confirm ── */
  const handleClearClick = () => {
    if (!confirmClear) { setConfirmClear(true); return }
    clearImportedLearners()
    setUploadedFile(null)
    setProcessed(false)
    setConfirmClear(false)
    rawFileRef.current = null
    showToast('All data cleared. The platform is now in an empty state.', 'info')
  }

  return (
    <div className={styles.grid}>

      {/* ── Left: Upload card ── */}
      <Card>
        <CardHeader title="Upload Learner Data" subtitle="CSV or Excel from LMS export" />
        <CardBody>

          {/* Active-data banner */}
          {hasImportedData && (
            <div className={styles.activeBanner}>
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" fill="#0CA678" />
                <path d="M6 10l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span className={styles.activeBannerText}>Imported data is active across the app.</span>
              {confirmClear ? (
                <div className={styles.confirmRow}>
                  <span className={styles.confirmText}>Remove all data?</span>
                  <button className={styles.confirmYesBtn} onClick={handleClearClick}>Yes, clear</button>
                  <button className={styles.confirmNoBtn}  onClick={() => setConfirmClear(false)}>Cancel</button>
                </div>
              ) : (
                <button className={styles.clearBtn} onClick={handleClearClick}>
                  <svg width="12" height="12" viewBox="0 0 20 20" fill="none">
                    <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                  Clear Data
                </button>
              )}
            </div>
          )}

          {/* Drop zone */}
          <div
            className={`${styles.dropZone} ${isDragging ? styles.dragOver : ''}`}
            onDrop={onDrop}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Upload file"
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
          >
            <div className={styles.dropIcon}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M12 15V3M8 7l4-4 4 4" stroke="#2D7DD2" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M3 18v1a2 2 0 002 2h14a2 2 0 002-2v-1" stroke="#2D7DD2" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <div className={styles.dropTitle}>Drop files here or click to browse</div>
            <div className={styles.dropSub}>Supports .csv, .xlsx, .xls — max 25MB</div>
            <input
              ref={fileInputRef}
              type="file"
              style={{ display: 'none' }}
              accept=".csv,.xlsx,.xls"
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>

          {/* File selected — preview row */}
          {uploadedFile && (
            <div className={`${styles.uploadPreview} ${processed ? styles.uploadPreviewProcessed : ''}`}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="10" cy="10" r="8" fill="var(--success)"/>
                <path d="M6 10l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <div className={styles.uploadPreviewInfo}>
                <div className={styles.uploadFileName}>{uploadedFile.name}</div>
                <div className={styles.uploadFileSub}>
                  {processed
                    ? `${uploadedFile.rows} records imported`
                    : uploadedFile.rows !== '—'
                      ? `${uploadedFile.rows} rows detected`
                      : 'Reading file…'}
                </div>
              </div>
              {!processed && (
                <button
                  className={styles.processBtn}
                  onClick={handleProcess}
                  disabled={isProcessing || !isDbReady}
                >
                  {isProcessing ? 'Processing…' : 'Process File'}
                </button>
              )}
            </div>
          )}

          {/* Expected columns reference */}
          <div className={styles.columnsSection}>
            <div className={styles.columnsLabel}>Expected Columns</div>
            <div className={styles.columnsList}>{EXPECTED_COLUMNS}</div>
          </div>

        </CardBody>
      </Card>

      {/* ── Right: History card ── */}
      <Card>
        <CardHeader title="Upload History" subtitle="Recent data imports" />
        <CardBody noPadding>
          {uploadHistory.length === 0 ? (
            <div className={styles.emptyHistory}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M9 13h6M9 17h3M7 3H4a1 1 0 00-1 1v16a1 1 0 001 1h16a1 1 0 001-1V8l-5-5H7z"
                  stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <p>No upload history yet.</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>File</th>
                  <th>Uploaded</th>
                  <th>Records</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {uploadHistory.map((row, i) => (
                  <tr key={i}>
                    <td className={styles.monoCell}>{row.file}</td>
                    <td>{row.date}</td>
                    <td>{row.records}</td>
                    <td><Badge variant={row.status}>Processed</Badge></td>
                    <td className={styles.deleteCell}>
                      <button
                        className={styles.deleteRowBtn}
                        onClick={() => removeUploadRecord(i)}
                        aria-label={`Remove ${row.file} from history`}
                        title="Remove from history"
                      >
                        <svg width="11" height="11" viewBox="0 0 20 20" fill="none">
                          <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardBody>
      </Card>

    </div>
  )
}
