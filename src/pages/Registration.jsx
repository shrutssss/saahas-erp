import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { ArrowLeft } from 'lucide-react'

function DateInput({ value, onChange, label, required }) {
  const [displayValue, setDisplayValue] = useState(() => {
    if (!value) return ''
    const parts = value.split('-')
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
    return value
  })

  useEffect(() => {
    if (!value) {
      setDisplayValue('')
      return
    }

    const parts = value.split('-')
    if (parts.length === 3) {
      setDisplayValue(`${parts[2]}/${parts[1]}/${parts[0]}`)
      return
    }

    setDisplayValue(value)
  }, [value])

  const handleChange = (e) => {
    let input = e.target.value
    input = input.replace(/\D/g, '')
    if (input.length >= 3 && input.length <= 4) {
      input = input.slice(0, 2) + '/' + input.slice(2)
    } else if (input.length >= 5) {
      input = input.slice(0, 2) + '/' + input.slice(2, 4) + '/' + input.slice(4, 8)
    }

    setDisplayValue(input)

    const digits = input.replace(/\D/g, '')
    if (digits.length === 8) {
      const dd = input.slice(0, 2)
      const mm = input.slice(3, 5)
      const yyyy = input.slice(6, 10)
      const isoDate = `${yyyy}-${mm}-${dd}`
      const dateObj = new Date(isoDate)
      if (!isNaN(dateObj.getTime())) {
        onChange(isoDate)
      }
    } else if (digits.length === 0) {
      onChange(null)
    }
  }

  return (
    <div>
      {label && <label style={{ display: 'block', marginBottom: 6, fontSize: 14, fontWeight: 600 }}>{label}{required && ' *'}</label>}
      <input
        type="text"
        inputMode="numeric"
        placeholder="DD/MM/YYYY"
        value={displayValue}
        onChange={handleChange}
        maxLength={10}
        style={{
          width: '100%',
          background: '#F0F0F0',
          border: 'none',
          borderRadius: 12,
          padding: 14,
          fontSize: 16,
          fontFamily: 'inherit'
        }}
      />
    </div>
  )
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
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.4)', zIndex: 1000 }} />
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#FFFFFF', borderRadius: '16px 16px 0 0', padding: '16px', boxShadow: '0 -2px 10px rgba(0,0,0,0.1)', maxHeight: '85vh', overflowY: 'auto', zIndex: 1001 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold' }}>{title}</h3>
          <button onClick={onClose} type="button" style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
        </div>
        {children}
      </div>
    </>
  )
}

