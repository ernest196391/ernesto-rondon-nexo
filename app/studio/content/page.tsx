import ContentStudioClient from "./ContentStudioClient";
import "./content.css";

export default function ContentStudioPage() {
  return <main className="content-page" id="main-content">
    <a className="content-back" href="/studio">← NEXO Studio</a>
    <section className="content-hero">
      <span>NEXO CONTENT STUDIO · 05</span>
      <h1>Convierte vídeo horizontal en una pieza vertical lista para revisar.</h1>
      <p>El motor empieza por una transformación real y reproducible. Después añadiremos las capas del Kit 05: transcripción, silencios, tomas repetidas, subtítulos, rótulos y mezcla de sonido.</p>
    </section>
    <ContentStudioClient />
  </main>;
}
