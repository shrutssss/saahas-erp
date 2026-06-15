import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Registration() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    species: 'dog',
    breed: '',
    gender: '',
    years: 0,
    months: 0,
    colour: '',
    rescue_date: '',
    admission_date: new Date().toISOString().split('T')[0],
    rescue_location: '',
    ward: '',
    current_status: '',
    category: 'normal',
    initial_assessment: '',
  })

  const [animalId, setAnimalId] = useState('')
  const [photos, setPhotos] = useState([])
  const [photoPreviews, setPhotoPreviews] = useState([])

  useEffect(() => {
    // Generate animal ID on mount
    const year = new Date().getFullYear()
    const num = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0')
    setAnimalId(`SAA-${year}-${num}`)
  }, [])

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
      // Insert animal into database
      const { data: animal, error: animalError } = await supabase
        .from('animals')
        .insert([
          {
            animal_id: animalId,
            name: formData.name,
            species: formData.species,
            breed: formData.breed,
            gender: formData.gender,
            estimated_age_months: formData.years * 12 + formData.months,
            colour: formData.colour,
            rescue_date: formData.rescue_date,
            admission_date: formData.admission_date,
            rescue_location: formData.rescue_location,
            ward: formData.ward,
            current_status: formData.current_status,
            category: formData.category,
            initial_assessment: formData.initial_assessment,
          },
        ])
        .select()

      if (animalError) throw animalError

      const newAnimalId = animal[0].id

      // Upload photos if any
      if (photos.length > 0) {
        for (let i = 0; i < photos.length; i++) {
          const file = photos[i]
          const fileName = `${animalId}-${Date.now()}-${i}.jpg`
          const filePath = `${animalId}/${fileName}`

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
                animal_id: newAnimalId,
                photo_url: urlData.publicUrl,
              },
            ])
        }
      }

      setLoading(false)
      alert('Animal Registered Successfully')
      navigate(`/animal/${newAnimalId}`)
    } catch (error) {
      setLoading(false)
      console.error('Error registering animal:', error)
      alert('Failed to register animal: ' + error.message)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF' }}>
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
          Add New Animal
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
            <option value="pig">Pig</option>
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

        {/* 9. Admission Date */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
            Admission Date *
          </label>
          <input
            type="date"
            name="admission_date"
            value={formData.admission_date}
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

        {/* 10. Rescue Location */}
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

        {/* 12. Current Status */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600' }}>
            Current Status *
          </label>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {['critical', 'moderate', 'stable'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, current_status: status }))}
                style={{
                  flex: '1 1 auto',
                  minWidth: '90px',
                  padding: '12px',
                  borderRadius: 50,
                  border: 'none',
                  background:
                    formData.current_status === status
                      ? status === 'critical'
                        ? '#EF4444'
                        : status === 'moderate'
                          ? '#F97316'
                          : '#22C55E'
                      : '#F0F0F0',
                  color: formData.current_status === status ? '#FFF' : '#666',
                  fontWeight: '600',
                  cursor: 'pointer',
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* 13. Category */}
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
          </select>
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
          {loading ? 'Registering Animal...' : 'Register Animal'}
        </button>
      </form>
    </div>
  )
}
