// Fa les crides API relacionades amb el vestuari d'una entitat (tipus de peça, peces de roba i colors).

import type {
  AmbAvis,
  ColorDto,
  PecaDetallDto,
  PecaResumDto,
  TipusPecaDto,
} from '@tfg-vestulari/shared'
import { api, apiFitxer, cosAmbImatge } from './ApiClient'
import type { VestuariGateway } from '../interfaces/VestuariGateway'

// Rutes base del vestuari d'una entitat
const tipus = (entitatId: number) => `/entitats/${entitatId}/tipus-peca`
const peces = (entitatId: number) => `/entitats/${entitatId}/peces`

export const vestuariApi: VestuariGateway = {
  tipus: (entitatId) => api<TipusPecaDto[]>(tipus(entitatId)),
  creaTipus: (entitatId, dades) =>
    api<TipusPecaDto>(tipus(entitatId), { method: 'POST', body: JSON.stringify(dades) }),
  desaTipus: (entitatId, tipusId, dades) =>
    api<TipusPecaDto>(`${tipus(entitatId)}/${tipusId}`, { method: 'PUT', body: JSON.stringify(dades) }),
  eliminaTipus: (entitatId, tipusId) =>
    api<void>(`${tipus(entitatId)}/${tipusId}`, { method: 'DELETE' }),

  peces: (entitatId) => api<PecaResumDto[]>(peces(entitatId)),
  peca: (entitatId, pecaId) => api<PecaDetallDto>(`${peces(entitatId)}/${pecaId}`),
  creaPeca: (entitatId, dades, imatge) =>
    api<AmbAvis<PecaDetallDto>>(peces(entitatId), { method: 'POST', body: cosAmbImatge(dades, imatge) }),
  editaPeca: (entitatId, pecaId, dades, imatge) =>
    api<AmbAvis<PecaDetallDto>>(`${peces(entitatId)}/${pecaId}`, {
      method: 'PUT',
      body: cosAmbImatge(dades, imatge),
    }),
  eliminaPeca: (entitatId, pecaId) => api<void>(`${peces(entitatId)}/${pecaId}`, { method: 'DELETE' }),
  fitxerImatgePeca: (entitatId, pecaId) => apiFitxer(`${peces(entitatId)}/${pecaId}/imatge/fitxer`),

  colors: (entitatId) => api<ColorDto[]>(`/entitats/${entitatId}/colors`),
  desaColors: (entitatId, colors) =>
    api<ColorDto[]>(`/entitats/${entitatId}/colors`, { method: 'PUT', body: JSON.stringify({ colors }) }),
}
