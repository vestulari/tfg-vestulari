import { createContext, useContext, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import type { Genere, TipusAtribut } from "@tfg-vestulari/shared";

/** Una fila de la plantilla de perfil. `clau` és un identificador estable només per a la interfície. */
export type AtributFila = { clau: number; nom: string; tipus: TipusAtribut | "" };

export type PerfilEsborrany = {
  nom: string;
  edat: string;
  genere: Genere | "";
  esInterpret: boolean;
  esAdministrador: boolean;
  valors: Record<number, string>; // clau de l'atribut → valor
};

export type Esborrany = {
  nom: string;
  descripcio: string;
  any: string;
  mes: string;
  dia: string;
  atributs: AtributFila[];
  perfil: PerfilEsborrany;
};

const NOU: Esborrany = {
  nom: "",
  descripcio: "",
  any: "",
  mes: "",
  dia: "",
  atributs: [{ clau: 1, nom: "", tipus: "" }],
  perfil: {
    nom: "",
    edat: "",
    genere: "",
    esInterpret: false,
    esAdministrador: true,
    valors: {},
  },
};

/** Les files totalment buides s'ignoren. */
export function atributsOmplerts(files: AtributFila[]): AtributFila[] {
  return files.filter((f) => f.nom.trim() !== "" || f.tipus !== "");
}

type Valor = {
  esborrany: Esborrany;
  actualitza: (parcial: Partial<Esborrany>) => void;
};

const Context = createContext<Valor | null>(null);

/** Ruta pare dels tres passos: mentre l'usuari hi és, l'esborrany es conserva; en sortir-ne, s'esborra. */
export function CreacioEntitatLayout() {
  const [esborrany, setEsborrany] = useState<Esborrany>(NOU);

  const valor = useMemo<Valor>(
    () => ({
      esborrany,
      actualitza: (parcial) => setEsborrany((e) => ({ ...e, ...parcial })),
    }),
    [esborrany]
  );

  return (
    <Context.Provider value={valor}>
      <Outlet />
    </Context.Provider>
  );
}

export function useCreacioEntitat(): Valor {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useCreacioEntitat s'ha d'usar dins de CreacioEntitatLayout");
  return ctx;
}