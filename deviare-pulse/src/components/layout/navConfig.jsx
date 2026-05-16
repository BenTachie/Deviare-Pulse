export const navSections = [
  {
    label: 'Overview',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        path: '/',
        icon: (
          <svg viewBox="0 0 20 20" fill="none">
            <rect x="2" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.9" />
            <rect x="11" y="2" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.5" />
            <rect x="2" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.5" />
            <rect x="11" y="11" width="7" height="7" rx="1.5" fill="currentColor" opacity="0.9" />
          </svg>
        ),
      },
      {
        id: 'learners',
        label: 'Learners',
        path: '/learners',
        icon: (
          <svg viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M3 17c0-3.314 3.134-6 7-6s7 2.686 7 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        id: 'schedule',
        label: 'Training Schedule',
        path: '/schedule',
        icon: (
          <svg viewBox="0 0 20 20" fill="none">
            <rect x="2" y="4" width="16" height="14" rx="2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M6 2v4M14 2v4M2 9h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M6 13h2M10 13h2M6 16h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        id: 'templates',
        label: 'Notification Templates',
        path: '/templates',
        icon: (
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M17 4H3a1 1 0 00-1 1v10a1 1 0 001 1h14a1 1 0 001-1V5a1 1 0 00-1-1z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M2 8h16M6 12h2M6 15h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Progress',
    items: [
      {
        id: 'notifications',
        label: 'Notifications',
        path: '/notifications',
        badge: 7,
        icon: (
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M10 2a6 6 0 00-6 6v3.586l-1.707 1.707A1 1 0 003 15h14a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 16a2 2 0 104 0" stroke="currentColor" strokeWidth="1.5" />
          </svg>
        ),
      },
      {
        id: 'reports',
        label: 'Reports',
        path: '/reports',
        icon: (
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M6 2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.5" />
            <path d="M8 7h4M8 10h4M8 13h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
  {
    label: 'Data',
    items: [
      {
        id: 'upload',
        label: 'Upload Data',
        path: '/upload',
        icon: (
          <svg viewBox="0 0 20 20" fill="none">
            <path d="M10 13V3M6 7l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M3 15v1a1 1 0 001 1h12a1 1 0 001-1v-1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
      },
      {
        id: 'integrations',
        label: 'Integrations',
        path: '/integrations',
        icon: (
          <svg viewBox="0 0 20 20" fill="none">
            <circle cx="5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="15" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <circle cx="10" cy="15" r="2.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7.5 5h5M6.8 7L10 12.5M13.2 7L10 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
]