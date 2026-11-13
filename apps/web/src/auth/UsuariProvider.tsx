// Context amb les dades de l'usuari que ha entrat (nom, invitacions pendents...).
// Es demanen un sol cop i les fan servir totes les pantalles.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { UsuariDto } from '@tfg-vestulari/shared'
import { usuariApi } from '../adapters/api/UsuariApi'

type UsuariState = {
  usuari: UsuariDto | null
  error: boolean
  // Torna a demanar les dades a l'API (per exemple, després de resoldre una invitació).
  recarrega: () => Promise<void>
  // Substitueix les dades per unes que ja tenim (per exemple, la resposta d'un PATCH).
  estableix: (u: UsuariDto) => void
}

const UsuariContext = createContext<UsuariState | null>(null)

// Carrega l'usuari en muntar-se i el comparteix amb totes les pantalles
export function UsuariProvider({ children }: { children: ReactNode }) {
  const [usuari, setUsuari] = useState<UsuariDto | null>(null)
  const [error, setError] = useState(false)

  const recarrega = useCallback(async () => {
    try {
      setUsuari(await usuariApi.getMe())
      setError(false)
    } catch (e) {
      console.error("Error carregant l'usuari", e)
      setError(true)
    }
  }, [])

  useEffect(() => {
    void recarrega()
  }, [recarrega])

  const value = useMemo<UsuariState>(
    () => ({ usuari, error, recarrega, estableix: setUsuari }),
    [usuari, error, recarrega]
  )

  return <UsuariContext.Provider value={value}>{children}</UsuariContext.Provider>
}

// Retorna l'usuari carregat. S'ha de fer servir dins d'UsuariProvider.
export function useUsuari() {
  const ctx = useContext(UsuariContext)
  if (!ctx) throw new Error("useUsuari s'ha d'usar dins d'UsuariProvider")
  return ctx
}
