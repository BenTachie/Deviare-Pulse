import { useState } from 'react'
import { Card, CardHeader, CardBody } from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import { useToast } from '../../components/context/ToastContext'
import styles from './Integrations.module.css'

/* ── Integration tile data ───────────────────────────────────────── */
const INTEGRATIONS = [
  {
    id: 'lms',
    name: 'Deviare LMS',
    desc: 'Direct LMS data sync via API',
    status: 'warning',
    statusLabel: 'Planned',
    iconBg: 'var(--info-bg)',
    iconColor: '#2D7DD2',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <rect x="3" y="3"   width="7" height="7" rx="1.5" fill="#2D7DD2" />
        <rect x="14" y="3"  width="7" height="7" rx="1.5" fill="#2D7DD2" opacity="0.5" />
        <rect x="3" y="14"  width="7" height="7" rx="1.5" fill="#2D7DD2" opacity="0.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" fill="#2D7DD2" />
      </svg>
    ),
  },
  {
    id: 'sendgrid',
    name: 'Twilio SendGrid',
    desc: 'Bulk & transactional email delivery',
    status: 'info',
    statusLabel: 'Configure',
    iconBg: '#f0fdf4',
    iconColor: '#0ca678',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" stroke="#0CA678" strokeWidth="1.5"/>
        <path d="M2 8l8 5 4-2.5 6-2.5" stroke="#0CA678" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="18" cy="18" r="4" fill="#0CA678"/>
        <path d="M16.5 18h3M18 16.5v3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'powerbi',
    name: 'Power BI',
    desc: 'Pull reports & datasets via API',
    status: 'warning',
    statusLabel: 'Configure',
    iconBg: '#fff7ed',
    iconColor: '#f59e0b',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <rect x="3"  y="12" width="4" height="9"  rx="1" fill="#f59e0b"/>
        <rect x="10" y="7"  width="4" height="14" rx="1" fill="#f59e0b" opacity="0.75"/>
        <rect x="17" y="3"  width="4" height="18" rx="1" fill="#f59e0b" opacity="0.5"/>
      </svg>
    ),
  },
]

/* ── LMS Config panel ────────────────────────────────────────────── */
function LMSConfig({ onSave }) {
  return (
    <Card>
      <CardHeader title="LMS API Configuration" subtitle="Future integration settings" />
      <CardBody>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>API Endpoint URL</label>
            <input className={styles.input} type="text" placeholder="https://lms.deviare.co.za/api/v1" defaultValue="https://lms.deviare.co.za/api/v1" />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>API Key</label>
            <input className={styles.input} type="password" placeholder="••••••••••••••••" />
          </div>
        </div>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Sync Frequency</label>
            <select className={styles.input}>
              <option>Every 6 hours</option>
              <option>Daily</option>
              <option>Manual only</option>
            </select>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Default Cohort Tag</label>
            <input className={styles.input} type="text" placeholder="e.g. MS25-2024" />
          </div>
        </div>
        <Button variant="primary" onClick={onSave}>Save Configuration</Button>
      </CardBody>
    </Card>
  )
}

