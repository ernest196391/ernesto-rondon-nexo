import KitBuilderClient from "./KitBuilderClient";
import "./kit-builder.css";

export default function KitBuilderPage() {
  return <main className="kit-builder-page" id="main-content">
    <a className="kit-builder-back" href="/studio">← NEXO Studio</a>
    <section className="kit-builder-hero">
      <span>NEXO KIT BUILDER · 08</span>
      <h1>Convierte una tarea repetitiva en un especialista.</h1>
      <p>Define el problema, comprueba fuentes, fija criterios y genera un contrato portable. NEXO no lo considera listo hasta que exista un ejemplo ejecutado y validado.</p>
    </section>
    <KitBuilderClient />
  </main>;
}
