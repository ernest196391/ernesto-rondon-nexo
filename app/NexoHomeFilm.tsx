"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { specialists } from "../lib/studio/catalog";

const shots = [
  { kicker: "NEXO", title: "De contexto a resultado.", copy: "Una plataforma para analizar, construir y mejorar negocios con especialistas de IA y procesos verificables.", kind: "hero" },
  { kicker: "ENTRADA", title: "Trae una URL, un archivo o una idea.", copy: "NEXO organiza el contexto antes de ejecutar nada.", kind: "input" },
  { kicker: "ORQUESTACIÓN", title: "Elige el especialista adecuado.", copy: "Cada trabajo sigue un contrato común: preparar, adquirir, analizar, revisar, ejecutar y validar.", kind: "flow" },
  { kicker: "01 · WEB STUDIO", title: "Una web deja de ser una opinión.", copy: "URL → evidencia → diagnóstico → propuesta → prototipo.", kind: "tool" },
  { kicker: "DOGFOOD", title: "NEXO se está usando sobre NEXO.", copy: "El primer caso real es esta propia web: reconocimiento, branding, cinco problemas concretos y reconstrucción.", kind: "proof" },
  { kicker: "07 · COMMERCE", title: "Auditar una tienda es revisar dónde se pierde una venta.", copy: "Experiencia de compra, confianza, móvil, producto, checkout y conversión.", kind: "tool" },
  { kicker: "06 · BRAND", title: "Una marca necesita claridad antes que ruido.", copy: "Posicionamiento, mensaje, oferta, presencia pública y oportunidades.", kind: "tool" },
  { kicker: "04 · CREATOR", title: "El contenido también deja patrones.", copy: "Canales, títulos, miniaturas, frecuencia y señales de rendimiento.", kind: "tool" },
  { kicker: "05 · CONTENT", title: "El vídeo se convierte en un sistema.", copy: "Transcripción, cortes, subtítulos, formatos verticales y activos reutilizables.", kind: "tool" },
  { kicker: "02 · CONVERSATIONS", title: "La conversación necesita guardrails.", copy: "Memoria, handoff humano, métricas y proveedores intercambiables.", kind: "tool" },
  { kicker: "08 · KIT BUILDER", title: "Una tarea repetitiva puede convertirse en especialista.", copy: "Definir, comprobar fuentes, construir, probar, validar y versionar.", kind: "tool" },
  { kicker: "03 · BUSINESS AUDIT", title: "La arquitectura ya le reservó su lugar.", copy: "El diagnóstico integral se incorporará cuando integremos el kit 03.", kind: "planned" },
  { kicker: "PROYECTOS", title: "El trabajo queda unido al contexto.", copy: "Fuentes, ejecuciones, evidencia, decisiones y artefactos viven dentro del mismo proyecto.", kind: "project" },
  { kicker: "REVISIÓN HUMANA", title: "NEXO no debe adivinar en silencio.", copy: "Antes de acciones sensibles: entender → mostrar → confirmar → ejecutar.", kind: "review" },
  { kicker: "RESULTADO", title: "Diagnóstico, informe, prototipo o sistema.", copy: "Cada salida queda asociada a una ejecución concreta y a la siguiente acción recomendada.", kind: "result" },
  { kicker: "NEXO STUDIO", title: "Empieza con un proyecto real.", copy: "Menos configuración. Más contexto útil. El primer motor real es Web Studio.", kind: "cta" },
] as const;

function SplitTitle({ text }: { text: string }) {
  return <h2 className="nhf-title mk-split">{text.split(" ").map((word, i) => <span className="nhf-word" style={{ "--wi": i } as React.CSSProperties} key={`${word}-${i}`}>{word}</span>)}</h2>;
}

