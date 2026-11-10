import postgres from 'postgres'

export function obreConnexio(url: string) {
  return postgres(url, { max: 1, prepare: false })
}

export type Sql = ReturnType<typeof obreConnexio>