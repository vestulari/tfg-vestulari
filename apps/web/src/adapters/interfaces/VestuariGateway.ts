// Normalització de les crides a l'API relacionades amb el vestuari d'una entitat
// (tipus de peça, peces de roba i paleta de colors). També comprova que el return sigui el tipus esperat.

import type {
  ColorDadesDto,
  ColorDto,
  PecaDadesDto,
  PecaDetallDto,
  PecaResumDto,
  TipusPecaDadesDto,
  TipusPecaDto,
  TipusPecaResumDto,
} from '@tfg-vestulari/shared'

export interface VestuariGateway {
  // Tipus de peça
  tipus(entitatId: number): Promise<TipusPecaResumDto[]>
  tipusDetall(entitatId: number, tipusId: number): Promise<TipusPecaDto>
  creaTipus(entitatId: number, dades: TipusPecaDadesDto): Promise<{ id: number }>
  desaTipus(entitatId: number, tipusId: number, dades: TipusPecaDadesDto): Promise<TipusPecaDto>
  eliminaTipus(entitatId: number, tipusId: number): Promise<void>

  // Peces de roba
  peces(entitatId: number): Promise<PecaResumDto[]>
  peca(entitatId: number, pecaId: number): Promise<PecaDetallDto>
  creaPeca(entitatId: number, dades: PecaDadesDto): Promise<{ id: number }>
  editaPeca(entitatId: number, pecaId: number, dades: PecaDadesDto): Promise<PecaDetallDto>
  eliminaPeca(entitatId: number, pecaId: number): Promise<void>
  canviaImatgePeca(entitatId: number, pecaId: number, imatge: File): Promise<PecaDetallDto>
  treuImatgePeca(entitatId: number, pecaId: number): Promise<PecaDetallDto>
  // La foto mateixa, per posar-la a la fitxa tècnica
  fitxerImatgePeca(entitatId: number, pecaId: number): Promise<Blob>

  // Paleta de colors
  colors(entitatId: number): Promise<ColorDto[]>
  desaColors(entitatId: number, colors: ColorDadesDto[]): Promise<ColorDto[]>
}
