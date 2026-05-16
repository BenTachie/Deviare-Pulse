import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AppProvider }   from './context/AppContext'
import { ToastProvider } from './components/context/ToastContext'
import { ModalProvider } from './components/context/ModalContext'
import Layout from './components/layout/Layout'
import DashboardPage from './pages/Dashboard'
import LearnersPage from './pages/Learners'
import SchedulePage from './pages/Schedule'
import TemplatesPage from './pages/Templates'
import NotificationsPage from './pages/Notifications'
import ReportsPage from './pages/Reports'
import UploadPage from './pages/Upload'
import IntegrationsPage from './pages/Integrations'

export default function App() {
  return (
    <BrowserRouter>
      <AppProvider> 
        <ToastProvider>
          <ModalProvider>
            <Layout>
              <Routes>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/learners" element={<LearnersPage />} />
                <Route path="/schedule" element={<SchedulePage />} />
                <Route path="/templates" element={<TemplatesPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/upload" element={<UploadPage />} />
                <Route path="/integrations" element={<IntegrationsPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Layout>
          </ModalProvider>
        </ToastProvider>
      </AppProvider>
    </BrowserRouter>
  );
}
