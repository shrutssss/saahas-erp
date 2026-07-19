import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import SaahasLogo, { brandFont } from '../components/SaahasLogo'
import { LogOut, Menu, X, LayoutDashboard, Stethoscope, BedDouble, House, ClipboardList, PlusCircle } from 'lucide-react'

const MONTHLY_STAT_ROWS = [
  { key: 'admitted', label: 'Admitted' },
  { key: 'released', label: 'Released' },
  { key: 'deaths', label: 'Deaths' },
  { key: 'blood_test', label: 'Blood Test' },
  { key: 'xray', label: 'X-Ray' },
  { key: 'surgery', label: 'Surgery' },
  { key: 'opd', label: 'OPD' },
  { key: 'rescue', label: 'Rescue' },
  { key: 'adopted', label: 'Adopted' },
]

const SPECIES_KEYS = ['dog', 'cat', 'cow', 'other']

const createEmptyMonthlyStats = () =>
  MONTHLY_STAT_ROWS.reduce((accumulator, { key }) => {
    SPECIES_KEYS.forEach((species) => {
      accumulator[`${key}_${species}`] = 0
    })
    return accumulator
  }, {})

const getSpeciesBucket = (species) => {
  const s = species?.toLowerCase()
  if (s === 'dog') return 'dog'
  if (s === 'cat') return 'cat'
  if (s === 'cow') return 'cow'
  return 'other'
}

const formatMonthKey = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

const formatMonthLabel = (date) => date.toLocaleString('default', { month: 'long', year: 'numeric' })

const getMonthBounds = (selectedYear, selectedMonth) => {
  const startDate = new Date(selectedYear, selectedMonth, 1).toISOString().split('T')[0]
  const endDate = new Date(selectedYear, selectedMonth + 1, 0).toISOString().split('T')[0]
  return {
    startDate,
    endDate,
  }
}

const normalizeMonthlyStatsRow = (row) =>
  MONTHLY_STAT_ROWS.reduce((accumulator, { key }) => {
    SPECIES_KEYS.forEach((species) => {
      accumulator[`${key}_${species}`] = row?.[`${key}_${species}`] || 0
    })
    return accumulator
  }, createEmptyMonthlyStats())

const buildMonthlyStatsPayload = (monthKey, stats) => {
  const payload = { month: monthKey }

  MONTHLY_STAT_ROWS.forEach(({ key }) => {
    SPECIES_KEYS.forEach((species) => {
      payload[`${key}_${species}`] = stats?.[`${key}_${species}`] || 0
    })
  })

  return payload
}

const extractSpecies = (row) => {
  const relatedAnimal = row?.animals
  if (Array.isArray(relatedAnimal)) return relatedAnimal[0]?.species
  if (relatedAnimal && typeof relatedAnimal === 'object') return relatedAnimal.species
  return row?.species
}

const countRowsBySpecies = (rows) => {
  const counts = { dog: 0, cat: 0, cow: 0, other: 0 }
  ;(rows || []).forEach((row) => {
    counts[getSpeciesBucket(extractSpecies(row))] += 1
  })
  return counts
}

const applyCountsToStats = (stats, prefix, counts) => {
  stats[`${prefix}_dog`] = counts.dog
  stats[`${prefix}_cat`] = counts.cat
  stats[`${prefix}_cow`] = counts.cow
  stats[`${prefix}_other`] = counts.other
}

const monthlyStatsSelect = MONTHLY_STAT_ROWS.flatMap(({ key }) => SPECIES_KEYS.map((species) => `${key}_${species}`)).join(', ')

const makeEmptySpeciesCounts = () => ({ dog: 0, cat: 0, cow: 0, other: 0 })

