import { useState, useCallback, useEffect, useRef, useMemo, memo } from 'react'
import { Card } from '../../components/ui/Card'
import { MultiSelectDropdown } from '../../components/ui/MultiSelectDropdown'
import LearnerRow from './LearnerRow'
import LearnerDetailPanel from './LearnerDetailPanel'
import { useLearners } from '../../hooks/useLearners'
import { useModal } from '../../components/context/ModalContext'
import styles from './Learners.module.css'

const OSL_STATUSES = ['Completed', 'In Progress', 'Not Started']
const PAGE_SIZES   = [50, 100, 250]

/* ── Pagination helpers ──────────────────────────────────────────── */
function getPagePills(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pills = []
  const add = (v) => { if (!pills.includes(v)) pills.push(v) }
  add(1)
  if (current > 3) pills.push('…')
  for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) add(i)
  if (current < total - 2) pills.push('…')
  add(total)
  return pills
}

const Pagination = memo(function Pagination({ current, total, pageSize, filteredCount, onPage, onPageSize }) {
  if (total <= 1 && filteredCount <= PAGE_SIZES[0]) return null
  const from = (current - 1) * pageSize + 1
  const to   = Math.min(current * pageSize, filteredCount)
  const pills = getPagePills(current, total)

  return (
    <div className={styles.pagination}>
      <span className={styles.pageInfo}>
        Showing <strong>{from.toLocaleString()}–{to.toLocaleString()}</strong> of{' '}
        <strong>{filteredCount.toLocaleString()}</strong> learners
      </span>

      <div className={styles.pageControls}>
        <button
          className={styles.pageBtn}
          onClick={() => onPage(current - 1)}
          disabled={current === 1}
          aria-label="Previous page"
        >
          ‹
        </button>

        {pills.map((p, i) =>
          p === '…'
            ? <span key={`ellipsis-${i}`} className={styles.pageEllipsis}>…</span>
            : <button
                key={p}
                className={`${styles.pageBtn} ${p === current ? styles.pageBtnActive : ''}`}
                onClick={() => onPage(p)}
              >{p}</button>
        )}

        <button
          className={styles.pageBtn}
          onClick={() => onPage(current + 1)}
          disabled={current === total}
          aria-label="Next page"
        >
          ›
        </button>
      </div>

      <div className={styles.pageSizeWrap}>
        <span className={styles.pageSizeLabel}>Rows</span>
        <select
          className={styles.pageSizeSelect}
          value={pageSize}
          onChange={(e) => onPageSize(Number(e.target.value))}
        >
          {PAGE_SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
    </div>
  )
})

export default function LearnersPage() {
  const { filtered, filters, setFilter, clientNames, projectNames, courseNames, statusOptions } = useLearners()
  const { openModal } = useModal()
  const [selectedLearner, setSelectedLearner] = useState(null)
  const [selectedIds, setSelectedIds] = useState(new Set())
  const selectAllRef = useRef(null)

  // ── Search debounce ───────────────────────────────────────────────
  const [searchDraft, setSearchDraft] = useState('')
  const searchTimerRef = useRef(null)
  const handleSearchChange = useCallback((value) => {
    setSearchDraft(value)
    clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => setFilter('search', value), 250)
  }, [setFilter])

  // ── Pagination ────────────────────────────────────────────────────
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(50)

  // Reset to page 1 whenever the filtered set changes
  useEffect(() => { setCurrentPage(1) }, [filtered.length])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const pageStart  = (currentPage - 1) * pageSize
  const paginated  = filtered.slice(pageStart, pageStart + pageSize)

  const handlePage = useCallback((p) => setCurrentPage(Math.max(1, Math.min(p, totalPages))), [totalPages])
  const handlePageSize = useCallback((s) => { setPageSize(s); setCurrentPage(1) }, [])

  const isAllSelected  = filtered.length > 0 && filtered.every((l) => selectedIds.has(l.id))
  const isIndeterminate = !isAllSelected && filtered.some((l) => selectedIds.has(l.id))

  useEffect(() => {
    if (selectAllRef.current) selectAllRef.current.indeterminate = isIndeterminate
  }, [isIndeterminate])

  const stats = useMemo(() => ({
    total:         filtered.length,
    certified:     filtered.filter((l) => l.status === 'Certified').length,
    oslCompleted:  filtered.filter((l) => l.oslProgress >= 85).length,
    projectPassed: filtered.filter((l) => l.projectResult === 'Passed').length,
  }), [filtered])

  const handleSelectAll = useCallback(() => {
    if (isAllSelected) {
      setSelectedIds((prev) => { const n = new Set(prev); filtered.forEach((l) => n.delete(l.id)); return n })
    } else {
      setSelectedIds((prev) => { const n = new Set(prev); filtered.forEach((l) => n.add(l.id)); return n })
    }
  }, [isAllSelected, filtered])

  const handleSelectOne = useCallback((id, checked) => {
    setSelectedIds((prev) => { const n = new Set(prev); checked ? n.add(id) : n.delete(id); return n })
  }, [])

  const handleRemind    = useCallback((learner) => openModal('send-reminder', { preselectedLearner: learner }), [openModal])
  const handleRemindAll = useCallback(() => {
    const sel = filtered.filter((l) => selectedIds.has(l.id))
    if (sel.length === 1) {
      openModal('send-reminder', { preselectedLearner: sel[0] })
    } else if (sel.length > 1) {
      openModal('send-reminder', { preselectedLearners: sel })
    }
  }, [filtered, selectedIds, openModal])

  const handleRowClick  = useCallback((learner) => setSelectedLearner(learner), [])
  const handlePanelClose = useCallback(() => setSelectedLearner(null), [])
  const toggleSeg        = useCallback((key, val) => setFilter(key, filters[key] === val ? '' : val), [filters, setFilter])

  // Local state for the OSL % input — only committed to filter on Enter
  const [oslPctDraft, setOslPctDraft] = useState('')

  const handleOslPctKeyDown = useCallback((e) => {
    if (e.key === 'Enter') {
      setFilter('oslMaxPct', oslPctDraft)
      e.target.blur()
    }
    if (e.key === 'Escape') {
      setOslPctDraft('')
      setFilter('oslMaxPct', '')
      e.target.blur()
    }
  }, [oslPctDraft, setFilter])

  const selectionCount = selectedIds.size

  return (
    <div>

      {/* ── Filter panel: 5 cascading columns with multi-select search ── */}
      <div className={styles.filterPanel}>

        <div className={styles.filterCol}>
          <div className={styles.filterColHeader}>
            <span className={styles.filterColTitle}>Client Name</span>
          </div>
          <div className={styles.filterColBodyMs}>
            <MultiSelectDropdown
              options={clientNames}
              selected={filters.clientName}
              onChange={(v) => setFilter('clientName', v)}
            />
          </div>
        </div>

        <div className={styles.filterCol}>
          <div className={styles.filterColHeader}>
            <span className={styles.filterColTitle}>Project Name</span>
          </div>
          <div className={styles.filterColBodyMs}>
            <MultiSelectDropdown
              options={projectNames}
              selected={filters.cohort}
              onChange={(v) => setFilter('cohort', v)}
            />
          </div>
        </div>

        <div className={styles.filterCol}>
          <div className={styles.filterColHeader}>
            <span className={styles.filterColTitle}>Course Name</span>
          </div>
          <div className={styles.filterColBodyMs}>
            <MultiSelectDropdown
              options={courseNames}
              selected={filters.course}
              onChange={(v) => setFilter('course', v)}
            />
          </div>
        </div>

        <div className={styles.filterCol}>
          <div className={styles.filterColHeader}>
            <span className={styles.filterColTitle}>User Name</span>
          </div>
          <div className={styles.filterColBody}>
            <input
              className={styles.filterColInput}
              type="text"
              placeholder="All"
              value={searchDraft}
              onChange={(e) => handleSearchChange(e.target.value)}
            />
          </div>
        </div>

        <div className={`${styles.filterCol} ${styles.filterColLast}`}>
          <div className={styles.filterColHeader}>
            <span className={styles.filterColTitle}>Certification Status</span>
          </div>
          <div className={styles.filterColBodyMs}>
            <MultiSelectDropdown
              options={statusOptions}
              selected={filters.status}
              onChange={(v) => setFilter('status', v)}
            />
          </div>
        </div>

      </div>

      {/* ── KPI stats bar ── */}
      <div className={styles.statsBar}>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Users</span>
          <span className={styles.statValue}>{stats.total}</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Certificates Unlocked</span>
          <span className={styles.statValue}>{stats.certified}</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>OSL Completed</span>
          <span className={styles.statValue}>
            {stats.oslCompleted > 0 ? stats.oslCompleted : <em className={styles.blankVal}>Blank</em>}
          </span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statLabel}>Project Passed</span>
          <span className={styles.statValue}>{stats.projectPassed}</span>
        </div>
        <div className={`${styles.statBox} ${styles.statBoxWide}`}>
          <span className={styles.statLabel}>OSL Status</span>
          <div className={styles.segControl}>
            {OSL_STATUSES.map((s) => (
              <button
                key={s}
                className={`${styles.segBtn} ${filters.oslStatus === s ? styles.segBtnActive : ''}`}
                onClick={() => toggleSeg('oslStatus', s)}
              >{s}</button>
            ))}
            <div className={`${styles.oslPctWrap} ${filters.oslMaxPct !== '' ? styles.oslPctActive : ''}`}>
              <span className={styles.oslPctLabel}>≤</span>
              <input
                type="number"
                min="0"
                max="100"
                placeholder="—"
                className={styles.oslPctInput}
                value={oslPctDraft}
                onChange={(e) => setOslPctDraft(e.target.value)}
                onKeyDown={handleOslPctKeyDown}
                title="Type a percentage and press Enter to filter"
              />
              <span className={styles.oslPctLabel}>%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Action row ── */}
      <div className={styles.actionRow}>
        <button
          className={`${styles.remindAllBtn} ${selectionCount > 0 ? styles.remindAllActive : ''}`}
          disabled={selectionCount === 0}
          onClick={handleRemindAll}
        >
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
            <path d="M10 2a6 6 0 0 0-6 6v3l-1.5 2.5h15L16 11V8a6 6 0 0 0-6-6Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <path d="M8 16.5a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Remind All
          {selectionCount > 0 && <span className={styles.selectionBadge}>{selectionCount}</span>}
        </button>
      </div>

      {/* ── Table ── */}
      <Card>
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <colgroup>
              <col style={{ width: '44px' }} />
              <col style={{ width: '19%' }} />
              <col style={{ width: '13%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '7%' }} />
              <col style={{ width: '10%' }} />
              <col style={{ width: '12%' }} />
              <col style={{ width: '9%' }} />
            </colgroup>
            <thead>
              <tr>
                <th className={styles.checkboxCell}>
                  <input
                    ref={selectAllRef}
                    type="checkbox"
                    className={styles.checkbox}
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    aria-label="Select all learners"
                  />
                </th>
                <th>Learner</th>
                <th>Course</th>
                <th>OSL Progress</th>
                <th>LVC Progress</th>
                <th>Test</th>
                <th>Project Result</th>
                <th className={styles.thStatus}>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length > 0 ? (
                paginated.map((learner) => (
                  <LearnerRow
                    key={`${learner.id}-${learner.email}`}
                    learner={learner}
                    isSelected={selectedIds.has(learner.id)}
                    onSelect={handleSelectOne}
                    onRemind={handleRemind}
                    onClick={handleRowClick}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={9} className={styles.emptyRow}>
                    No learners match the current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          current={currentPage}
          total={totalPages}
          pageSize={pageSize}
          filteredCount={filtered.length}
          onPage={handlePage}
          onPageSize={handlePageSize}
        />
      </Card>

      <LearnerDetailPanel learner={selectedLearner} onClose={handlePanelClose} />
    </div>
  )
}
