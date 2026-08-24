"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { specialists } from "../lib/studio/catalog";

const shots = [
  { kicker: "01 · EMPIEZA", title: "Cuéntale a NEXO qué quieres conseguir.", copy: "Crea un proyecto con una URL, archivos o contexto. NEXO organiza lo importante antes de trabajar.", kind: "input" },
  { kicker: "02 · ELIGE", title: "Usa el especialista que resuelve ese problema.", copy: "Web, negocio, comercio, marca, contenido, conversaciones o creación de nuevos especialistas.", kind: "flow" },
  { kicker: "03 · REVISA", title: "NEXO te enseña qué entendió.", copy: "Los resultados separan evidencia, interpretación y siguiente acción. Tú confirmas antes de acciones sensibles.", kind: "review" },
  { kicker: "04 · RECIBE", title: "Obtén algo que puedas usar.", copy: "Diagnóstico, auditoría, prototipo, informe, contenido o una ejecución guardada dentro del proyecto.", kind: "result" },
  { kicker: "BUSINESS AUDIT", title: "Descubre dónde pierde tiempo y ventas un negocio.", copy: "Cruza presencia pública y operación interna sin mezclar las puntuaciones ni inventar datos.", kind: "tool" },
  { kicker: "CONTENT STUDIO", title: "Convierte un vídeo en una versión lista para publicar.", copy: "Transcripción real, cortes aprobados, formato vertical, subtítulos sincronizados y audio normalizado.", kind: "tool" },
  { kicker: "NEXO STUDIO", title: "Empieza con un proyecto real.", copy: "No necesitas configurar herramientas técnicas. Crea el proyecto y avanza desde una sola pantalla.", kind: "cta" },
] as const;

function SplitTitle({ text }: { text: string }) {
  return <h2 className="nhf-title mk-split">{text.split(" ").map((word, i) => <span className="nhf-word" style={{ "--wi": i } as React.CSSProperties} key={`${word}-${i}`}>{word}</span>)}</h2>;
}

export default function NexoHomeFilm() {
  const filmRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const reduced = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);

  useEffect(() => {
    if (reduced) return;
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
    raf = requestAnimationFrame(update);
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll, { passive: true });
    return () => { removeEventListener("scroll", onScroll); removeEventListener("resize", onScroll); if (raf) cancelAnimationFrame(raf); };
  }, [reduced]);

  const active = Math.min(shots.length - 1, Math.round(progress * (shots.length - 1)));

  return <main className="nexo-home-film" id="main-content">
    <div className="nhf-conversion-bar">
      <Link className="nhf-mini-brand" href="/">NEXO</Link>
      <span>De un problema a un resultado útil.</span>
      <Link className="nhf-bar-cta" href="/studio">Abrir Studio →</Link>
    </div>

    <section className="nhf-first-screen">
      <div className="nhf-first-copy">
        <div className="nhf-kicker">NEXO · TRABAJO CON IA</div>
        <h1>Trae el problema.<br/>NEXO organiza el trabajo.</h1>
        <p>Una plataforma para analizar negocios, mejorar webs, crear contenido y convertir tareas repetitivas en procesos claros.</p>
        <div className="nhf-actions"><Link className="nhf-primary" href="/studio">Crear proyecto →</Link><a className="nhf-secondary" href="#pelicula">Cómo funciona</a></div>
      </div>
      <div className="nhf-first-demo" aria-label="Flujo de NEXO Studio">
        <div className="nhf-demo-node strong">Problema</div><span>→</span><div className="nhf-demo-node">Especialista</div><span>→</span><div className="nhf-demo-node">Revisión</div><span>→</span><div className="nhf-demo-node strong">Resultado</div>
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
              {shot.kind === "input" && <div className="nhf-input-card"><span>Proyecto</span><strong>Tu objetivo</strong><small>URL · archivos · contexto</small></div>}
              {shot.kind === "flow" && <div className="nhf-flow-line">entender <b>→</b> analizar <b>→</b> revisar <b>→</b> entregar</div>}
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
      <div className="nhf-kicker">QUÉ PUEDES HACER</div>
      <h2>Elige el resultado que necesitas.</h2>
      <div className="nhf-specialist-grid">{specialists.map(item => <article key={item.id}><span>{item.accent}</span><h3>{item.shortName}</h3><p>{item.description}</p><small>{item.status === "ready" ? "Disponible" : "En preparación"}</small></article>)}</div>
    </section>

    <footer className="nhf-final-cta">
      <div><div className="nhf-kicker">EMPIEZA AHORA</div><h2>Crea un proyecto y deja que NEXO ordene el siguiente paso.</h2><p>Tu contexto, resultados y decisiones quedan unidos al proyecto para poder continuar después.</p></div>
      <Link className="nhf-primary giant" href="/studio">Crear proyecto →</Link>
    </footer>
  </main>;
}
