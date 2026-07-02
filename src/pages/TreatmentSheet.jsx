import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { supabase } from '../supabaseClient'
import { ArrowLeft } from 'lucide-react'

const getStatusColor = (status) => {
  if (!status) return '#E0E0E0'
  const s = status.toLowerCase()
  if (s === 'critical') return '#EF4444'
  if (s === 'moderate') return '#F97316'
  if (s === 'stable') return '#22C55E'
  if (s === 'recovered') return '#22C55E'
  return '#E0E0E0'
}

export default function TreatmentSheet() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()

  const today = new Date().toISOString().split('T')[0]

  const [animal, setAnimal] = useState(null)
  const [treatments, setTreatments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ drug_name: '', notes: '' })
  const [savingIds, setSavingIds] = useState(new Set())

  const formatDateDisplay = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00Z')
    const options = { day: 'numeric', month: 'short', year: 'numeric' }
    return date.toLocaleDateString('en-GB', options)
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [animalRes, treatmentsRes] = await Promise.all([
        supabase.from('animals').select('*').eq('id', id).single(),
        supabase.from('treatment_entries').select('*').eq('animal_id', id).order('date', { ascending: false }),
      ])

      if (animalRes.data) setAnimal(animalRes.data)
      if (treatmentsRes.data) setTreatments(treatmentsRes.data)
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (id) fetchData()
  }, [id])

  const groupByDate = () => {
    const groups = {}
    treatments.forEach((t) => {
      if (!groups[t.date]) groups[t.date] = []
      groups[t.date].push(t)
    })
    return Object.entries(groups).sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
  }

  const dateGroups = groupByDate()

  const handleCheckboxChange = async (treatmentId, field) => {
    const treatment = treatments.find((t) => t.id === treatmentId)
    if (!treatment) return
    if (treatment.date !== today) return

    setSavingIds((prev) => new Set([...prev, treatmentId]))
    try {
      const updateData = {}
      updateData[field] = !treatment[field]

      await supabase.from('treatment_entries').update(updateData).eq('id', treatmentId)

      setTreatments((prev) => prev.map((t) => (t.id === treatmentId ? { ...t, [field]: !treatment[field] } : t)))
    } catch (err) {
      console.error('Error updating treatment:', err)
    } finally {
      setSavingIds((prev) => {
        const updated = new Set(prev)
        updated.delete(treatmentId)
        return updated
      })
    }
  }

  const handleAddMedicine = async (e) => {
    e.preventDefault()
    if (!formData.drug_name.trim()) return

    try {
      await supabase.from('treatment_entries').insert({
        animal_id: id,
        drug_name: formData.drug_name,
        notes: formData.notes,
        date: today,
        morning_given: false,
        evening_given: false,
      })

      setFormData({ drug_name: '', notes: '' })
      setShowForm(false)
      await fetchData()
    } catch (err) {
      console.error('Error adding medicine:', err)
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
        <div style={{ padding: '16px', textAlign: 'center' }}>Loading...</div>
      </div>
    )
  }

  if (!animal) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
        <div style={{ padding: '16px', textAlign: 'center' }}>Animal not found</div>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      <div
        style={{
          backgroundColor: '#F5F5F5',
          padding: '16px',
          borderBottomLeftRadius: '16px',
          borderBottomRightRadius: '16px',
          maxHeight: '150px',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            position: 'absolute',
            top: '16px',
            left: '16px',
            background: '#EBEBEB',
            border: 'none',
            borderRadius: '10px',
            width: '34px',
            height: '34px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            padding: 0,
          }}
          aria-label="Go back"
        >
          <ArrowLeft size={18} color="#1A1A1A" />
        </button>

        <div style={{ display: 'flex', gap: '12px', marginLeft: '40px' }}>
          <div
            style={{
              width: '50px',
              height: '50px',
              borderRadius: '50%',
              backgroundColor: '#E0E0E0',
              flexShrink: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
            }}
          >
            {animal.photo ? (
              <img
                src={animal.photo}
                alt={animal.name}
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
            ) : (
              '🐾'
            )}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ marginBottom: '6px' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#000000' }}>{animal.name}</div>
              <div style={{ fontSize: '12px', color: '#666666' }}>{animal.animal_id}</div>
            </div>

            <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
              {animal.gender && (
                <span
                  style={{
                    backgroundColor: '#E0E0E0',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#555555',
                  }}
                >
                  {animal.gender}
                </span>
              )}
              {animal.ward && (
                <span
                  style={{
                    backgroundColor: '#E0E0E0',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    color: '#555555',
                  }}
                >
                  {animal.ward}
                </span>
              )}
              {animal.current_status && (
                <span
                  style={{
                    backgroundColor: getStatusColor(animal.current_status),
                    color:
                      animal.current_status === 'critical' || animal.current_status === 'moderate'
                        ? '#FFFFFF'
                        : '#000000',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                  }}
                >
                  {animal.current_status}
                </span>
              )}
            </div>

            {animal.admission_date && (
              <div style={{ fontSize: '12px', color: '#666666' }}>
                Admitted: {formatDateDisplay(animal.admission_date)}
              </div>
            )}
          </div>
        </div>
      </div>

      <main style={{ flex: 1, paddingBottom: '100px', overflow: 'auto', backgroundColor: '#FFFFFF' }}>
        {treatments.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '80px 16px',
              textAlign: 'center',
              color: '#999999',
            }}
          >
            <div style={{ fontSize: '16px', marginBottom: '24px' }}>No medication records yet</div>
          </div>
        ) : (
          <div style={{ paddingTop: '16px' }}>
            {dateGroups.map(([date, entries]) => {
              const isToday = date === today
              return (
                <div key={date} style={{ paddingLeft: '16px', paddingRight: '16px', marginBottom: '24px' }}>
                  <div
                    style={{
                      fontSize: '14px',
                      fontWeight: 'bold',
                      color: '#000000',
                      marginBottom: '12px',
                      paddingBottom: '8px',
                      borderBottom: '1px solid #E0E0E0',
                    }}
                  >
                    {formatDateDisplay(date)}
                  </div>

                  {entries.map((entry) => {
                    const isSaving = savingIds.has(entry.id)
                    return (
                      <div
                        key={entry.id}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '12px 0',
                          borderBottom: '1px solid #F0F0F0',
                        }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#000000' }}>{entry.drug_name}</div>
                          {entry.notes && <div style={{ fontSize: '12px', color: '#999999', marginTop: '2px' }}>{entry.notes}</div>}
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginLeft: '16px', flexShrink: 0 }}>
                          <button
                            onClick={() => isToday && handleCheckboxChange(entry.id, 'morning_given')}
                            disabled={!isToday || isSaving}
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '8px',
                              border: '2px solid #E0E0E0',
                              backgroundColor: entry.morning_given ? '#F5C800' : '#FFFFFF',
                              cursor: isToday && !isSaving ? 'pointer' : 'not-allowed',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              color: entry.morning_given ? '#000000' : '#999999',
                              transition: 'all 0.2s ease',
                              opacity: isToday && !isSaving ? 1 : 0.6,
                            }}
                            title={isToday ? 'Toggle Morning' : 'Past date - read only'}
                          >
                            {entry.morning_given ? '✓M' : 'M'}
                          </button>

                          <button
                            onClick={() => isToday && handleCheckboxChange(entry.id, 'evening_given')}
                            disabled={!isToday || isSaving}
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '8px',
                              border: '2px solid #E0E0E0',
                              backgroundColor: entry.evening_given ? '#F5C800' : '#FFFFFF',
                              cursor: isToday && !isSaving ? 'pointer' : 'not-allowed',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              color: entry.evening_given ? '#000000' : '#999999',
                              transition: 'all 0.2s ease',
                              opacity: isToday && !isSaving ? 1 : 0.6,
                            }}
                            title={isToday ? 'Toggle Evening' : 'Past date - read only'}
                          >
                            {entry.evening_given ? '✓E' : 'E'}
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </main>

      <button
        onClick={() => setShowForm(true)}
        style={{
          position: 'fixed',
          bottom: '24px',
          left: '16px',
          right: '16px',
          padding: '14px 20px',
          backgroundColor: '#F5C800',
          border: 'none',
          borderRadius: '12px',
          fontSize: '14px',
          fontWeight: '600',
          cursor: 'pointer',
          color: '#000000',
          boxShadow: '0 4px 12px rgba(245, 200, 0, 0.2)',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => (e.target.style.transform = 'translateY(-2px)')}
        onMouseLeave={(e) => (e.target.style.transform = 'translateY(0)')}
      >
        + Add Medicine
      </button>

      {showForm && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            display: 'flex',
            alignItems: 'flex-end',
            zIndex: 1000,
          }}
          onClick={() => setShowForm(false)}
        >
          <div
            style={{
              width: '100%',
              backgroundColor: '#FFFFFF',
              borderRadius: '16px 16px 0 0',
              padding: '20px 16px 24px 16px',
              boxShadow: '0 -4px 12px rgba(0,0,0,0.15)',
              maxHeight: '70vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#000000' }}>Add Medicine</h3>
              <button
                onClick={() => setShowForm(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '28px',
                  cursor: 'pointer',
                  color: '#999999',
                  padding: 0,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleAddMedicine}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#666666', marginBottom: '6px' }}>
                  Drug Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Amoxicillin"
                  required
                  value={formData.drug_name}
                  onChange={(e) => setFormData({ ...formData, drug_name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid #E0E0E0',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#666666', marginBottom: '6px' }}>
                  Notes
                </label>
                <input
                  type="text"
                  placeholder="e.g. After food"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '12px',
                    border: '1px solid #E0E0E0',
                    fontSize: '14px',
                    boxSizing: 'border-box',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              <div
                style={{
                  marginBottom: '20px',
                  padding: '12px 14px',
                  backgroundColor: '#F9F9F9',
                  borderRadius: '12px',
                  fontSize: '13px',
                  color: '#666666',
                }}
              >
                Adding for: <strong>{formatDateDisplay(today)}</strong>
              </div>

              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  backgroundColor: '#F5C800',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  color: '#000000',
                  transition: 'all 0.2s ease',
                }}
              >
                Save Medicine
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