/* ── SendGrid Config panel ───────────────────────────────────────── */
function SendGridConfig({ onSave, onTest }) {
  const [sendMode, setSendMode] = useState('transactional')
  const [sgStatus, setSgStatus] = useState(null) // null | 'connected' | 'error'

  const handleTest = () => {
    setSgStatus('connected')
    onTest()
  }

  return (
    <Card>
      <CardHeader
        title="Twilio SendGrid Configuration"
        subtitle="Configure the SendGrid Email API for automated learner notifications"
        action={
          sgStatus === 'connected'
            ? <Badge variant="success">Connected</Badge>
            : sgStatus === 'error'
            ? <Badge variant="danger">Connection failed</Badge>
            : null
        }
      />
      <CardBody>

        {/* Setup guidance banner */}
        <div className={styles.guidanceBanner}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke="#2D7DD2" strokeWidth="1.5"/>
            <path d="M10 9v5M10 6.5v1" stroke="#2D7DD2" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <div>
            <strong>Setup steps:</strong> 1) Create a free account at <em>sendgrid.com</em> &nbsp;·&nbsp;
            2) Go to <em>Settings → API Keys → Create API Key</em> (Full Access or Mail Send scope) &nbsp;·&nbsp;
            3) Verify a sender under <em>Sender Authentication</em> (Single Sender or Domain Auth) &nbsp;·&nbsp;
            4) Paste your key and verified sender below.
          </div>
        </div>

        {/* Row 1 — API key + from name */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>SendGrid API Key</label>
            <div className={styles.inputWithPrefix}>
              <span className={styles.inputPrefix}>SG.</span>
              <input className={`${styles.input} ${styles.inputPrefixed}`} type="password" placeholder="••••••••••••••••••••••" />
            </div>
            <div className={styles.fieldHint}>
              Generate at <em>app.sendgrid.com → Settings → API Keys</em>. Scope: Mail Send.
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>From Name</label>
            <input className={styles.input} type="text" placeholder="e.g. Deviare Learning" defaultValue="Deviare Learning" />
            <div className={styles.fieldHint}>Displayed as the sender name in recipients' inboxes.</div>
          </div>
        </div>

        {/* Row 2 — from email + reply-to */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Verified From Email</label>
            <input className={styles.input} type="email" placeholder="noreply@deviare.co.za" />
            <div className={styles.fieldHint}>
              Must be verified in SendGrid under <em>Sender Authentication</em>.
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Reply-to Email</label>
            <input className={styles.input} type="email" placeholder="csm@deviare.co.za" />
            <div className={styles.fieldHint}>Where learner replies are directed.</div>
          </div>
        </div>

        {/* Row 3 — send mode + batch size */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Send Mode</label>
            <div className={styles.toggleGroup}>
              <button
                className={`${styles.toggleBtn} ${sendMode === 'transactional' ? styles.toggleBtnActive : ''}`}
                onClick={() => setSendMode('transactional')}
                type="button"
              >
                Transactional
              </button>
              <button
                className={`${styles.toggleBtn} ${sendMode === 'bulk' ? styles.toggleBtnActive : ''}`}
                onClick={() => setSendMode('bulk')}
                type="button"
              >
                Bulk (personalizations)
              </button>
            </div>
            <div className={styles.fieldHint}>
              {sendMode === 'bulk'
                ? 'Sends one API call with up to 1,000 personalizations — ideal for Dispatch All.'
                : 'Sends individual API calls per recipient — ideal for single triggered reminders.'}
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Unsubscribe Group ID <span className={styles.optionalTag}>optional</span></label>
            <input className={styles.input} type="text" placeholder="e.g. 12345" />
            <div className={styles.fieldHint}>
              SendGrid Unsubscribe Group ID for one-click unsubscribe compliance.
            </div>
          </div>
        </div>

        {/* API reference box */}
        <div className={styles.apiRefBox}>
          <div className={styles.apiRefTitle}>API Reference</div>
          <div className={styles.apiRefGrid}>
            <div className={styles.apiRefItem}>
              <span className={styles.methodBadge}>POST</span>
              <code>https://api.sendgrid.com/v3/mail/send</code>
            </div>
            <div className={styles.apiRefItem}>
              <span className={styles.keyIcon}>🔑</span>
              <span>Authorization: Bearer SG.&lt;api_key&gt;</span>
            </div>
            <div className={styles.apiRefItem}>
              <span className={styles.keyIcon}>📦</span>
              <span>Body: <code>to[]</code>, <code>from</code>, <code>subject</code>, <code>content[]</code>{sendMode === 'bulk' ? ', <code>personalizations[]</code> (max 1,000)' : ''}</span>
            </div>
          </div>
        </div>

        <div className={styles.actionRow}>
          <Button variant="primary" onClick={onSave}>Save SendGrid Config</Button>
          <Button variant="secondary" onClick={handleTest}>Test Connection</Button>
        </div>
      </CardBody>
    </Card>
  )
}

/* ── Power BI Config panel ───────────────────────────────────────── */
function PowerBIConfig({ onSave, onTest }) {
  const [scopes, setScopes] = useState({ reports: true, datasets: true, workspaces: false })
  const [pbiStatus, setPbiStatus] = useState(null)

  const toggleScope = (key) => setScopes((s) => ({ ...s, [key]: !s[key] }))

  const handleTest = () => {
    setPbiStatus('connected')
    onTest()
  }

  return (
    <Card>
      <CardHeader
        title="Power BI Integration"
        subtitle="Connect via Azure AD service principal to pull reports and datasets"
        action={
          pbiStatus === 'connected'
            ? <Badge variant="success">Connected</Badge>
            : null
        }
      />
      <CardBody>

        {/* Setup guidance */}
        <div className={styles.guidanceBanner}>
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
            <circle cx="10" cy="10" r="8" stroke="#2D7DD2" strokeWidth="1.5"/>
            <path d="M10 9v5M10 6.5v1" stroke="#2D7DD2" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <div>
            <strong>Setup steps:</strong> 1) Register an app in <em>Azure AD → App registrations</em> &nbsp;·&nbsp;
            2) Add <em>Power BI Service</em> API permissions (Report.Read.All, Dataset.Read.All) &nbsp;·&nbsp;
            3) Create a <em>Client Secret</em> under Certificates &amp; secrets &nbsp;·&nbsp;
            4) In Power BI Admin Portal enable <em>"Allow service principals to use Power BI APIs"</em>.
          </div>
        </div>

        {/* Row 1 — Tenant ID + Client ID */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Azure AD Tenant ID</label>
            <input className={styles.input} type="text" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
            <div className={styles.fieldHint}>Found in <em>Azure AD → Overview → Tenant ID</em>.</div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Client ID (Application ID)</label>
            <input className={styles.input} type="text" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
            <div className={styles.fieldHint}>Found in <em>Azure AD → App registrations → Overview</em>.</div>
          </div>
        </div>

        {/* Row 2 — Client Secret + Token endpoint */}
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Client Secret</label>
            <input className={styles.input} type="password" placeholder="••••••••••••••••" />
            <div className={styles.fieldHint}>Create under <em>Certificates &amp; secrets → New client secret</em>.</div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Default Workspace ID <span className={styles.optionalTag}>optional</span></label>
            <input className={styles.input} type="text" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
            <div className={styles.fieldHint}>Leave blank to access all workspaces.</div>
          </div>
        </div>

        {/* API endpoints (read-only reference) */}
        <div className={styles.apiRefBox}>
          <div className={styles.apiRefTitle}>API Endpoints</div>
          <div className={styles.apiRefGrid}>
            <div className={styles.apiRefItem}>
              <span className={styles.methodBadgeGet}>GET</span>
              <code>https://api.powerbi.com/v1.0/myorg/groups</code>
              <span className={styles.apiRefNote}>List workspaces</span>
            </div>
            <div className={styles.apiRefItem}>
              <span className={styles.methodBadgeGet}>GET</span>
              <code>https://api.powerbi.com/v1.0/myorg/groups/&#123;groupId&#125;/reports</code>
              <span className={styles.apiRefNote}>List reports</span>
            </div>
            <div className={styles.apiRefItem}>
              <span className={styles.methodBadge}>POST</span>
              <code>/groups/&#123;groupId&#125;/reports/&#123;reportId&#125;/GenerateToken</code>
              <span className={styles.apiRefNote}>Embed token</span>
            </div>
            <div className={styles.apiRefItem}>
              <span className={styles.keyIcon}>🔑</span>
              <span>OAuth2 token: <code>https://login.microsoftonline.com/&#123;tenantId&#125;/oauth2/v2.0/token</code></span>
            </div>
          </div>
        </div>

        {/* API Permissions */}
        <div className={styles.scopesSection}>
          <div className={styles.scopesTitle}>API Permissions <span className={styles.optionalTag}>(select the scopes granted in Azure AD)</span></div>
          <div className={styles.scopesGrid}>
            <label className={styles.scopeItem}>
              <input type="checkbox" checked={scopes.reports} onChange={() => toggleScope('reports')} />
              <div>
                <div className={styles.scopeName}>Report.Read.All</div>
                <div className={styles.scopeDesc}>Read all Power BI reports</div>
              </div>
            </label>
            <label className={styles.scopeItem}>
              <input type="checkbox" checked={scopes.datasets} onChange={() => toggleScope('datasets')} />
              <div>
                <div className={styles.scopeName}>Dataset.Read.All</div>
                <div className={styles.scopeDesc}>Read all Power BI datasets</div>
              </div>
            </label>
            <label className={styles.scopeItem}>
              <input type="checkbox" checked={scopes.workspaces} onChange={() => toggleScope('workspaces')} />
              <div>
                <div className={styles.scopeName}>Workspace.Read.All</div>
                <div className={styles.scopeDesc}>List all workspaces</div>
              </div>
            </label>
          </div>
        </div>

        <div className={styles.actionRow}>
          <Button variant="primary" onClick={onSave}>Save Power BI Config</Button>
          <Button variant="secondary" onClick={handleTest}>Test Connection</Button>
        </div>
      </CardBody>
    </Card>
  )
}

