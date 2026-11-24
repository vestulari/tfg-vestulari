// Fa les crides API relacionades amb les entitats.

import type {
  AdministradorDto,
  AmbAvis,
  AtributDto,
  EntitatCreadaDto,
  EntitatDetallDto,
  EntitatResumDto,
} from '@tfg-vestulari/shared'
import { api, apiFitxer, cosAmbImatge } from './ApiClient'
import type { EntitatGateway } from '../interfaces/EntitatGateway'

export const entitatApi: EntitatGateway = {
  llistaMeves: () => api<EntitatResumDto[]>('/me/entitats'),
  detall: (id) => api<EntitatDetallDto>(`/entitats/${id}`),
  crea: (dades, imatge) =>
    api<EntitatCreadaDto>('/entitats', { method: 'POST', body: cosAmbImatge(dades, imatge) }),
  edita: (id, dades, imatge) =>
    api<AmbAvis<EntitatDetallDto>>(`/entitats/${id}`, { method: 'PATCH', body: cosAmbImatge(dades, imatge) }),
  elimina: (id) => api<void>(`/entitats/${id}`, { method: 'DELETE' }),
  fitxerImatge: (id) => apiFitxer(`/entitats/${id}/imatge/fitxer`),
  administradors: (id) => api<AdministradorDto[]>(`/entitats/${id}/administradors`),
  passaCreador: (id, perfilId) =>
    api<void>(`/entitats/${id}/creador`, { method: 'POST', body: JSON.stringify({ perfilId }) }),
  surt: (id) => api<void>(`/entitats/${id}/sortir`, { method: 'POST' }),
  plantilla: (id) => api<AtributDto[]>(`/entitats/${id}/plantilla`),
  desaPlantilla: (id, atributs) =>
    api<AtributDto[]>(`/entitats/${id}/plantilla`, {
      method: 'PUT',
      body: JSON.stringify({ atributs }),
    }),
}
