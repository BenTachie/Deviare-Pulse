import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import styles from './Modals.module.css'

const COURSES = ['.NET Programming', 'Data Analyst', 'PowerBI']
const COHORTS = ['NET-SEP22', 'DA-SEP22', 'PBI-SEP22']

export default function AddLearnerModal({ onClose, onAdd }) {
  const [form, setForm] = useState({
    name: '', email: '', course: '', cohort: '', startDate: '',
  })

  const set = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))
  const isValid = form.name && form.email && form.course && form.cohort

  const handleSubmit = () => {
    if (!isValid) return
    onAdd?.(form)
    onClose()
  }

  return (
    <Modal
      title="Add New Learner"
      subtitle="Enroll a learner into a training programme"
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit} disabled={!isValid}>Add Learner</Button>
        </>
      }
    >
      <div className={styles.form}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Full Name *</label>
            <input className={styles.input} placeholder="e.g. Sipho Nkosi" value={form.name} onChange={set('name')} />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address *</label>
            <input className={styles.input} type="email" placeholder="learner@example.com" value={form.email} onChange={set('email')} />
          </div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Course *</label>
            <select className={styles.input} value={form.course} onChange={set('course')}>
              <option value="">Select a course</option>
              {COURSES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Cohort *</label>
            <select className={styles.input} value={form.cohort} onChange={set('cohort')}>
              <option value="">Select a cohort</option>
              {COHORTS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>
        <div className={styles.formGroup}>
          <label className={styles.label}>Start Date</label>
          <input className={styles.input} type="date" value={form.startDate} onChange={set('startDate')} />
        </div>
      </div>
    </Modal>
  )
}
