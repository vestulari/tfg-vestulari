// Els "catàlegs" de l'entitat: la plantilla de perfil, els tipus de peça (amb els atributs) i la paleta de colors.
// Gairebé no canvien i els fan servir moltes pantalles, així que es demanen a l'API un sol cop per entitat
// (la primera vegada que una pantalla els necessita) i es guarden aquí. Quan un administrador els desa,
// la pantalla actualitza el catàleg amb la resposta de l'API, i no cal tornar-lo a demanar.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AtributDto, ColorDto, TipusPecaDto } from "@tfg-vestulari/shared";
import { entitatApi } from "../adapters/api/EntitatApi";
import { vestuariApi } from "../adapters/api/VestuariApi";

type Catalegs = {
  plantilla: AtributDto[];
  tipus: TipusPecaDto[];
  colors: ColorDto[];
};

type Clau = keyof Catalegs;

// Com es demana cada catàleg a l'API
const carregadors: { [K in Clau]: (entitatId: number) => Promise<Catalegs[K]> } = {
  plantilla: (id) => entitatApi.plantilla(id),
  tipus: (id) => vestuariApi.tipus(id),
  colors: (id) => vestuariApi.colors(id),
};

type Valor = {
  dades: Partial<Catalegs>;
  errors: Partial<Record<Clau, boolean>>;
  demana: (clau: Clau) => void;
  posa: <K extends Clau>(clau: K, canvi: (actual: Catalegs[K] | undefined) => Catalegs[K] | undefined) => void;
};

const CatalegsContext = createContext<Valor | null>(null);

// Guarda els catàlegs d'una entitat. S'ha de posar amb key={entitat.id}, perquè en canviar d'entitat comenci buit.
// Si dues pantalles demanen el mateix catàleg alhora, només es fa una crida.
export function CatalegsProvider({ entitatId, children }: { entitatId: number; children: ReactNode }) {
  const [dades, setDades] = useState<Partial<Catalegs>>({});
  const [errors, setErrors] = useState<Partial<Record<Clau, boolean>>>({});
  const enCurs = useRef(new Set<Clau>());

  const demana = useCallback(
    (clau: Clau) => {
      if (enCurs.current.has(clau)) return;
      enCurs.current.add(clau);
      setErrors((e) => ({ ...e, [clau]: false }));
      carregadors[clau](entitatId)
        .then((v) => setDades((d) => ({ ...d, [clau]: v })))
        .catch((e) => {
          console.error(`Error carregant el catàleg ${clau}`, e);
          setErrors((er) => ({ ...er, [clau]: true }));
        })
        .finally(() => enCurs.current.delete(clau));
    },
    [entitatId]
  );

  const posa = useCallback<Valor["posa"]>((clau, canvi) => {
    setDades((d) => ({ ...d, [clau]: canvi(d[clau]) }));
  }, []);

  const valor = useMemo(() => ({ dades, errors, demana, posa }), [dades, errors, demana, posa]);
  return <CatalegsContext.Provider value={valor}>{children}</CatalegsContext.Provider>;
}

// Retorna el context, o peta si no som dins d'una entitat
function useValor(): Valor {
  const ctx = useContext(CatalegsContext);
  if (!ctx) throw new Error("Els catàlegs s'han d'usar dins de les rutes d'una entitat");
  return ctx;
}

// Retorna un catàleg, i el demana a l'API si encara no s'havia carregat.
// Mentre es carrega, dades és null. Si falla, error és true (i es torna a provar en tornar a la pantalla).
function useCataleg<K extends Clau>(clau: K): { dades: Catalegs[K] | null; error: boolean } {
  const { dades, errors, demana } = useValor();
  const falta = dades[clau] === undefined;
  useEffect(() => {
    if (falta) demana(clau);
  }, [falta, clau, demana]);
  return { dades: dades[clau] ?? null, error: errors[clau] === true };
}

// La plantilla de perfil de l'entitat
export const usePlantilla = () => useCataleg("plantilla");

// Els tipus de peça de l'entitat, cadascun amb els seus atributs
export const useTipusPeca = () => useCataleg("tipus");

// La paleta de colors del vestuari de l'entitat
export const useColors = () => useCataleg("colors");

// Ordena els tipus de peça pel nom, com els retorna l'API
const perNom = (a: TipusPecaDto, b: TipusPecaDto) => a.nom.localeCompare(b.nom, "ca");

// Les funcions per actualitzar els catàlegs amb el que retorna l'API després de desar
export function useActualitzaCatalegs() {
  const { posa } = useValor();
  return useMemo(
    () => ({
      posaPlantilla: (plantilla: AtributDto[]) => posa("plantilla", () => plantilla),
      posaColors: (colors: ColorDto[]) => posa("colors", () => colors),
      // Afegeix un tipus nou o substitueix el que ja hi havia amb el mateix id.
      // Si la llista encara no s'havia carregat, es deixa així: quan calgui, es demanarà sencera.
      posaTipus: (tipus: TipusPecaDto) =>
        posa("tipus", (actual) => actual && [...actual.filter((t) => t.id !== tipus.id), tipus].sort(perNom)),
      treuTipus: (id: number) => posa("tipus", (actual) => actual?.filter((t) => t.id !== id)),
    }),
    [posa]
  );
}
