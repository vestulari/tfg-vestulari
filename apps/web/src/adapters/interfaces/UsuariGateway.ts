import type { UsuariDto } from '@tfg-vestulari/shared'

export interface UsuariGateway {
  getMe(): Promise<UsuariDto>
}