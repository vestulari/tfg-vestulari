// Normalització de les crides a l'API relacionades amb el vestuari d'una entitat
// (tipus de peça, peces de roba i paleta de colors). També comprova que el return sigui el tipus esperat.

import type {
  AmbAvis,
  ColorDadesDto,
  ColorDto,
  PecaDadesDto,
  PecaDetallDto,
  PecaResumDto,
  TipusPecaDadesDto,
  TipusPecaDto,
} from '@tfg-vestulari/shared'
import type { CanviImatge } from '../api/ApiClient'

export interface VestuariGateway {
  // Tipus de peça (la llista ja porta els atributs de cada tipus)
  tipus(entitatId: number): Promise<TipusPecaDto[]>
  creaTipus(entitatId: number, dades: TipusPecaDadesDto): Promise<TipusPecaDto>
  desaTipus(entitatId: number, tipusId: number, dades: TipusPecaDadesDto): Promise<TipusPecaDto>
  eliminaTipus(entitatId: number, tipusId: number): Promise<void>

  // Peces de roba
  peces(entitatId: number): Promise<PecaResumDto[]>
  peca(entitatId: number, pecaId: number): Promise<PecaDetallDto>
  // Crear i editar desen les dades i la foto alhora. Si la foto falla, la resposta porta un avís.
  creaPeca(entitatId: number, dades: PecaDadesDto, imatge: CanviImatge): Promise<AmbAvis<PecaDetallDto>>
  editaPeca(
    entitatId: number,
    pecaId: number,
    dades: PecaDadesDto,
    imatge: CanviImatge
  ): Promise<AmbAvis<PecaDetallDto>>
  eliminaPeca(entitatId: number, pecaId: number): Promise<void>
  // La foto mateixa, per posar-la a la fitxa tècnica
  fitxerImatgePeca(entitatId: number, pecaId: number): Promise<Blob>

  // Paleta de colors
  colors(entitatId: number): Promise<ColorDto[]>
  desaColors(entitatId: number, colors: ColorDadesDto[]): Promise<ColorDto[]>
}
