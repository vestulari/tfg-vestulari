// Obre la connexió amb la base de dades

import postgres from 'postgres'

export function obreConnexio(url: string) {
  return postgres(url, { max: 1, prepare: false })
}

export type Sql = ReturnType<typeof obreConnexio>
