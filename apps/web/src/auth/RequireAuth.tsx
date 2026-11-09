// Creador del component que protegeix les rutes que necessiten autentificació.
// Si no estas autentificat, t'envia cap al login.

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'

export function RequireAuth() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p>Carregant…</p>
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}