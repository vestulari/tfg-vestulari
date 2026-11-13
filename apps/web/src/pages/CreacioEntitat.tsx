// Primer pas de la creació d'una entitat: el nom, la data de creació i la descripció.

import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  DESCRIPCIO_MAX,
  ENTITAT_NOM_MAX,
  errorDataCreacio,
  errorDescripcio,
  errorNomEntitat,
} from "@tfg-vestulari/shared";
import BotoEnrere from "../components/BotoEnrere";
import Capcalera from "../components/Capcalera";
import { useCreacioEntitat } from "../context/CreacioEntitatContext";
import { filtraEnter } from "../lib/enters";
import "../components/Formulari.css";
import "./CreacioEntitat.css";

// Passa un text a número, o a null si és buit
const aEnter = (s: string): number | null => (s.trim() === "" ? null : Number(s));

// La imatge encara no es pot pujar: de moment només hi ha l'espai reservat
export default function CreacioEntitat() {
  const { esborrany, actualitza } = useCreacioEntitat();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  // Desa el canvi a l'esborrany i treu l'error
  function canvia(parcial: Parameters<typeof actualitza>[0]) {
    actualitza(parcial);
    setError(null);
  }

  // Valida aquest pas i, si està bé, passa a la plantilla
  function envia(e: FormEvent) {
    e.preventDefault();

    const err =
      errorNomEntitat(esborrany.nom) ??
      errorDataCreacio(aEnter(esborrany.any), aEnter(esborrany.mes), aEnter(esborrany.dia)) ??
      errorDescripcio(esborrany.descripcio);

    if (err) {
      setError(err);
      return;
    }
    setError(null);
    navigate("/entitats/nova/plantilla");
  }

  return (
    <div className="pantalla">
      <Capcalera titol="Creant una entitat…" bloquejat />

      <div className="pantalla__barra">
        <BotoEnrere to="/inici" />
      </div>

      <main className="pantalla__contingut">
        <form className="formulari" onSubmit={envia} noValidate>
          <div className="entitat-nova__dalt">
            {/* Espai reservat per a la imatge: encara no és funcional */}
            <div className="entitat-nova__imatge" aria-hidden="true">
              <svg className="entitat-nova__icona" viewBox="0 0 80 64" focusable="false">
                <rect x="3" y="3" width="74" height="58" rx="2" fill="none" stroke="currentColor" strokeWidth="4" />
                <polyline
                  points="3,48 24,26 40,42 54,30 77,52"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeLinejoin="round"
                />
                <circle cx="56" cy="18" r="6" fill="none" stroke="currentColor" strokeWidth="4" />
              </svg>
              <span>Insereix imatge</span>
            </div>

            <div className="entitat-nova__camps">
              <div className="formulari__fila">
                <label className="formulari__etiqueta entitat-nova__etiqueta" htmlFor="entitat-nom">
                  Nom de l'entitat
                </label>
                <input
                  id="entitat-nom"
                  className="formulari__input entitat-nova__nom"
                  type="text"
                  autoComplete="off"
                  placeholder="Escriu aquí…"
                  value={esborrany.nom}
                  maxLength={ENTITAT_NOM_MAX}
                  onChange={(e) => canvia({ nom: e.target.value })}
                />
              </div>

              <div className="formulari__fila">
                <div className="entitat-nova__etiqueta">
                  <span className="formulari__etiqueta" id="etiqueta-data">
                    Data de creació de l'entitat
                  </span>
                  <span className="formulari__nota" id="nota-data">
                    D'aquests números l'únic obligatori és l'any
                  </span>
                </div>
                <div
                  className="entitat-nova__data"
                  role="group"
                  aria-labelledby="etiqueta-data"
                  aria-describedby="nota-data"
                >
                  <input
                    className="formulari__input formulari__input--centrat"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="Dia"
                    aria-label="Dia"
                    maxLength={2}
                    value={esborrany.dia}
                    onChange={(e) => canvia({ dia: filtraEnter(e.target.value) })}
                  />
                  <input
                    className="formulari__input formulari__input--centrat"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="Mes"
                    aria-label="Mes"
                    maxLength={2}
                    value={esborrany.mes}
                    onChange={(e) => canvia({ mes: filtraEnter(e.target.value) })}
                  />
                  <input
                    className="formulari__input formulari__input--centrat"
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    placeholder="Any"
                    aria-label="Any (obligatori)"
                    maxLength={4}
                    value={esborrany.any}
                    onChange={(e) => canvia({ any: filtraEnter(e.target.value) })}
                  />
                </div>
              </div>
            </div>
          </div>

          <label className="formulari__etiqueta" htmlFor="entitat-descripcio">
            Descripció de l'entitat
          </label>
          <textarea
            id="entitat-descripcio"
            className="formulari__textarea"
            placeholder={
              "Explica què sou, d'on sou, què feu… Qualsevol dada que pugui ser rellevant de l'entitat!\nAquesta informació la veuran els usuaris convidats."
            }
            maxLength={DESCRIPCIO_MAX}
            value={esborrany.descripcio}
            onChange={(e) => canvia({ descripcio: e.target.value })}
          />
          <span className="formulari__comptador" aria-hidden="true">
            {Array.from(esborrany.descripcio).length} / {DESCRIPCIO_MAX}
          </span>

          {error && <p className="formulari__error" role="alert">{error}</p>}

          <div className="formulari__accions">
            <button type="submit" className="formulari__confirma">Confirmar</button>
          </div>
        </form>
      </main>
    </div>
  );
}