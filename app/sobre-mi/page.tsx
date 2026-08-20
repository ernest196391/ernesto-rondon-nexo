import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Ernesto Rondón | NEXO",
  description: "Trayectoria de Ernesto Rondón: medicina, emprendimiento, operaciones y construcción de negocios y productos digitales con inteligencia artificial.",
};

const principles = [
  ["Problemas reales", "Prefiero empezar por una necesidad concreta antes que por una tecnología o una moda."],
  ["Aprender operando", "Ventas, proveedores, atención al cliente y logística enseñan cosas que una presentación no muestra."],
  ["IA como acelerador", "La inteligencia artificial sirve para investigar, estructurar y construir más rápido; no sustituye la evidencia del mercado."],
  ["Sistemas, no improvisación", "NEXO nace para convertir aprendizajes dispersos en un proceso repetible de decisión y ejecución."],
];

export default function Page() {
  return <main id="main-content">
    <section className="hero compact-hero">
      <div className="eyebrow">ERNESTO RONDÓN CEDEÑO</div>
      <h1>Aprender haciendo.</h1>
      <p className="lead">Mi formación profesional comenzó en medicina. Con el tiempo, mi trabajo se extendió al emprendimiento, la administración, las ventas, el marketing, las operaciones y la construcción de productos digitales.</p>
    </section>

    <section className="section split-section">
      <div><div className="eyebrow">RECORRIDO</div><h2>De la práctica a los sistemas.</h2></div>
      <div className="prose-block">
        <p>He trabajado coordinando personas, proveedores, atención al cliente y operaciones mientras desarrollo proyectos propios. Ese recorrido me obligó a pensar menos en ideas aisladas y más en sistemas: cómo captar demanda, organizar trabajo, reducir errores y convertir oportunidades en procesos sostenibles.</p>
        <p>Hoy concentro ese aprendizaje en NEXO: una forma sistemática de investigar problemas, validar oportunidades, diseñar ofertas, construir soluciones con inteligencia artificial y aprender de los resultados reales.</p>
        <p>No presento cada proyecto como un éxito terminado. Algunos están operativos, otros evolucionan y otros siguen en construcción. La intención de este portfolio es mostrar ese proceso con transparencia.</p>
      </div>
    </section>

    <section className="section">
      <div className="eyebrow">CÓMO PIENSO</div>
      <h2>Cuatro principios de trabajo.</h2>
      <div className="grid">{principles.map(([title, description]) => <article className="card" key={title}><h3>{title}</h3><p className="muted">{description}</p></article>)}</div>
    </section>

    <section className="section tool-callout">
      <div><div className="eyebrow">PROYECTOS</div><h2>El trabajo habla mejor que los títulos.</h2><p className="lead">Casa Viva, Triciclub, NEXO y PREVENTE forman parte del recorrido empresarial y del laboratorio donde se prueban estas ideas.</p></div>
      <div><Link className="cta" href="/negocios">Ver proyectos</Link></div>
    </section>
  </main>;
}
