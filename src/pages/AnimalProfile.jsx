import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState, useContext, useRef } from 'react'
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
    normal: 'Normal',
    paralysed: 'Paralyzed',
    blind: 'Blind',
    neurological: 'Neurological',
    behavioural: 'Behavioral',
    senior: 'Senior Care',
    disabled: 'Disabled',
    chemo: 'Chemo',
  }
  return labels[cat] || cat
}

const getWardLabel = (ward) => {
  const labels = { opd: 'OPD', ipd: 'IPD', inhouse: 'In-House' }
  return labels[ward] || ward
}

const formatDisplayDate = (value) => {
  if (!value) return '—'
  const date = new Date(typeof value === 'string' && !value.includes('T') ? `${value}T00:00:00` : value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

const getReportTypeLabel = (type, customType) => {
  const labels = {
    x_ray: 'X-Ray',
    blood_test: 'Blood Test',
    ultrasound: 'Ultrasound',
    other: customType?.trim() || 'Other',
  }
  return labels[type] || type
}

const todayString = () => new Date().toISOString().split('T')[0]

const sheetInputStyle = {
  width: '100%',
  padding: '10px',
  borderRadius: '8px',
  border: '1px solid #E0E0E0',
  fontSize: '14px',
  boxSizing: 'border-box',
}

const primaryButtonStyle = {
  width: '100%',
  padding: '12px',
  backgroundColor: '#F5C800',
  border: 'none',
  borderRadius: '50px',
  fontWeight: 'bold',
  fontSize: '14px',
  cursor: 'pointer',
  color: '#000',
}

function BottomSheet({ title, onClose, children }) {
  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          zIndex: 1000,
        }}
      />
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: '#FFFFFF',
          borderRadius: '16px 16px 0 0',
          padding: '16px',
          boxShadow: '0 -2px 10px rgba(0,0,0,0.1)',
          maxHeight: '85vh',
          overflowY: 'auto',
          zIndex: 1001,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{title}</h3>
          <button onClick={onClose} type="button" style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>
            ×
          </button>
        </div>
        {children}
      </div>
    </>
  )
}

function PhotoUploadField({ previewUrl, onFileSelect, uploadInputRef, cameraInputRef }) {
  return (
    <div style={{ marginBottom: '12px' }}>
      <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '8px' }}>Photo</label>
      <div style={{ display: 'flex', gap: '12px', marginBottom: previewUrl ? '12px' : 0 }}>
        <button
          type="button"
          onClick={() => uploadInputRef.current?.click()}
          style={{ ...primaryButtonStyle, width: 'auto', flex: 1, borderRadius: '12px', backgroundColor: '#F0F0F0' }}
        >
          Upload Photo
        </button>
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          style={{ ...primaryButtonStyle, width: 'auto', flex: 1, borderRadius: '12px', backgroundColor: '#F0F0F0' }}
        >
          Take Photo
        </button>
      </div>
      <input ref={uploadInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={onFileSelect} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={onFileSelect} />
      {previewUrl && (
        <img
          src={previewUrl}
          alt="Preview"
          style={{ width: '100%', maxHeight: '220px', objectFit: 'contain', borderRadius: '12px', border: '1px solid #E0E0E0', backgroundColor: '#F8F8F8' }}
        />
      )}
    </div>
  )
}