export default function Registration() {
  const navigate = useNavigate()
  const location = useLocation()
  const editAnimal = location.state?.animal || null
  const isEditMode = Boolean(editAnimal)
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState(null)
  
  const [reporterPhotoFile, setReporterPhotoFile] = useState(null)
  const animalCameraInputRef = useRef(null)
  const animalUploadInputRef = useRef(null)
  const [formData, setFormData] = useState({
    name: '',
    species: 'dog',
    breed: '',
    gender: '',
    years: '',
    months: '',
    colour: '',
    rescue_date: '',
    rescue_location: '',
    ward: '',
    category: '',
    lss_incharge: '',
    initial_assessment: '',
    reason_for_admission: '',
    rescuer_type: '', // New field
    reporter_name: '', // Conditional fields
    reporter_address: '',
    reporter_phone: ''
  })

  const [animalId, setAnimalId] = useState('')
  const [photos, setPhotos] = useState([])
  const [photoPreviews, setPhotoPreviews] = useState([])
  const [nameSuggestion, setNameSuggestion] = useState('')
  const [showNameWarning, setShowNameWarning] = useState(false)

  const buildAgeFields = (estimatedAgeMonths) => {
    const ageMonths = Number.parseInt(estimatedAgeMonths, 10) || 0
    return {
      years: ageMonths >= 12 ? String(Math.floor(ageMonths / 12)) : '',
      months: ageMonths % 12 ? String(ageMonths % 12) : '',
    }
  }

  const speciesCodes = {
    dog: 'DG',
    cat: 'CT',
    cow: 'CW',
    other: 'OT',
    pig: 'OT',
  }

  const genderCodes = {
    male: 'M',
    female: 'F',
  }

  const buildAnimalIdPrefix = (species, gender) => {
    const speciesCode = speciesCodes[species?.toLowerCase()] || 'OT'
    const genderCode = genderCodes[gender?.toLowerCase()] || ''
    return genderCode ? `${speciesCode}-${genderCode}` : ''
  }

  const generateUniqueAnimalId = async (species, gender) => {
    const prefix = buildAnimalIdPrefix(species, gender)
    if (!prefix) return ''

    const { data, error } = await supabase
      .from('animals')
      .select('animal_id')
      .like('animal_id', `${prefix}-%`)

    if (error) throw error

    const highestSequence = (data || []).reduce((max, record) => {
      const match = record.animal_id?.match(/-(\d{3})$/)
      if (!match) return max
      return Math.max(max, Number.parseInt(match[1], 10))
    }, 0)

    const nextSequence = String(highestSequence + 1).padStart(3, '0')
    return `${prefix}-${nextSequence}`
  }

  useEffect(() => {
    if (!editAnimal) return

    const { years, months } = buildAgeFields(editAnimal.estimated_age_months)
    setFormData({
      name: editAnimal.name || '',
      species: editAnimal.species || 'dog',
      breed: editAnimal.breed || '',
      gender: editAnimal.gender || '',
      years,
      months,
      colour: editAnimal.colour || '',
      rescue_date: editAnimal.rescue_date || '',
      rescue_location: editAnimal.rescue_location || '',
      ward: editAnimal.ward || '',
      category: editAnimal.category || '',
      lss_incharge: editAnimal.lss_incharge || '',
      initial_assessment: editAnimal.initial_assessment || '',
      reason_for_admission: editAnimal.reason_for_admission || '',
      rescuer_type: editAnimal.rescuer_type || '',
      reporter_name: editAnimal.reporter_name || '',
      reporter_address: editAnimal.reporter_address || '',
      reporter_phone: editAnimal.reporter_phone || '',
    })
    

    
    setAnimalId(editAnimal.animal_id || '')
  }, [editAnimal])

  useEffect(() => {
    let isActive = true

    const updateAnimalId = async () => {
      if (!formData.species || !formData.gender) {
        if (isEditMode && editAnimal?.animal_id) {
          setAnimalId(editAnimal.animal_id)
        } else {
          setAnimalId('')
        }
        return
      }

      if (
        isEditMode &&
        editAnimal &&
        formData.species === editAnimal.species &&
        formData.gender === editAnimal.gender
      ) {
        if (isActive) setAnimalId(editAnimal.animal_id || '')
        return
      }

      try {
        const nextId = await generateUniqueAnimalId(formData.species, formData.gender)
        if (isActive) setAnimalId(nextId)
      } catch (error) {
        console.error('Error generating animal ID:', error)
        if (isActive) setAnimalId('')
      }
    }

    updateAnimalId()

    return () => {
      isActive = false
    }
  }, [formData.species, formData.gender, editAnimal, isEditMode])

  useEffect(() => {
    const enteredName = formData.name?.trim()
    if (!enteredName) {
      const clearTimer = setTimeout(() => {
        setShowNameWarning(false)
        setNameSuggestion('')
      }, 0)
      return () => clearTimeout(clearTimer)
    }

    if (isEditMode && editAnimal && editAnimal.name && editAnimal.name.toLowerCase() === enteredName.toLowerCase()) {
      const clearTimer = setTimeout(() => {
        setShowNameWarning(false)
        setNameSuggestion('')
      }, 0)
      return () => clearTimeout(clearTimer)
    }

    const timer = setTimeout(async () => {
      try {
        const { data: existingNames } = await supabase
          .from('animals')
          .select('name')
          .ilike('name', `${enteredName}%`)

        const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
        const regex = new RegExp(`^${escapeRegExp(enteredName)}(\\d*)$`, 'i')
        
        let maxSuffix = 1
        let hasExactMatch = false

        if (existingNames) {
          for (const item of existingNames) {
            if (!item.name) continue
            const match = item.name.match(regex)
            if (match) {
              const suffixStr = match[1]
              if (suffixStr === '') {
                hasExactMatch = true
              } else {
                const suffixNum = parseInt(suffixStr, 10)
                if (!isNaN(suffixNum) && suffixNum > maxSuffix) {
                  maxSuffix = suffixNum
                }
              }
            }
          }
        }

        if (hasExactMatch) {
          const suggestion = `${enteredName}${maxSuffix + 1}`
          setNameSuggestion(suggestion)
          setShowNameWarning(true)
        } else {
          setShowNameWarning(false)
          setNameSuggestion('')
        }
      } catch (err) {
        console.error('Error checking duplicate name:', err)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [formData.name, isEditMode, editAnimal])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleUseSuggestion = () => {
    setFormData((prev) => ({ ...prev, name: nameSuggestion }))
    setShowNameWarning(false)
  }

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files)
    setPhotos((prev) => [...prev, ...files])

    // Create previews
    files.forEach((file) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        setPhotoPreviews((prev) => [...prev, event.target.result])
      }
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (index) => {
    setPhotos((prev) => prev.filter((_, i) => i !== index))
    setPhotoPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  const CLOUDINARY_CLOUD_NAME = 'dtixpptzy'
  const CLOUDINARY_UPLOAD_PRESET = 'saahas_unsigned'


  const uploadReporterPhoto = async (file) => {
    if (!file) return null
    
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!ALLOWED_TYPES.includes(file.type)) {
      throw new Error('Only JPG, PNG, and WebP images are allowed')
    }
    
    const formData = new FormData()
    formData.append('file', file)
    formData.append('upload_preset', 'saahas_unsigned')
    
    const response = await fetch(
      'https://api.cloudinary.com/v1_1/dtixpptzy/image/upload',
      { method: 'POST', body: formData }
    )
    
    if (!response.ok) {
      const err = await response.json()
      throw new Error(`Photo upload failed: ${err.error?.message}`)
    }
    
    const data = await response.json()
    return data.secure_url
  }

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Validation for reporter fields
      if (formData.rescuer_type === 'Animal Bought by Reporter') {
        if (!formData.reporter_name || !formData.reporter_phone) {
          throw new Error('Name and Phone are required when "Animal Bought by Reporter" is selected.')
        }
      }
      
      let currentAnimalId = animalId
      if (!currentAnimalId && formData.species && formData.gender) {
        currentAnimalId = await generateUniqueAnimalId(formData.species, formData.gender)
        setAnimalId(currentAnimalId)
      }

      if (!currentAnimalId) {
        throw new Error('Animal ID could not be generated. Please select species and gender.')
      }


      let reporterPhotoUrl = isEditMode && editAnimal?.reporter_photo_url ? editAnimal.reporter_photo_url : null;
      if (formData.rescuer_type === 'Animal Bought by Reporter' && reporterPhotoFile) {
        reporterPhotoUrl = await uploadReporterPhoto(reporterPhotoFile);
      }
      
      const animalPayload = {
        animal_id: currentAnimalId,
        name: formData.name,
        species: formData.species,
        breed: formData.breed,
        gender: formData.gender,
        estimated_age_months:
          (Number.parseInt(formData.years, 10) || 0) * 12 +
          (Number.parseInt(formData.months, 10) || 0),
        colour: formData.colour,
        rescue_date: formData.rescue_date || null,
        admission_date: formData.admission_date || new Date().toISOString().split('T')[0],
        rescue_location: formData.rescue_location,
        ward: formData.ward,
        category: formData.category || null,
        lss_incharge: formData.lss_incharge,
        initial_assessment: formData.initial_assessment,
        reason_for_admission: formData.reason_for_admission,
        rescuer_type: formData.rescuer_type,
        reporter_name: formData.rescuer_type === 'Animal Bought by Reporter' ? formData.reporter_name : null,
        reporter_address: formData.rescuer_type === 'Animal Bought by Reporter' ? formData.reporter_address : null,
        reporter_phone: formData.rescuer_type === 'Animal Bought by Reporter' ? formData.reporter_phone : null,
        reporter_photo_url: reporterPhotoUrl || null,
        requires_vet_attention: true,
      }

      let savedAnimalId = editAnimal?.id || null

      if (isEditMode && editAnimal?.id) {
        const { data: updatedAnimal, error: animalError } = await supabase
          .from('animals')
          .update(animalPayload)
          .eq('id', editAnimal.id)
          .select()
          .single()

        if (animalError) throw animalError
        savedAnimalId = updatedAnimal.id
      } else {
        const { data: animal, error: animalError } = await supabase
          .from('animals')
          .insert([animalPayload])
          .select()

        if (animalError) throw animalError
        savedAnimalId = animal[0].id
      }

      // Upload photos if any
      if (photos.length > 0) {
        for (const photo of photos) {
          const photoUrl = await uploadToCloudinary(photo)
          await supabase.from('animal_photos').insert({
            animal_id: savedAnimalId,
            photo_url: photoUrl
          })
        }
      }

      setLoading(false)
      setNotification({ type: 'success', message: isEditMode ? 'Animal updated successfully' : 'Animal registered successfully' })
      await new Promise((resolve) => setTimeout(resolve, 1200))
      navigate(`/animal/${savedAnimalId}`, { replace: true })
    } catch (error) {
      setLoading(false)
      console.error('Error registering animal:', error)
      setNotification({ type: 'error', message: `Failed to save animal: ${error.message}` })
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>
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

      {/* Top Bar */}
      <div
        style={{
          background: '#F5C800',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{
            background: 'rgba(0,0,0,0.10)',
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
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, flex: 1, textAlign: 'center', color: '#1A1A1A' }}>
          {isEditMode ? 'Edit Animal' : 'Add New Animal'}
        </h1>
        <div style={{ width: '36px' }} />
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ padding: '16px', paddingBottom: '100px' }}>
        {/* 1. Animal Name */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
            Animal Name *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #E0E0E0',
              borderRadius: '12px',
              fontSize: '14px',
            }}
          />
          {showNameWarning && nameSuggestion && (
            <div
              style={{
                background: '#FFF9E6',
                border: '1px solid #F5C800',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '13px',
                color: '#1A1A1A',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <span>
                ⚠️ '{formData.name}' already exists. Try: {nameSuggestion}
              </span>
              <button
                type="button"
                onClick={handleUseSuggestion}
                style={{
                  background: '#F5C800',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  fontSize: '12px',
                  fontWeight: '600',
                  color: '#000',
                  cursor: 'pointer',
                }}
              >
                Use {nameSuggestion}
              </button>
            </div>
          )}
        </div>

        {/* 2. Animal ID */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
            Animal ID
          </label>
          <input
            type="text"
            value={animalId}
            disabled
            placeholder="Select species and gender to generate ID"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #E0E0E0',
              borderRadius: '12px',
              fontSize: '14px',
              background: '#F0F0F0',
              color: '#666',
            }}
          />
        </div>

        {/* 3. Species */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
            Species *
          </label>
          <select
            name="species"
            value={formData.species}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #E0E0E0',
              borderRadius: '12px',
              fontSize: '14px',
            }}
          >
            <option value="dog">Dog</option>
            <option value="cat">Cat</option>
            <option value="cow">Cow</option>
            <option value="other">Other</option>
          </select>
        </div>

        {/* 4. Breed */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
            Breed
          </label>
          <input
            type="text"
            name="breed"
            value={formData.breed}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #E0E0E0',
              borderRadius: '12px',
              fontSize: '14px',
            }}
          />
        </div>

        {/* 5. Gender */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
            Gender *
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            {['male', 'female'].map((gender) => (
              <button
                key={gender}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, gender }))}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 50,
                  border: 'none',
                  background: formData.gender === gender ? '#F5C800' : '#F0F0F0',
                  color: formData.gender === gender ? '#000' : '#666',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {gender.charAt(0).toUpperCase() + gender.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* 6. Estimated Age */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
            Estimated Age
          </label>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Years</label>
              <input
                type="number"
                name="years"
                value={formData.years}
                onChange={handleInputChange}
                min="0"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #E0E0E0',
                  borderRadius: '12px',
                  fontSize: '14px',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: '12px', color: '#666', display: 'block', marginBottom: '4px' }}>Months</label>
              <input
                type="number"
                name="months"
                value={formData.months}
                onChange={handleInputChange}
                min="0"
                max="11"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #E0E0E0',
                  borderRadius: '12px',
                  fontSize: '14px',
                }}
              />
            </div>
          </div>
        </div>

        {/* 7. Colour / Identity marks */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
            Colour / Identity Marks
          </label>
          <input
            type="text"
            name="colour"
            value={formData.colour}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #E0E0E0',
              borderRadius: '12px',
              fontSize: '14px',
            }}
          />
        </div>

        {/* 8. Rescue Date */}
        <div style={{ marginBottom: '16px' }}>
          <DateInput
            label="Rescue Date"
            value={formData.rescue_date}
            onChange={(value) => setFormData({ ...formData, rescue_date: value || '' })}
            required={false}
          />
        </div>

        {/* 9. Rescue Location */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
            Rescue Location
          </label>
          <input
            type="text"
            name="rescue_location"
            value={formData.rescue_location}
            onChange={handleInputChange}
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #E0E0E0',
              borderRadius: '12px',
              fontSize: '14px',
            }}
          />
        </div>

        {/* 11. Ward */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
            Ward *
          </label>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {['opd', 'ipd', 'inhouse'].map((ward) => (
              <button
                key={ward}
                type="button"
                onClick={() => setFormData((prev) => ({ 
                  ...prev, 
                  ward,
                  category: ward === 'opd' ? '' : prev.category
                }))}
                style={{
                  flex: '1 1 auto',
                  minWidth: '100px',
                  padding: '12px',
                  borderRadius: 50,
                  border: 'none',
                  background: formData.ward === ward ? '#F5C800' : '#F0F0F0',
                  color: formData.ward === ward ? '#000' : '#666',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {ward === 'inhouse' ? 'In-House' : ward.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* 12. Category */}
        {formData.ward && formData.ward !== 'opd' && (
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              style={{
                width: '100%',
                padding: '12px',
                border: '1px solid #E0E0E0',
                borderRadius: '12px',
                fontSize: '14px',
              }}
            >
              <option value="">Select Category</option>
              <option value="normal">Normal</option>
              <option value="paralysed">Paralysed</option>
              <option value="blind">Blind</option>
              <option value="neurological">Neurological</option>
              <option value="behavioural">Behavioural Problems</option>
              <option value="senior">Senior Care</option>
              <option value="disabled">Disabled</option>
              <option value="chemo">Chemo</option>
            </select>
          </div>
        )}

        {/* 13. LSS Incharge */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
            LSS Incharge
          </label>
          <input
            type="text"
            name="lss_incharge"
            value={formData.lss_incharge}
            onChange={handleInputChange}
            placeholder="Enter name"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #E0E0E0',
              borderRadius: '12px',
              fontSize: '14px',
            }}
          />
        </div>

        {/* Reason for Admission */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
            Reason for Admission
          </label>
          <input
            type="text"
            name="reason_for_admission"
            value={formData.reason_for_admission}
            onChange={handleInputChange}
            placeholder="e.g., Road accident"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #E0E0E0',
              borderRadius: '12px',
              fontSize: '14px',
              color: '#1A1A1A',
            }}
          />
        </div>

        {/* Rescued / Reporter */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Rescued / Reporter *</label>
          <select
            name="rescuer_type"
            value={formData.rescuer_type}
            onChange={handleInputChange}
            required
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #E0E0E0',
              borderRadius: '12px',
              fontSize: '14px',
            }}
          >
            <option value="">Select</option>
            <option value="Rescued Animal">Rescued Animal</option>
            <option value="Animal Bought by Reporter">Animal Bought by Reporter</option>
          </select>
        </div>
        {formData.rescuer_type === 'Animal Bought by Reporter' && (
          <>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '14px', color: '#666', marginBottom: '8px', fontWeight: 'bold' }}>
                Reporter Details
              </label>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Reporter Name *</label>
              <input type="text" name="reporter_name" value={formData.reporter_name} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', border: '1px solid #E0E0E0', borderRadius: '12px', fontSize: '14px' }} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Reporter Phone *</label>
              <input type="text" name="reporter_phone" value={formData.reporter_phone} onChange={handleInputChange} required style={{ width: '100%', padding: '12px', border: '1px solid #E0E0E0', borderRadius: '12px', fontSize: '14px' }} />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>Reporter Address</label>
              <input type="text" name="reporter_address" value={formData.reporter_address} onChange={handleInputChange} style={{ width: '100%', padding: '12px', border: '1px solid #E0E0E0', borderRadius: '12px', fontSize: '14px' }} />
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
                Reporter Photo
              </label>
              <div>
                <label style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#F5C800',
                  color: '#000000',
                  borderRadius: 50,
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                  border: 'none'
                }}>
                  📷 Upload Photo
                  <input 
                    type="file" 
                    accept="image/jpeg,image/png,image/webp"
                    style={{ display: 'none' }}
                    onChange={(e) => setReporterPhotoFile(e.target.files[0])}
                  />
                </label>
              </div>
              {reporterPhotoFile && (
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <img 
                    src={URL.createObjectURL(reporterPhotoFile)} 
                    alt="Preview" 
                    style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #E0E0E0' }} 
                  />
                  <span style={{ fontSize: '12px', color: '#666' }}>{reporterPhotoFile.name}</span>
                </div>
              )}
            </div>
          </>
        )}

        {/* 14. Current Condition */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
            Current Condition
          </label>
          <textarea
            name="initial_assessment"
            value={formData.initial_assessment}
            onChange={handleInputChange}
            placeholder="e.g., Weight: 12 kg, Temp: 101°F, abdominal wound, weak but alert"
            rows="4"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #E0E0E0',
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: 'inherit',
              color: '#1A1A1A',
            }}
          />
        </div>

        {/* 15. Photos */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
            Add Photos
          </label>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
            <button
              type="button"
              onClick={() => animalUploadInputRef.current?.click()}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #E0E0E0',
                backgroundColor: '#F0F0F0',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                textAlign: 'center',
                whiteSpace: 'nowrap'
              }}
            >
              Choose Files
            </button>
            <input
              ref={animalUploadInputRef}
              type="file"
              multiple
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />
            <button
              type="button"
              onClick={() => animalCameraInputRef.current?.click()}
              style={{
                flex: 1,
                padding: '12px 16px',
                borderRadius: '8px',
                border: '1px solid #E0E0E0',
                backgroundColor: '#F0F0F0',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '14px',
                textAlign: 'center',
                whiteSpace: 'nowrap'
              }}
            >
              Take Photo
            </button>
            <input
              ref={animalCameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              style={{ display: 'none' }}
              onChange={handlePhotoChange}
            />
          </div>
          {photoPreviews.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' }}>
              {photoPreviews.map((preview, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'relative',
                    width: '80px',
                    height: '80px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  <img
                    src={preview}
                    alt={`Preview ${idx}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(idx)}
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: 'red',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold',
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '16px',
            borderRadius: 50,
            border: 'none',
            background: '#F5C800',
            color: '#000',
            fontSize: '16px',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (isEditMode ? 'Updating Animal...' : 'Registering Animal...') : (isEditMode ? 'Update Animal' : 'Register Animal')}
        </button>
      </form>



    </div>
  )
}
