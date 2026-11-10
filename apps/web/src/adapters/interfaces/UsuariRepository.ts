// Descripció de les coses que pot fer el repositori d'usuaris.

export interface UsuariRepository {
  getMe(): Promise<{ userId: string }>
}