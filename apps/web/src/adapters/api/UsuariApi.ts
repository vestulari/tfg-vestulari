// Fa les crides API relacionades amb els usuaris

import type { UsuariDto } from '@tfg-vestulari/shared'
import { api } from './ApiClient'
import type { UsuariGateway } from '../interfaces/UsuariGateway'

export const usuariApi: UsuariGateway = {
  getMe: () => api<UsuariDto>('/me'),
  canviaNom: (nom) =>
    api<UsuariDto>('/me', { method: 'PATCH', body: JSON.stringify({ nom }) }),
  canviaImatge: (imatge) => {
    const cos = new FormData()
    cos.append('imatge', imatge)
    return api<UsuariDto>('/me/imatge', { method: 'PUT', body: cos })
  },
  treuImatge: () => api<UsuariDto>('/me/imatge', { method: 'DELETE' }),
}