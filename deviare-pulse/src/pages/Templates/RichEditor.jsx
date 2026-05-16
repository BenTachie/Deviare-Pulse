import { useRef, useState, useEffect, useImperativeHandle, forwardRef } from 'react'
import styles from './Templates.module.css'

const TOOLBAR_ACTIONS = [
  { cmd: 'bold',      label: <b>B</b>,      title: 'Bold' },
  { cmd: 'italic',    label: <i>I</i>,      title: 'Italic' },
  { cmd: 'underline', label: <u>U</u>,      title: 'Underline' },
]

const RichEditor = forwardRef(function RichEditor(
  { initialContent, onContentChange, onDirty, isDirty },
  ref
) {
  const editorRef = useRef(null)
  const [activeFormats, setActiveFormats] = useState({})

  useImperativeHandle(ref, () => ({
    getHTML: () => editorRef.current?.innerHTML ?? '',
    setHTML: (html) => {
      if (editorRef.current) editorRef.current.innerHTML = html
    },
  }))

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.innerHTML = initialContent ?? ''
    }
  }, [initialContent])

  const applyFormat = (cmd) => {
    document.execCommand(cmd, false, null)
    editorRef.current?.focus()
    updateActiveFormats()
    onDirty?.()
  }

  const updateActiveFormats = () => {
    setActiveFormats({
      bold:      document.queryCommandState('bold'),
      italic:    document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
    })
  }

  const insertLink = () => {
    const url = window.prompt('Enter URL:', 'https://')
    if (url) {
      editorRef.current?.focus()
      document.execCommand('createLink', false, url)
      onDirty?.()
    }
  }

  return (
    <div className={styles.editorWrap}>
      <div className={styles.toolbar}>
        {TOOLBAR_ACTIONS.map((action) => (
          <button
            key={action.cmd}
            className={`${styles.toolbarBtn} ${activeFormats[action.cmd] ? styles.toolbarBtnActive : ''}`}
            title={action.title}
            onMouseDown={(e) => { e.preventDefault(); applyFormat(action.cmd) }}
            type="button"
          >
            {action.label}
          </button>
        ))}

        <span className={styles.toolbarSep} />

        <button
          className={styles.toolbarBtn}
          title="Bullet list"
          onMouseDown={(e) => { e.preventDefault(); applyFormat('insertUnorderedList') }}
          type="button"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <circle cx="2" cy="4" r="1.5" fill="currentColor"/>
            <circle cx="2" cy="8" r="1.5" fill="currentColor"/>
            <circle cx="2" cy="12" r="1.5" fill="currentColor"/>
            <path d="M6 4h8M6 8h8M6 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        <button
          className={styles.toolbarBtn}
          title="Numbered list"
          onMouseDown={(e) => { e.preventDefault(); applyFormat('insertOrderedList') }}
          type="button"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <path d="M1 3h2M1 8h2M1 13h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M6 4h8M6 8h8M6 12h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>

        <span className={styles.toolbarSep} />

        <button
          className={`${styles.toolbarBtn} ${styles.toolbarBtnText}`}
          title="Insert link"
          onMouseDown={(e) => { e.preventDefault(); insertLink() }}
          type="button"
        >
          Link
        </button>

        <span className={styles.toolbarSep} />

        <button
          className={`${styles.toolbarBtn} ${styles.toolbarBtnText}`}
          title="Clear formatting"
          onMouseDown={(e) => { e.preventDefault(); applyFormat('removeFormat') }}
          type="button"
        >
          Clear
        </button>

        <span className={styles.toolbarAutoSave}>Changes auto-save on exit</span>
      </div>

      <div
        ref={editorRef}
        className={styles.editor}
        contentEditable
        suppressContentEditableWarning
        onInput={() => {
          onContentChange?.(editorRef.current?.innerHTML ?? '')
          onDirty?.()
        }}
        onKeyUp={updateActiveFormats}
        onMouseUp={updateActiveFormats}
        spellCheck
      />

      <div className={styles.editorFooter}>
        <span className={styles.editorFooterSig}>Signature appended automatically from CSM profile</span>
        <span className={styles.dirtyIndicator} style={{ display: isDirty ? 'inline' : 'none' }}>
          Unsaved changes
        </span>
      </div>
    </div>
  )
})

export default RichEditor
