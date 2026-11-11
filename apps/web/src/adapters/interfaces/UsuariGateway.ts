// Normalització de les crides a l'API relacionades amb els usuaris.
// També comprova que el return sigui el tipus esperat.

import type { UsuariDto } from '@tfg-vestulari/shared'

export interface UsuariGateway {
  getMe(): Promise<UsuariDto>
}