export default function Dashboard() {
  const navigate = useNavigate()
  const [speciesCounts, setSpeciesCounts] = useState({ dog: 0, cat: 0, cow: 0, other: 0 })
  const [loading, setLoading] = useState(true)
  const [showMenu, setShowMenu] = useState(false)
  const [selectedMonth, setSelectedMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))
  const [monthlyStats, setMonthlyStats] = useState(createEmptyMonthlyStats())
  const [savedMonthlyStats, setSavedMonthlyStats] = useState(createEmptyMonthlyStats())
  const [statsLoading, setStatsLoading] = useState(true)
  const [statsError, setStatsError] = useState('')
  const [statsNote, setStatsNote] = useState('')
  const [editingCell, setEditingCell] = useState(null)
  const [editingValue, setEditingValue] = useState('')
  const [savingStats, setSavingStats] = useState(false)

  const selectedMonthKey = formatMonthKey(selectedMonth)
  const currentMonthKey = formatMonthKey(new Date())
  const monthLabel = formatMonthLabel(selectedMonth)
  const isCurrentMonth = selectedMonthKey === currentMonthKey

  const loadMonthlyStats = async (monthDate, { forceLive = false } = {}) => {
    const monthKey = formatMonthKey(monthDate)
    const liveMode = forceLive || monthKey === currentMonthKey
    const { startDate, endDate } = getMonthBounds(monthDate.getFullYear(), monthDate.getMonth())
    setStatsLoading(true)
    setStatsNote('')
    setStatsError('')
    setEditingCell(null)
    setEditingValue('')

    try {
      if (liveMode) {
        let successCount = 0

        const fetchRows = async (queryBuilder, label) => {
          try {
            const { data, error } = await queryBuilder
            if (error) throw error
            successCount += 1
            return data || []
          } catch (error) {
            console.error(`Error fetching ${label}:`, error)
            return []
          }
        }

        const { data: admittedData, error: admittedError } = await supabase
          .from('animals')
          .select('species, ward')
          .in('ward', ['ipd', 'inhouse'])
          .eq('is_active', true)

        if (admittedError) {
          console.error('Admitted fetch error:', admittedError)
        } else {
          successCount += 1
        }

        const [releasedData, deathsData, bloodData, xrayData, surgeryData, opdData, rescueData, adoptedData] = await Promise.all([
          fetchRows(
            supabase
              .from('animals')
              .select('species')
              .eq('current_status', 'released')
              .gte('updated_at', startDate)
              .lte('updated_at', endDate),
            'released stats'
          ),
          fetchRows(
            supabase
              .from('animals')
              .select('species')
              .eq('current_status', 'deceased')
              .gte('updated_at', startDate)
              .lte('updated_at', endDate),
            'death stats'
          ),
          fetchRows(
            supabase
              .from('animal_reports')
              .select('animals(species)')
              .eq('report_type', 'blood_test')
              .gte('created_at', startDate)
              .lte('created_at', endDate),
            'blood test stats'
          ),
          fetchRows(
            supabase
              .from('animal_reports')
              .select('animals(species)')
              .eq('report_type', 'x_ray')
              .gte('created_at', startDate)
              .lte('created_at', endDate),
            'x-ray stats'
          ),
          fetchRows(
            supabase
              .from('surgeries')
              .select('animals(species)')
              .gte('created_at', startDate)
              .lte('created_at', endDate),
            'surgery stats'
          ),
          fetchRows(
            supabase
              .from('animals')
              .select('species')
              .eq('ward', 'opd')
              .gte('admission_date', startDate)
              .lte('admission_date', endDate),
            'OPD stats'
          ),
          fetchRows(
            supabase
              .from('animals')
              .select('species')
              .eq('rescuer_type', 'Rescued Animal')
              .gte('admission_date', startDate)
              .lte('admission_date', endDate),
            'rescue stats'
          ),
          fetchRows(
            supabase
              .from('animals')
              .select('species')
              .eq('current_status', 'adopted')
              .gte('updated_at', startDate)
              .lte('updated_at', endDate),
            'adopted stats'
          ),
        ])

        const liveStats = createEmptyMonthlyStats()
        if (!admittedError) {
          applyCountsToStats(liveStats, 'admitted', {
            dog: admittedData.filter(a => getSpeciesBucket(a.species) === 'dog').length,
            cat: admittedData.filter(a => getSpeciesBucket(a.species) === 'cat').length,
            cow: admittedData.filter(a => getSpeciesBucket(a.species) === 'cow').length,
            other: admittedData.filter(a => getSpeciesBucket(a.species) === 'other').length,
          })
        }
        applyCountsToStats(liveStats, 'released', countRowsBySpecies(releasedData))
        applyCountsToStats(liveStats, 'deaths', countRowsBySpecies(deathsData))
        applyCountsToStats(liveStats, 'blood_test', countRowsBySpecies(bloodData))
        applyCountsToStats(liveStats, 'xray', countRowsBySpecies(xrayData))
        applyCountsToStats(liveStats, 'surgery', countRowsBySpecies(surgeryData))
        applyCountsToStats(liveStats, 'opd', countRowsBySpecies(opdData))
        applyCountsToStats(liveStats, 'rescue', countRowsBySpecies(rescueData))
        applyCountsToStats(liveStats, 'adopted', countRowsBySpecies(adoptedData))

        setMonthlyStats(liveStats)
        setSavedMonthlyStats(liveStats)

        if (successCount === 0) {
          setStatsError('Failed to load monthly stats')
          return
        }

        try {
          const { error } = await supabase.from('monthly_stats').upsert(buildMonthlyStatsPayload(monthKey, liveStats), {
            onConflict: 'month',
          })

          if (error) throw error
        } catch (error) {
          console.error('Error auto-saving current month stats:', error)
        }
        return
      }

      try {
        const { data, error } = await supabase.from('monthly_stats').select(monthlyStatsSelect).eq('month', monthKey).maybeSingle()

        if (error) throw error

        if (data) {
          const savedStats = normalizeMonthlyStatsRow(data)
          setMonthlyStats(savedStats)
          setSavedMonthlyStats(savedStats)
          setStatsNote('')
        } else {
          const emptyStats = createEmptyMonthlyStats()
          setMonthlyStats(emptyStats)
          setSavedMonthlyStats(emptyStats)
          setStatsNote('No data recorded for this month')
        }
      } catch (error) {
        console.error('Error loading monthly stats:', error)
        setStatsError('Failed to load monthly stats')
        const emptyStats = createEmptyMonthlyStats()
        setMonthlyStats(emptyStats)
        setSavedMonthlyStats(emptyStats)
      }
    } catch (error) {
      console.error('Error loading monthly stats:', error)
      setStatsError('Failed to load monthly stats')
    } finally {
      setStatsLoading(false)
    }
  }

  const handleSaveStats = async () => {
    setSavingStats(true)
    try {
      const { error } = await supabase
        .from('monthly_stats')
        .upsert(buildMonthlyStatsPayload(selectedMonthKey, monthlyStats), { onConflict: 'month' })

      if (error) throw error

      setSavedMonthlyStats({ ...monthlyStats })
      setStatsNote('')
      setStatsError('')
      alert('Stats saved successfully!')
    } catch (error) {
      console.error('Error saving stats:', error)
      alert('Failed to save stats')
    } finally {
      setSavingStats(false)
    }
  }

  useEffect(() => {
    const fetchSpeciesCounts = async () => {
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
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchSpeciesCounts()
  }, [])

  useEffect(() => {
    loadMonthlyStats(selectedMonth)
  }, [selectedMonthKey])

  const handlePreviousMonth = () => {
    setSelectedMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
  }

  const handleNextMonth = () => {
    setSelectedMonth((prev) => {
      const next = new Date(prev.getFullYear(), prev.getMonth() + 1, 1)
      return formatMonthKey(next) > currentMonthKey ? prev : next
    })
  }

  const startEditingCell = (cellKey) => {
    setEditingCell(cellKey)
    setEditingValue(String(monthlyStats[cellKey] || 0))
  }

  const commitEditingCell = () => {
    if (!editingCell) return
    const nextValue = Number.parseInt(editingValue, 10)
    setMonthlyStats((prev) => ({
      ...prev,
      [editingCell]: Number.isNaN(nextValue) ? 0 : Math.max(0, nextValue),
    }))
    setEditingCell(null)
    setEditingValue('')
  }

  const cancelEditingCell = () => {
    setEditingCell(null)
    setEditingValue('')
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/', { replace: true })
  }

  const speciesCards = [
    { key: 'dog', label: 'Dogs', emoji: '🐕' },
    { key: 'cat', label: 'Cats', emoji: '🐈' },
    { key: 'cow', label: 'Cows', emoji: '🐄' },
    { key: 'other', label: 'Other', emoji: '🐾' },
  ]

  const hasUnsavedChanges = JSON.stringify(monthlyStats) !== JSON.stringify(savedMonthlyStats)

  const renderEditableCell = (activityKey, species) => {
    const cellKey = `${activityKey}_${species}`
    const value = monthlyStats[cellKey] || 0
    const isEditing = editingCell === cellKey
    const isDirty = monthlyStats[cellKey] !== savedMonthlyStats[cellKey]

    return (
      <td key={cellKey} style={{ padding: '10px 8px', borderBottom: '1px solid #F0F0F0' }}>
        {isEditing ? (
          <input
            type="number"
            min="0"
            autoFocus
            value={editingValue}
            onChange={(e) => setEditingValue(e.target.value)}
            onBlur={commitEditingCell}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitEditingCell()
              if (e.key === 'Escape') cancelEditingCell()
            }}
            style={{
              width: '100%',
              border: '1px solid #D6D6D6',
              borderRadius: '12px',
              padding: '10px 12px',
              fontSize: '20px',
              fontWeight: 700,
              textAlign: 'center',
              color: '#1A1A1A',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        ) : (
          <div
            onClick={() => startEditingCell(cellKey)}
            style={{
              minHeight: '46px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              borderRadius: '12px',
              cursor: 'pointer',
              fontSize: '20px',
              fontWeight: 700,
              color: '#111111',
              userSelect: 'none',
              position: 'relative',
            }}
          >
            <span>{value}</span>
            {isDirty && (
              <span
                title="Manually changed"
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '8px',
                  height: '8px',
                  borderRadius: '999px',
                  background: '#F5C800',
                }}
              />
            )}
          </div>
        )}
      </td>
    )
  }

  const calculateTotal = (activityKey) =>
    SPECIES_KEYS.reduce((sum, species) => sum + (monthlyStats[`${activityKey}_${species}`] || 0), 0)

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
        <style>{`
          @keyframes dashboard-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @media (max-width: 768px) {
            .stats-table th, .stats-table td {
              padding: 6px 4px !important;
              font-size: 13px !important;
            }
            .stats-table td > div {
              min-height: 36px !important;
              font-size: 16px !important;
            }
            .stats-table input {
              font-size: 16px !important;
              padding: 6px 4px !important;
            }
          }
        `}</style>
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
          <div style={{ background: '#F5C800', borderRadius: '18px 18px 0 0', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
            <button
              onClick={handlePreviousMonth}
              style={{ background: 'rgba(0,0,0,0.08)', border: 'none', width: '34px', height: '34px', borderRadius: '999px', cursor: 'pointer', fontSize: '18px', fontWeight: 700, color: '#1A1A1A' }}
              aria-label="Previous month"
            >
              ←
            </button>
            <div style={{ fontSize: '18px', fontWeight: 800, color: '#1A1A1A', textAlign: 'center', flex: 1 }}>
              {monthLabel}
            </div>
            <button
              onClick={handleNextMonth}
              disabled={isCurrentMonth}
              style={{
                background: isCurrentMonth ? 'rgba(0,0,0,0.04)' : 'rgba(0,0,0,0.08)',
                border: 'none',
                width: '34px',
                height: '34px',
                borderRadius: '999px',
                cursor: isCurrentMonth ? 'not-allowed' : 'pointer',
                fontSize: '18px',
                fontWeight: 700,
                color: isCurrentMonth ? '#8A8A8A' : '#1A1A1A'
              }}
              aria-label="Next month"
            >
              →
            </button>
          </div>

          <div style={{ border: '1px solid #F0F0F0', borderTop: 'none', borderRadius: '0 0 18px 18px', overflow: 'hidden', background: '#FFFFFF' }}>
            {statsLoading ? (
              <div style={{ padding: '28px 18px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: '#666' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', border: '3px solid #E5E7EB', borderTopColor: '#F5C800', animation: 'dashboard-spin 0.9s linear infinite' }} />
                <div>Loading monthly stats...</div>
              </div>
            ) : (
              <>
                {statsError && (
                  <div style={{ padding: '12px 14px 0', fontSize: '13px', color: '#B45309' }}>{statsError}</div>
                )}
                {statsNote && (
                  <div style={{ padding: '12px 14px 0', fontSize: '13px', color: '#666' }}>{statsNote}</div>
                )}
                <div style={{ overflowX: 'auto' }}>
                  <table className="stats-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#F5C800' }}>
                        <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '13px', fontWeight: 800, color: '#1A1A1A' }}>Activity</th>
                        <th style={{ padding: '12px 14px', textAlign: 'center', fontSize: '13px', fontWeight: 800, color: '#1A1A1A' }}>Dog</th>
                        <th style={{ padding: '12px 14px', textAlign: 'center', fontSize: '13px', fontWeight: 800, color: '#1A1A1A' }}>Cat</th>
                        <th style={{ padding: '12px 14px', textAlign: 'center', fontSize: '13px', fontWeight: 800, color: '#1A1A1A' }}>Cow</th>
                        <th style={{ padding: '12px 14px', textAlign: 'center', fontSize: '13px', fontWeight: 800, color: '#1A1A1A' }}>Other</th>
                        <th style={{ padding: '12px 14px', textAlign: 'center', fontSize: '13px', fontWeight: 800, color: '#1A1A1A' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {MONTHLY_STAT_ROWS.map(({ key, label }, index) => {
                        return (
                          <tr key={key} style={{ background: index % 2 === 0 ? '#FFFFFF' : '#FAFAFA' }}>
                            <td style={{ padding: '14px', borderBottom: '1px solid #F0F0F0', fontSize: '14px', fontWeight: 600, color: '#1A1A1A' }}>
                              {label}
                            </td>
                            {renderEditableCell(key, 'dog')}
                            {renderEditableCell(key, 'cat')}
                            {renderEditableCell(key, 'cow')}
                            {renderEditableCell(key, 'other')}
                            <td style={{ padding: '10px 14px', borderBottom: '1px solid #F0F0F0', textAlign: 'center', fontSize: '20px', fontWeight: 800, color: '#111111' }}>
                              {calculateTotal(key)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div style={{ padding: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {hasUnsavedChanges && (
                    <button
                      onClick={handleSaveStats}
                      disabled={savingStats}
                      style={{
                        background: '#F5C800',
                        color: '#1A1A1A',
                        border: 'none',
                        borderRadius: '999px',
                        padding: '12px 18px',
                        fontSize: '14px',
                        fontWeight: 800,
                        cursor: savingStats ? 'not-allowed' : 'pointer',
                        opacity: savingStats ? 0.75 : 1,
                      }}
                    >
                      {savingStats ? 'Saving...' : 'Save Changes'}
                    </button>
                  )}

                  {isCurrentMonth && (
                    <button
                      onClick={() => loadMonthlyStats(selectedMonth, { forceLive: true })}
                      disabled={statsLoading}
                      style={{
                        background: '#E5E7EB',
                        color: '#1F2937',
                        border: 'none',
                        borderRadius: '999px',
                        padding: '12px 18px',
                        fontSize: '14px',
                        fontWeight: 800,
                        cursor: statsLoading ? 'not-allowed' : 'pointer',
                        opacity: statsLoading ? 0.75 : 1,
                      }}
                    >
                      Recalculate
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
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
