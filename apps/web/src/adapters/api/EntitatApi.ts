// Fa les crides API relacionades amb les entitats.

import type { EntitatCreadaDto, EntitatDetallDto, EntitatResumDto } from '@tfg-vestulari/shared'
import { api } from './ApiClient'
import type { EntitatGateway } from '../interfaces/EntitatGateway'

export const entitatApi: EntitatGateway = {
  llistaMeves: () => api<EntitatResumDto[]>('/me/entitats'),
  detall: (id) => api<EntitatDetallDto>(`/entitats/${id}`),
  crea: (dades) =>
    api<EntitatCreadaDto>('/entitats', { method: 'POST', body: JSON.stringify(dades) }),
}