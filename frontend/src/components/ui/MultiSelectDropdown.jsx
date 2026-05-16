import { useState, useEffect, useRef, useCallback, memo } from 'react'
import { createPortal } from 'react-dom'
import styles from './MultiSelectDropdown.module.css'

export const MultiSelectDropdown = memo(function MultiSelectDropdown({
  options,
  selected,
  onChange,
}) {
  const [isOpen, setIsOpen]     = useState(false)
  const [query, setQuery]       = useState('')
  const [panelPos, setPanelPos] = useState({ top: 0, left: 0, minWidth: 220 })

  const triggerRef = useRef(null)
  const panelRef   = useRef(null)
  const inputRef   = useRef(null)

  // ── Open / close ──────────────────────────────────────────────────
  const openPanel = useCallback(() => {
    if (triggerRef.current) {
      const r = triggerRef.current.getBoundingClientRect()
      setPanelPos({ top: r.bottom + 4, left: r.left, minWidth: Math.max(r.width, 220) })
    }
    setIsOpen(true)
  }, [])

  const closePanel = useCallback(() => { setIsOpen(false); setQuery('') }, [])

  const togglePanel = useCallback(() => {
    isOpen ? closePanel() : openPanel()
  }, [isOpen, openPanel, closePanel])

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return
    function onDown(e) {
      if (
        panelRef.current   && !panelRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) closePanel()
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [isOpen, closePanel])

  // Re-position panel on scroll / resize while open
  useEffect(() => {
    if (!isOpen) return
    function reposition() {
      if (triggerRef.current) {
        const r = triggerRef.current.getBoundingClientRect()
        setPanelPos({ top: r.bottom + 4, left: r.left, minWidth: Math.max(r.width, 220) })
      }
    }
    window.addEventListener('scroll', reposition, true)
    window.addEventListener('resize', reposition)
    return () => {
      window.removeEventListener('scroll', reposition, true)
      window.removeEventListener('resize', reposition)
    }
  }, [isOpen])

  // Auto-focus search on open
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 0)
  }, [isOpen])

  // ── Handlers ──────────────────────────────────────────────────────
  const visibleOptions = query
    ? options.filter(o => o.toLowerCase().includes(query.toLowerCase()))
    : options

  const toggle = useCallback((opt) => {
    onChange(selected.includes(opt)
      ? selected.filter(s => s !== opt)
      : [...selected, opt])
  }, [selected, onChange])

  const clearAll = useCallback((e) => {
    e.stopPropagation()
    onChange([])
    closePanel()
  }, [onChange, closePanel])

  // ── Derived display label ─────────────────────────────────────────
  const label =
    selected.length === 0 ? 'All' :
    selected.length === 1 ? selected[0] :
    `${selected.length} selected`

  const active = selected.length > 0

  // ── Render ────────────────────────────────────────────────────────
  return (
    <div className={styles.container}>
      <button
        ref={triggerRef}
        type="button"
        className={`${styles.trigger} ${active ? styles.triggerActive : ''}`}
        onClick={togglePanel}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className={styles.triggerLabel}>{label}</span>
        {active && <span className={styles.badge}>{selected.length}</span>}
        <svg
          className={`${styles.chevron} ${isOpen ? styles.chevronOpen : ''}`}
          width="11" height="11" viewBox="0 0 12 12" fill="none"
        >
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {isOpen && createPortal(
        <div
          ref={panelRef}
          className={styles.panel}
          style={{ top: panelPos.top, left: panelPos.left, minWidth: panelPos.minWidth }}
          role="listbox"
          aria-multiselectable="true"
        >
          {/* Search */}
          <div className={styles.searchRow}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none" className={styles.searchIcon}>
              <circle cx="7" cy="7" r="5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              className={styles.searchInput}
              placeholder="Search…"
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
            {query && (
              <button type="button" className={styles.clearQuery} onClick={() => setQuery('')}>
                ×
              </button>
            )}
          </div>

          {/* Option list */}
          <div className={styles.list}>
            {visibleOptions.length === 0 ? (
              <div className={styles.empty}>No matches</div>
            ) : (
              visibleOptions.map(opt => {
                const checked = selected.includes(opt)
                return (
                  <label
                    key={opt}
                    className={`${styles.item} ${checked ? styles.itemChecked : ''}`}
                  >
                    <input
                      type="checkbox"
                      className={styles.checkbox}
                      checked={checked}
                      onChange={() => toggle(opt)}
                    />
                    <span className={styles.itemText}>{opt}</span>
                  </label>
                )
              })
            )}
          </div>

          {/* Footer */}
          {active && (
            <div className={styles.footer}>
              <button type="button" className={styles.clearAll} onClick={clearAll}>
                Clear all ({selected.length})
              </button>
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  )
})