/* ── Page ────────────────────────────────────────────────────────── */
export default function IntegrationsPage() {
  const { showToast } = useToast()
  const [activeTab, setActiveTab] = useState(null)

  const scrollTo = (id) => {
    setActiveTab(id)
    const el = document.getElementById(`config-${id}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div>
      {/* Top integration tiles */}
      <div className={styles.cardsGrid}>
        {INTEGRATIONS.map((int) => (
          <div
            key={int.id}
            className={`${styles.intTile} ${activeTab === int.id ? styles.intTileActive : ''}`}
            onClick={() => scrollTo(int.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && scrollTo(int.id)}
          >
            <Card>
              <CardBody>
                <div className={styles.intCard}>
                  <div className={styles.intIcon} style={{ background: int.iconBg }}>
                    {int.icon}
                  </div>
                  <div className={styles.intName}>{int.name}</div>
                  <div className={styles.intDesc}>{int.desc}</div>
                  <Badge variant={int.status}>{int.statusLabel}</Badge>
                </div>
              </CardBody>
            </Card>
          </div>
        ))}
      </div>

      {/* Config panels */}
      <div className={styles.configStack}>
        <div id="config-lms">
          <LMSConfig onSave={() => showToast('LMS configuration saved.', 'success')} />
        </div>

        <div id="config-sendgrid">
          <SendGridConfig
            onSave={() => showToast('SendGrid configuration saved.', 'success')}
            onTest={() => showToast('SendGrid connection verified — ready to send.', 'success')}
          />
        </div>

        <div id="config-powerbi">
          <PowerBIConfig
            onSave={() => showToast('Power BI configuration saved.', 'success')}
            onTest={() => showToast('Power BI connection verified — workspace access confirmed.', 'success')}
          />
        </div>
      </div>
    </div>
  )
}
