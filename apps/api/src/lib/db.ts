// Obre la connexió amb la base de dades

import postgres from 'postgres'

// Crea una connexió nova. Se n'obre una per petició, perquè els Workers
// no poden reaprofitar connexions entre peticions.
export function obreConnexio(url: string) {
  return postgres(url, { max: 1, prepare: false })
}

export type Sql = ReturnType<typeof obreConnexio>
