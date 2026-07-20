import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { useContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import { AuthContext } from './AuthContext'
import BottomNav from './components/BottomNav'

import Login from './pages/Login'
import Registration from './pages/Registration'
import Dashboard from './pages/Dashboard'
import AnimalList from './pages/AnimalList'
import AnimalProfile from './pages/AnimalProfile'
import Tracking from './pages/Tracking'
import TreatmentSheet from './pages/TreatmentSheet'

function ProtectedRoute() {
  const { user, loading } = useContext(AuthContext)

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>Loading...</div>
  if (!user) return <Navigate to="/" replace />

  return <Outlet />
}

function ProtectedLayout() {
  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      <Outlet />
      <BottomNav />
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/" element={<Login />} />

        {/* Protected */}
        <Route element={<ProtectedRoute />}>
          <Route element={<ProtectedLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/register" element={<Registration />} />
            <Route path="/opd" element={<AnimalList ward="opd" />} />
            <Route path="/ipd" element={<AnimalList ward="ipd" />} />
            <Route path="/inhouse" element={<AnimalList ward="inhouse" />} />
            <Route path="/animal/:id" element={<AnimalProfile />} />
            <Route path="/tracking" element={<Tracking />} />
            <Route path="/treatment/:id" element={<TreatmentSheet />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

