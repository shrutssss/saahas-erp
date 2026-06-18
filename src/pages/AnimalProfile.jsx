import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState, useContext } from 'react'
import { supabase } from '../supabaseClient'
import { AuthContext } from '../AuthContext'
import SaahasLogo, { brandFont } from '../components/SaahasLogo'

const getStatusColor = (status) => {
  if (!status) return '#E0E0E0'
  const s = status.toLowerCase()
  if (s === 'critical') return '#EF4444'
  if (s === 'moderate') return '#F97316'
  if (s === 'stable') return '#22C55E'
  if (s === 'recovered') return '#22C55E'
  return '#E0E0E0'
}

const getCategoryLabel = (cat) => {
  if (!cat) return ''
  const labels = {
    'normal': 'Normal',
    'paralysed': 'Paralyzed',
    'blind': 'Blind',
    'neurological': 'Neurological',
    'behavioural': 'Behavioral',
    'senior': 'Senior Care',
    'disabled': 'Disabled',
    'chemo': 'Chemo',
  }
  return labels[cat] || cat
}

const getWardLabel = (ward) => {
  const labels = { 'opd': 'OPD', 'ipd': 'IPD', 'inhouse': 'In-House' }
  return labels[ward] || ward
}

const OBS_META_PREFIX = '<!--OBS:'

const encodeObservationNotes = (reporter, initialMedicalAssessment, additionalNotes) => {
  const reporterValue = reporter?.trim() || ''
  const assessmentValue = initialMedicalAssessment?.trim() || ''
  const notesValue = additionalNotes?.trim() || ''

  if (!reporterValue && !assessmentValue) {
    return notesValue || null
  }

  const meta = JSON.stringify({
    reporter: reporterValue,
    initial_medical_assessment: assessmentValue,
  })
  return `${OBS_META_PREFIX}${meta}-->${notesValue ? `\n${notesValue}` : ''}`
}

const getObservationDisplayFields = (obs) => {
  const reporter = obs.reporter?.trim() || ''
  const initialMedicalAssessment = obs.initial_medical_assessment?.trim() || ''
  let additionalNotes = obs.additional_notes || ''

  if (reporter || initialMedicalAssessment) {
    return { reporter, initialMedicalAssessment, additionalNotes }
  }

  if (!additionalNotes.startsWith(OBS_META_PREFIX)) {
    return { reporter: '', initialMedicalAssessment: '', additionalNotes }
  }

  const metaEnd = additionalNotes.indexOf('-->')
  if (metaEnd === -1) {
    return { reporter: '', initialMedicalAssessment: '', additionalNotes }
  }

  try {
    const meta = JSON.parse(additionalNotes.slice(OBS_META_PREFIX.length, metaEnd))
    const cleanNotes = additionalNotes.slice(metaEnd + 3).replace(/^\n/, '')
    return {
      reporter: meta.reporter?.trim() || '',
      initialMedicalAssessment: meta.initial_medical_assessment?.trim() || '',
      additionalNotes: cleanNotes,
    }
  } catch {
    return { reporter: '', initialMedicalAssessment: '', additionalNotes }
  }
}

const isMissingObservationColumnError = (error) => {
  const message = (error?.message || '').toLowerCase()
  return (
    message.includes('reporter') ||
    message.includes('initial_medical_assessment') ||
    message.includes('schema cache')
  )
}

const buildObservationPayload = (animalId, obsForm, updatedBy = null) => {
  const payload = {
    animal_id: animalId,
    weight: obsForm.weight ? parseFloat(obsForm.weight) : null,
    temperature: obsForm.temperature ? parseFloat(obsForm.temperature) : null,
    vomiting: obsForm.vomiting,
    eating_status: obsForm.eating_status,
    loose_motion: obsForm.loose_motion,
    food_given: obsForm.food_given.trim() || null,
    activity_level: obsForm.activity_level,
    additional_notes: obsForm.additional_notes.trim() || null,
  }

  if (updatedBy) {
    payload.updated_by = updatedBy
  }

  return payload
}

