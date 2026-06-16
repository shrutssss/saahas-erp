import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'

export default function Navbar() {
  const navigate = useNavigate()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/')
  }

  return (
    <nav style={{
      backgroundColor: '#F5C800',
      padding: '12px 16px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    }}>
      <h3 style={{ margin: 0, color: '#000000' }}>Saahas</h3>
      <button onClick={handleLogout} className="btn" style={{ padding: '8px 12px', fontSize: '12px' }}>
        Logout
      </button>
    </nav>
  )
}
