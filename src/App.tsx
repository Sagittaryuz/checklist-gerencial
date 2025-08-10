import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { ChecklistPage } from './pages/ChecklistPage'
import { ConfigPage } from './pages/ConfigPage'
import { ChecklistFormPage } from './pages/ChecklistFormPage'
import { ChecklistResultPage } from './pages/ChecklistResultPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="checklist" element={<ChecklistPage />} />
            <Route path="checklist/new" element={<ChecklistFormPage />} />
            <Route path="checklist/:id/result" element={<ChecklistResultPage />} />
            <Route path="config" element={<ConfigPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </AuthProvider>
  )
}

export default App