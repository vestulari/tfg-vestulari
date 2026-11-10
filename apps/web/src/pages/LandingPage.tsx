/* Landing page de l'aplicació */

import { useNavigate } from "react-router-dom";
import LandingNavBar from "../components/LandingNavBar";
import "./LandingPage.css";

export default function Landing() {
  const navigate = useNavigate();

  return (
    <main className="landing">
      <LandingNavBar />

      <section className="landing__hero">
        <h1 className="landing__title">Vestulari</h1>

        <p className="landing__subtitle">Tot el teu vestuari, en un mateix lloc</p>

        <p className="landing__text">
          Tingues el teu vestuari ordenat en un mateix lloc, amb la capacitat de
          poder planificar l’espai artístic tenint en compte els intèrprets, les
          posicions i el vestuari que utilitzaran.
        </p>

        {/* Botó vermell, si s'acciona, es va al login! */}
        <button className="landing__cta" onClick={() => navigate("/login")}>
          Inicia sessió
        </button>
      </section>
    </main>
  );
}