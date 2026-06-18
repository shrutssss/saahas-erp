import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Registration() {
  const navigate = useNavigate()
  const location = useLocation()
  const editAnimal = location.state?.animal || null
  const isEditMode = Boolean(editAnimal)
  const [loading, setLoading] = useState(false)
  const [notification, setNotification] = useState(null)
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
    category: 'normal',
    lss_incharge: '',
    initial_assessment: '',
  })

  const [animalId, setAnimalId] = useState('')
  const [photos, setPhotos] = useState([])
  const [photoPreviews, setPhotoPreviews] = useState([])

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
      category: editAnimal.category || 'normal',
      lss_incharge: editAnimal.lss_incharge || '',
      initial_assessment: editAnimal.initial_assessment || '',
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

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      let currentAnimalId = animalId
      if (!currentAnimalId && formData.species && formData.gender) {
        currentAnimalId = await generateUniqueAnimalId(formData.species, formData.gender)
        setAnimalId(currentAnimalId)
      }

      if (!currentAnimalId) {
        throw new Error('Animal ID could not be generated. Please select species and gender.')
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
        rescue_date: formData.rescue_date,
        rescue_location: formData.rescue_location,
        ward: formData.ward,
        category: formData.category,
        lss_incharge: formData.lss_incharge,
        initial_assessment: formData.initial_assessment,
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
        for (let i = 0; i < photos.length; i++) {
          const file = photos[i]
          const fileName = `${currentAnimalId}-${Date.now()}-${i}.jpg`
          const filePath = `${currentAnimalId}/${fileName}`

          const { data: photoData, error: uploadError } = await supabase.storage
            .from('animal-photos')
            .upload(filePath, file)

          if (uploadError) throw uploadError

          // Get public URL
          const { data: urlData } = supabase.storage
            .from('animal-photos')
            .getPublicUrl(filePath)

          // Insert photo record
          await supabase
            .from('animal_photos')
            .insert([
              {
                animal_id: savedAnimalId,
                photo_url: urlData.publicUrl,
              },
            ])
        }
      }

      setLoading(false)
      setNotification({ type: 'success', message: isEditMode ? 'Animal updated successfully' : 'Animal registered successfully' })
      await new Promise((resolve) => setTimeout(resolve, 1200))
      navigate(`/animal/${savedAnimalId}`)
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
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
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
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, flex: 1, textAlign: 'center' }}>
          {isEditMode ? 'Edit Animal' : 'Add New Animal'}
        </h1>
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
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
            Rescue Date
          </label>
          <input
            type="date"
            name="rescue_date"
            value={formData.rescue_date}
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
                onClick={() => setFormData((prev) => ({ ...prev, ward }))}
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
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
            Category *
          </label>
          <select
            name="category"
            value={formData.category}
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

        {/* 14. Initial Medical Assessment */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
            Initial Medical Assessment
          </label>
          <textarea
            name="initial_assessment"
            value={formData.initial_assessment}
            onChange={handleInputChange}
            rows="4"
            style={{
              width: '100%',
              padding: '12px',
              border: '1px solid #E0E0E0',
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: 'inherit',
            }}
          />
        </div>

        {/* 15. Photos */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
            Add Photos
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handlePhotoChange}
            style={{ marginBottom: '12px' }}
          />
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
