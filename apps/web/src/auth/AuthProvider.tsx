// Creador del context d'autentificació.
// Serveix per compartir l'estat entre components.

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type AuthState = {
  session: Session | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

// Guarda la sessió de Supabase i l'actualitza quan l'usuari entra o surt
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const value: AuthState = {
    session,
    user: session?.user ?? null,
    loading,
    signOut: async () => {
      await supabase.auth.signOut()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Retorna l'estat de la sessió. S'ha de fer servir dins d'AuthProvider.
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error("useAuth s'ha d'usar dins d'AuthProvider")
  return ctx
}

// Tanca la sessió i porta a la landing.
// Primer es navega i després es tanca: si fos al revés, RequireAuth ens enviaria un instant a /login.
export function useTancaSessio() {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  return () => {
    navigate('/', { replace: true })
    void signOut()
  }
}
