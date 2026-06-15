import React, { createContext, useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [role, setRole] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      const { data } = await supabase.auth.getSession()
      if (!mounted) return

      if (data?.session?.user) {
        setUser(data.session.user)
        // Fetch user role from profiles table
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', data.session.user.id)
            .single()
          if (profile?.role) setRole(profile.role)
        } catch (e) {
          console.error('Failed to fetch user role:', e)
        }
      }
      setLoading(false)
    }

    initAuth()

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return
      if (session?.user) {
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
      } else {
        setUser(null)
        setRole(null)
      }
    })

    return () => {
      mounted = false
      listener?.subscription?.unsubscribe?.()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, role, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

