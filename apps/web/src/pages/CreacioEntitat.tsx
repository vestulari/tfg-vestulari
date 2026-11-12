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
import "../components/Formulari.css";
import "./CreacioEntitat.css";

const aEnter = (s: string): number | null => (s.trim() === "" ? null : Number(s));

export default function CreacioEntitat() {
  const { esborrany, actualitza } = useCreacioEntitat();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

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
      <Capcalera titol="Creant una entitat…" />

      <div className="pantalla__barra">
        <BotoEnrere to="/inici" />
      </div>

      <main className="pantalla__contingut">
        <form className="formulari" onSubmit={envia} noValidate>
          <div className="entitat-nova__dalt">
            {/* Espai reservat per a la imatge: encara no és funcional */}
            <div className="entitat-nova__imatge" aria-hidden="true">
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
                  placeholder="Escriu aquí…"
                  value={esborrany.nom}
                  maxLength={ENTITAT_NOM_MAX}
                  onChange={(e) => {
                    actualitza({ nom: e.target.value });
                    setError(null);
                  }}
                />
              </div>

              <div className="formulari__fila">
                <div className="entitat-nova__etiqueta">
                  <span className="formulari__etiqueta">Data de creació de l'entitat</span>
                  <span className="formulari__nota" id="nota-data">
                    D'aquests números l'únic obligatori és l'any
                  </span>
                </div>
                <div className="entitat-nova__data" role="group" aria-describedby="nota-data">
                  <input
                    className="formulari__input"
                    type="number"
                    inputMode="numeric"
                    placeholder="Dia"
                    aria-label="Dia"
                    min={1}
                    max={31}
                    value={esborrany.dia}
                    onChange={(e) => {
                      actualitza({ dia: e.target.value });
                      setError(null);
                    }}
                  />
                  <input
                    className="formulari__input"
                    type="number"
                    inputMode="numeric"
                    placeholder="Mes"
                    aria-label="Mes"
                    min={1}
                    max={12}
                    value={esborrany.mes}
                    onChange={(e) => {
                      actualitza({ mes: e.target.value });
                      setError(null);
                    }}
                  />
                  <input
                    className="formulari__input"
                    type="number"
                    inputMode="numeric"
                    placeholder="Any"
                    aria-label="Any (obligatori)"
                    required
                    value={esborrany.any}
                    onChange={(e) => {
                      actualitza({ any: e.target.value });
                      setError(null);
                    }}
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
            onChange={(e) => {
              actualitza({ descripcio: e.target.value });
              setError(null);
            }}
          />

          {error && <p className="formulari__error" role="alert">{error}</p>}

          <div className="formulari__accions">
            <button type="submit" className="formulari__confirma">Confirmar</button>
          </div>
        </form>
      </main>
    </div>
  );
}