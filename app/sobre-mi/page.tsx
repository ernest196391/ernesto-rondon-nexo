import Link from "next/link";

const focus = [
  ["Operaciones", "Convertir procesos dispersos en sistemas claros, medibles y repetibles."],
  ["Ventas y oferta", "Entender qué problema merece resolverse y cómo traducirlo en una propuesta concreta."],
  ["Producto digital", "Usar software e inteligencia artificial para acelerar trabajo real, no para decorar una idea."],
  ["Aprendizaje", "Construir, medir, corregir y documentar lo aprendido para reutilizarlo en el siguiente negocio."],
];

export default function Page() {
  return <main id="main-content">
    <section className="hero portfolio-hero">
      <div className="eyebrow">ERNESTO RONDÓN CEDEÑO</div>
      <h1>Aprender haciendo. Construir con método.</h1>
      <p className="lead">Mi formación profesional comenzó en medicina y con el tiempo mi trabajo se extendió al emprendimiento, la administración, las ventas, el marketing, las operaciones y los productos digitales.</p>
      <p className="lead">Hoy concentro ese recorrido en NEXO: investigar problemas, validar oportunidades y convertirlas en negocios, sistemas y herramientas usando tecnología e inteligencia artificial.</p>
      <div className="actions"><Link className="cta" href="/negocios">Ver proyectos</Link><Link className="cta secondary" href="/herramientas">Analizar una idea</Link></div>
    </section>

    <section className="section">
      <div className="eyebrow">CÓMO TRABAJO</div>
      <h2>Menos teoría aislada. Más ciclos completos.</h2>
      <div className="grid">{focus.map(([title, description]) => <article className="card" key={title}><h3>{title}</h3><p className="muted">{description}</p></article>)}</div>
    </section>

    <section className="section">
      <div className="eyebrow">PRINCIPIO</div>
      <h2>No presentar como resultado lo que todavía es una hipótesis.</h2>
      <p className="lead">Los proyectos de este portfolio se muestran con su estado real: operativo, en desarrollo, en construcción o experiencia previa. NEXO se está construyendo sobre esa disciplina: evidencia antes que apariencia.</p>
    </section>
  </main>;
}
