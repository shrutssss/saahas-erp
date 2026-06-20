import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'



const navItems = [
  {
    path: '/dashboard',
    label: 'Home',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 30, height: 30, display: 'block' }}>
        <path d="M3 11.5L12 4l9 7.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.5 10.8V20h11V10.8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9.2 20v-6.2h5.6V20" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8.8 9.8h6.4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    path: '/opd',
    label: 'OPD',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 30, height: 30, display: 'block' }}>
        <path d="M5 8h14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M7 8v10h10V8" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10 12h4M9 15h6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    path: '/ipd',
    label: 'IPD',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 30, height: 30, display: 'block' }}>
        <path d="M4 19h16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
        <path d="M6.5 19V10l5.5-4 5.5 4v9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M9 13h2.2v-2.2h1.8V13H15v1.8h-2V17h-1.8v-2.2H9z" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    path: '/inhouse',
    label: 'In-House',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 30, height: 30, display: 'block' }}>
        <path d="M4.5 11.5L12 5l7.5 6.5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M6.5 10.9V20h11V10.9" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8.4 19.2v-5.4h3v5.4M12.6 19.2v-5.4h3v5.4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M10.8 14.4h2.4" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    path: '/tracking',
    label: 'Tracking',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true" style={{ width: 30, height: 30, display: 'block' }}>
        <rect x="4" y="5" width="16" height="15" rx="2.5" fill="none" stroke="currentColor" strokeWidth="2.4" />
        <path d="M8 3v4M16 3v4M4 9h16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M8 13h8M8 16h5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
      </svg>
    ),
  },
]

export default function BottomNav() {
  const location = useLocation()
  const [trackingCount, setTrackingCount] = useState(0)

  useEffect(() => {
    const fetchCount = async () => {
      const { count } = await supabase
        .from('animals')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('requires_vet_attention', true)
      
      setTrackingCount(count || 0)
    }
    
    fetchCount()
    
    const channel = supabase
      .channel('animals_tracking_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'animals' }, () => {
        fetchCount()
      })
      .subscribe()
      
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid #E0E0E0',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        zIndex: 100,
        boxShadow: '0 -6px 18px rgba(0,0,0,0.06)',
      }}
    >
      {navItems.map((item) => {
        const active = isActive(item.path)

        return (
          <Link
            key={item.path}
            to={item.path}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '10px 6px 12px',
              textDecoration: 'none',
              color: '#111111',
              backgroundColor: active ? '#FFF4BF' : '#FFFFFF',
              minHeight: '76px',
              transition: 'background-color 0.2s ease, transform 0.2s ease',
            }}
          >
            <span style={{ position: 'relative', color: '#111111', transform: active ? 'scale(1.05)' : 'scale(1)' }}>
              {item.icon}
              {item.path === '/tracking' && trackingCount > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  backgroundColor: '#EF4444',
                  color: 'white',
                  fontSize: '10px',
                  fontWeight: 'bold',
                  height: '18px',
                  minWidth: '18px',
                  borderRadius: '9px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                  {trackingCount}
                </div>
              )}
            </span>
            <span style={{ fontSize: '10px', lineHeight: 1.1, fontWeight: active ? 700 : 600, textAlign: 'center', color: '#111111' }}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
