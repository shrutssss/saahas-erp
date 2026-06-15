import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { AuthContext } from './AuthContext'

import Login from './pages/Login'
import Registration from './pages/Registration'
import Dashboard from './pages/Dashboard'
import AnimalList from './pages/AnimalList'
import AnimalProfile from './pages/AnimalProfile'
import DailyTracking from './pages/DailyTracking'
import TreatmentSheet from './pages/TreatmentSheet'

function ProtectedRoute({ children }) {
  const [isAuthed, setIsAuthed] = useState(null)

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()
      setIsAuthed(!!data?.session?.user)
    }
    checkAuth()
  }, [])

  if (isAuthed === null) return <div style={{ padding: '16px' }}>Loading...</div>
  if (!isAuthed) return <Navigate to="/" replace />

  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Login />} />

        {/* Protected */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/register"
          element={
            <ProtectedRoute>
              <Registration />
            </ProtectedRoute>
          }
        />
        <Route
          path="/opd"
          element={
            <ProtectedRoute>
              <AnimalList ward="opd" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ipd"
          element={
            <ProtectedRoute>
              <AnimalList ward="ipd" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inhouse"
          element={
            <ProtectedRoute>
              <AnimalList ward="inhouse" />
            </ProtectedRoute>
          }
        />
        <Route
          path="/animal/:id"
          element={
            <ProtectedRoute>
              <AnimalProfile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/daily-tracking"
          element={
            <ProtectedRoute>
              <DailyTracking />
            </ProtectedRoute>
          }
        />
        <Route
          path="/treatment/:id"
          element={
            <ProtectedRoute>
              <TreatmentSheet />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

