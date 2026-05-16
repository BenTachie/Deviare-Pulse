import { useLocation, useNavigate } from "react-router-dom";
import styles from "./Topbar.module.css";

const routeTitles = {
  "/": "Dashboard",
  "/learners": "Learners",
  "/schedule": "Training Schedule",
  "/templates": "Notification Templates",
  "/notifications": "Notifications",
  "/reports": "Reports",
  "/upload": "Upload Data",
  "/integrations": "Integrations",
  "/cohorts": "Cohorts",
};

export default function Topbar({
  onSyncLearners,
  syncing = false,
  onSendReminders,
  onMenuToggle,
}) {
  const location = useLocation();
  const navigate = useNavigate();
  const title = routeTitles[location.pathname] ?? "Deviare Pulse";

  return (
    <header className={styles.topbar}>
      <button
        className={styles.hamburger}
        onClick={onMenuToggle}
        aria-label="Toggle menu"
      >
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
          <path
            d="M3 5h14M3 10h14M3 15h14"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      </button>
      <h1 className={styles.title}>{title}</h1>

      <div className={styles.search}>
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
          <circle
            cx="8.5"
            cy="8.5"
            r="5.5"
            stroke="#8DA0B8"
            strokeWidth="1.5"
          />
          <path
            d="M13 13l3 3"
            stroke="#8DA0B8"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <input type="text" placeholder="Search learners, cohorts…" />
      </div>

      <button
        className={`${styles.action} ${styles.secondary}`}
        onClick={onSendReminders}
      >
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15h14a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z"
            stroke="currentColor"
            strokeWidth="1.5"
          />
          <path d="M8 16a2 2 0 104 0" stroke="currentColor" strokeWidth="1.5" />
        </svg>
        Send Reminders
      </button>

      <button
        className={`${styles.action} ${styles.primary} ${styles.syncBtn}`}
        onClick={onSyncLearners}
        disabled={syncing}
      >
        <svg
          className={`${styles.syncIcon} ${syncing ? styles.syncIconSpinning : ''}`}
          width="14" height="14" viewBox="0 0 20 20" fill="none"
        >
          <path d="M4 10a6 6 0 016-6 6 6 0 014.24 1.76L16 7.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M16 10a6 6 0 01-6 6 6 6 0 01-4.24-1.76L4 12.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M14 5.5l2 2 2-2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M2 12.5l2 2 2-2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        {syncing ? 'Syncing…' : 'Sync Learners'}
      </button>

      <button
        className={styles.notifBell}
        onClick={() => navigate("/notifications")}
        aria-label="View notifications"
      >
        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15h14a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z"
            stroke="#4A6080"
            strokeWidth="1.5"
          />
          <path d="M8 16a2 2 0 104 0" stroke="#4A6080" strokeWidth="1.5" />
        </svg>
        <span className={styles.notifDot} aria-hidden="true" />
      </button>
    </header>
  );
}