const emptyObsForm = () => ({
  reporter: '',
  initial_medical_assessment: '',
  weight: '',
  temperature: '',
  vomiting: false,
  eating_status: 'eating_well',
  loose_motion: false,
  food_given: '',
  activity_level: 'normal',
  additional_notes: '',
})

export default function AnimalProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { role } = useContext(AuthContext)

  const [animal, setAnimal] = useState(null)
  const [photos, setPhotos] = useState([])
  const [observations, setObservations] = useState([])
  const [treatments, setTreatments] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('details')
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [showPhotoModal, setShowPhotoModal] = useState(false)
  const [showObsForm, setShowObsForm] = useState(false)
  const [showMedicineForm, setShowMedicineForm] = useState(false)
  const [photoScroll, setPhotoScroll] = useState(0)

  const [statusUpdate, setStatusUpdate] = useState('')
  const [statusLoading, setStatusLoading] = useState(false)
  const [obsSaving, setObsSaving] = useState(false)
  const [notification, setNotification] = useState(null)

  const [obsForm, setObsForm] = useState({
    reporter: '',
    initial_medical_assessment: '',
    weight: '',
    temperature: '',
    vomiting: false,
    eating_status: 'eating_well',
    loose_motion: false,
    food_given: '',
    activity_level: 'normal',
    additional_notes: ''
  })

  const [medForm, setMedForm] = useState({
    drug_name: '',
    morning_given: false,
    evening_given: false
  })

  useEffect(() => {
    fetchData()
  }, [id])

  const fetchData = async () => {
    try {
      const [animalRes, photosRes, obsRes, treatRes] = await Promise.all([
        supabase.from('animals').select('*').eq('id', id).single(),
        supabase.from('animal_photos').select('*').eq('animal_id', id).order('uploaded_at', { ascending: false }),
        supabase.from('observation_logs').select('*').eq('animal_id', id).order('log_date', { ascending: false }),
        supabase.from('treatment_entries').select('*').eq('animal_id', id).order('date', { ascending: false })
      ])

      if (animalRes.data) {
        setAnimal(animalRes.data)
        const status = animalRes.data.current_status
        setStatusUpdate(['recovered', 'deceased'].includes(status) ? status : '')
      }
      if (photosRes.data) setPhotos(photosRes.data)
      if (obsRes.error) {
        console.error('Error fetching observations:', obsRes.error)
      } else if (obsRes.data) {
        setObservations(obsRes.data)
      }
      if (treatRes.data) setTreatments(treatRes.data)
    } catch (err) {
      console.error('Error fetching animal data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusUpdate = async () => {
    if (!statusUpdate) return
    setStatusLoading(true)
    try {
      await supabase.from('animals').update({ current_status: statusUpdate }).eq('id', id)
      setAnimal({ ...animal, current_status: statusUpdate })
    } catch (err) {
      console.error('Error updating status:', err)
    } finally {
      setStatusLoading(false)
    }
  }

  const handleAddObservation = async (e) => {
    e.preventDefault()
    setObsSaving(true)
    setNotification(null)

    const finishSave = (savedObs) => {
      setObservations((prev) => [savedObs, ...prev])
      setShowObsForm(false)
      setActiveTab('medical')
      setObsForm(emptyObsForm())
      setNotification({ type: 'success', message: 'Observation saved successfully' })
      setTimeout(() => setNotification(null), 3000)
    }

    try {
      const { data: userData } = await supabase.auth.getUser()
      let updatedBy = null

      if (userData?.user?.id) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userData.user.id)
          .maybeSingle()
        if (profile?.id) {
          updatedBy = profile.id
        }
      }

      const payloadWithColumns = {
        ...buildObservationPayload(id, obsForm, updatedBy),
        reporter: obsForm.reporter.trim() || null,
        initial_medical_assessment: obsForm.initial_medical_assessment.trim() || null,
      }

      const { data: savedObs, error } = await supabase
        .from('observation_logs')
        .insert(payloadWithColumns)
        .select('*')
        .single()

      if (!error) {
        finishSave(savedObs)
        return
      }

      if (!isMissingObservationColumnError(error)) {
        throw error
      }

      const fallbackPayload = {
        ...buildObservationPayload(id, obsForm, updatedBy),
        additional_notes: encodeObservationNotes(
          obsForm.reporter,
          obsForm.initial_medical_assessment,
          obsForm.additional_notes
        ),
      }

      const { data: fallbackObs, error: fallbackError } = await supabase
        .from('observation_logs')
        .insert(fallbackPayload)
        .select('*')
        .single()

      if (fallbackError) throw fallbackError

      finishSave(fallbackObs)
    } catch (err) {
      console.error('Error adding observation:', err)
      setNotification({
        type: 'error',
        message: `Failed to save observation: ${err.message}`,
      })
    } finally {
      setObsSaving(false)
    }
  }

  const handleAddMedicine = async (e) => {
    e.preventDefault()
    try {
      await supabase.from('treatment_entries').insert({
        animal_id: id,
        drug_name: medForm.drug_name,
        morning_given: medForm.morning_given,
        evening_given: medForm.evening_given
      })
      setShowMedicineForm(false)
      setMedForm({ drug_name: '', morning_given: false, evening_given: false })
      await fetchData()
    } catch (err) {
      console.error('Error adding medicine:', err)
    }
  }

  if (loading) return <div style={{ padding: '16px' }}>Loading...</div>
  if (!animal) return <div style={{ padding: '16px' }}>Animal not found</div>

  const ageMonths = animal.estimated_age_months
  const years = Math.floor(ageMonths / 12)
  const months = ageMonths % 12

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 2000,
            backgroundColor: notification.type === 'success' ? '#DCFCE7' : '#FEE2E2',
            color: notification.type === 'success' ? '#166534' : '#991B1B',
            border: `1px solid ${notification.type === 'success' ? '#22C55E' : '#EF4444'}`,
            borderRadius: '12px',
            padding: '12px 16px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.12)',
            maxWidth: 'calc(100vw - 32px)',
            width: 'fit-content',
            fontSize: '14px',
            fontWeight: 600,
          }}
        >
          {notification.message}
        </div>
      )}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          padding: '16px',
          background: '#FFFFFF',
          borderBottom: '1px solid #E0E0E0',
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
          }}
        >
          ←
        </button>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, fontFamily: brandFont, flex: 1 }}>
          Saahas
        </h1>
        <SaahasLogo size={44} />
      </div>
      <main style={{ flex: 1, paddingBottom: '100px', backgroundColor: '#FFFFFF' }}>
        {/* Top Section */}
        <div style={{ padding: '16px', backgroundColor: '#FFFFFF', borderBottom: '1px solid #E0E0E0', position: 'relative' }}>
          {role && (role === 'admin' || role === 'doctor') && (
            <button
              onClick={() => navigate('/register', { state: { animal } })}
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
              aria-label="Edit animal"
            >
              ✎
            </button>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            {/* Photo Carousel */}
            {photos.length > 0 ? (
              <div style={{ position: 'relative' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#F5F5F5', cursor: 'pointer' }} onClick={() => { setSelectedPhoto(photos[0]); setShowPhotoModal(true) }}>
                  <img src={photos[0].photo_url} alt={animal.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                {photos.length > 1 && (
                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px', overflowX: 'auto', scrollBehavior: 'smooth' }}>
                    {photos.slice(1, 4).map((p, i) => (
                      <img key={i} src={p.photo_url} alt="" onClick={() => { setSelectedPhoto(p); setShowPhotoModal(true) }} style={{ width: '40px', height: '40px', borderRadius: '4px', cursor: 'pointer', objectFit: 'cover' }} />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ width: '80px', height: '80px', borderRadius: '8px', backgroundColor: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>🐾</div>
            )}

            {/* Info */}
            <div style={{ flex: 1 }}>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 'bold', color: '#1A1A1A' }}>{animal.name}</h2>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#666' }}>{animal.animal_id}</p>
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666' }}>{animal.species} • {animal.breed}</p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-block', backgroundColor: '#F0F0F0', padding: '4px 8px', borderRadius: '12px', fontSize: '12px' }}>{animal.gender}</span>
                <span style={{ display: 'inline-block', backgroundColor: getStatusColor(animal.current_status), color: animal.current_status === 'critical' || animal.current_status === 'moderate' ? '#FFF' : '#000', padding: '4px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold' }}>{animal.current_status}</span>
                <span style={{ display: 'inline-block', backgroundColor: '#E0E0E0', padding: '4px 8px', borderRadius: '12px', fontSize: '12px' }}>{getWardLabel(animal.ward)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '2px solid #E0E0E0', backgroundColor: '#FFFFFF', position: 'sticky', top: '0', zIndex: 10 }}>
          {['details', 'medical', 'treatment'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} style={{ flex: 1, padding: '12px', border: 'none', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '14px', fontWeight: activeTab === tab ? 'bold' : 'normal', borderBottom: activeTab === tab ? '3px solid #F5C800' : 'none', color: activeTab === tab ? '#F5C800' : '#666' }}>
              {tab === 'details' ? 'Observation' : tab === 'medical' ? 'Medical History' : 'Treatment'}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div style={{ padding: '16px' }}>
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Rescue Date</label>
                <p style={{ margin: '0', fontSize: '14px', color: '#1A1A1A' }}>{animal.rescue_date || '—'}</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Admission Date</label>
                <p style={{ margin: '0', fontSize: '14px', color: '#1A1A1A' }}>{animal.admission_date || '—'}</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Rescue Location</label>
                <p style={{ margin: '0', fontSize: '14px', color: '#1A1A1A' }}>{animal.rescue_location || '—'}</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Age</label>
                <p style={{ margin: '0', fontSize: '14px', color: '#1A1A1A' }}>{years}y {months}m</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Colour / Marks</label>
                <p style={{ margin: '0', fontSize: '14px', color: '#1A1A1A' }}>{animal.colour || '—'}</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Category</label>
                <p style={{ margin: '0', fontSize: '14px', color: '#1A1A1A' }}>{getCategoryLabel(animal.category)}</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>LSS Incharge</label>
                <p style={{ margin: '0', fontSize: '14px', color: '#1A1A1A' }}>{animal.lss_incharge || '—'}</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Initial Assessment</label>
                <p style={{ margin: '0', fontSize: '14px', color: '#1A1A1A', whiteSpace: 'pre-wrap' }}>{animal.initial_assessment || '—'}</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Update Status</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select value={statusUpdate} onChange={(e) => setStatusUpdate(e.target.value)} style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #E0E0E0', fontSize: '14px' }}>
                    <option value="">Select status</option>
                    <option value="recovered">Recovered</option>
                    <option value="deceased">Deceased</option>
                  </select>
                  <button onClick={handleStatusUpdate} disabled={statusLoading} style={{ padding: '10px 16px', backgroundColor: '#F5C800', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', color: '#000' }}>
                    {statusLoading ? 'Saving...' : 'Update'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Medical History Tab */}
          {activeTab === 'medical' && (
            <div>
              {observations.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>No observations yet</p>
              ) : (
                <div style={{ marginBottom: '16px' }}>
                  {observations.map(obs => {
                    const { reporter, initialMedicalAssessment, additionalNotes } = getObservationDisplayFields(obs)
                    return (
                    <div key={obs.id} style={{ marginBottom: '16px', borderLeft: '4px solid #F5C800', paddingLeft: '12px' }}>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '8px', alignItems: 'baseline' }}>
                        <p style={{ margin: 0, fontSize: '12px', fontWeight: 'bold', color: '#F5C800' }}>{obs.log_date}</p>
                        <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                          <strong>Reporter:</strong> {reporter || '—'}
                        </p>
                      </div>
                      <p style={{ margin: '4px 0 8px 0', fontSize: '13px', whiteSpace: 'pre-wrap' }}>
                        <strong>Initial Medical Assessment:</strong> {initialMedicalAssessment || '—'}
                      </p>
                      {obs.weight && <p style={{ margin: '4px 0', fontSize: '13px' }}><strong>Weight:</strong> {obs.weight} kg</p>}
                      {obs.temperature && <p style={{ margin: '4px 0', fontSize: '13px' }}><strong>Temp:</strong> {obs.temperature}°C</p>}
                      <p style={{ margin: '4px 0', fontSize: '13px' }}><strong>Eating:</strong> {obs.eating_status}</p>
                      <p style={{ margin: '4px 0', fontSize: '13px' }}><strong>Activity:</strong> {obs.activity_level}</p>
                      {obs.vomiting && <p style={{ margin: '4px 0', fontSize: '13px', color: '#EF4444' }}><strong>Vomiting: Yes</strong></p>}
                      {obs.loose_motion && <p style={{ margin: '4px 0', fontSize: '13px', color: '#EF4444' }}><strong>Loose Motion: Yes</strong></p>}
                      {obs.food_given && <p style={{ margin: '4px 0', fontSize: '13px' }}><strong>Food:</strong> {obs.food_given}</p>}
                      {additionalNotes && <p style={{ margin: '4px 0', fontSize: '13px' }}><strong>Notes:</strong> {additionalNotes}</p>}
                    </div>
                    )
                  })}
                </div>
              )}
              <button onClick={() => setShowObsForm(true)} style={{ width: '100%', padding: '12px', backgroundColor: '#F5C800', border: 'none', borderRadius: '50px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', color: '#000' }}>+ Add Observation</button>
            </div>
          )}

          {/* Treatment Sheet Tab */}
          {activeTab === 'treatment' && (
            <div>
              {treatments.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>No medicines yet</p>
              ) : (
                <table style={{ width: '100%', marginBottom: '16px', borderCollapse: 'collapse', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E0E0E0' }}>
                      <th style={{ textAlign: 'left', padding: '8px', fontWeight: 'bold' }}>Drug</th>
                      <th style={{ textAlign: 'center', padding: '8px', fontWeight: 'bold' }}>M</th>
                      <th style={{ textAlign: 'center', padding: '8px', fontWeight: 'bold' }}>E</th>
                      <th style={{ textAlign: 'left', padding: '8px', fontWeight: 'bold' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {treatments.map(t => (
                      <tr key={t.id} style={{ borderBottom: '1px solid #E0E0E0' }}>
                        <td style={{ padding: '8px' }}>{t.drug_name}</td>
                        <td style={{ textAlign: 'center', padding: '8px' }}>{t.morning_given ? '✓' : '—'}</td>
                        <td style={{ textAlign: 'center', padding: '8px' }}>{t.evening_given ? '✓' : '—'}</td>
                        <td style={{ padding: '8px' }}>{t.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              <button onClick={() => setShowMedicineForm(true)} style={{ width: '100%', padding: '12px', backgroundColor: '#F5C800', border: 'none', borderRadius: '50px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', color: '#000' }}>+ Add Medicine</button>
            </div>
          )}
        </div>
      </main>

      {/* Photo Modal */}
      {showPhotoModal && (
        <div onClick={() => setShowPhotoModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <img src={selectedPhoto.photo_url} alt="" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '8px' }} />
        </div>
      )}

      {/* Observation Form Sheet */}
      {showObsForm && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', borderRadius: '16px 16px 0 0', padding: '16px', boxShadow: '0 -2px 10px rgba(0,0,0,0.1)', maxHeight: '80vh', overflowY: 'auto', zIndex: 1000 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Add Observation</h3>
            <button onClick={() => setShowObsForm(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
          </div>

          <form onSubmit={handleAddObservation}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Reporter</label>
              <input type="text" placeholder="Enter reporter name" value={obsForm.reporter} onChange={(e) => setObsForm({ ...obsForm, reporter: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E0E0E0', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Initial Medical Assessment</label>
              <textarea placeholder="Enter initial medical assessment" value={obsForm.initial_medical_assessment} onChange={(e) => setObsForm({ ...obsForm, initial_medical_assessment: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E0E0E0', fontSize: '14px', boxSizing: 'border-box', minHeight: '80px', fontFamily: 'inherit' }} />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Weight (kg)</label>
              <input type="number" step="0.1" value={obsForm.weight} onChange={(e) => setObsForm({ ...obsForm, weight: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E0E0E0', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Temperature (°C)</label>
              <input type="number" step="0.1" value={obsForm.temperature} onChange={(e) => setObsForm({ ...obsForm, temperature: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E0E0E0', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '8px' }}>Eating Status</label>
              <select value={obsForm.eating_status} onChange={(e) => setObsForm({ ...obsForm, eating_status: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E0E0E0', fontSize: '14px', boxSizing: 'border-box' }}>
                <option value="eating_well">Eating Well</option>
                <option value="not_eating">Not Eating</option>
                <option value="partial">Partial</option>
              </select>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '8px' }}>Activity Level</label>
              <select value={obsForm.activity_level} onChange={(e) => setObsForm({ ...obsForm, activity_level: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E0E0E0', fontSize: '14px', boxSizing: 'border-box' }}>
                <option value="active">Active</option>
                <option value="normal">Normal</option>
                <option value="lethargic">Lethargic</option>
              </select>
            </div>

            <div style={{ marginBottom: '12px', display: 'flex', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}>
                <input type="checkbox" checked={obsForm.vomiting} onChange={(e) => setObsForm({ ...obsForm, vomiting: e.target.checked })} />
                Vomiting
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}>
                <input type="checkbox" checked={obsForm.loose_motion} onChange={(e) => setObsForm({ ...obsForm, loose_motion: e.target.checked })} />
                Loose Motion
              </label>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Food Given</label>
              <input type="text" placeholder="e.g. Rice & dal" value={obsForm.food_given} onChange={(e) => setObsForm({ ...obsForm, food_given: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E0E0E0', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Additional Notes</label>
              <textarea value={obsForm.additional_notes} onChange={(e) => setObsForm({ ...obsForm, additional_notes: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E0E0E0', fontSize: '14px', boxSizing: 'border-box', minHeight: '80px', fontFamily: 'inherit' }} />
            </div>

            <button type="submit" disabled={obsSaving} style={{ width: '100%', padding: '12px', backgroundColor: '#F5C800', border: 'none', borderRadius: '50px', fontWeight: 'bold', fontSize: '14px', cursor: obsSaving ? 'not-allowed' : 'pointer', color: '#000', opacity: obsSaving ? 0.7 : 1 }}>{obsSaving ? 'Saving...' : 'Save Observation'}</button>
          </form>
        </div>
      )}

      {/* Medicine Form Sheet */}
      {showMedicineForm && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', borderRadius: '16px 16px 0 0', padding: '16px', boxShadow: '0 -2px 10px rgba(0,0,0,0.1)', maxHeight: '80vh', overflowY: 'auto', zIndex: 1000 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>Add Medicine</h3>
            <button onClick={() => setShowMedicineForm(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
          </div>

          <form onSubmit={handleAddMedicine}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Drug Name *</label>
              <input type="text" placeholder="e.g. Amoxicillin" required value={medForm.drug_name} onChange={(e) => setMedForm({ ...medForm, drug_name: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #E0E0E0', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>

            <div style={{ marginBottom: '12px', display: 'flex', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}>
                <input type="checkbox" checked={medForm.morning_given} onChange={(e) => setMedForm({ ...medForm, morning_given: e.target.checked })} />
                Morning
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px' }}>
                <input type="checkbox" checked={medForm.evening_given} onChange={(e) => setMedForm({ ...medForm, evening_given: e.target.checked })} />
                Evening
              </label>
            </div>

            <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#F5C800', border: 'none', borderRadius: '50px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer', color: '#000' }}>Save Medicine</button>
          </form>
        </div>
      )}

    </div>
  )
}