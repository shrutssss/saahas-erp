import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useContext, useState } from 'react'
import { AuthContext } from '../AuthContext'
import { supabase } from '../supabaseClient'

export default function BottomNav() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, role } = useContext(AuthContext)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  const handleLogout = async () => {
    await supabase.auth.signOut()
    setSidebarOpen(false)
    navigate('/')
  }

  const navItems = [
    { path: '/dashboard', icon: '🏠', label: 'Home' },
    { path: '/opd', icon: '🏥', label: 'OPD' },
    { path: '/daily-tracking', icon: '📋', label: 'Daily Record' },
    { path: '/inhouse', icon: '🏢', label: 'In-House' },
  ]

  return (
    <>
      {/* Sidebar Overlay */}
      {sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', zIndex: 999 }} />
      )}

      {/* Sidebar */}
      <div style={{
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        width: '250px',
        backgroundColor: '#FFFFFF',
        zIndex: 1001,
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: sidebarOpen ? '0 0 10px rgba(0,0,0,0.2)' : 'none'
      }}>
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid #E0E0E0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: '#F5C800', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px' }}>🐾</div>
          <div>
            <p style={{ margin: 0, fontWeight: 'bold', fontSize: '16px' }}>Saahas</p>
            <p style={{ margin: 0, fontSize: '11px', color: '#666' }}>Shelter</p>
          </div>
        </div>

        {/* Nav Links */}
        <div style={{ flex: 1, padding: '16px 0', overflowY: 'auto' }}>
          <Link to="/dashboard" onClick={() => setSidebarOpen(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#1A1A1A', fontSize: '14px', borderLeft: isActive('/dashboard') ? '4px solid #F5C800' : 'transparent', paddingLeft: isActive('/dashboard') ? '12px' : '16px', backgroundColor: isActive('/dashboard') ? '#F5F5F5' : 'transparent' }}>
            Home
          </Link>
          <Link to="/opd" onClick={() => setSidebarOpen(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#1A1A1A', fontSize: '14px', borderLeft: isActive('/opd') ? '4px solid #F5C800' : 'transparent', paddingLeft: isActive('/opd') ? '12px' : '16px', backgroundColor: isActive('/opd') ? '#F5F5F5' : 'transparent' }}>
            OPD
          </Link>
          <Link to="/ipd" onClick={() => setSidebarOpen(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#1A1A1A', fontSize: '14px', borderLeft: isActive('/ipd') ? '4px solid #F5C800' : 'transparent', paddingLeft: isActive('/ipd') ? '12px' : '16px', backgroundColor: isActive('/ipd') ? '#F5F5F5' : 'transparent' }}>
            IPD
          </Link>
          <Link to="/inhouse" onClick={() => setSidebarOpen(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#1A1A1A', fontSize: '14px', borderLeft: isActive('/inhouse') ? '4px solid #F5C800' : 'transparent', paddingLeft: isActive('/inhouse') ? '12px' : '16px', backgroundColor: isActive('/inhouse') ? '#F5F5F5' : 'transparent' }}>
            In-House
          </Link>
          <Link to="/daily-tracking" onClick={() => setSidebarOpen(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#1A1A1A', fontSize: '14px', borderLeft: isActive('/daily-tracking') ? '4px solid #F5C800' : 'transparent', paddingLeft: isActive('/daily-tracking') ? '12px' : '16px', backgroundColor: isActive('/daily-tracking') ? '#F5F5F5' : 'transparent' }}>
            Daily Tracking
          </Link>
          <Link to="/register" onClick={() => setSidebarOpen(false)} style={{ display: 'block', padding: '12px 16px', textDecoration: 'none', color: '#1A1A1A', fontSize: '14px', borderLeft: isActive('/register') ? '4px solid #F5C800' : 'transparent', paddingLeft: isActive('/register') ? '12px' : '16px', backgroundColor: isActive('/register') ? '#F5F5F5' : 'transparent' }}>
            New Registration
          </Link>
        </div>

        {/* Footer */}
        <div style={{ borderTop: '1px solid #E0E0E0', padding: '12px 16px' }}>
          {user && (
            <>
              <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 'bold', color: '#1A1A1A' }}>{user.email || 'User'}</p>
              <p style={{ margin: '0 0 12px 0', fontSize: '11px', color: '#666' }}>Role: {role || 'staff'}</p>
            </>
          )}
          <button onClick={handleLogout} style={{ width: '100%', padding: '10px', backgroundColor: '#EF4444', color: '#FFF', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      {/* Bottom Navigation Bar */}
      <nav style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E0E0E0',
        display: 'flex',
        justifyContent: 'space-around',
        padding: '8px 0',
        zIndex: 100
      }}>
        {navItems.map(item => (
          <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)} style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '12px 8px',
            textDecoration: 'none',
            color: isActive(item.path) ? '#F5C800' : '#999',
            fontSize: '11px',
            gap: '4px',
            transition: 'color 0.2s'
          }}>
            <span style={{ fontSize: '20px' }}>{item.icon}</span>
            <span style={{ fontSize: '10px' }}>{item.label}</span>
          </Link>
        ))}

        {/* Menu Button */}
        <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 8px',
          background: 'none',
          border: 'none',
          color: sidebarOpen ? '#F5C800' : '#999',
          fontSize: '11px',
          gap: '4px',
          cursor: 'pointer',
          transition: 'color 0.2s'
        }}>
          <span style={{ fontSize: '20px' }}>☰</span>
          <span style={{ fontSize: '10px' }}>Menu</span>
        </button>
      </nav>
    </>
  )
}
