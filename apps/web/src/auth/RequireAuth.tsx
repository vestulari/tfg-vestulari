// Creador del component que protegeix les rutes que necessiten autentificació.
// Si no estas autentificat, t'envia cap al login.

import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { UsuariProvider } from './UsuariProvider'

// Mentre carrega, espera. Sense sessió, envia al login (recordant on es volia anar).
// Amb sessió, carrega l'usuari per a totes les pantalles de dins. La key fa que,
// si canvia l'usuari, no quedin dades de l'anterior.
export function RequireAuth() {
  const { session, loading } = useAuth()
  const location = useLocation()

  if (loading) return <p>Carregant…</p>
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />
  return (
    <UsuariProvider key={session.user.id}>
      <Outlet />
    </UsuariProvider>
  )
}