import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState, useLocation } from 'react'
import { supabase } from '../supabaseClient'
import Navbar from '../components/Navbar'

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

  const [animal, setAnimal] = useState(null)
  const [treatments, setTreatments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ drug_name: '', notes: '' })
  const [savingIds, setSavingIds] = useState(new Set())

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const [animalRes, treatmentsRes] = await Promise.all([
        supabase.from('animals').select('*').eq('id', id).single(),
        supabase.from('treatment_entries').select('*').eq('animal_id', id).eq('date', today).order('created_at', { ascending: false })
      ])

      if (animalRes.data) setAnimal(animalRes.data)
      if (treatmentsRes.data) setTreatments(treatmentsRes.data)
    } catch (err) {
      console.error('Error fetching data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckboxChange = async (treatmentId, field) => {
    const treatment = treatments.find(t => t.id === treatmentId)
    if (!treatment) return

    setSavingIds(prev => new Set([...prev, treatmentId]))
    try {
      const updateData = {}
      updateData[field] = !treatment[field]
      await supabase.from('treatment_entries').update(updateData).eq('id', treatmentId)

      setTreatments(prev =>
        prev.map(t => t.id === treatmentId ? { ...t, [field]: !treatment[field] } : t)
      )
    } catch (err) {
      console.error('Error updating treatment:', err)
    } finally {
      setSavingIds(prev => {
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
        evening_given: false
      })

      setFormData({ drug_name: '', notes: '' })
      setShowForm(false)
      await fetchData()
    } catch (err) {
      console.error('Error adding medicine:', err)
    }
  }

  if (loading) return <div style={{ padding: '16px', textAlign: 'center' }}>Loading...</div>
  if (!animal) return <div style={{ padding: '16px', textAlign: 'center' }}>Animal not found</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      <Navbar />
      <main style={{ flex: 1, paddingBottom: '100px', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>
        {/* Back Button */}
        <button onClick={() => navigate(-1)} style={{ position: 'absolute', top: '16px', left: '16px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', zIndex: 10 }}>←</button>

        {/* Top Section */}
        <div style={{ padding: '16px', paddingTop: '48px', backgroundColor: '#FFFFFF', borderBottom: '1px solid #E0E0E0', maxHeight: '150px', display: 'flex', gap: '12px' }}>
          {/* Photo */}
          <div style={{ width: '50px', height: '50px', borderRadius: '50%', backgroundColor: '#F5F5F5', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>🐾</div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ margin: '0 0 2px 0', fontSize: '15px', fontWeight: 'bold', color: '#1A1A1A' }}>{animal.name}</p>
            <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#666' }}>{animal.animal_id}</p>
            <div style={{ display: 'flex', gap: '6px', marginBottom: '6px', flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-block', backgroundColor: '#F0F0F0', padding: '3px 6px', borderRadius: '10px', fontSize: '11px' }}>{animal.admission_date}</span>
              <span style={{ display: 'inline-block', backgroundColor: '#F0F0F0', padding: '3px 6px', borderRadius: '10px', fontSize: '11px' }}>{animal.gender}</span>
            </div>
            <p style={{ margin: '0 0 4px 0', fontSize: '12px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{animal.initial_assessment || 'No details'}</p>
            <span style={{ display: 'inline-block', backgroundColor: getStatusColor(animal.current_status), color: animal.current_status === 'critical' || animal.current_status === 'moderate' ? '#FFF' : '#000', padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>{animal.current_status}</span>
          </div>
        </div>

        {/* Table Section */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
          {treatments.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#666', padding: '32px 16px' }}>
              <p style={{ fontSize: '14px', margin: 0 }}>No medicines for today</p>
            </div>
          ) : (
            <div style={{ marginBottom: '16px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E0E0E0', backgroundColor: '#F9F9F9' }}>
                    <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 'bold', fontSize: '12px' }}>Drug Name</th>
                    <th style={{ textAlign: 'center', padding: '10px 4px', fontWeight: 'bold', fontSize: '12px' }}>M</th>
                    <th style={{ textAlign: 'center', padding: '10px 4px', fontWeight: 'bold', fontSize: '12px' }}>E</th>
                    <th style={{ textAlign: 'left', padding: '10px 8px', fontWeight: 'bold', fontSize: '12px' }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {treatments.map(t => (
                    <tr key={t.id} style={{ borderBottom: '1px solid #E0E0E0' }}>
                      <td style={{ padding: '12px 8px', fontSize: '13px', fontWeight: '500' }}>{t.drug_name}</td>
                      <td style={{ textAlign: 'center', padding: '12px 4px' }}>
                        <input
                          type="checkbox"
                          checked={t.morning_given}
                          onChange={() => handleCheckboxChange(t.id, 'morning_given')}
                          disabled={savingIds.has(t.id)}
                          style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                        />
                      </td>
                      <td style={{ textAlign: 'center', padding: '12px 4px' }}>
                        <input
                          type="checkbox"
                          checked={t.evening_given}
                          onChange={() => handleCheckboxChange(t.id, 'evening_given')}
                          disabled={savingIds.has(t.id)}
                          style={{ cursor: 'pointer', width: '18px', height: '18px' }}
                        />
                      </td>
                      <td style={{ padding: '12px 8px', fontSize: '12px', color: '#666', maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.notes || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Add Medicine Button */}
          <button onClick={() => setShowForm(true)} style={{ width: '100%', padding: '12px', backgroundColor: '#F5C800', border: 'none', borderRadius: '50px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', color: '#000', marginTop: '16px' }}>+ Add Medicine</button>
        </div>
      </main>

      {/* Add Medicine Form Sheet */}
      {showForm && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', borderRadius: '16px 16px 0 0', padding: '16px', boxShadow: '0 -2px 10px rgba(0,0,0,0.1)', maxHeight: '70vh', overflowY: 'auto', zIndex: 1000 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Add Medicine</h3>
            <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
          </div>

          <form onSubmit={handleAddMedicine}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Drug Name *</label>
              <input
                type="text"
                placeholder="e.g. Amoxicillin"
                required
                value={formData.drug_name}
                onChange={(e) => setFormData({ ...formData, drug_name: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E0E0E0', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Notes</label>
              <input
                type="text"
                placeholder="e.g. After food"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E0E0E0', fontSize: '14px', boxSizing: 'border-box' }}
              />
            </div>

            <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#F5C800', border: 'none', borderRadius: '50px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', color: '#000' }}>Save Medicine</button>
          </form>
        </div>
      )}

    </div>
  )
}
