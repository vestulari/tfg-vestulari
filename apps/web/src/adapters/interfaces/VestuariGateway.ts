// Normalització de les crides a l'API relacionades amb el vestuari d'una entitat
// (els tipus de peça i les peces de roba). També comprova que el return sigui el tipus esperat.

import type {
  PecaResumDto,
  TipusPecaDadesDto,
  TipusPecaDto,
  TipusPecaResumDto,
} from '@tfg-vestulari/shared'

export interface VestuariGateway {
  peces(entitatId: number): Promise<PecaResumDto[]>
  tipus(entitatId: number): Promise<TipusPecaResumDto[]>
  tipusDetall(entitatId: number, tipusId: number): Promise<TipusPecaDto>
  creaTipus(entitatId: number, dades: TipusPecaDadesDto): Promise<{ id: number }>
  desaTipus(entitatId: number, tipusId: number, dades: TipusPecaDadesDto): Promise<TipusPecaDto>
  eliminaTipus(entitatId: number, tipusId: number): Promise<void>
}
