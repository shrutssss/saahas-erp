import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState, useContext, useRef } from 'react'
import { supabase } from '../supabaseClient'
import { AuthContext } from '../AuthContext'
import SaahasLogo, { brandFont } from '../components/SaahasLogo'
import { ArrowLeft, Pencil, Trash2, Eye, Activity, Syringe, Bandage, FileText } from 'lucide-react'

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
  const [surgeries, setSurgeries] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('details')
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [showPhotoModal, setShowPhotoModal] = useState(false)

  const [showMedicalForm, setShowMedicalForm] = useState(false)
  const [showTreatmentSheetForm, setShowTreatmentSheetForm] = useState(false)
  const [showReportForm, setShowReportForm] = useState(false);
  const [showSurgeryForm, setShowSurgeryForm] = useState(false);
  const [showRequestTreatmentForm, setShowRequestTreatmentForm] = useState(false);
  const [requestSaving, setRequestSaving] = useState(false)

  const [activeHealthTag, setActiveHealthTag] = useState(null)
  const [showHealthFormModal, setShowHealthFormModal] = useState(false)
  const [showHealthViewModal, setShowHealthViewModal] = useState(false)
  const [showHealthDeleteModal, setShowHealthDeleteModal] = useState(false)
  const [healthForm, setHealthForm] = useState({
    status: '',
    date: todayString(),
    medicineName: '',
    reporterName: '',
  })

  const [showRecoveryModal, setShowRecoveryModal] = useState(false)
  const [recoveryPhotoForm, setRecoveryPhotoForm] = useState({
    file: null,
    previewUrl: ''
  })
  const recoveryUploadRef = useRef(null)
  const recoveryCameraRef = useRef(null)

  const [statusUpdate, setStatusUpdate] = useState('')
  const [statusLoading, setStatusLoading] = useState(false)
  const [medicalSaving, setMedicalSaving] = useState(false)
  const [treatmentSheetSaving, setTreatmentSheetSaving] = useState(false)
  const [reportSaving, setReportSaving] = useState(false)
  const [surgerySaving, setSurgerySaving] = useState(false)
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

  const [surgeryForm, setSurgeryForm] = useState({
    surgery_name: '',
    doctor_name: '',
    surgery_date: todayString(),
    notes: '',
  })
  const [showCustomSurgeryInput, setShowCustomSurgeryInput] = useState(false)

  const treatmentUploadRef = useRef(null)
  const treatmentCameraRef = useRef(null)
  const reportUploadRef = useRef(null)
  const reportCameraRef = useRef(null)

  const getHealthTagConfig = (key) => {
    const configs = {
      vaccinated: { label: 'Vaccinated', fieldLabel: 'Vaccine/Dose Name' },
      rabies: { label: 'Rabies Vaccine', fieldLabel: 'Vaccine/Dose Name' },
      dewormed: { label: 'Dewormed', fieldLabel: 'Deworming Medicine Name' },
      sterilized: { label: 'Neutered/Spayed', fieldLabel: null },
    }
    return configs[key] || {}
  }

  const handleHealthTagClick = (tagKey) => {
    const healthInfo = animal.health_info || {}
    const existing = healthInfo[tagKey]
    
    if (existing && existing.status === 'Yes') {
      setActiveHealthTag(tagKey)
      setShowHealthViewModal(true)
    } else {
      setActiveHealthTag(tagKey)
      setHealthForm({
        status: existing?.status || '',
        date: todayString(),
        medicineName: '',
        reporterName: ''
      })
      setShowHealthFormModal(true)
    }
  }

  const handleSaveHealthInfo = async (e) => {
    e.preventDefault()
    if (!healthForm.status) {
      showToast('error', 'Status is required')
      return
    }

    if (healthForm.status === 'Yes') {
      if (!healthForm.date || !healthForm.reporterName) {
        showToast('error', 'Date and Reporter Name are required when status is Yes')
        return
      }
      const config = getHealthTagConfig(activeHealthTag)
      if (config.fieldLabel && !healthForm.medicineName) {
        showToast('error', `${config.fieldLabel} is required`)
        return
      }
    }

    const newInfo = { ...healthForm }
    if (newInfo.status === 'No') {
      delete newInfo.date
      delete newInfo.medicineName
      delete newInfo.reporterName
    }

    const updatedHealthInfo = { ...(animal.health_info || {}), [activeHealthTag]: newInfo }
    
    try {
      await supabase.from('animals').update({ health_info: updatedHealthInfo }).eq('id', id)
      setAnimal({ ...animal, health_info: updatedHealthInfo })
      setShowHealthFormModal(false)
      setShowHealthViewModal(false)
      showToast('success', `${getHealthTagConfig(activeHealthTag)?.label} status updated`)
    } catch (err) {
      console.error('Error updating health status:', err)
      showToast('error', 'Failed to update health status')
    }
  }

  const handleDeleteHealthInfo = async () => {
    const updatedHealthInfo = { ...(animal.health_info || {}) }
    delete updatedHealthInfo[activeHealthTag]
    
    try {
      await supabase.from('animals').update({ health_info: updatedHealthInfo }).eq('id', id)
      setAnimal({ ...animal, health_info: updatedHealthInfo })
      setShowHealthDeleteModal(false)
      setShowHealthViewModal(false)
      showToast('success', `${getHealthTagConfig(activeHealthTag)?.label} record deleted`)
    } catch (err) {
      console.error('Error deleting health status:', err)
      showToast('error', 'Failed to delete health record')
    }
  }

  const handleEditHealthInfo = () => {
    const existing = animal.health_info?.[activeHealthTag] || {}
    setHealthForm({
      status: existing.status || 'Yes',
      date: existing.date || todayString(),
      medicineName: existing.medicineName || '',
      reporterName: existing.reporterName || ''
    })
    setShowHealthViewModal(false)
    setShowHealthFormModal(true)
  }

  useEffect(() => {
    fetchData()
  }, [id])

  useEffect(() => {
    return () => {
      if (treatmentSheetForm.previewUrl) URL.revokeObjectURL(treatmentSheetForm.previewUrl)
      if (reportForm.previewUrl) URL.revokeObjectURL(reportForm.previewUrl)
      if (recoveryPhotoForm.previewUrl) URL.revokeObjectURL(recoveryPhotoForm.previewUrl)
    }
  }, [treatmentSheetForm.previewUrl, reportForm.previewUrl, recoveryPhotoForm.previewUrl])

  const showToast = (type, message) => {
    setNotification({ type, message })
    setTimeout(() => setNotification(null), 3000)
  }

  const fetchData = async () => {
    try {
      const results = await Promise.all([
        supabase.from('animals').select('*').eq('id', id).single(),
        supabase.from('animal_photos').select('*').eq('animal_id', id).order('uploaded_at', { ascending: false }),
        supabase.from('medical_records').select('*').eq('animal_id', id).order('record_date', { ascending: false }).order('created_at', { ascending: false }),
        supabase.from('treatment_sheets').select('*').eq('animal_id', id).order('created_at', { ascending: false }),
        supabase.from('animal_reports').select('*').eq('animal_id', id).order('created_at', { ascending: false }),
        supabase.from('surgeries').select('*').eq('animal_id', id).order('surgery_date', { ascending: false }),
      ])
      
      const [animalRes, photosRes, medicalRes, sheetsRes, reportsRes, surgeriesRes] = results;

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
      if (surgeriesRes.error) console.error('Error fetching surgeries:', surgeriesRes.error)
      else if (surgeriesRes.data) setSurgeries(surgeriesRes.data)
    } catch (err) {
      console.error('Error fetching animal data:', err)
    } finally {
      setLoading(false)
    }
  }

  const CLOUDINARY_CLOUD_NAME = 'dtixpptzy'
  const CLOUDINARY_UPLOAD_PRESET = 'saahas_unsigned'

  const uploadToCloudinary = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
    
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: 'POST', body: formData }
    )
    
    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Cloudinary upload failed: ${errorData.error?.message}`)
    }
    
    const data = await response.json()
    return data.secure_url
  }

  const handleStatusUpdate = async () => {
    if (!statusUpdate) return
    if (statusUpdate === 'recovered') {
      setShowRecoveryModal(true)
      return
    }

    setStatusLoading(true)
    try {
      await supabase.from('animals').update({ current_status: statusUpdate }).eq('id', id)
      setAnimal({ ...animal, current_status: statusUpdate })
      showToast('success', 'Status updated successfully')
    } catch (err) {
      console.error('Error updating status:', err)
      showToast('error', 'Failed to update status')
    } finally {
      setStatusLoading(false)
    }
  }

  const handleRecoveryPhotoFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (recoveryPhotoForm.previewUrl) URL.revokeObjectURL(recoveryPhotoForm.previewUrl)
    setRecoveryPhotoForm({ file, previewUrl: URL.createObjectURL(file) })
    e.target.value = ''
  }

  const handleSaveRecovery = async (e) => {
    e.preventDefault()
    if (!recoveryPhotoForm.file) {
      showToast('error', 'Please upload or take a recovery photo')
      return
    }

    setStatusLoading(true)
    try {
      const imageUrl = await uploadToCloudinary(recoveryPhotoForm.file)
      
      await supabase.from('animals').update({ 
        current_status: 'recovered',
        recovery_photo_url: imageUrl
      }).eq('id', id)
      
      setAnimal({ ...animal, current_status: 'recovered', recovery_photo_url: imageUrl })
      setShowRecoveryModal(false)
      showToast('success', 'Animal marked as recovered with photo')
    } catch (err) {
      console.error('Error saving recovery:', err)
      showToast('error', `Failed to save recovery: ${err.message}`)
    } finally {
      setStatusLoading(false)
    }
  }

  const handleAddSurgery = async (e) => {
    e.preventDefault()
    if (!surgeryForm.surgery_name.trim() || !surgeryForm.doctor_name.trim()) {
      showToast('error', 'Surgery name and doctor name are required')
      return
    }

    setSurgerySaving(true)
    try {
      const { data, error } = await supabase
        .from('surgeries')
        .insert({
          animal_id: id,
          surgery_name: surgeryForm.surgery_name.trim(),
          doctor_name: surgeryForm.doctor_name.trim(),
          surgery_date: surgeryForm.surgery_date,
          notes: surgeryForm.notes.trim(),
        })
        .select('*')
        .single()

      if (error) throw error

      setSurgeries((prev) => [data, ...prev])
      setShowSurgeryForm(false)
      setShowCustomSurgeryInput(false)
      setSurgeryForm({ surgery_name: '', doctor_name: '', surgery_date: todayString(), notes: '' })
      showToast('success', 'Surgery record saved successfully')
    } catch (err) {
      console.error('Error adding surgery record:', err)
      showToast('error', `Failed to save surgery record: ${err.message}`)
    } finally {
      setSurgerySaving(false)
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
      setMedicalSaving(false);
  }
}

  const handleRequestTreatment = async () => {
    setRequestSaving(true);
    try {
      await supabase.from('animals').update({ requires_vet_attention: true }).eq('id', id);
      setAnimal((prev) => ({ ...prev, requires_vet_attention: true }));
      showToast('success', 'Treatment request submitted');
      setShowRequestTreatmentForm(false);
    } catch (err) {
      console.error('Error requesting treatment:', err);
      showToast('error', `Failed to request treatment: ${err.message}`);
    } finally {
      setRequestSaving(false);
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
      const imageUrl = await uploadToCloudinary(treatmentSheetForm.file)
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
      const imageUrl = await uploadToCloudinary(reportForm.file)
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
      await supabase.from('surgeries').delete().eq('animal_id', id)

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
    { key: 'details', label: 'Observation', Icon: Eye },
    { key: 'medical', label: 'Medical Record', Icon: Activity },
    { key: 'surgery', label: 'Surgery', Icon: Syringe },
    { key: 'treatment', label: 'Treatment Sheet', Icon: Bandage },
    { key: 'reports', label: 'Reports', Icon: FileText },
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
          gap: '12px',
          padding: '14px 16px',
          background: '#FFFFFF',
          borderBottom: '1px solid #F0F0F0',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            background: '#F5F5F5',
            border: 'none',
            borderRadius: '10px',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <ArrowLeft size={20} color="#1A1A1A" />
        </button>
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, fontFamily: brandFont, flex: 1, color: '#1A1A1A' }}>Saahas</h1>
        <SaahasLogo size={36} />
      </div>

      <main style={{ flex: 1, paddingBottom: '100px', backgroundColor: '#FFFFFF' }}>
        <div style={{ padding: '16px', paddingBottom: '24px', backgroundColor: '#FFFFFF', borderBottom: 'none', position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
              <div style={{ flex: 1, minWidth: '140px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '8px', textAlign: 'center' }}>On admission</label>
                {photos.length > 0 ? (
                  <div
                    style={{ width: '100%', aspectRatio: '1/1', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#F5F5F5', cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedPhoto(photos[0])
                      setShowPhotoModal(true)
                    }}
                  >
                    <img src={photos[0].photo_url} alt="On admission" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div style={{ width: '100%', aspectRatio: '1/1', borderRadius: '12px', backgroundColor: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px' }}>
                    🐾
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: '140px', display: 'flex', flexDirection: 'column' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '8px', textAlign: 'center' }}>On Release</label>
                {animal.recovery_photo_url ? (
                  <div
                    style={{ width: '100%', aspectRatio: '1/1', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#F5F5F5', cursor: 'pointer' }}
                    onClick={() => {
                      setSelectedPhoto({ photo_url: animal.recovery_photo_url })
                      setShowPhotoModal(true)
                    }}
                  >
                    <img src={animal.recovery_photo_url} alt="On Release" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ) : (
                  <div
                    onClick={() => setShowRecoveryModal(true)}
                    style={{ cursor: 'pointer', width: '100%', aspectRatio: '1/1', borderRadius: '12px', backgroundColor: '#F8F8F8', border: '1px dashed #D0D0D0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', color: '#999', textAlign: 'center', padding: '8px', flex: 1 }}
                  >
                    + Add On Release<br/>Photo
                  </div>
                )}
              </div>
            </div>
            
            {photos.length > 1 && (
              <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', scrollBehavior: 'smooth' }}>
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

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#1A1A1A' }}>{animal.name}</h2>
                  <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>{animal.animal_id}</p>
                </div>
                {role && (role === 'admin' || role === 'doctor') && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => navigate('/register', { state: { animal } })}
                      style={{ background: '#F5F5F5', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      aria-label="Edit animal"
                    >
                      <Pencil size={15} color="#555" />
                    </button>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      style={{ background: '#FEE2E2', border: 'none', borderRadius: '8px', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      aria-label="Delete animal"
                    >
                      <Trash2 size={15} color="#EF4444" />
                    </button>
                  </div>
                )}
              </div>
              <p style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#666' }}>
                {animal.species} • {animal.breed}
              </p>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginBottom: '24px' }}>
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
              
              <div style={{ display: 'flex' }}>
                {['vaccinated', 'rabies', 'dewormed', 'sterilized'].map((tagKey, index) => {
                  const info = animal.health_info?.[tagKey]
                  const config = getHealthTagConfig(tagKey)
                  const isDone = config.fieldLabel === null 
                    ? (info?.status === 'Yes')
                    : (info?.status === 'Yes' && !!info?.medicineName && info.medicineName.trim() !== '')

                  return (
                    <div
                      key={tagKey}
                      onClick={() => handleHealthTagClick(tagKey)}
                      style={{
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'flex-start',
                        padding: '4px',
                        cursor: 'pointer',
                        borderRight: index < 3 ? '1px solid #E0E0E0' : 'none',
                        textAlign: 'center'
                      }}
                    >
                      <div style={{
                        width: '14px', height: '14px', borderRadius: '50%',
                        backgroundColor: isDone ? '#22C55E' : '#EF4444',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        marginBottom: '6px'
                      }}>
                        {isDone ? (
                          <span style={{ color: '#FFF', fontSize: '10px', lineHeight: 1 }}>✓</span>
                        ) : (
                          <span style={{ color: '#FFF', fontSize: '10px', lineHeight: 1 }}>✕</span>
                        )}
                      </div>
                      <span style={{ fontSize: '10px', color: '#999', fontWeight: 600, lineHeight: 1.2 }}>{config.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', borderBottom: '1px solid #E0E0E0', backgroundColor: '#FFFFFF', position: 'sticky', top: 0, zIndex: 10 }}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-start',
                  padding: '10px 4px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  cursor: 'pointer',
                  color: isActive ? '#F5C800' : '#666',
                  borderBottom: isActive ? '3px solid #F5C800' : '3px solid transparent',
                  position: 'relative'
                }}
              >
                <tab.Icon size={18} color="#999" style={{ marginBottom: '6px' }} />
                <span style={{
                  fontSize: '10px',
                  fontWeight: isActive ? 'bold' : '600',
                  lineHeight: 1.2,
                  textAlign: 'center',
                  whiteSpace: 'normal',
                  wordWrap: 'break-word',
                  maxWidth: '100%'
                }}>
                  {tab.label}
                </span>
              </button>
            )
          })}
        </div>

        <div style={{ padding: '16px' }}>
          {activeTab === 'details' && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '4px' }}>Rescue Date</label>
                <p style={{ margin: 0, fontSize: '14px', color: '#1A1A1A' }}>{animal.rescue_date || '—'}</p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '4px' }}>Admission Date</label>
                <p style={{ margin: 0, fontSize: '14px', color: '#1A1A1A' }}>{animal.admission_date || '—'}</p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '4px' }}>Rescue Location</label>
                <p style={{ margin: 0, fontSize: '14px', color: '#1A1A1A' }}>{animal.rescue_location || '—'}</p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '4px' }}>Age</label>
                <p style={{ margin: 0, fontSize: '14px', color: '#1A1A1A' }}>
                  {years}y {months}m
                </p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '4px' }}>Colour / Marks</label>
                <p style={{ margin: 0, fontSize: '14px', color: '#1A1A1A' }}>{animal.colour || '—'}</p>
              </div>
              {animal.ward && animal.ward.toLowerCase() !== 'opd' && (
                <div style={{ marginBottom: '16px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '4px' }}>Category</label>
                  <p style={{ margin: 0, fontSize: '14px', color: '#1A1A1A' }}>{getCategoryLabel(animal.category)}</p>
                </div>
              )}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '4px' }}>LSS Incharge</label>
                <p style={{ margin: 0, fontSize: '14px', color: '#1A1A1A' }}>{animal.lss_incharge || '—'}</p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '4px' }}>Reason for Admission</label>
                <p style={{ margin: 0, fontSize: '14px', color: '#1A1A1A' }}>{animal.reason_for_admission || '—'}</p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '4px' }}>Current Condition</label>
                <p style={{ margin: 0, fontSize: '14px', color: '#1A1A1A', whiteSpace: 'pre-wrap' }}>{animal.initial_assessment || '—'}</p>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '4px' }}>Rescuer / Reporter</label>
                <p style={{ margin: 0, fontSize: '14px', color: '#1A1A1A' }}>{animal.rescuer_type || 'Rescued Animal'}</p>
              </div>
              {animal.rescuer_type === 'Animal Bought by Reporter' && (
                <div style={{ marginBottom: '16px', backgroundColor: '#F8F8F8', padding: '12px', borderRadius: '8px', border: '1px solid #E0E0E0' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#999', marginBottom: '8px', fontWeight: 'bold' }}>Reporter Details</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div>
                      <span style={{ fontSize: '12px', color: '#999' }}>Name:</span>
                      <p style={{ margin: 0, fontSize: '14px', color: '#1A1A1A' }}>{animal.reporter_name || '—'}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#999' }}>Address:</span>
                      <p style={{ margin: 0, fontSize: '14px', color: '#1A1A1A' }}>{animal.reporter_address || '—'}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#999' }}>Phone:</span>
                      <p style={{ margin: 0, fontSize: '14px', color: '#1A1A1A' }}>{animal.reporter_phone || '—'}</p>
                    </div>
                    <div>
                      <span style={{ fontSize: '12px', color: '#999' }}>Aadhaar URL:</span>
                      {animal.reporter_aadhaar_url ? (
                        <a href={animal.reporter_aadhaar_url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', fontSize: '14px', color: '#2563EB', textDecoration: 'underline' }}>View Aadhaar</a>
                      ) : (
                        <p style={{ margin: 0, fontSize: '14px', color: '#1A1A1A' }}>—</p>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
              <button onClick={() => setShowMedicalForm(true)} style={{ ...primaryButtonStyle, marginBottom: '8px' }}>
                  + Add Medical Record
                </button>
                <button onClick={() => setShowRequestTreatmentForm(true)} style={{ ...primaryButtonStyle, backgroundColor: '#F5C800', marginBottom: '16px' }}>
                  Request Treatment
                </button>
                {showRequestTreatmentForm && (
                  <BottomSheet title="Request Treatment" onClose={() => !requestSaving && setShowRequestTreatmentForm(false)}>
                    <div style={{ marginBottom: '12px' }}>
                      <p>Confirm you want to request veterinary attention for this animal?</p>
                    </div>
                    <button type="button" onClick={handleRequestTreatment} disabled={requestSaving} style={{ ...primaryButtonStyle, backgroundColor: '#F5C800' }}>
                      {requestSaving ? 'Requesting...' : 'Confirm Request'}
                    </button>
                  </BottomSheet>
                )}
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

          {activeTab === 'surgery' && (
            <div>
              {role && (role === 'admin' || role === 'doctor') && (
                <button onClick={() => setShowSurgeryForm(true)} style={{ ...primaryButtonStyle, marginBottom: '16px' }}>
                  + Add Surgery
                </button>
              )}
              {surgeries.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666', padding: '20px 0' }}>No surgeries yet</p>
              ) : (
                surgeries.map((surgery) => (
                  <div key={surgery.id} style={{ marginBottom: '16px' }}>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'baseline', marginBottom: '8px', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', fontWeight: 'bold', color: '#1A1A1A' }}>Date: {formatDisplayDate(surgery.surgery_date)}</span>
                      <span style={{ fontSize: '13px', color: '#1A1A1A' }}>Doctor: {surgery.doctor_name || '—'}</span>
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#1A1A1A', marginBottom: '8px' }}>
                      {surgery.surgery_name}
                    </div>
                    {surgery.notes && (
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
                        {surgery.notes}
                      </div>
                    )}
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

      {showSurgeryForm && (
        <BottomSheet title="Add Surgery" onClose={() => {
          if (!surgerySaving) {
            setShowSurgeryForm(false)
            setShowCustomSurgeryInput(false)
          }
        }}>
          <form onSubmit={handleAddSurgery}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Date</label>
              <input
                type="date"
                required
                value={surgeryForm.surgery_date}
                onChange={(e) => setSurgeryForm({ ...surgeryForm, surgery_date: e.target.value })}
                style={sheetInputStyle}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Surgery Name</label>
              {showCustomSurgeryInput ? (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    required
                    placeholder="Enter surgery name"
                    value={surgeryForm.surgery_name}
                    onChange={(e) => setSurgeryForm({ ...surgeryForm, surgery_name: e.target.value })}
                    style={{ ...sheetInputStyle, flex: 1 }}
                  />
                  <button type="button" onClick={() => {
                    setShowCustomSurgeryInput(false)
                    setSurgeryForm({ ...surgeryForm, surgery_name: '' })
                  }} style={{ background: 'none', border: 'none', fontSize: '12px', color: '#2563EB', cursor: 'pointer', textDecoration: 'underline' }}>
                    Select from list
                  </button>
                </div>
              ) : (
                <select
                  required
                  value={surgeryForm.surgery_name}
                  onChange={(e) => {
                    if (e.target.value === 'Others') {
                      setShowCustomSurgeryInput(true)
                      setSurgeryForm({ ...surgeryForm, surgery_name: '' })
                    } else {
                      setSurgeryForm({ ...surgeryForm, surgery_name: e.target.value })
                    }
                  }}
                  style={sheetInputStyle}
                >
                  <option value="">Select Surgery</option>
                  <option value="ABC">ABC</option>
                  <option value="Enucleation (Eye Removal)">Enucleation (Eye Removal)</option>
                  <option value="Tumor Removal">Tumor Removal</option>
                  <option value="Amputation">Amputation</option>
                  <option value="Jaw Repair">Jaw Repair</option>
                  <option value="Hernia Repair">Hernia Repair</option>
                  <option value="Others">Others</option>
                </select>
              )}
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Doctor Name</label>
              <input
                type="text"
                required
                placeholder="Enter doctor name"
                value={surgeryForm.doctor_name}
                onChange={(e) => setSurgeryForm({ ...surgeryForm, doctor_name: e.target.value })}
                style={sheetInputStyle}
              />
            </div>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Notes (Optional)</label>
              <textarea
                placeholder="Enter additional notes or surgeon name"
                value={surgeryForm.notes}
                onChange={(e) => setSurgeryForm({ ...surgeryForm, notes: e.target.value })}
                style={{ ...sheetInputStyle, minHeight: '80px', fontFamily: 'inherit' }}
              />
            </div>
            <button type="submit" disabled={surgerySaving} style={{ ...primaryButtonStyle, opacity: surgerySaving ? 0.7 : 1 }}>
              {surgerySaving ? 'Saving...' : 'Save Surgery'}
            </button>
          </form>
        </BottomSheet>
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

      {showHealthFormModal && (
        <BottomSheet
          title={`Update ${getHealthTagConfig(activeHealthTag)?.label}`}
          onClose={() => setShowHealthFormModal(false)}
        >
          <form onSubmit={handleSaveHealthInfo}>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Status</label>
              <select
                value={healthForm.status}
                onChange={(e) => setHealthForm({ ...healthForm, status: e.target.value })}
                style={sheetInputStyle}
                required
              >
                <option value="">Select status</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
            {healthForm.status === 'Yes' && (
              <>
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Date</label>
                  <input
                    type="date"
                    required
                    value={healthForm.date}
                    onChange={(e) => setHealthForm({ ...healthForm, date: e.target.value })}
                    style={sheetInputStyle}
                  />
                </div>
                {getHealthTagConfig(activeHealthTag)?.fieldLabel && (
                  <div style={{ marginBottom: '12px' }}>
                    <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>{getHealthTagConfig(activeHealthTag).fieldLabel}</label>
                    <input
                      type="text"
                      required
                      placeholder={`Enter ${getHealthTagConfig(activeHealthTag).fieldLabel.toLowerCase()}`}
                      value={healthForm.medicineName}
                      onChange={(e) => setHealthForm({ ...healthForm, medicineName: e.target.value })}
                      style={sheetInputStyle}
                    />
                  </div>
                )}
                <div style={{ marginBottom: '12px' }}>
                  <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Reporter Name</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter reporter name"
                    value={healthForm.reporterName}
                    onChange={(e) => setHealthForm({ ...healthForm, reporterName: e.target.value })}
                    style={sheetInputStyle}
                  />
                </div>
              </>
            )}
            <button type="submit" style={primaryButtonStyle}>
              Save
            </button>
          </form>
        </BottomSheet>
      )}

      {showHealthViewModal && (
        <BottomSheet
          title={`${getHealthTagConfig(activeHealthTag)?.label} Details`}
          onClose={() => setShowHealthViewModal(false)}
        >
          <div style={{ padding: '8px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '16px', marginBottom: '16px' }}>
              <button
                onClick={handleEditHealthInfo}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                aria-label="Edit"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
              </button>
              <button
                onClick={() => setShowHealthDeleteModal(true)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                aria-label="Delete"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000000" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Status</label>
              <p style={{ margin: 0, fontSize: '14px', color: '#1A1A1A' }}>{animal.health_info?.[activeHealthTag]?.status}</p>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Date</label>
              <p style={{ margin: 0, fontSize: '14px', color: '#1A1A1A' }}>{formatDisplayDate(animal.health_info?.[activeHealthTag]?.date)}</p>
            </div>
            {getHealthTagConfig(activeHealthTag)?.fieldLabel && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>{getHealthTagConfig(activeHealthTag).fieldLabel}</label>
                <p style={{ margin: 0, fontSize: '14px', color: '#1A1A1A' }}>{animal.health_info?.[activeHealthTag]?.medicineName}</p>
              </div>
            )}
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#666', marginBottom: '4px' }}>Reporter Name</label>
              <p style={{ margin: 0, fontSize: '14px', color: '#1A1A1A' }}>{animal.health_info?.[activeHealthTag]?.reporterName}</p>
            </div>
          </div>
        </BottomSheet>
      )}

      {showHealthDeleteModal && (
        <div
          onClick={() => setShowHealthDeleteModal(false)}
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
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#1A1A1A' }}>Delete Record?</h3>
            <p style={{ margin: 0, fontSize: '14px', color: '#666666', lineHeight: '1.5' }}>
              Are you sure you want to delete this {getHealthTagConfig(activeHealthTag)?.label} record?
            </p>
            <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={() => setShowHealthDeleteModal(false)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '50px',
                  border: '1px solid #E0E0E0',
                  backgroundColor: '#FFFFFF',
                  color: '#666666',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteHealthInfo}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '50px',
                  border: 'none',
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  fontSize: '14px',
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {showRecoveryModal && (
        <BottomSheet
          title="Recovered - Add After Photo"
          onClose={() => {
            if (!statusLoading) {
              if (recoveryPhotoForm.previewUrl) URL.revokeObjectURL(recoveryPhotoForm.previewUrl)
              setRecoveryPhotoForm({ file: null, previewUrl: '' })
              setShowRecoveryModal(false)
              setStatusUpdate(animal.current_status)
            }
          }}
        >
          <form onSubmit={handleSaveRecovery}>
            <PhotoUploadField
              previewUrl={recoveryPhotoForm.previewUrl}
              onFileSelect={handleRecoveryPhotoFile}
              uploadInputRef={recoveryUploadRef}
              cameraInputRef={recoveryCameraRef}
            />
            <button type="submit" disabled={statusLoading} style={{ ...primaryButtonStyle, opacity: statusLoading ? 0.7 : 1 }}>
              {statusLoading ? 'Saving...' : 'Save Recovery'}
            </button>
          </form>
        </BottomSheet>
      )}
    </div>
  )
}
