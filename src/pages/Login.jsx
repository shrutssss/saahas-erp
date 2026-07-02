import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabaseClient'
import SaahasLogo, { brandFont } from '../components/SaahasLogo'
import { AuthContext } from '../AuthContext'
import { User, Lock } from 'lucide-react'

export default function Login() {
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { user } = useContext(AuthContext)

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

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
    <div style={{ minHeight: '100vh', backgroundColor: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <div style={{ width: '100%', maxWidth: '430px', minHeight: '100vh', backgroundColor: '#F5C800', display: 'flex', flexDirection: 'column', boxShadow: '0 0 60px rgba(0,0,0,0.18)' }}>
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(60px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .login-input { transition: border-color 0.2s; }
        .login-input:focus { outline: none; border-color: #F5C800; box-shadow: 0 0 0 3px rgba(245,200,0,0.15); }
        .sign-in-btn:hover { opacity: 0.9; transform: translateY(-1px); }
        .sign-in-btn:active { transform: translateY(0); }
      `}</style>

      {/* Yellow Brand Zone */}
      <div style={{
        flex: '0 0 44vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: '40px',
        animation: 'fadeIn 0.5s ease',
      }}>
        <SaahasLogo size={96} />
        <h1 style={{
          fontFamily: brandFont,
          fontSize: '38px',
          fontWeight: 700,
          marginTop: '16px',
          marginBottom: '6px',
          color: '#1A1A1A',
          letterSpacing: '-0.5px',
        }}>
          Saahas
        </h1>
        <p style={{ fontSize: '13px', color: 'rgba(0,0,0,0.55)', fontWeight: 500, letterSpacing: '0.5px' }}>
          Animal Care & ERP
        </p>
      </div>

      {/* White Form Card */}
      <div style={{
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: '28px 28px 0 0',
        padding: '36px 28px 48px',
        boxShadow: '0 -8px 40px rgba(0,0,0,0.10)',
        animation: 'slideUp 0.45s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}>
        <h2 style={{
          fontFamily: brandFont,
          fontSize: '26px',
          fontWeight: 700,
          color: '#1A1A1A',
          marginBottom: '6px',
          letterSpacing: '-0.3px',
        }}>
          Welcome Back
        </h2>
        <p style={{ fontSize: '13px', color: '#999', marginBottom: '32px' }}>
          Sign in to your account to continue
        </p>

        <form onSubmit={handleLogin}>
          {/* Name / Email input */}
          <div style={{ position: 'relative', marginBottom: '14px' }}>
            <User
              size={17}
              style={{
                position: 'absolute',
                left: '15px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#BBBBBB',
                pointerEvents: 'none',
              }}
            />
            <input
              className="login-input"
              placeholder="Username or Email"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              style={{
                width: '100%',
                paddingLeft: '44px',
                paddingRight: '16px',
                paddingTop: '15px',
                paddingBottom: '15px',
                border: '1.5px solid #EBEBEB',
                borderRadius: '14px',
                fontSize: '15px',
                backgroundColor: '#FAFAFA',
                color: '#1A1A1A',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Password input */}
          <div style={{ position: 'relative', marginBottom: '28px' }}>
            <Lock
              size={17}
              style={{
                position: 'absolute',
                left: '15px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#BBBBBB',
                pointerEvents: 'none',
              }}
            />
            <input
              className="login-input"
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{
                width: '100%',
                paddingLeft: '44px',
                paddingRight: '16px',
                paddingTop: '15px',
                paddingBottom: '15px',
                border: '1.5px solid #EBEBEB',
                borderRadius: '14px',
                fontSize: '15px',
                backgroundColor: '#FAFAFA',
                color: '#1A1A1A',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Sign In button */}
          <button
            type="submit"
            className="sign-in-btn"
            disabled={loading}
            style={{
              width: '100%',
              padding: '17px',
              backgroundColor: '#F5C800',
              border: 'none',
              borderRadius: '50px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              color: '#000000',
              opacity: loading ? 0.75 : 1,
              transition: 'all 0.2s ease',
              letterSpacing: '0.2px',
            }}
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>

          {error && (
            <p style={{
              color: '#EF4444',
              marginTop: '16px',
              textAlign: 'center',
              fontSize: '13px',
              fontWeight: 500,
            }}>
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
    </div>
  )
}
