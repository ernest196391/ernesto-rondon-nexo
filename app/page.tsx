import Link from "next/link";
const projects=[
["Casa Viva","Comercio + operaciones","Ecosistema de comercio para el hogar con operaciones, logística y una red comercial."],
["Triciclub","Movilidad","Plataforma en desarrollo para conectar necesidades de transporte y mensajería con tricicleros."],
["Nexo","IA + negocios","Sistema para investigar, validar, construir y hacer crecer productos y negocios con inteligencia artificial."],
["PREVENTE","Empresa","Proyecto empresarial con experiencia en operación, administración y desarrollo de nuevas líneas de negocio."]
];
export default function Home(){return <main>
<section className="hero"><div className="eyebrow">Emprendimiento · Tecnología · Inteligencia artificial</div><h1>Convierto problemas reales en negocios y sistemas.</h1><p className="lead">Construyo empresas, productos digitales y herramientas usando tecnología e inteligencia artificial para pasar de una oportunidad a algo que funciona en el mundo real.</p><div><Link className="cta" href="/negocios">Ver lo que construyo</Link><Link className="cta secondary" href="/herramientas">Analizar una idea</Link></div></section>
<section className="section"><div className="eyebrow">En construcción</div><h2>Negocios como laboratorio.</h2><div className="grid">{projects.map(([n,t,d])=><article className="card" key={n}><div className="tag">{t}</div><h3>{n}</h3><p className="muted">{d}</p></article>)}</div></section>
<section className="section"><div className="eyebrow">NEXO</div><h2>Idea → evidencia → negocio.</h2><p className="lead">No se trata de construir por construir. Investigo la oportunidad, valido el problema, diseño la oferta, creo el sistema, lo pruebo y aprendo de los resultados.</p><Link className="cta" href="/herramientas">Probar NEXO Business Analyzer</Link></section>
</main>}
