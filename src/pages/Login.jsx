import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import { AuthContext } from '../AuthContext'

export default function Login() {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    // Call signInWithPassword using the name field as the email identifier.
    const { data, error } = await supabase.auth.signInWithPassword({
      email: name,
      password,
    })

    if (error || !data?.user) {
      setError('Invalid name or password')
      setLoading(false)
      return
    }

    setLoading(false)
    navigate('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '375px', textAlign: 'center' }}>
        <div style={{ width: 100, height: 100, borderRadius: 50, background: '#F5C800', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }} aria-hidden>
          {/* Simple dog silhouette */}
          <svg width="60" height="60" viewBox="0 0 24 24" fill="#000000" xmlns="http://www.w3.org/2000/svg" aria-hidden>
            <path d="M5 10c-.5-1 0-2 1-3s2-1 3-1 2 0 3 1 2 1 3 1 2 0 2 1-1 1-2 2-2 2-3 2-2 0-3-1-2-2-3-2-1 0-2-1-1-1-1-1z" />
            <path d="M3 17c0 1.7 3 3 6 3s6-1.3 6-3v-1H3v1z" />
          </svg>
        </div>

        <h1 style={{ fontSize: 24, fontWeight: 700, marginTop: 16, marginBottom: 24 }}>Saahas</h1>

        <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>Enter Name:</label>
          <input
            placeholder="eg. Srushti"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            style={{
              width: '100%',
              background: '#F0F0F0',
              border: 'none',
              borderRadius: 12,
              padding: 14,
              fontSize: 16,
              marginBottom: 12,
            }}
          />

          <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>Enter Password:</label>
          <input
            type="password"
            placeholder=""
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              background: '#F0F0F0',
              border: 'none',
              borderRadius: 12,
              padding: 14,
              fontSize: 16,
              marginBottom: 16,
            }}
          />

          <button
            type="submit"
            style={{
              width: '100%',
              background: '#F5C800',
              color: '#000000',
              border: 'none',
              borderRadius: 50,
              padding: 16,
              fontSize: 18,
              fontWeight: 700,
              cursor: 'pointer',
            }}
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          {error && <p style={{ color: 'red', marginTop: 12 }}>{error}</p>}
        </form>

      </div>
    </div>
  )
}

