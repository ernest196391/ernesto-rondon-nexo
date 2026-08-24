import ContentStudioClient from "./ContentStudioClient";
import "./content.css";

export default function ContentStudioPage() {
  return <main className="content-page" id="main-content">
    <a className="content-back" href="/studio">← NEXO Studio</a>
    <section className="content-hero">
      <span>EDICIÓN DE VÍDEO</span>
      <h1>Sube un vídeo. NEXO prepara la versión vertical.</h1>
      <p>Analiza la fuente, transcribe cuando lo necesites y te deja revisar los cortes antes de generar el resultado.</p>
    </section>
    <ContentStudioClient />
  </main>;
}
