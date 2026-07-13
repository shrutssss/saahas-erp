import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import SaahasLogo, { brandFont } from '../components/SaahasLogo'
import { LogOut, Menu, X, LayoutDashboard, Stethoscope, BedDouble, House, ClipboardList, PlusCircle } from 'lucide-react'

export default function Dashboard() {
  const navigate = useNavigate()
  const [speciesCounts, setSpeciesCounts] = useState({ dog: 0, cat: 0, cow: 0, other: 0 })
  const [monthlyStats, setMonthlyStats] = useState({})
  const [originalStats, setOriginalStats] = useState({})
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(new Date())
  const [showMonthDropdown, setShowMonthDropdown] = useState(false)
  const [pickerMonth, setPickerMonth] = useState(selectedMonth.getMonth())
  const [pickerYear, setPickerYear] = useState(selectedMonth.getFullYear())

  const monthLabel = selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' })
  const monthKey = monthLabel.toLowerCase()

  const monthsList = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  const currentYear = new Date().getFullYear()
  const yearsList = Array.from({ length: 11 }, (_, i) => currentYear - i)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const { data: animals } = await supabase.from('animals').select('species').eq('is_active', true)
        if (animals) {
          const counts = { dog: 0, cat: 0, cow: 0, other: 0 }
          animals.forEach((a) => {
            const species = a.species?.toLowerCase() || 'other'
            const normalized = counts[species] !== undefined ? species : 'other'
            counts[normalized] += 1
          })
          setSpeciesCounts(counts)
        }

        const { data: stats } = await supabase
          .from('monthly_stats')
          .select('*')
          .eq('month', monthKey)
          .single()

        const normalized = {
          admitted_dog: stats?.admitted_dog || 0,
          admitted_cat: stats?.admitted_cat || 0,
          admitted_cow: stats?.admitted_cow || 0,
          admitted_other: stats?.admitted_other || 0,
          released_dog: stats?.released_dog || 0,
          released_cat: stats?.released_cat || 0,
          released_cow: stats?.released_cow || 0,
          released_other: stats?.released_other || 0,
          deaths_dog: stats?.deaths_dog || 0,
          deaths_cat: stats?.deaths_cat || 0,
          deaths_cow: stats?.deaths_cow || 0,
          deaths_other: stats?.deaths_other || 0,
          blood_test_dog: stats?.blood_test_dog || 0,
          blood_test_cat: stats?.blood_test_cat || 0,
          blood_test_cow: stats?.blood_test_cow || 0,
          blood_test_other: stats?.blood_test_other || 0,
          xray_dog: stats?.xray_dog || 0,
          xray_cat: stats?.xray_cat || 0,
          xray_cow: stats?.xray_cow || 0,
          xray_other: stats?.xray_other || 0,
          surgery_dog: stats?.surgery_dog || 0,
          surgery_cat: stats?.surgery_cat || 0,
          surgery_cow: stats?.surgery_cow || 0,
          surgery_other: stats?.surgery_other || 0,
          opd_dog: stats?.opd_dog || 0,
          opd_cat: stats?.opd_cat || 0,
          opd_cow: stats?.opd_cow || 0,
          opd_other: stats?.opd_other || 0,
          rescue_dog: stats?.rescue_dog || 0,
          rescue_cat: stats?.rescue_cat || 0,
          rescue_cow: stats?.rescue_cow || 0,
          rescue_other: stats?.rescue_other || 0,
          adopted_dog: stats?.adopted_dog || 0,
          adopted_cat: stats?.adopted_cat || 0,
          adopted_cow: stats?.adopted_cow || 0,
          adopted_other: stats?.adopted_other || 0,
        }
        setMonthlyStats(normalized)
        setOriginalStats({ ...normalized })
      } catch (error) {
        console.error('Error fetching data:', error)
      }
      setLoading(false)
    }

    fetchData()
  }, [monthKey])

  const handleCellChange = (key, value) => {
    setMonthlyStats((prev) => ({ ...prev, [key]: parseInt(value) || 0 }))
    setIsEditing(true)
  }

  const handleSaveStats = async () => {
    try {
      const { error } = await supabase
        .from('monthly_stats')
        .upsert({ month: monthKey, ...monthlyStats }, { onConflict: 'month' })

      if (!error) {
        setOriginalStats({ ...monthlyStats })
        setIsEditing(false)
        alert('Stats saved successfully!')
      }
    } catch (error) {
      console.error('Error saving stats:', error)
      alert('Failed to save stats')
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/', { replace: true })
  }

  const renderCell = (activity, species) => {
    const key = `${activity.toLowerCase().replace(/\s+/g, '_')}_${species.toLowerCase()}`
    const value = monthlyStats[key] || 0

    return (
      <td
        key={key}
        onClick={() => {
          const newVal = prompt(`Enter value for ${activity} - ${species}:`, value)
          if (newVal !== null) handleCellChange(key, newVal)
        }}
        style={{
          cursor: 'pointer',
          padding: '10px 8px',
          textAlign: 'center',
          border: '1px solid #EFEFEF',
          fontSize: '14px',
        }}
      >
        {value}
      </td>
    )
  }

  const calculateTotal = (activity) => {
    const baseKey = activity.toLowerCase().replace(/\s+/g, '_')
    return (
      (monthlyStats[`${baseKey}_dog`] || 0) +
      (monthlyStats[`${baseKey}_cat`] || 0) +
      (monthlyStats[`${baseKey}_cow`] || 0) +
      (monthlyStats[`${baseKey}_other`] || 0)
    )
  }

  const speciesCards = [
    { key: 'dog', label: 'Dogs', emoji: '🐕' },
    { key: 'cat', label: 'Cats', emoji: '🐈' },
    { key: 'cow', label: 'Cows', emoji: '🐄' },
    { key: 'other', label: 'Other', emoji: '🐾' },
  ]

  if (loading) return <div style={{ padding: '24px', textAlign: 'center', color: '#888' }}>Loading…</div>

  const navLinks = [
    { label: 'Dashboard', path: '/dashboard', Icon: LayoutDashboard },
    { label: 'OPD', path: '/opd', Icon: Stethoscope },
    { label: 'IPD', path: '/ipd', Icon: BedDouble },
    { label: 'In-House', path: '/inhouse', Icon: House },
    { label: 'Tracking', path: '/tracking', Icon: ClipboardList },
    { label: 'Register Animal', path: '/register', Icon: PlusCircle },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', paddingBottom: '100px' }}>

      {/* Sidebar Drawer Overlay */}
      {showMenu && (
        <div
          onClick={() => setShowMenu(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200 }}
        />
      )}

      {/* Slide-out Sidebar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: '260px',
        background: '#FFFFFF',
        zIndex: 201,
        boxShadow: '4px 0 24px rgba(0,0,0,0.12)',
        transform: showMenu ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Sidebar Header */}
        <div style={{
          background: '#F5C800',
          padding: '20px 16px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <SaahasLogo size={34} />
            <span style={{ fontFamily: brandFont, fontSize: '18px', fontWeight: 700, color: '#1A1A1A' }}>Saahas</span>
          </div>
          <button
            onClick={() => setShowMenu(false)}
            style={{ background: 'rgba(0,0,0,0.10)', border: 'none', borderRadius: '8px', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <X size={18} color="#1A1A1A" />
          </button>
        </div>

        {/* Nav Links */}
        <nav style={{ padding: '12px 10px', flex: 1 }}>
          {navLinks.map(({ label, path, Icon }) => (
            <button
              key={path}
              onClick={() => { navigate(path); setShowMenu(false) }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '13px 14px',
                background: location.pathname === path ? '#FFF4BF' : 'transparent',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                marginBottom: '4px',
                textAlign: 'left',
              }}
            >
              <Icon size={18} color={location.pathname === path ? '#C49A00' : '#555'} strokeWidth={location.pathname === path ? 2.2 : 1.8} />
              <span style={{ fontSize: '14px', fontWeight: 600, color: location.pathname === path ? '#C49A00' : '#333' }}>{label}</span>
            </button>
          ))}
        </nav>

        {/* Logout at bottom */}
        <div style={{ padding: '12px 10px', borderTop: '1px solid #F0F0F0' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '13px 14px',
              background: '#FEE2E2',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
            }}
          >
            <LogOut size={18} color="#EF4444" />
            <span style={{ fontSize: '14px', fontWeight: 600, color: '#EF4444' }}>Logout</span>
          </button>
        </div>
      </div>

      {/* Top Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          background: '#FFFFFF',
          borderBottom: '1px solid #F0F0F0',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => setShowMenu(true)}
            style={{ background: '#F5F5F5', border: 'none', borderRadius: '10px', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            <Menu size={20} color="#1A1A1A" />
          </button>
          <span style={{ fontFamily: brandFont, fontSize: '20px', fontWeight: 700, color: '#1A1A1A' }}>
            Saahas
          </span>
        </div>
        <SaahasLogo size={36} />
      </div>

      {/* Main Content */}
      <main style={{ padding: '20px 16px' }}>
        {/* Species Summary */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '14px', color: '#1A1A1A' }}>
            Live Animal Count
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {speciesCards.map((card) => (
              <div
                key={card.key}
                style={{
                  background: '#FAFAFA',
                  border: '1.5px solid #F5C800',
                  borderRadius: '20px',
                  padding: '20px 16px',
                  minHeight: '110px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 2px 10px rgba(245,200,0,0.12)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '20px' }}>{card.emoji}</span>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#555' }}>
                    {card.label}
                  </p>
                </div>
                <div style={{ fontSize: '38px', fontWeight: 800, color: '#1A1A1A', lineHeight: 1 }}>
                  {speciesCounts[card.key]}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Stats Table */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', position: 'relative' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#1A1A1A' }}>
              {monthLabel} Stats
            </h2>
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => {
                  setPickerMonth(selectedMonth.getMonth())
                  setPickerYear(selectedMonth.getFullYear())
                  setShowMonthDropdown(!showMonthDropdown)
                }}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '4px',
                  color: '#555',
                }}
              >
                ▼
              </button>
              {showMonthDropdown && (
                <>
                  <div
                    onClick={() => setShowMonthDropdown(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 90 }}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      background: '#FFF',
                      border: '1px solid #E0E0E0',
                      borderRadius: '12px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      zIndex: 100,
                      width: '280px',
                      padding: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    <div style={{ display: 'flex', gap: '8px', height: '220px' }}>
                      {/* Month Column */}
                      <div style={{ flex: 1, overflowY: 'auto', borderRight: '1px solid #F0F0F0', paddingRight: '4px' }}>
                        {monthsList.map((m, i) => {
                          const isSelected = i === pickerMonth;
                          return (
                            <div
                              key={m}
                              onClick={() => setPickerMonth(i)}
                              style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                background: isSelected ? '#FFF4BF' : 'transparent',
                                color: isSelected ? '#C49A00' : '#333',
                                fontWeight: isSelected ? 600 : 500,
                                borderRadius: '6px',
                                marginBottom: '2px',
                                fontSize: '14px',
                                transition: 'background 0.2s',
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) e.target.style.background = '#FAFAFA'
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) e.target.style.background = 'transparent'
                              }}
                            >
                              {m}
                            </div>
                          )
                        })}
                      </div>
                      
                      {/* Year Column */}
                      <div style={{ flex: 1, overflowY: 'auto', paddingLeft: '4px' }}>
                        {yearsList.map((y) => {
                          const isSelected = y === pickerYear;
                          return (
                            <div
                              key={y}
                              onClick={() => setPickerYear(y)}
                              style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                background: isSelected ? '#FFF4BF' : 'transparent',
                                color: isSelected ? '#C49A00' : '#333',
                                fontWeight: isSelected ? 600 : 500,
                                borderRadius: '6px',
                                marginBottom: '2px',
                                fontSize: '14px',
                                transition: 'background 0.2s',
                              }}
                              onMouseEnter={(e) => {
                                if (!isSelected) e.target.style.background = '#FAFAFA'
                              }}
                              onMouseLeave={(e) => {
                                if (!isSelected) e.target.style.background = 'transparent'
                              }}
                            >
                              {y}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => {
                        setSelectedMonth(new Date(pickerYear, pickerMonth, 1));
                        setShowMonthDropdown(false);
                      }}
                      style={{
                        width: '100%',
                        background: '#F5C800',
                        color: '#000000',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '10px',
                        fontSize: '14px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Apply
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
          <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid #F0F0F0' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: '#FAFAFA', minWidth: '400px' }}>
              <thead>
                <tr style={{ background: '#F5C800' }}>
                  <th style={{ padding: '12px 10px', textAlign: 'left', fontSize: '13px', fontWeight: 700 }}>Activity</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px', fontWeight: 700 }}>Dog</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px', fontWeight: 700 }}>Cat</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px', fontWeight: 700 }}>Cow</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px', fontWeight: 700 }}>Other</th>
                  <th style={{ padding: '12px 8px', textAlign: 'center', fontSize: '13px', fontWeight: 700 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {['Admitted', 'Released', 'Deaths', 'Blood Test', 'X-Ray', 'Surgery', 'OPD', 'Rescue', 'Adopted'].map(
                  (activity, i) => (
                    <tr key={activity} style={{ background: i % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                      <td style={{ padding: '10px', fontWeight: 600, fontSize: '13px', borderBottom: '1px solid #F0F0F0' }}>{activity}</td>
                      {renderCell(activity, 'dog')}
                      {renderCell(activity, 'cat')}
                      {renderCell(activity, 'cow')}
                      {renderCell(activity, 'other')}
                      <td style={{ padding: '10px 8px', textAlign: 'center', borderBottom: '1px solid #F0F0F0', fontWeight: 700, fontSize: '14px', color: '#F5C800' }}>
                        {calculateTotal(activity)}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
          {isEditing && (
            <button
              onClick={handleSaveStats}
              style={{
                marginTop: '14px',
                width: '100%',
                background: '#F5C800',
                color: '#000000',
                border: 'none',
                borderRadius: '50px',
                padding: '14px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Save Stats
            </button>
          )}
        </div>
      </main>

      {/* Floating Add Button */}
      <button
        onClick={() => navigate('/register')}
        style={{
          position: 'fixed',
          bottom: '88px',
          right: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#F5C800',
          color: '#000000',
          border: 'none',
          fontSize: '28px',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 16px rgba(245,200,0,0.45)',
          zIndex: 100,
        }}
      >
        +
      </button>
    </div>
  )
}
