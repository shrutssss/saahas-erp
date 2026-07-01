import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import SaahasLogo from '../components/SaahasLogo'
import { ArrowLeft } from 'lucide-react'

export default function AnimalList({ ward = 'opd' }) {
  const navigate = useNavigate()
  const [animals, setAnimals] = useState([])
  const [filteredAnimals, setFilteredAnimals] = useState([])
  const [loading, setLoading] = useState(true)

  const [speciesFilter, setSpeciesFilter] = useState('all')
  const [conditionFilters, setConditionFilters] = useState(new Set())
  const [searchQuery, setSearchQuery] = useState('')

  const wardTitle = ward === 'opd' ? 'OPD' : ward === 'ipd' ? 'IPD' : 'In-House'
  const conditions = ward === 'opd'
    ? []
    : ['Recovered', 'Paralyzed', 'Blind', 'Neurological', 'Behavioral', 'Critical']

  useEffect(() => {
    const fetchAnimals = async () => {
      try {
        const { data, error } = await supabase
          .from('animals')
          .select('*, animal_photos(photo_url)')
          .eq('ward', ward)
          .eq('is_active', true)

        if (data) {
          setAnimals(data)
          applyFilters(data, 'all', new Set(), '')
        }
        if (error) console.error('Error fetching animals:', error)
      } catch (error) {
        console.error('Error:', error)
      }
      setLoading(false)
    }

    fetchAnimals()
  }, [ward])

  const applyFilters = (animalList, species, conditions, search) => {
    let filtered = animalList

    // Species filter
    if (species !== 'all') {
      const speciesMap = {
        dogs: 'dog',
        cats: 'cat',
        cows: 'cow',
        others: 'other',
      }
      filtered = filtered.filter((a) => a.species?.toLowerCase() === speciesMap[species])
    }

    // Condition filters (match category or status)
    if (conditions.size > 0) {
      const conditionArray = Array.from(conditions).map((c) => c.toLowerCase())
      filtered = filtered.filter((a) => {
        const category = a.category?.toLowerCase() || ''
        const status = a.current_status?.toLowerCase() || ''
        return conditionArray.some(
          (cond) =>
            category.includes(cond) ||
            status.includes(cond) ||
            (cond === 'paralyzed' && category === 'paralysed')
        )
      })
    }

    // Search filter (name or animal_id)
    if (search.trim()) {
      const q = search.toLowerCase()
      filtered = filtered.filter(
        (a) =>
          a.name?.toLowerCase().includes(q) ||
          a.animal_id?.toLowerCase().includes(q)
      )
    }

    setFilteredAnimals(filtered)
  }

  const handleSpeciesFilter = (species) => {
    setSpeciesFilter(species)
    applyFilters(animals, species, conditionFilters, searchQuery)
  }

  const handleConditionToggle = (condition) => {
    const updated = new Set(conditionFilters)
    if (updated.has(condition)) {
      updated.delete(condition)
    } else {
      updated.add(condition)
    }
    setConditionFilters(updated)
    applyFilters(animals, speciesFilter, updated, searchQuery)
  }

  const handleSearch = (value) => {
    setSearchQuery(value)
    applyFilters(animals, speciesFilter, conditionFilters, value)
  }

  const getStatusColor = (status) => {
    if (!status) return '#999'
    const s = status.toLowerCase()
    if (s === 'critical') return '#EF4444'
    if (s === 'moderate') return '#F97316'
    if (s === 'stable') return '#22C55E'
    return '#999'
  }

  if (loading) return <div style={{ padding: '16px' }}>Loading...</div>

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', paddingBottom: '100px' }}>
      {/* Top Bar */}
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
        <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, flex: 1, color: '#1A1A1A' }}>
          {wardTitle}
        </h1>
        <SaahasLogo size={36} />
      </div>

      {/* Content */}
      <div style={{ padding: '16px' }}>
        {/* Species Filter */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            marginBottom: '16px',
            paddingBottom: '8px',
          }}
        >
          {['All', 'Dogs', 'Cats', 'Cows', 'Others'].map((species) => (
            <button
              key={species}
              onClick={() => handleSpeciesFilter(species.toLowerCase())}
              style={{
                padding: '8px 16px',
                borderRadius: 50,
                border: 'none',
                background:
                  speciesFilter === species.toLowerCase() ? '#F5C800' : '#F0F0F0',
                color: speciesFilter === species.toLowerCase() ? '#000' : '#666',
                fontWeight: '600',
                fontSize: '14px',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              {species}
            </button>
          ))}
        </div>

        {/* Condition Filter */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
            marginBottom: '16px',
          }}
        >
          {conditions.map((condition) => (
            <button
              key={condition}
              onClick={() => handleConditionToggle(condition)}
              style={{
                padding: '8px 12px',
                borderRadius: 50,
                border: 'none',
                background: conditionFilters.has(condition) ? '#F5C800' : '#F0F0F0',
                color: conditionFilters.has(condition) ? '#000' : '#666',
                fontWeight: '600',
                fontSize: '12px',
                cursor: 'pointer',
              }}
            >
              {condition}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <input
          type="text"
          placeholder="Search by name or ID"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          style={{
            width: '100%',
            padding: '13px 16px',
            border: '1.5px solid #EBEBEB',
            borderRadius: '14px',
            fontSize: '15px',
            marginBottom: '16px',
            backgroundColor: '#FAFAFA',
            fontFamily: 'inherit',
            boxSizing: 'border-box',
            color: '#1A1A1A',
          }}
        />

        {/* Animal List */}
        {filteredAnimals.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#666', marginTop: '24px' }}>
            No animals found
          </p>
        ) : (
          filteredAnimals.map((animal) => (
            <div
              key={animal.id}
              onClick={() => navigate(`/animal/${animal.id}`)}
              style={{
                display: 'flex',
                gap: '12px',
                padding: '12px',
                background: '#FFFFFF',
                border: '1px solid #E0E0E0',
                borderRadius: '12px',
                marginBottom: '12px',
                cursor: 'pointer',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                transition: 'all 0.3s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)')}
              onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)')}
            >
              {/* Photo */}
              <div
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  background: '#F0F0F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                {animal.animal_photos?.length > 0 && animal.animal_photos[0]?.photo_url ? (
                  <img
                    src={animal.animal_photos[0].photo_url}
                    alt={animal.name}
                    style={{
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                ) : (
                  <span style={{ fontSize: '32px' }}>🐾</span>
                )}
              </div>

              {/* Info */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <h3 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 700 }}>
                  {animal.name}
                </h3>
                <p style={{ margin: '0 0 8px', fontSize: '12px', color: '#666' }}>
                  {animal.animal_id}
                </p>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: getStatusColor(animal.current_status),
                      color: '#FFF',
                      fontSize: '11px',
                      fontWeight: '600',
                    }}
                  >
                    {animal.current_status ? animal.current_status.charAt(0).toUpperCase() + animal.current_status.slice(1) : 'N/A'}
                  </span>
                </div>
                <p style={{ margin: 0, fontSize: '12px', color: '#999' }}>
                  {animal.species} {animal.breed ? `• ${animal.breed}` : ''}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}


