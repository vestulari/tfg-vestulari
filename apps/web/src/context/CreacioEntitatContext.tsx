// Esborrany de la creació d'una entitat.
// Guarda el que s'escriu als tres passos (entitat, plantilla i perfil) fins que s'envia a l'API.

import { createContext, useContext, useMemo, useState } from "react";
import { Outlet } from "react-router-dom";
import type { Genere, TipusAtribut } from "@tfg-vestulari/shared";

// Una fila de la plantilla de perfil. La clau només serveix per identificar la fila a la pantalla.
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

// Les files totalment buides s'ignoren.
export function atributsOmplerts(files: AtributFila[]): AtributFila[] {
  return files.filter((f) => f.nom.trim() !== "" || f.tipus !== "");
}

export type CanviEsborrany = Partial<Esborrany> | ((actual: Esborrany) => Partial<Esborrany>);

type Valor = {
  esborrany: Esborrany;
  actualitza: (canvi: CanviEsborrany) => void;
};

const Context = createContext<Valor | null>(null);

// Ruta pare dels tres passos. Mentre l'usuari hi és l'esborrany es guarda, i quan en surt es perd.
export function CreacioEntitatLayout() {
  const [esborrany, setEsborrany] = useState<Esborrany>(NOU);

  const valor = useMemo<Valor>(
    () => ({
      esborrany,
      actualitza: (canvi) =>
        setEsborrany((e) => ({ ...e, ...(typeof canvi === "function" ? canvi(e) : canvi) })),
    }),
    [esborrany]
  );

  return (
    <Context.Provider value={valor}>
      <Outlet />
    </Context.Provider>
  );
}

// Retorna l'esborrany i la funció per canviar-lo. S'ha de fer servir dins de CreacioEntitatLayout.
export function useCreacioEntitat(): Valor {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useCreacioEntitat s'ha d'usar dins de CreacioEntitatLayout");
  return ctx;
}