export default function AnimalProfile() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { role } = useContext(AuthContext)

  const [animal, setAnimal] = useState(null)
  const [photos, setPhotos] = useState([])
  const [medicalRecords, setMedicalRecords] = useState([])
  const [treatmentSheets, setTreatmentSheets] = useState([])
  const [reports, setReports] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('details')
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [showPhotoModal, setShowPhotoModal] = useState(false)

  const [showMedicalForm, setShowMedicalForm] = useState(false)
  const [showTreatmentSheetForm, setShowTreatmentSheetForm] = useState(false)
  const [showReportForm, setShowReportForm] = useState(false)

  const [statusUpdate, setStatusUpdate] = useState('')
  const [statusLoading, setStatusLoading] = useState(false)
  const [medicalSaving, setMedicalSaving] = useState(false)
  const [treatmentSheetSaving, setTreatmentSheetSaving] = useState(false)
  const [reportSaving, setReportSaving] = useState(false)
  const [notification, setNotification] = useState(null)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

  const [medicalForm, setMedicalForm] = useState({
    record_date: todayString(),
    doctor_name: '',
    entry: '',
  })

  const [treatmentSheetForm, setTreatmentSheetForm] = useState({
    reporter_name: '',
    file: null,
    previewUrl: '',
  })

  const [reportForm, setReportForm] = useState({
    reporter_name: '',
    report_type: 'x_ray',
    custom_report_type: '',
    file: null,
    previewUrl: '',
  })

  const treatmentUploadRef = useRef(null)
  const treatmentCameraRef = useRef(null)
  const reportUploadRef = useRef(null)
  const reportCameraRef = useRef(null)

  useEffect(() => {
    fetchData()
  }, [id])

  useEffect(() => {
    return () => {
      if (treatmentSheetForm.previewUrl) URL.revokeObjectURL(treatmentSheetForm.previewUrl)
      if (reportForm.previewUrl) URL.revokeObjectURL(reportForm.previewUrl)
    }
  }, [treatmentSheetForm.previewUrl, reportForm.previewUrl])

  const showToast = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const fetchData = async () => {
    try {
      const [animalRes, photosRes, medicalRes, sheetsRes, reportsRes] = await Promise.all([
        supabase.from('animals').select('*').eq('id', id).single(),
        supabase.from('animal_photos').select('*').eq('animal_id', id).order('uploaded_at', { ascending: false }),
        supabase.from('medical_records').select('*').eq('animal_id', id).order('record_date', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('treatment_sheets').select('*').eq('animal_id', id).order('created_at', { ascending: false }),
        supabase.from('animal_reports').select('*').eq('animal_id', id).order('created_at', { ascending: false }),
      ])

      if (animalRes.data) {
        setAnimal(animalRes.data)
        const status = animalRes.data.current_status
        setStatusUpdate(['recovered', 'deceased'].includes(status) ? status : '')
      }
      if (photosRes.data) setPhotos(photosRes.data)
      if (medicalRes.error) console.error('Error fetching medical records:', medicalRes.error)
      else if (medicalRes.data) setMedicalRecords(medicalRes.data)
      if (sheetsRes.error) console.error('Error fetching treatment sheets:', sheetsRes.error)
      else if (sheetsRes.data) setTreatmentSheets(sheetsRes.data)
      if (reportsRes.error) console.error('Error fetching reports:', reportsRes.error)
      else if (reportsRes.data) setReports(reportsRes.data)
    } catch (err) {
      console.error('Error fetching animal data:', err)
    } finally {
      setLoading(false)
    }
  }

  const uploadImage = async (file, folder) => {
    const ext = file.name.split('.').pop() || 'jpg'
    const fileName = `${folder}-${Date.now()}.${ext}`
    const filePath = `${animal.animal_id}/${folder}/${fileName}`

    const { error: uploadError } = await supabase.storage.from('animal-photos').upload(filePath, file)
    if (uploadError) throw uploadError

    const { data: urlData } = supabase.storage.from('animal-photos').getPublicUrl(filePath)
    return urlData.publicUrl
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

  const handleAddMedicalRecord = async (e) => {
    e.preventDefault()
    if (!medicalForm.doctor_name.trim() || !medicalForm.entry.trim()) {
      showToast('error', 'Doctor name and medical entry are required')
      return
    }

    setMedicalSaving(true)
    try {
      const { data, error } = await supabase
        .from('medical_records')
        .insert({
          animal_id: id,
          record_date: medicalForm.record_date,
          doctor_name: medicalForm.doctor_name.trim(),
          entry: medicalForm.entry.trim(),
        })
        .select('*')
        .single()

      if (error) throw error

      setMedicalRecords((prev) => [data, ...prev])
      setShowMedicalForm(false)
      setMedicalForm({ record_date: todayString(), doctor_name: '', entry: '' })
      showToast('success', 'Medical record saved successfully')
    } catch (err) {
      console.error('Error adding medical record:', err)
      showToast('error', `Failed to save medical record: ${err.message}`)
    } finally {
      setMedicalSaving(false)
    }
  }

  const handleTreatmentSheetFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (treatmentSheetForm.previewUrl) URL.revokeObjectURL(treatmentSheetForm.previewUrl)
    setTreatmentSheetForm((prev) => ({
      ...prev,
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    e.target.value = ''
  }

  const handleUploadTreatmentSheet = async (e) => {
    e.preventDefault()
    if (!treatmentSheetForm.reporter_name.trim()) {
      showToast('error', 'Reporter name is required')
      return
    }
    if (!treatmentSheetForm.file) {
      showToast('error', 'Please upload or take a photo')
      return
    }

    setTreatmentSheetSaving(true)
    try {
      const imageUrl = await uploadImage(treatmentSheetForm.file, 'treatment-sheets')
      const { data, error } = await supabase
        .from('treatment_sheets')
        .insert({
          animal_id: id,
          reporter_name: treatmentSheetForm.reporter_name.trim(),
          image_url: imageUrl,
        })
        .select('*')
        .single()

      if (error) throw error

      setTreatmentSheets((prev) => [data, ...prev])
      if (treatmentSheetForm.previewUrl) URL.revokeObjectURL(treatmentSheetForm.previewUrl)
      setTreatmentSheetForm({ reporter_name: '', file: null, previewUrl: '' })
      setShowTreatmentSheetForm(false)
      showToast('success', 'Treatment sheet uploaded successfully')
    } catch (err) {
      console.error('Error uploading treatment sheet:', err)
      showToast('error', `Failed to upload treatment sheet: ${err.message}`)
    } finally {
      setTreatmentSheetSaving(false)
    }
  }

  const handleReportFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (reportForm.previewUrl) URL.revokeObjectURL(reportForm.previewUrl)
    setReportForm((prev) => ({
      ...prev,
      file,
      previewUrl: URL.createObjectURL(file),
    }))
    e.target.value = ''
  }

  const handleUploadReport = async (e) => {
    e.preventDefault()
    if (!reportForm.reporter_name.trim()) {
      showToast('error', 'Reporter name is required')
      return
    }
    if (reportForm.report_type === 'other' && !reportForm.custom_report_type.trim()) {
      showToast('error', 'Please enter a custom report type')
      return
    }
    if (!reportForm.file) {
      showToast('error', 'Please upload or take a photo')
      return
    }

    setReportSaving(true)
    try {
      const imageUrl = await uploadImage(reportForm.file, 'reports')
      const { data, error } = await supabase
        .from('animal_reports')
        .insert({
          animal_id: id,
          reporter_name: reportForm.reporter_name.trim(),
          report_type: reportForm.report_type,
          custom_report_type: reportForm.report_type === 'other' ? reportForm.custom_report_type.trim() : null,
          image_url: imageUrl,
        })
        .select('*')
        .single()

      if (error) throw error

      setReports((prev) => [data, ...prev])
      if (reportForm.previewUrl) URL.revokeObjectURL(reportForm.previewUrl)
      setReportForm({
        reporter_name: '',
        report_type: 'x_ray',
        custom_report_type: '',
        file: null,
        previewUrl: '',
      })
      setShowReportForm(false)
      showToast('success', 'Report uploaded successfully')
    } catch (err) {
      console.error('Error uploading report:', err)
      showToast('error', `Failed to upload report: ${err.message}`)
    } finally {
      setReportSaving(false)
    }
  }

  const handleDeleteAnimal = async () => {
    setDeleteLoading(true)
    setNotification(null)
    try {
      await supabase.from('treatment_sheets').delete().eq('animal_id', id)
      await supabase.from('animal_reports').delete().eq('animal_id', id)
      await supabase.from('medical_records').delete().eq('animal_id', id)
      await supabase.from('treatment_entries').delete().eq('animal_id', id)
      await supabase.from('observation_logs').delete().eq('animal_id', id)
      await supabase.from('animal_photos').delete().eq('animal_id', id)

      try {
        if (animal?.animal_id) {
          const { data: fileList } = await supabase.storage.from('animal-photos').list(animal.animal_id)
          if (fileList?.length > 0) {
            const filesToRemove = fileList.flatMap((item) => {
              if (item.id === null) {
                return [`${animal.animal_id}/${item.name}`]
              }
              return [`${animal.animal_id}/${item.name}`]
            })
            await supabase.storage.from('animal-photos').remove(filesToRemove)
          }
        }
      } catch (storageErr) {
        console.warn('Non-blocking storage cleanup error:', storageErr)
      }

      const { error: animalError } = await supabase.from('animals').delete().eq('id', id)
      if (animalError) throw animalError

      showToast('success', 'Animal deleted successfully')
      setShowDeleteModal(false)
      await new Promise((resolve) => setTimeout(resolve, 1500))

      const wardUrl =
        animal.ward === 'opd' ? '/opd' : animal.ward === 'ipd' ? '/ipd' : animal.ward === 'inhouse' ? '/inhouse' : '/dashboard'
      navigate(wardUrl, { replace: true })
    } catch (err) {
      console.error('Error deleting animal:', err)
      showToast('error', `Failed to delete animal: ${err.message}`)
    } finally {
      setDeleteLoading(false)
    }
  }

  if (loading) return <div style={{ padding: '16px' }}>Loading...</div>
  if (!animal) return <div style={{ padding: '16px' }}>Animal not found</div>

  const ageMonths = animal.estimated_age_months
  const years = Math.floor(ageMonths / 12)
  const months = ageMonths % 12

  const tabs = [
    { key: 'details', label: 'Observation' },
    { key: 'medical', label: 'Medical Record' },
    { key: 'treatment', label: 'Treatment Sheet' },
    { key: 'reports', label: 'Reports' },
  ]

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
          style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
        >
          ←
        </button>
        <h1 style={{ margin: 0, fontSize: '24px', fontWeight: 700, fontFamily: brandFont, flex: 1 }}>Saahas</h1>
        <SaahasLogo size={44} />
      </div>

      <main style={{ flex: 1, paddingBottom: '100px', backgroundColor: '#FFFFFF' }}>
        <div style={{ padding: '16px', backgroundColor: '#FFFFFF', borderBottom: '1px solid #E0E0E0', position: 'relative' }}>
          {role && (role === 'admin' || role === 'doctor') && (
            <div style={{ position: 'absolute', top: '16px', right: '16px', display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={() => navigate('/register', { state: { animal } })}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', padding: 0, lineHeight: 1 }}
                aria-label="Edit animal"
              >
                ✎
              </button>
              <button
                onClick={() => setShowDeleteModal(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="Delete animal"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>
          )}

          <div style={{ display: 'flex', gap: '12px' }}>
            {photos.length > 0 ? (
              <div style={{ position: 'relative' }}>
                <div
                  style={{ width: '80px', height: '80px', borderRadius: '8px', overflow: 'hidden', backgroundColor: '#F5F5F5', cursor: 'pointer' }}
                  onClick={() => {
                    setSelectedPhoto(photos[0])
                    setShowPhotoModal(true)
                  }}
                >
                  <img src={photos[0].photo_url} alt={animal.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                {photos.length > 1 && (
                  <div style={{ display: 'flex', gap: '4px', marginTop: '4px', overflowX: 'auto', scrollBehavior: 'smooth' }}>
                    {photos.slice(1, 4).map((p, i) => (
                      <img
                        key={i}
                        src={p.photo_url}
                        alt=""
                        onClick={() => {
                          setSelectedPhoto(p)
                          setShowPhotoModal(true)
                        }}
                        style={{ width: '40px', height: '40px', borderRadius: '4px', cursor: 'pointer', objectFit: 'cover' }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ width: '80px', height: '80px', borderRadius: '8px', backgroundColor: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px' }}>
                🐾
              </div>
            )}

            <div style={{ flex: 1 }}>
              <h2 style={{ margin: '0 0 4px 0', fontSize: '20px', fontWeight: 'bold', color: '#1A1A1A' }}>{animal.name}</h2>
              <p style={{ margin: '0 0 8px 0', fontSize: '12px', color: '#666' }}>{animal.animal_id}</p>
              <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666' }}>
                {animal.species} • {animal.breed}
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-block', backgroundColor: '#F0F0F0', padding: '4px 8px', borderRadius: '12px', fontSize: '12px' }}>{animal.gender}</span>
                <span
                  style={{
                    display: 'inline-block',
                    backgroundColor: getStatusColor(animal.current_status),
                    color: animal.current_status === 'critical' || animal.current_status === 'moderate' ? '#FFF' : '#000',
                    padding: '4px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                  }}
                >
                  {animal.current_status}
                </span>
                <span style={{ display: 'inline-block', backgroundColor: '#E0E0E0', padding: '4px 8px', borderRadius: '12px', fontSize: '12px' }}>{getWardLabel(animal.ward)}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', padding: '0 12px', borderBottom: '2px solid #E0E0E0', backgroundColor: '#FFFFFF', position: 'sticky', top: 0, zIndex: 10, overflowX: 'auto' }}>
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1,
                minWidth: '96px',
                padding: '14px 12px',
                border: 'none',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: activeTab === tab.key ? 'bold' : 'normal',
                borderBottom: activeTab === tab.key ? '3px solid #F5C800' : 'none',
                color: activeTab === tab.key ? '#F5C800' : '#666',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ padding: '16px' }}>
          {activeTab === 'details' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Rescue Date</label>
                <p style={{ margin: 0, fontSize: '14px', color: '#1A1A1A' }}>{animal.rescue_date || '—'}</p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Admission Date</label>
                <p style={{ margin: 0, fontSize: '14px', color: '#1A1A1A' }}>{animal.admission_date || '—'}</p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Rescue Location</label>
                <p style={{ margin: 0, fontSize: '14px', color: '#1A1A1A' }}>{animal.rescue_location || '—'}</p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Age</label>
                <p style={{ margin: 0, fontSize: '14px', color: '#1A1A1A' }}>
                  {years}y {months}m
                </p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Colour / Marks</label>
                <p style={{ margin: 0, fontSize: '14px', color: '#1A1A1A' }}>{animal.colour || '—'}</p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Category</label>
                <p style={{ margin: 0, fontSize: '14px', color: '#1A1A1A' }}>{getCategoryLabel(animal.category)}</p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>LSS Incharge</label>
                <p style={{ margin: 0, fontSize: '14px', color: '#1A1A1A' }}>{animal.lss_incharge || '—'}</p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Reason for Admission</label>
                <p style={{ margin: 0, fontSize: '14px', color: '#1A1A1A' }}>{animal.reason_for_admission || '—'}</p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Current Condition</label>
                <p style={{ margin: 0, fontSize: '14px', color: '#1A1A1A', whiteSpace: 'pre-wrap' }}>{animal.initial_assessment || '—'}</p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Update Status</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <select
                    value={statusUpdate}
                    onChange={(e) => setStatusUpdate(e.target.value)}
                    style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid #E0E0E0', fontSize: '14px' }}
                  >
                    <option value="">Select status</option>
                    <option value="recovered">Recovered</option>
                    <option value="deceased">Deceased</option>
                  </select>
                  <button
                    onClick={handleStatusUpdate}
                    disabled={statusLoading}
                    style={{ padding: '10px 16px', backgroundColor: '#F5C800', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', color: '#000' }}
                  >
                    {statusLoading ? 'Saving...' : 'Update'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'medical' && (
            <div>
              <button onClick={() => setShowMedicalForm(true)} style={{ ...primaryButtonStyle, marginBottom: '16px' }}>
                + Add Medical Record
              </button>
              {medicalRecords.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666', padding: '20px 0' }}>No medical records yet</p>
              ) : (
                medicalRecords.map((record) => (
                  <div key={record.id} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'baseline', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1A1A1A' }}>{formatDisplayDate(record.record_date)}</span>
                      <span style={{ fontSize: '13px', color: '#666' }}>{record.doctor_name}</span>
                    </div>
                    <div
                      style={{
                        backgroundColor: '#F5F5F5',
                        borderRadius: '12px',
                        padding: '12px',
                        fontSize: '14px',
                        color: '#1A1A1A',
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.5,
                      }}
                    >
                      {record.entry}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'treatment' && (
            <div>
              <button onClick={() => setShowTreatmentSheetForm(true)} style={{ ...primaryButtonStyle, marginBottom: '16px' }}>
                + Upload Treatment Sheet
              </button>
              {treatmentSheets.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666', padding: '20px 0' }}>No treatment sheets yet</p>
              ) : (
                treatmentSheets.map((sheet) => (
                  <div key={sheet.id} style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'baseline', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1A1A1A' }}>{formatDisplayDate(sheet.created_at)}</span>
                      <span style={{ fontSize: '13px', color: '#666' }}>{sheet.reporter_name}</span>
                    </div>
                    <img
                      src={sheet.image_url}
                      alt={`Treatment sheet uploaded by ${sheet.reporter_name}`}
                      style={{ width: '100%', borderRadius: '12px', border: '1px solid #E0E0E0', backgroundColor: '#F8F8F8' }}
                    />
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#999999' }}>Upload X-Rays / Blood Tests / Ultrasound Reports</p>
              <button onClick={() => setShowReportForm(true)} style={{ ...primaryButtonStyle, marginBottom: '16px' }}>
                + Upload Report
              </button>
              {reports.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666', padding: '20px 0' }}>No reports yet</p>
              ) : (
                reports.map((report) => (
                  <div key={report.id} style={{ marginBottom: '20px' }}>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'baseline', marginBottom: '4px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1A1A1A' }}>{formatDisplayDate(report.created_at)}</span>
                      <span style={{ fontSize: '13px', color: '#666' }}>{getReportTypeLabel(report.report_type, report.custom_report_type)}</span>
                    </div>
                    <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#666' }}>{report.reporter_name}</p>
                    <img
                      src={report.image_url}
                      alt={`${getReportTypeLabel(report.report_type, report.custom_report_type)} report`}
                      style={{ width: '100%', borderRadius: '12px', border: '1px solid #E0E0E0', backgroundColor: '#F8F8F8' }}
                    />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {showPhotoModal && (
        <div
          onClick={() => setShowPhotoModal(false)}
          style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
        >
          <img src={selectedPhoto.photo_url} alt="" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: '8px' }} />
        </div>
      )}

      {showMedicalForm && (
        <BottomSheet title="Add Medical Record" onClose={() => !medicalSaving && setShowMedicalForm(false)}>
          <form onSubmit={handleAddMedicalRecord}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Date</label>
              <input
                type="date"
                required
                value={medicalForm.record_date}
                onChange={(e) => setMedicalForm({ ...medicalForm, record_date: e.target.value })}
                style={sheetInputStyle}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Doctor Name</label>
              <input
                type="text"
                required
                placeholder="Enter doctor name"
                value={medicalForm.doctor_name}
                onChange={(e) => setMedicalForm({ ...medicalForm, doctor_name: e.target.value })}
                style={sheetInputStyle}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>New Medical Entry</label>
              <textarea
                required
                placeholder="Enter medical record details"
                value={medicalForm.entry}
                onChange={(e) => setMedicalForm({ ...medicalForm, entry: e.target.value })}
                style={{ ...sheetInputStyle, minHeight: '120px', fontFamily: 'inherit' }}
              />
            </div>
            <button type="submit" disabled={medicalSaving} style={{ ...primaryButtonStyle, opacity: medicalSaving ? 0.7 : 1 }}>
              {medicalSaving ? 'Saving...' : 'Save Medical Record'}
            </button>
          </form>
        </BottomSheet>
      )}

      {showTreatmentSheetForm && (
        <BottomSheet
          title="Upload Treatment Sheet"
          onClose={() => {
            if (!treatmentSheetSaving) {
              if (treatmentSheetForm.previewUrl) URL.revokeObjectURL(treatmentSheetForm.previewUrl)
              setTreatmentSheetForm({ reporter_name: '', file: null, previewUrl: '' })
              setShowTreatmentSheetForm(false)
            }
          }}
        >
          <form onSubmit={handleUploadTreatmentSheet}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Reporter Name</label>
              <input
                type="text"
                required
                placeholder="Enter reporter name"
                value={treatmentSheetForm.reporter_name}
                onChange={(e) => setTreatmentSheetForm({ ...treatmentSheetForm, reporter_name: e.target.value })}
                style={sheetInputStyle}
              />
            </div>
            <PhotoUploadField
              previewUrl={treatmentSheetForm.previewUrl}
              onFileSelect={handleTreatmentSheetFile}
              uploadInputRef={treatmentUploadRef}
              cameraInputRef={treatmentCameraRef}
            />
            <button type="submit" disabled={treatmentSheetSaving} style={{ ...primaryButtonStyle, opacity: treatmentSheetSaving ? 0.7 : 1 }}>
              {treatmentSheetSaving ? 'Uploading...' : 'Save Treatment Sheet'}
            </button>
          </form>
        </BottomSheet>
      )}

      {showReportForm && (
        <BottomSheet
          title="Upload Report"
          onClose={() => {
            if (!reportSaving) {
              if (reportForm.previewUrl) URL.revokeObjectURL(reportForm.previewUrl)
              setReportForm({ reporter_name: '', report_type: 'x_ray', custom_report_type: '', file: null, previewUrl: '' })
              setShowReportForm(false)
            }
          }}
        >
          <form onSubmit={handleUploadReport}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Reporter Name</label>
              <input
                type="text"
                required
                placeholder="Enter reporter name"
                value={reportForm.reporter_name}
                onChange={(e) => setReportForm({ ...reportForm, reporter_name: e.target.value })}
                style={sheetInputStyle}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Report Type</label>
              <select
                value={reportForm.report_type}
                onChange={(e) => setReportForm({ ...reportForm, report_type: e.target.value })}
                style={sheetInputStyle}
              >
                <option value="x_ray">X-Ray</option>
                <option value="blood_test">Blood Test</option>
                <option value="ultrasound">Ultrasound</option>
                <option value="other">Other</option>
              </select>
            </div>
            {reportForm.report_type === 'other' && (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Custom Report Type</label>
                <input
                  type="text"
                  required
                  placeholder="Enter report type"
                  value={reportForm.custom_report_type}
                  onChange={(e) => setReportForm({ ...reportForm, custom_report_type: e.target.value })}
                  style={sheetInputStyle}
                />
              </div>
            )}
            <PhotoUploadField
              previewUrl={reportForm.previewUrl}
              onFileSelect={handleReportFile}
              uploadInputRef={reportUploadRef}
              cameraInputRef={reportCameraRef}
            />
            <button type="submit" disabled={reportSaving} style={{ ...primaryButtonStyle, opacity: reportSaving ? 0.7 : 1 }}>
              {reportSaving ? 'Uploading...' : 'Save Report'}
            </button>
          </form>
        </BottomSheet>
      )}

      {showDeleteModal && (
        <div
          onClick={() => !deleteLoading && setShowDeleteModal(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(3px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '16px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '16px',
              padding: '24px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ fontSize: '48px', margin: '0 auto' }}>⚠️</div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1A1A1A' }}>Delete Animal Profile?</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#666666', lineHeight: '1.5' }}>
              Are you sure you want to permanently delete <strong>{animal?.name}</strong>? This action cannot be undone and will remove all database records, treatment history, observation logs, and photos.
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '50px',
                  border: '1px solid #E0E0E0',
                  backgroundColor: '#FFFFFF',
                  color: '#666666',
                  fontWeight: 'bold',
                  cursor: deleteLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAnimal}
                disabled={deleteLoading}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '50px',
                  border: 'none',
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  fontWeight: 'bold',
                  cursor: deleteLoading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  opacity: deleteLoading ? 0.7 : 1,
                }}
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
