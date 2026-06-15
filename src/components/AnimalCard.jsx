import { Link } from 'react-router-dom'

export default function AnimalCard({ animal }) {
  return (
    <Link to={`/animal/${animal.id}`} style={{ textDecoration: 'none' }}>
      <div className="card" style={{ cursor: 'pointer', transition: 'all 0.3s ease' }} 
           onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'}
           onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)'}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
          <div>
            <h4>{animal.name}</h4>
            <p className="text-muted">{animal.species}</p>
            <p style={{ marginTop: '8px' }}><strong>Status:</strong> {animal.status}</p>
          </div>
          <div style={{ 
            backgroundColor: '#F5C800', 
            color: '#000000', 
            padding: '8px 12px', 
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {animal.age}
          </div>
        </div>
      </div>
    </Link>
  )
}
