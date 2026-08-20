import Link from "next/link";

const capabilities = [
  ["01", "Investigar", "Separar intuiciones de evidencia: cliente, problema, alternativas, mercado y restricciones."],
  ["02", "Validar", "Probar la hipótesis más arriesgada antes de invertir meses construyendo."],
  ["03", "Construir", "Convertir una oferta validada en producto, automatización, web o sistema operativo."],
  ["04", "Lanzar y aprender", "Publicar, medir el comportamiento real y decidir qué mejorar, escalar o detener."],
];

const projects = [
  ["Casa Viva", "OPERATIVO · EVOLUCIÓN DIGITAL", "Comercio para el hogar con operaciones, logística y red comercial."],
  ["Triciclub", "EN DESARROLLO", "Plataforma para conectar transporte, carga y mensajería con tricicleros."],
  ["NEXO", "EN CONSTRUCCIÓN", "Sistema para investigar, validar, construir y hacer crecer negocios con IA."],
  ["PREVENTE", "EXPERIENCIA EMPRESARIAL", "Operación y administración que forman parte del aprendizaje detrás de NEXO."],
];

export default function Home() {
  return <main id="main-content">
    <section className="hero">
      <div className="eyebrow">NEXO · NEGOCIOS + INTELIGENCIA ARTIFICIAL</div>
      <h1>De una idea a un negocio real.</h1>
      <p className="lead">Investigamos problemas, validamos oportunidades y construimos sistemas que puedan funcionar fuera de una presentación. La IA acelera el trabajo; la evidencia decide qué merece construirse.</p>
      <div className="actions"><Link className="cta" href="/herramientas">Analizar una idea</Link><Link className="cta secondary" href="/negocios">Ver proyectos</Link></div>
    </section>

    <section className="section">
      <div className="eyebrow">EL MÉTODO</div>
      <h2>Construir es una etapa, no el comienzo.</h2>
      <p className="lead">NEXO trabaja por checkpoints: entender → investigar → validar → diseñar la oferta → construir → probar → desplegar → crecer → aprender.</p>
      <div className="grid process-grid">{capabilities.map(([n,t,d]) => <article className="card" key={n}><div className="step-number">{n}</div><h3>{t}</h3><p className="muted">{d}</p></article>)}</div>
    </section>

    <section className="section">
      <div className="section-heading"><div><div className="eyebrow">CASOS Y LABORATORIOS</div><h2>Aprender construyendo.</h2></div><Link className="text-link" href="/negocios">Todos los proyectos →</Link></div>
      <div className="grid">{projects.map(([n,s,d]) => <article className="card project-card" key={n}><div className="tag">{s}</div><h3>{n}</h3><p className="muted">{d}</p></article>)}</div>
    </section>

    <section className="section tool-callout">
      <div><div className="eyebrow">HERRAMIENTA GRATUITA</div><h2>¿Tu idea merece construirse?</h2><p className="lead">Describe la oportunidad y NEXO Business Analyzer la somete a un primer filtro de problema, cliente, monetización, riesgos y validación.</p></div>
      <div><Link className="cta" href="/herramientas">Probar Business Analyzer</Link><p className="fineprint">Un análisis inicial no sustituye investigación de mercado, asesoría legal ni validación con clientes reales.</p></div>
    </section>
  </main>;
}
