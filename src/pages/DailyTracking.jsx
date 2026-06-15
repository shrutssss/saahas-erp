import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'

const getStatusColor = (status) => {
  if (!status) return '#E0E0E0'
  const s = status.toLowerCase()
  if (s === 'critical') return '#EF4444'
  if (s === 'moderate') return '#F97316'
  if (s === 'stable') return '#22C55E'
  if (s === 'recovered') return '#22C55E'
  return '#E0E0E0'
}

export default function DailyTracking() {
  const navigate = useNavigate()
  const [animals, setAnimals] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    fetchAnimals()
  }, [])

  const fetchAnimals = async () => {
    try {
      const { data } = await supabase
        .from('animals')
        .select('*')
        .eq('is_active', true)
        .order('name')

      if (data) setAnimals(data)
    } catch (err) {
      console.error('Error fetching animals:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = animals.filter(a =>
    a.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.animal_id.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) return <div style={{ padding: '16px', textAlign: 'center' }}>Loading...</div>

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#FFFFFF' }}>
      <Navbar />
      <main style={{ flex: 1, paddingBottom: '100px', backgroundColor: '#FFFFFF' }}>
        {/* Header */}
        <div style={{ padding: '16px', borderBottom: '1px solid #E0E0E0' }}>
          <h2 style={{ margin: '0 0 12px 0', fontSize: '20px', fontWeight: 'bold' }}>Daily Tracking</h2>
          <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#666' }}>Select an animal to log observations</p>
          
          {/* Search */}
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: '8px',
              border: '1px solid #E0E0E0',
              fontSize: '14px',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Animals List */}
        <div style={{ padding: '12px' }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#666' }}>
              <p>No active animals found</p>
            </div>
          ) : (
            filtered.map(animal => (
              <div
                key={animal.id}
                onClick={() => navigate(`/treatment/${animal.id}`)}
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E0E0E0',
                  borderRadius: '12px',
                  padding: '12px',
                  marginBottom: '10px',
                  cursor: 'pointer',
                  display: 'flex',
                  gap: '12px',
                  alignItems: 'center',
                  transition: 'all 0.2s',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)'}
              >
                {/* Photo */}
                <div style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '8px',
                  backgroundColor: '#F5F5F5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  flexShrink: 0
                }}>
                  🐾
                </div>

                {/* Info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: 'bold', color: '#1A1A1A' }}>{animal.name}</p>
                  <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#666' }}>{animal.animal_id} • {animal.species}</p>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <span style={{ display: 'inline-block', backgroundColor: getStatusColor(animal.current_status), color: animal.current_status === 'critical' || animal.current_status === 'moderate' ? '#FFF' : '#000', padding: '3px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 'bold' }}>
                      {animal.current_status}
                    </span>
                    <span style={{ display: 'inline-block', backgroundColor: '#E0E0E0', padding: '3px 8px', borderRadius: '10px', fontSize: '11px' }}>
                      {animal.ward?.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <div style={{ fontSize: '18px', color: '#F5C800' }}>→</div>
              </div>
            ))
          )}
        </div>
      </main>
      <BottomNav />
    </div>
  )
}
