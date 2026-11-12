import { useState, type FormEvent } from "react";
import {
  EDAT_MAX,
  EDAT_MIN,
  GENERES,
  PERFIL_NOM_MAX,
  VALOR_MAX,
  errorEdat,
  errorGenere,
  errorNomPerfil,
  errorValor,
  type Genere,
  type TipusAtribut,
} from "@tfg-vestulari/shared";
import type { AtributFila, PerfilEsborrany } from "../context/CreacioEntitatContext";
import "./Formulari.css";
import "./PerfilForm.css";

type AtributDefinit = AtributFila & { tipus: TipusAtribut };

type Props = {
  /** Atributs addicionals de la plantilla. */
  atributs: AtributFila[];
  perfil: PerfilEsborrany;
  onCanvi: (perfil: PerfilEsborrany) => void;
  /** Només es crida si el formulari és vàlid. */
  onConfirma: () => void;
  /** El creador de l'entitat sempre és administrador i no ho pot deixar de ser. */
  adminObligatori?: boolean;
  enviant?: boolean;
  errorServidor?: string | null;
};

export default function PerfilForm({
  atributs,
  perfil,
  onCanvi,
  onConfirma,
  adminObligatori = false,
  enviant = false,
  errorServidor = null,
}: Props) {
  const [error, setError] = useState<string | null>(null);
  const [infoOberta, setInfoOberta] = useState(false);

  const definits = atributs.filter((a): a is AtributDefinit => a.tipus !== "");
  const esAdmin = adminObligatori || perfil.esAdministrador;

  function canvia(parcial: Partial<PerfilEsborrany>) {
    onCanvi({ ...perfil, ...parcial });
    setError(null);
  }

  function envia(e: FormEvent) {
    e.preventDefault();

    const edat = perfil.edat.trim() === "" ? null : Number(perfil.edat);
    let err =
      errorNomPerfil(perfil.nom) ??
      errorEdat(edat) ??
      errorGenere(perfil.genere) ??
      (esAdmin || perfil.esInterpret ? null : "Cal triar almenys un tipus de permís.");

    if (!err) {
      for (const a of definits) {
        err = errorValor(a.nom, a.tipus, perfil.valors[a.clau] ?? "");
        if (err) break;
      }
    }

    if (err) {
      setError(err);
      return;
    }
    setError(null);
    onConfirma();
  }

  const missatge = error ?? errorServidor;

  return (
    <form className="formulari" onSubmit={envia} noValidate>
      <div className="formulari__fila">
        <label className="formulari__etiqueta perfil__etiqueta" htmlFor="perfil-nom">
          Nom del perfil
        </label>
        <input
          id="perfil-nom"
          className="formulari__input perfil__ample"
          type="text"
          value={perfil.nom}
          maxLength={PERFIL_NOM_MAX}
          onChange={(e) => canvia({ nom: e.target.value })}
        />
      </div>

      <div className="formulari__fila">
        <label className="formulari__etiqueta perfil__etiqueta" htmlFor="perfil-edat">
          Edat del perfil
        </label>
        <input
          id="perfil-edat"
          className="formulari__input perfil__curt"
          type="number"
          inputMode="numeric"
          step={1}
          min={EDAT_MIN}
          max={EDAT_MAX}
          value={perfil.edat}
          onChange={(e) => canvia({ edat: e.target.value })}
        />

        <label className="formulari__etiqueta perfil__etiqueta" htmlFor="perfil-genere">
          Gènere del perfil
        </label>
        <select
          id="perfil-genere"
          className="formulari__input perfil__mig"
          value={perfil.genere}
          onChange={(e) => canvia({ genere: e.target.value as Genere | "" })}
        >
          <option value="">Escull…</option>
          {GENERES.map((g) => (
            <option key={g.valor} value={g.valor}>{g.etiqueta}</option>
          ))}
        </select>
      </div>

      <fieldset className="perfil__permisos">
        <legend className="formulari__etiqueta">Tipus de permisos d'aquest usuari:</legend>

        <button
          type="button"
          className="perfil__info"
          aria-label="Més informació sobre els permisos"
          aria-expanded={infoOberta}
          onClick={() => setInfoOberta(!infoOberta)}
        >
          i
        </button>

        <label className="perfil__opcio">
          <input
            type="checkbox"
            checked={perfil.esInterpret}
            onChange={(e) => canvia({ esInterpret: e.target.checked })}
          />
          <span>Intèrpret</span>
        </label>

        <label className="perfil__opcio">
          <input
            type="checkbox"
            checked={esAdmin}
            disabled={adminObligatori}
            onChange={(e) => canvia({ esAdministrador: e.target.checked })}
          />
          <span>Administrador</span>
        </label>
      </fieldset>

      {infoOberta && (
        <p className="formulari__nota perfil__explicacio" role="note">
          Un intèrpret participa en els espectacles de l'entitat. Un administrador, a més, gestiona
          l'entitat (perfils, peces de roba, espectacles…). Un perfil pot ser les dues coses.
        </p>
      )}
      {adminObligatori && (
        <p className="formulari__nota">Com a creador de l'entitat, sempre ets administrador.</p>
      )}

      {definits.map((a) => (
        <div key={a.clau} className="formulari__fila">
          <label className="formulari__etiqueta perfil__etiqueta" htmlFor={`valor-${a.clau}`}>
            {a.nom}
          </label>
          <input
            id={`valor-${a.clau}`}
            className="formulari__input perfil__mig"
            type={a.tipus === "integer" ? "number" : "text"}
            step={a.tipus === "integer" ? 1 : undefined}
            placeholder={a.tipus === "integer" ? "Número" : "Text"}
            maxLength={VALOR_MAX}
            value={perfil.valors[a.clau] ?? ""}
            onChange={(e) => canvia({ valors: { ...perfil.valors, [a.clau]: e.target.value } })}
          />
        </div>
      ))}

      {missatge && <p className="formulari__error" role="alert">{missatge}</p>}

      <div className="formulari__accions">
        <button type="submit" className="formulari__confirma" disabled={enviant}>
          {enviant ? "Un moment…" : "Confirmar"}
        </button>
      </div>
    </form>
  );
}