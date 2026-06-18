import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import SaahasLogo, { brandFont } from '../components/SaahasLogo'

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
        <SaahasLogo size={165} style={{ margin: '0 auto' }} />

        <h1 style={{ fontFamily: brandFont, fontSize: 28, fontWeight: 700, marginTop: 16, marginBottom: 24 }}>Saahas</h1>

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

