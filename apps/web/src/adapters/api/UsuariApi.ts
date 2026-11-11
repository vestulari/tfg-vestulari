// Fa les crides API relacionades amb els usuaris

import type { UsuariDto } from '@tfg-vestulari/shared'
import { api } from './ApiClient'
import type { UsuariGateway } from '../interfaces/UsuariGateway'

export const usuariApi: UsuariGateway = {
  getMe: () => api<UsuariDto>('/me'),
}