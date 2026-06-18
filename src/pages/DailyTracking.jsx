import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import SaahasLogo from '../components/SaahasLogo'

export default function DailyTracking() {
  const navigate = useNavigate()
  const dateScrollRef = useRef(null)

  // Get today's date
  const today = new Date()
  const todayString = today.toISOString().split('T')[0]

  // State
  const [selectedDate, setSelectedDate] = useState(todayString)
  const [animals, setAnimals] = useState([])
  const [treatmentEntries, setTreatmentEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [savingIds, setSavingIds] = useState(new Set())

  // Format date for display
  const formatDateDisplay = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00Z')
    const options = { day: 'numeric', month: 'short', year: 'numeric' }
    return date.toLocaleDateString('en-GB', options)
  }

  // Get 7 days (3 past, today, 3 future)
  const getDates = () => {
    const dates = []
    for (let i = -3; i <= 3; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      dates.push(d.toISOString().split('T')[0])
    }
    return dates
  }

  const dates = getDates()

  // Format date for date strip display
  const formatStripDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00Z')
    const day = date.toLocaleDateString('en-GB', { weekday: 'short' })
    const dayNum = date.getDate()
    return `${day} ${dayNum}`
  }

  // Fetch data
  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch all active animals
      const { data: animalsData } = await supabase
        .from('animals')
        .select('*')
        .eq('is_active', true)
        .order('name')

      // Fetch treatment entries for selected date
      const { data: treatmentsData } = await supabase
        .from('treatment_entries')
        .select('*')
        .eq('date', selectedDate)

      if (animalsData) setAnimals(animalsData)
      if (treatmentsData) setTreatmentEntries(treatmentsData)
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch data when selectedDate changes
  useEffect(() => {
    fetchData()
  }, [selectedDate])

  // Build flat list of entries (split morning/evening)
  const buildFlatList = () => {
    const list = []

    treatmentEntries.forEach((entry) => {
      const animal = animals.find((a) => a.id === entry.animal_id)
      if (!animal) return

      // Create Morning entry if morning_given exists
      if (entry.morning_given !== undefined) {
        list.push({
          animal,
          drug_name: entry.drug_name,
          time_slot: 'M',
          given: entry.morning_given,
          treatment_entry_id: entry.id,
          field: 'morning_given',
        })
      }

      // Create Evening entry if evening_given exists
      if (entry.evening_given !== undefined) {
        list.push({
          animal,
          drug_name: entry.drug_name,
          time_slot: 'E',
          given: entry.evening_given,
          treatment_entry_id: entry.id,
          field: 'evening_given',
        })
      }
    })

    // Sort: Morning entries first (by animal name), then Evening entries (by animal name)
    list.sort((a, b) => {
      if (a.time_slot !== b.time_slot) {
        return a.time_slot === 'M' ? -1 : 1
      }
      return a.animal.name.localeCompare(b.animal.name)
    })

    return list
  }

  const flatList = buildFlatList()

  // Filter by search term
  const filtered = flatList.filter((entry) =>
    entry.animal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.animal.animal_id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Handle checkbox toggle
  const handleCheckboxToggle = async (e, entry) => {
    e.stopPropagation()

    setSavingIds((prev) => new Set([...prev, entry.treatment_entry_id]))

    try {
      const updateData = {}
      updateData[entry.field] = !entry.given

      await supabase
        .from('treatment_entries')
        .update(updateData)
        .eq('id', entry.treatment_entry_id)

      // Update local state
      setTreatmentEntries((prev) =>
        prev.map((t) =>
          t.id === entry.treatment_entry_id
            ? { ...t, [entry.field]: !entry.given }
            : t
        )
      )
    } catch (err) {
      console.error('Error updating treatment:', err)
    } finally {
      setSavingIds((prev) => {
        const updated = new Set(prev)
        updated.delete(entry.treatment_entry_id)
        return updated
      })
    }
  }

  // Navigate to treatment sheet
  const handleCardClick = (e, animalId) => {
    e.preventDefault()
    navigate(`/treatment/${animalId}`, { state: { selectedDate } })
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
        <div style={{ padding: '16px', textAlign: 'center' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      {/* TOP BAR */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #E0E0E0',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#000000' }}>
            Daily Tracking
          </h1>
          <span style={{ fontSize: '14px', color: '#000000', fontWeight: '600' }}>
            {formatDateDisplay(selectedDate)}
          </span>
        </div>
        <SaahasLogo size={44} />
      </div>

      {/* DATE STRIP */}
      <div
        ref={dateScrollRef}
        style={{
          display: 'flex',
          gap: '8px',
          padding: '12px 16px',
          overflowX: 'auto',
          overflowY: 'hidden',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E0E0E0',
          scrollBehavior: 'smooth',
        }}
      >
        {dates.map((date) => (
          <button
            key={date}
            onClick={() => setSelectedDate(date)}
            style={{
              flexShrink: 0,
              padding: '10px 16px',
              borderRadius: '12px',
              border: 'none',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              backgroundColor: date === selectedDate ? '#F5C800' : '#E0E0E0',
              color: date === selectedDate ? '#000000' : '#666666',
              transition: 'all 0.2s ease',
            }}
          >
            {formatStripDate(date)}
          </button>
        ))}
      </div>

      {/* SEARCH BAR */}
      <div style={{ padding: '16px' }}>
        <input
          type="text"
          placeholder="Search animal name or ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '12px 16px',
            borderRadius: '12px',
            border: '1px solid #E0E0E0',
            fontSize: '14px',
            boxSizing: 'border-box',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {/* MAIN CONTENT */}
      <main style={{ flex: 1, paddingBottom: '24px', overflow: 'auto' }}>
        {filtered.length === 0 ? (
          // EMPTY STATE
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 16px',
              textAlign: 'center',
              color: '#999999',
            }}
          >
            <div style={{ fontSize: '16px', marginBottom: '16px' }}>
              No medications scheduled for this date
            </div>
            <button
              className="btn"
              onClick={() => navigate('/animal-list')}
              style={{
                marginTop: '12px',
                padding: '10px 20px',
                fontSize: '14px',
              }}
            >
              + Add Medicine
            </button>
          </div>
        ) : (
          // LIST OF ENTRIES
          <div style={{ paddingLeft: '16px', paddingRight: '16px' }}>
            {filtered.map((entry) => {
              const isChecked = entry.given
              const isSaving = savingIds.has(entry.treatment_entry_id)

              return (
                <div
                  key={`${entry.treatment_entry_id}-${entry.time_slot}`}
                  className="card"
                  onClick={(e) => handleCardClick(e, entry.animal.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    cursor: 'pointer',
                    minHeight: '64px',
                    backgroundColor: '#F5F5F5',
                    marginBottom: '12px',
                  }}
                >
                  {/* Animal Photo / Icon */}
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: '#E0E0E0',
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '20px',
                      color: '#999999',
                    }}
                  >
                    {entry.animal.photo ? (
                      <img
                        src={entry.animal.photo}
                        alt={entry.animal.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      '🐾'
                    )}
                  </div>

                  {/* Middle: Name & Drug Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#000000' }}>
                      {entry.animal.name}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: '#666666',
                        display: 'flex',
                        gap: '8px',
                        alignItems: 'center',
                        marginTop: '4px',
                      }}
                    >
                      <span>{entry.drug_name}</span>
                      {entry.animal.ward && (
                        <span
                          style={{
                            backgroundColor: '#E0E0E0',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            color: '#555555',
                          }}
                        >
                          {entry.animal.ward}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right: Time Slot & Checkbox */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '4px',
                      flexShrink: 0,
                    }}
                  >
                    <span style={{ fontSize: '12px', color: '#999999' }}>
                      {entry.time_slot === 'M' ? 'Morning' : 'Evening'}
                    </span>
                    <button
                      onClick={(e) => handleCheckboxToggle(e, entry)}
                      disabled={isSaving}
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '8px',
                        border: '2px solid #E0E0E0',
                        backgroundColor: isChecked ? '#F5C800' : '#FFFFFF',
                        cursor: isSaving ? 'not-allowed' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '18px',
                        color: isChecked ? '#000000' : '#E0E0E0',
                        transition: 'all 0.2s ease',
                        opacity: isSaving ? 0.6 : 1,
                      }}
                    >
                      {isChecked ? '✓' : ''}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
