// Primer pas de la creació d'una entitat: el nom, la data de creació i la descripció.

import { useNavigate } from "react-router-dom";
import BotoEnrere from "../components/BotoEnrere";
import Capcalera from "../components/Capcalera";
import EntitatForm from "../components/EntitatForm";
import { useCreacioEntitat } from "../context/CreacioEntitatContext";
import "../components/Formulari.css";

// Les dades es guarden a l'esborrany, i si són vàlides es passa a la plantilla
export default function CreacioEntitat() {
  const { esborrany, actualitza } = useCreacioEntitat();
  const navigate = useNavigate();

  return (
    <div className="pantalla">
      <Capcalera titol="Creant una entitat…" bloquejat />

      <div className="pantalla__barra">
        <BotoEnrere to="/inici" />
      </div>

      <main className="pantalla__contingut">
        <EntitatForm
          dades={esborrany}
          onCanvi={actualitza}
          onConfirma={() => navigate("/entitats/nova/plantilla")}
        />
      </main>
    </div>
  );
}
