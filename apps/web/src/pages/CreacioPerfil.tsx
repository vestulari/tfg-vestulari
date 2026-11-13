// Últim pas de la creació d'una entitat: el perfil del creador. En confirmar, es crea tot!

import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import type { EntitatNovaDto, Genere, TipusAtribut } from "@tfg-vestulari/shared";
import { ApiError } from "../adapters/api/ApiClient";
import { entitatApi } from "../adapters/api/EntitatApi";
import { useUsuari } from "../auth/UsuariProvider";
import BotoEnrere from "../components/BotoEnrere";
import Capcalera from "../components/Capcalera";
import PerfilForm from "../components/PerfilForm";
import { atributsOmplerts, useCreacioEntitat } from "../context/CreacioEntitatContext";
import "../components/Formulari.css";

// Si s'hi arriba sense haver fet el primer pas (per exemple, en recarregar), torna al principi.
// Proposa el nom de l'usuari com a nom del perfil, sense trepitjar el que ja s'hagi escrit.
export default function CreacioPerfil() {
  const { esborrany, actualitza } = useCreacioEntitat();
  const navigate = useNavigate();
  const [enviant, setEnviant] = useState(false);
  const [errorServidor, setErrorServidor] = useState<string | null>(null);

  const { usuari } = useUsuari();
  const nomUsuari = usuari?.nom;
  useEffect(() => {
    if (!nomUsuari) return;
    actualitza((e) => (e.perfil.nom !== "" ? {} : { perfil: { ...e.perfil, nom: nomUsuari } }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nomUsuari]);

  if (esborrany.nom === "") return <Navigate to="/entitats/nova" replace />;

  const atributs = atributsOmplerts(esborrany.atributs);

  // Munta les dades per a l'API amb tot l'esborrany, crea l'entitat i hi entra
  async function confirma() {
    setEnviant(true);
    setErrorServidor(null);

    const p = esborrany.perfil;
    const dades: EntitatNovaDto = {
      nom: esborrany.nom,
      descripcio: esborrany.descripcio.trim(),
      anyCreacio: Number(esborrany.any),
      mesCreacio: esborrany.mes.trim() === "" ? null : Number(esborrany.mes),
      diaCreacio: esborrany.dia.trim() === "" ? null : Number(esborrany.dia),
      atributs: atributs.map((a) => ({ nom: a.nom, tipus: a.tipus as TipusAtribut })),
      perfil: {
        nom: p.nom,
        edat: Number(p.edat),
        genere: p.genere as Genere,
        esInterpret: p.esInterpret,
        valors: atributs
          .filter((a) => (p.valors[a.clau] ?? "").trim() !== "")
          .map((a) => ({ atribut: a.nom, valor: (p.valors[a.clau] ?? "").trim() })),
      },
    };

    try {
      const { id } = await entitatApi.crea(dades);
      navigate(`/entitat/${id}`);
    } catch (e) {
      setErrorServidor(e instanceof ApiError ? e.message : "No s'ha pogut crear l'entitat.");
      setEnviant(false);
    }
  }

  return (
    <div className="pantalla">
      <Capcalera titol="Crea el teu perfil" bloquejat />

      <div className="pantalla__barra">
        <BotoEnrere to="/entitats/nova/plantilla" />
      </div>

      <main className="pantalla__contingut">
        <PerfilForm
          atributs={atributs}
          perfil={esborrany.perfil}
          onCanvi={(perfil) => actualitza({ perfil })}
          onConfirma={confirma}
          adminObligatori
          enviant={enviant}
          errorServidor={errorServidor}
        />
      </main>
    </div>
  );
}