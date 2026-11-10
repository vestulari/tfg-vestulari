import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthProvider'
import { usuariApi } from '../adapters/api/usuariAPI'

export default function Inici() {
  const { user, signOut } = useAuth()
  const [apiUserId, setApiUserId] = useState('…')

  useEffect(() => {
    usuariApi
      .getMe()
      .then((r) => setApiUserId(r.userId))
      .catch(() => setApiUserId('error'))
  }, [])

  return (
    <div>
      <p>Sessió: {user?.email}</p>
      <p>L'API et reconeix com a: {apiUserId}</p>
      <button onClick={signOut}>Tanca la sessió</button>
    </div>
  )
}