import { Link, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { supabase } from '../supabaseClient'
import { LayoutDashboard, Stethoscope, BedDouble, House, ClipboardList } from 'lucide-react'

const navItems = [
  { path: '/dashboard', label: 'Home', Icon: LayoutDashboard },
  { path: '/opd', label: 'OPD', Icon: Stethoscope },
  { path: '/ipd', label: 'IPD', Icon: BedDouble },
  { path: '/inhouse', label: 'In-House', Icon: House },
  { path: '/tracking', label: 'Tracking', Icon: ClipboardList },
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

    return () => supabase.removeChannel(channel)
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
        borderTop: '1px solid #F0F0F0',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        zIndex: 100,
        boxShadow: '0 -4px 24px rgba(0,0,0,0.07)',
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
      }}
    >
      {navItems.map(({ path, label, Icon }) => {
        const active = isActive(path)
        return (
          <Link
            key={path}
            to={path}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              padding: '10px 4px 12px',
              textDecoration: 'none',
              position: 'relative',
            }}
          >
            {active && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: '20%',
                right: '20%',
                height: '3px',
                backgroundColor: '#F5C800',
                borderRadius: '0 0 3px 3px',
              }} />
            )}
            <div style={{
              position: 'relative',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '10px',
              backgroundColor: active ? '#FFF4BF' : 'transparent',
              transition: 'background-color 0.2s ease',
            }}>
              <Icon
                size={20}
                strokeWidth={active ? 2.2 : 1.8}
                color={active ? '#C49A00' : '#999999'}
              />
              {path === '/tracking' && trackingCount > 0 && (
                <div style={{
                  position: 'absolute',
                  top: '-2px',
                  right: '-2px',
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  fontSize: '9px',
                  fontWeight: 700,
                  height: '16px',
                  minWidth: '16px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                }}>
                  {trackingCount}
                </div>
              )}
            </div>
            <span style={{
              fontSize: '10px',
              fontWeight: active ? 700 : 500,
              color: active ? '#C49A00' : '#AAAAAA',
              letterSpacing: '0.2px',
            }}>
              {label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
