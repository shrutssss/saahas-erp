import React, { createContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      if (session) {
        setUser(session.user)
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', session.user.id)
            .single()
          if (profile?.role) setRole(profile.role)
        } catch (e) {
          console.error('Failed to fetch user role:', e)
        }
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setRole(null)
        } else if (session) {
          setUser(session.user)
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', session.user.id)
              .single()
            if (profile?.role) setRole(profile.role)
          } catch (e) {
            console.error('Failed to fetch user role:', e)
          }
        }
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