export default function NexoHomeFilm() {
  const filmRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const reduced = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  useEffect(() => {
    if (reduced) { setProgress(0); return; }
    let raf = 0;
    const update = () => {
      raf = 0;
      const film = filmRef.current;
      if (!film) return;
      const rect = film.getBoundingClientRect();
      const total = film.offsetHeight - window.innerHeight;
      const p = total > 0 ? Math.max(0, Math.min(1, -rect.top / total)) : 0;
      setProgress(p);
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    update();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll, { passive: true });
    return () => { removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [reduced]);

  const active = Math.min(shots.length - 1, Math.round(progress * (shots.length - 1)));

  return <main className="nexo-home-film" id="main-content">
    <div className="nhf-conversion-bar">
      <Link className="nhf-mini-brand" href="/">NEXO</Link>
      <span>Studio convierte contexto en trabajo verificable.</span>
      <Link className="nhf-bar-cta" href="/studio">Entrar a Studio →</Link>
    </div>

    <section className="nhf-first-screen">
      <div className="nhf-first-copy">
        <div className="nhf-kicker">NEXO · NEGOCIOS + IA</div>
        <h1>Trae el proyecto.<br/>NEXO organiza el trabajo.</h1>
        <p>Analiza, construye y mejora negocios desde una sola base, con especialistas reutilizables y resultados trazables.</p>
        <div className="nhf-actions"><Link className="nhf-primary" href="/studio">Nuevo proyecto →</Link><a className="nhf-secondary" href="#pelicula">Ver cómo funciona</a></div>
      </div>
      <div className="nhf-first-demo" aria-label="Flujo de NEXO Studio">
        <div className="nhf-demo-node strong">Proyecto</div><span>→</span><div className="nhf-demo-node">Especialista</div><span>→</span><div className="nhf-demo-node">Ejecución</div><span>→</span><div className="nhf-demo-node strong">Resultado</div>
      </div>
    </section>

    <section id="pelicula" ref={filmRef} className="nhf-film mk-film" style={{ "--mk-p": progress, "--mk-nshots": shots.length } as React.CSSProperties}>
      <div className="nhf-stage mk-tunnel">
        {shots.map((shot, index) => {
          const f = progress * (shots.length - 1) - index;
          const opacity = reduced ? 1 : Math.max(0, Math.min(1, Math.min((f + 1.65) / .75, (.42 - f) / .28)));
          const z = reduced ? 0 : f * 720;
          const live = index === active;
          return <article className={`nhf-shot mk-zshot ${live ? "is-live" : ""}`} style={{ "--zi": index, transform: reduced ? "none" : `translateZ(${z}px)`, opacity } as React.CSSProperties} key={shot.kicker} aria-hidden={!live && !reduced}>
            <div className="nhf-shot-inner mk-zdepth">
              <div className="nhf-kicker">{shot.kicker}</div>
              <SplitTitle text={shot.title}/>
              <p>{shot.copy}</p>
              {shot.kind === "hero" && <div className="nhf-orbit"><span>URL</span><span>Archivo</span><span>Contexto</span></div>}
              {shot.kind === "input" && <div className="nhf-input-card"><span>Proyecto</span><strong>Tu negocio</strong><small>URL · archivos · objetivo · restricciones</small></div>}
              {shot.kind === "flow" && <div className="nhf-flow-line">preparar <b>→</b> adquirir <b>→</b> analizar <b>→</b> revisar <b>→</b> ejecutar <b>→</b> validar</div>}
              {shot.kind === "proof" && <div className="nhf-proof-grid"><span>Branding real</span><span>5 problemas observables</span><span>Reconstrucción</span><span>QA</span></div>}
              {shot.kind === "project" && <div className="nhf-project-stack"><span>Sources</span><span>Runs</span><span>Evidence</span><span>Artifacts</span></div>}
              {shot.kind === "review" && <div className="nhf-review">NEXO entendió esto <span>Confirmar</span><span>Editar</span><span>Descartar</span></div>}
              {shot.kind === "result" && <div className="nhf-result-cards"><span>Diagnóstico</span><span>Prototipo</span><span>Informe</span></div>}
              {shot.kind === "cta" && <Link className="nhf-primary giant" href="/studio">Abrir NEXO Studio →</Link>}
            </div>
          </article>;
        })}
      </div>
      <div className="nhf-rail" aria-hidden="true"><span style={{ transform: `scaleY(${reduced ? 0 : progress})` }}/></div>
    </section>

    <section className="nhf-static-specialists">
      <div className="nhf-kicker">ESPECIALISTAS</div>
      <h2>Un sistema. Distintas capacidades.</h2>
      <div className="nhf-specialist-grid">{specialists.map(item => <article key={item.id}><span>{item.accent}</span><h3>{item.shortName}</h3><p>{item.description}</p><small>{item.status === "ready" ? "Base lista" : "Planificado"}</small></article>)}</div>
    </section>

    <footer className="nhf-final-cta">
      <div><div className="nhf-kicker">SIGUIENTE ACCIÓN</div><h2>Convierte un proyecto real en la primera ejecución.</h2><p>Web Studio será el primer motor completo: URL → adquisición segura → diagnóstico → brief → propuesta → prototipo.</p></div>
      <Link className="nhf-primary giant" href="/studio">Entrar a NEXO Studio →</Link>
    </footer>
  </main>;
}
