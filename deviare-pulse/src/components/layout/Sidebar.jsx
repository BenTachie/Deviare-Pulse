import { memo } from 'react'
import { NavLink } from 'react-router-dom'
import { navSections } from './navConfig'
import { useApp } from "../../context/AppContext";
import styles from "./Sidebar.module.css";

function SidebarLogo() {
  return (
    <div className={styles.logoArea}>
      <div className={styles.logoMark}>
        <svg className={styles.logoIcon} viewBox="0 0 32 32" fill="none">
          <polygon
            points="4,28 16,4 28,28"
            fill="none"
            stroke="#00C2CB"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <polygon
            points="10,28 16,16 22,28"
            fill="rgba(0,194,203,0.35)"
            stroke="#00C2CB"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
        <div className={styles.logoText}>
          <span className={styles.logoName}>Deviare Pulse</span>
          <span className={styles.logoSub}>Progress Platform</span>
        </div>
      </div>
    </div>
  );
}

const NavItem = memo(function NavItem({ item }) {
  const { notificationCount } = useApp()
  const badge = item.id === 'notifications' ? notificationCount : item.badge

  return (
    <NavLink
      to={item.path}
      end={item.path === '/'}
      className={({ isActive }) =>
        [styles.navItem, isActive ? styles.navItemActive : ''].join(' ')
      }
    >
      <span className={styles.navIcon}>{item.icon}</span>
      <span className={styles.navLabel}>{item.label}</span>
      {badge > 0 && <span className={styles.navBadge}>{badge}</span>}
    </NavLink>
  )
})


function SidebarUserCard() {
  return (
    <div className={styles.footer}>
      <div className={styles.userCard}>
        <div className={styles.userAvatar}>SA</div>
        <div className={styles.userInfo}>
          <div className={styles.userName}>Sarah Adeyemi</div>
          <div className={styles.userRole}>Customer Success Manager</div>
        </div>
      </div>
    </div>
  )
}

export default function Sidebar() {
  return (
    <>
      <SidebarLogo />
      <nav className={styles.nav}>
        {navSections.map((section) => (
          <div key={section.label}>
            <div className={styles.sectionLabel}>{section.label}</div>
            {section.items.map((item) => (
              <NavItem key={item.id} item={item} />
            ))}
          </div>
        ))}
      </nav>
      <SidebarUserCard />
    </>
  )
}