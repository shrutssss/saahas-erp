import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

export default function Dashboard() {
  const navigate = useNavigate()
  const [animalStats, setAnimalStats] = useState([])
  const [monthlyStats, setMonthlyStats] = useState({})
  const [originalStats, setOriginalStats] = useState({})
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' })
  const monthKey = currentMonth.toLowerCase()

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch animals by species
        const { data: animals } = await supabase.from('animals').select('species').eq('is_active', true)
        if (animals) {
          const counts = {}
          animals.forEach((a) => {
            const species = a.species?.toLowerCase() || 'other'
            counts[species] = (counts[species] || 0) + 1
          })

          const chartData = Object.entries(counts).map(([species, count]) => ({
            name: species.charAt(0).toUpperCase() + species.slice(1),
            value: count,
            species,
          }))
          setAnimalStats(chartData)
        }

        // Fetch monthly stats
        const { data: stats } = await supabase
          .from('monthly_stats')
          .select('*')
          .eq('month', monthKey)
          .single()

        if (stats) {
          const normalized = {
            admitted_dog: stats.admitted_dog || 0,
            admitted_cat: stats.admitted_cat || 0,
            admitted_cow: stats.admitted_cow || 0,
            admitted_other: stats.admitted_other || 0,
            released_dog: stats.released_dog || 0,
            released_cat: stats.released_cat || 0,
            released_cow: stats.released_cow || 0,
            released_other: stats.released_other || 0,
            deaths_dog: stats.deaths_dog || 0,
            deaths_cat: stats.deaths_cat || 0,
            deaths_cow: stats.deaths_cow || 0,
            deaths_other: stats.deaths_other || 0,
            blood_test_dog: stats.blood_test_dog || 0,
            blood_test_cat: stats.blood_test_cat || 0,
            blood_test_cow: stats.blood_test_cow || 0,
            blood_test_other: stats.blood_test_other || 0,
            xray_dog: stats.xray_dog || 0,
            xray_cat: stats.xray_cat || 0,
            xray_cow: stats.xray_cow || 0,
            xray_other: stats.xray_other || 0,
            surgery_dog: stats.surgery_dog || 0,
            surgery_cat: stats.surgery_cat || 0,
            surgery_cow: stats.surgery_cow || 0,
            surgery_other: stats.surgery_other || 0,
            opd_dog: stats.opd_dog || 0,
            opd_cat: stats.opd_cat || 0,
            opd_cow: stats.opd_cow || 0,
            opd_other: stats.opd_other || 0,
            rescue_dog: stats.rescue_dog || 0,
            rescue_cat: stats.rescue_cat || 0,
            rescue_cow: stats.rescue_cow || 0,
            rescue_other: stats.rescue_other || 0,
          }
          setMonthlyStats(normalized)
          setOriginalStats({ ...normalized })
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      }
      setLoading(false)
    }

    fetchData()
  }, [])

  const handleCellChange = (key, value) => {
    setMonthlyStats((prev) => ({ ...prev, [key]: parseInt(value) || 0 }))
    setIsEditing(true)
  }

  const handleSaveStats = async () => {
    try {
      const { error } = await supabase
        .from('monthly_stats')
        .upsert(
          { month: monthKey, ...monthlyStats },
          { onConflict: 'month' }
        )

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
          padding: '8px',
          textAlign: 'center',
          border: '1px solid #E0E0E0',
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

  const COLORS = {
    dog: '#F5C800',
    cat: '#14B8A6',
    cow: '#A855F7',
    other: '#EF4444',
  }

  if (loading) return <div style={{ padding: '16px' }}>Loading...</div>

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', paddingBottom: '100px' }}>
      {/* Top Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          background: '#FFFFFF',
          borderBottom: '1px solid #E0E0E0',
        }}
      >
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
          }}
        >
          ☰
        </button>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700 }}>Saahas</h1>
        <div style={{ width: '24px' }} />
      </div>

      {/* Sidebar Menu */}
      {showMenu && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 1000,
          }}
          onClick={() => setShowMenu(false)}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: 0,
              width: '80%',
              height: '100%',
              background: '#FFFFFF',
              padding: '16px',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2>Menu</h2>
            <ul style={{ listStyle: 'none', padding: 0 }}>
              <li style={{ marginBottom: '12px' }}>
                <a
                  href="/dashboard"
                  style={{
                    textDecoration: 'none',
                    color: '#F5C800',
                    fontWeight: 600,
                  }}
                  onClick={() => setShowMenu(false)}
                >
                  Dashboard
                </a>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <a
                  href="/opd"
                  style={{
                    textDecoration: 'none',
                    color: '#F5C800',
                    fontWeight: 600,
                  }}
                  onClick={() => setShowMenu(false)}
                >
                  OPD
                </a>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <a
                  href="/ipd"
                  style={{
                    textDecoration: 'none',
                    color: '#F5C800',
                    fontWeight: 600,
                  }}
                  onClick={() => setShowMenu(false)}
                >
                  IPD
                </a>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <a
                  href="/inhouse"
                  style={{
                    textDecoration: 'none',
                    color: '#F5C800',
                    fontWeight: 600,
                  }}
                  onClick={() => setShowMenu(false)}
                >
                  In-house
                </a>
              </li>
              <li style={{ marginBottom: '12px' }}>
                <a
                  href="/daily-tracking"
                  style={{
                    textDecoration: 'none',
                    color: '#F5C800',
                    fontWeight: 600,
                  }}
                  onClick={() => setShowMenu(false)}
                >
                  Daily Tracking
                </a>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main style={{ padding: '16px' }}>
        {/* Section 1: Pie Chart */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ marginBottom: '16px' }}>Total Animals</h2>
          <div style={{ width: '100%', height: '300px' }}>
            {animalStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={animalStats}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {animalStats.map((entry) => (
                      <Cell key={`cell-${entry.species}`} fill={COLORS[entry.species] || '#999'} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p style={{ textAlign: 'center', color: '#666' }}>No animal data yet</p>
            )}
          </div>
        </div>

        {/* Section 2: Monthly Stats Table */}
        <div style={{ marginBottom: '32px' }}>
          <h2 style={{ marginBottom: '16px' }}>{currentMonth} Stats</h2>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                background: '#F5F5F5',
                borderRadius: '16px',
                overflow: 'hidden',
              }}
            >
              <thead>
                <tr style={{ background: '#E0E0E0' }}>
                  <th style={{ padding: '12px', textAlign: 'left' }}>Activity</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Dog</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Cat</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Cow</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Other</th>
                  <th style={{ padding: '12px', textAlign: 'center' }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {['Admitted', 'Released', 'Deaths', 'Blood Test', 'X-Ray', 'Surgery', 'OPD', 'Rescue'].map(
                  (activity) => (
                    <tr key={activity}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{activity}</td>
                      {renderCell(activity, 'dog')}
                      {renderCell(activity, 'cat')}
                      {renderCell(activity, 'cow')}
                      {renderCell(activity, 'other')}
                      <td
                        style={{
                          padding: '8px',
                          textAlign: 'center',
                          border: '1px solid #E0E0E0',
                          fontWeight: 700,
                        }}
                      >
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
                marginTop: '16px',
                width: '100%',
                background: '#F5C800',
                color: '#000000',
                border: 'none',
                borderRadius: 50,
                padding: '12px',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Save Stats
            </button>
          )}
        </div>

        {/* Section 3: Navigation Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '12px',
            marginBottom: '32px',
          }}
        >
          {[
            { label: 'OPD', href: '/opd' },
            { label: 'IPD', href: '/ipd' },
            { label: 'In-House', href: '/inhouse' },
            { label: 'Daily Record', href: '/daily-tracking' },
          ].map((card) => (
            <a
              key={card.label}
              href={card.href}
              style={{
                background: '#F5F5F5',
                borderRadius: '16px',
                padding: '16px',
                height: '160px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                textDecoration: 'none',
                color: '#1A1A1A',
                fontWeight: 700,
                fontSize: '16px',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = 'none')}
            >
              {card.label}
            </a>
          ))}
        </div>
      </main>

      {/* Floating Add Button */}
      <button
        onClick={() => navigate('/register')}
        style={{
          position: 'fixed',
          bottom: '100px',
          right: '16px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: '#F5C800',
          color: '#000000',
          border: 'none',
          fontSize: '32px',
          fontWeight: 'bold',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
          zIndex: 100,
        }}
      >
        +
      </button>

      {/* Bottom Navigation */}
      <nav
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: '#F5F5F5',
          borderTop: '1px solid #E0E0E0',
          display: 'flex',
          justifyContent: 'space-around',
          padding: '8px 0',
          zIndex: 50,
        }}
      >
        <a
          href="/dashboard"
          style={{
            flex: 1,
            textAlign: 'center',
            padding: '12px',
            textDecoration: 'none',
            color: '#1A1A1A',
            fontSize: '12px',
          }}
        >
          🏠 Home
        </a>
        <a
          href="/inhouse"
          style={{
            flex: 1,
            textAlign: 'center',
            padding: '12px',
            textDecoration: 'none',
            color: '#1A1A1A',
            fontSize: '12px',
          }}
        >
          🐾 In-house
        </a>
        <a
          href="/daily-tracking"
          style={{
            flex: 1,
            textAlign: 'center',
            padding: '12px',
            textDecoration: 'none',
            color: '#1A1A1A',
            fontSize: '12px',
          }}
        >
          📋 Tracking
        </a>
        <button
          onClick={() => setShowMenu(!showMenu)}
          style={{
            flex: 1,
            textAlign: 'center',
            padding: '12px',
            background: 'none',
            border: 'none',
            color: '#1A1A1A',
            fontSize: '12px',
            cursor: 'pointer',
          }}
        >
          👤 Menu
        </button>
      </nav>
    </div>
  )
}
