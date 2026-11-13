// Fa les crides API relacionades amb les entitats.

import type {
  AdministradorDto,
  EntitatCreadaDto,
  EntitatDetallDto,
  EntitatResumDto,
} from '@tfg-vestulari/shared'
import { api } from './ApiClient'
import type { EntitatGateway } from '../interfaces/EntitatGateway'

export const entitatApi: EntitatGateway = {
  llistaMeves: () => api<EntitatResumDto[]>('/me/entitats'),
  detall: (id) => api<EntitatDetallDto>(`/entitats/${id}`),
  crea: (dades) =>
    api<EntitatCreadaDto>('/entitats', { method: 'POST', body: JSON.stringify(dades) }),
  edita: (id, dades) =>
    api<EntitatDetallDto>(`/entitats/${id}`, { method: 'PATCH', body: JSON.stringify(dades) }),
  elimina: (id) => api<void>(`/entitats/${id}`, { method: 'DELETE' }),
  administradors: (id) => api<AdministradorDto[]>(`/entitats/${id}/administradors`),
  passaCreador: (id, perfilId) =>
    api<void>(`/entitats/${id}/creador`, { method: 'POST', body: JSON.stringify({ perfilId }) }),
  surt: (id) => api<void>(`/entitats/${id}/sortir`, { method: 'POST' }),
}
