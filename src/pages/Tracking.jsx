import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import SaahasLogo from '../components/SaahasLogo'

export default function Tracking() {
  const navigate = useNavigate()
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      // Also fetch photos to show the first photo
      const { data, error } = await supabase
        .from('animals')
        .select(`
          *,
          animal_photos (photo_url, uploaded_at)
        `)
        .eq('is_active', true)
        .eq('requires_vet_attention', true)
        .order('created_at', { ascending: false })

      if (data) {
        // Process data to include the main photo
        const processed = data.map(a => {
          let mainPhoto = null
          if (a.animal_photos && a.animal_photos.length > 0) {
            a.animal_photos.sort((x, y) => new Date(y.uploaded_at) - new Date(x.uploaded_at))
            mainPhoto = a.animal_photos[0].photo_url
          }
          return { ...a, photo: mainPhoto }
        })
        setAnimals(processed)
      }
    } catch (err) {
      console.error('Error fetching tracking animals:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    
    const channel = supabase
      .channel('tracking_page_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'animals' }, () => {
        fetchData()
      })
      .subscribe()
      
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const filtered = animals.filter((animal) =>
    animal.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    animal.animal_id?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleCardClick = (e, animalId) => {
    e.preventDefault()
    navigate(`/animal/${animalId}`, { state: { activeTab: 'medical' } })
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'critical': return '#EF4444'
      case 'moderate': return '#F59E0B'
      case 'stable': return '#22C55E'
      case 'recovered': return '#3B82F6'
      case 'deceased': return '#6B7280'
      default: return '#9CA3AF'
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      <div
        style={{
          backgroundColor: '#FFFFFF',
          padding: '16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #E0E0E0',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 'bold', color: '#000000' }}>
            Tracking
          </h1>
          <span style={{ backgroundColor: '#F59E0B', color: '#FFFFFF', borderRadius: '12px', padding: '2px 8px', fontSize: '12px', marginLeft: '8px' }}>{animals.length}</span>
          <span style={{ fontSize: '12px', color: '#666666' }}>
            Requires Veterinary Attention
          </span>
        </div>
        <SaahasLogo size={44} />
      </div>

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

      <main style={{ flex: 1, paddingBottom: '80px', overflow: 'auto' }}>
        {loading ? (
          <div style={{ padding: '16px', textAlign: 'center', color: '#666' }}>Loading...</div>
        ) : filtered.length === 0 ? (
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
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>🏥</div>
            <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#1A1A1A' }}>
              All caught up!
            </div>
            <div style={{ fontSize: '14px', marginTop: '8px' }}>
              No animals currently require veterinary attention.
            </div>
          </div>
        ) : (
          <div style={{ paddingLeft: '16px', paddingRight: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map((animal) => (
              <div
                key={animal.id}
                className="card"
                onClick={(e) => handleCardClick(e, animal.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  cursor: 'pointer',
                  minHeight: '64px',
                  backgroundColor: '#F5F5F5',
                  marginBottom: 0,
                }}
              >
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
                    fontSize: '20px',
                    color: '#999999',
                    overflow: 'hidden'
                  }}
                >
                  {animal.photo ? (
                    <img src={animal.photo} alt={animal.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    '🐾'
                  )}
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#000000' }}>
                    {animal.name}
                  </div>
                  <div
                    style={{
                      fontSize: '12px',
                      color: '#666666',
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center',
                      marginTop: '4px',
                      flexWrap: 'wrap'
                    }}
                  >
                    <span>{animal.animal_id}</span>
                    <span>•</span>
                    <span>{animal.species}</span>
                    {animal.ward && (
                      <span
                        style={{
                          backgroundColor: '#E0E0E0',
                          padding: '2px 6px',
                          borderRadius: '8px',
                          fontSize: '10px',
                          color: '#555555',
                        }}
                      >
                        {animal.ward}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
                  <span
                    style={{
                      backgroundColor: getStatusColor(animal.current_status),
                      color: ['critical', 'moderate'].includes(animal.current_status?.toLowerCase()) ? '#FFFFFF' : '#000000',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: 'bold',
                    }}
                  >
                    {animal.current_status || 'Unknown'}
                  </span>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999999" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6"></polyline>
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
