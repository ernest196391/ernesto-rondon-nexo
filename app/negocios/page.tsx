import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Proyectos | NEXO",
  description: "Proyectos y laboratorios empresariales vinculados a NEXO: Casa Viva, Triciclub, NEXO y PREVENTE.",
};

const items = [
  {
    name: "Casa Viva",
    status: "OPERATIVO · EVOLUCIÓN DIGITAL",
    category: "Comercio + operaciones + logística",
    description: "Proyecto de comercio para el hogar cuya evolución digital integra catálogo, pedidos, logística, gestores y administración.",
    learning: "Laboratorio para operación real: stock, ventas, atención al cliente, entregas, comisiones y procesos internos.",
  },
  {
    name: "Triciclub",
    status: "EN DESARROLLO",
    category: "Movilidad + marketplace",
    description: "Plataforma en desarrollo para conectar necesidades de transporte, carga y mensajería con tricicleros y negocios.",
    learning: "Explora liquidez de marketplace, matching entre oferta y demanda y operación logística urbana.",
  },
  {
    name: "NEXO",
    status: "EN CONSTRUCCIÓN",
    category: "IA + creación de negocios",
    description: "Sistema para investigar, validar, construir, desplegar y aprender de productos y negocios utilizando inteligencia artificial.",
    learning: "Convierte experiencia dispersa en un proceso repetible con checkpoints, evidencia y decisiones explícitas.",
  },
  {
    name: "PREVENTE",
    status: "EXPERIENCIA EMPRESARIAL",
    category: "Operación + administración",
    description: "Experiencia empresarial y administrativa que forma parte del recorrido de aprendizaje detrás de NEXO.",
    learning: "Aporta contexto práctico sobre coordinación, gestión y desarrollo de nuevas líneas de negocio.",
  },
];

export default function Page() {
  return <main id="main-content">
    <section className="hero compact-hero">
      <div className="eyebrow">PROYECTOS NEXO</div>
      <h1>Negocios como laboratorio.</h1>
      <p className="lead">No todos los proyectos están en la misma etapa. Algunos operan, otros evolucionan y otros todavía se están validando o construyendo. Aquí mostramos esa diferencia de forma explícita.</p>
    </section>

    <section className="section">
      <div className="projects-stack">{items.map((item) => <article className="project-detail" key={item.name}>
        <div className="project-meta"><div className="tag">{item.status}</div><span>{item.category}</span></div>
        <div className="project-copy"><h2>{item.name}</h2><p className="lead small-lead">{item.description}</p><p className="muted"><strong>Qué estamos aprendiendo:</strong> {item.learning}</p></div>
      </article>)}</div>
    </section>

    <section className="section tool-callout">
      <div><div className="eyebrow">NEXO BUSINESS ANALYZER</div><h2>¿Tienes una oportunidad que analizar?</h2><p className="lead">Antes de construir, sométela a un primer filtro de problema, cliente, monetización, riesgos y validación.</p></div>
      <div><Link className="cta" href="/herramientas">Analizar una idea</Link></div>
    </section>
  </main>;
}
