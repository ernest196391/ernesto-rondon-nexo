"use client";
import Link from "next/link";
import {useState} from "react";
import "../saldo360.css";
export default function Publicar(){
 const [monto,setMonto]=useState("500"),[precio,setPrecio]=useState(""),[medio,setMedio]=useState("Transfermóvil"),[done,setDone]=useState(false),[copyError,setCopyError]=useState(false);
 const n=Number(monto),p=Number(precio),ok=Number.isFinite(n)&&Number.isInteger(n)&&n>0&&n<=100000&&Number.isFinite(p)&&p>0&&p<=1000000;
 const message=`SALDO360 OFERTA\nSaldo disponible: ${n} CUP\nPrecio por 100 CUP de saldo: ${p} CUP\nPago: ${medio}\nConfirmar antes de publicar.\nAutorizo que se me contacte para verificar la oferta; todavía no autorizo publicar mis datos personales.`;
 async function copy(){if(!ok)return;try{await navigator.clipboard.writeText(message);setDone(true);setCopyError(false)}catch{setCopyError(true);setDone(false)}}
 return <main className="s360 s360-real"><div className="s360-shell"><header className="s360-top"><Link className="s360-logo" href="/saldo360"><img src="/saldo360/logo.svg" alt="" width="42" height="42"/><span>saldo<strong>360</strong></span></Link><Link href="/saldo360/ofertas" className="s360-header-link">Busco saldo →</Link></header>
 <section className="s360-content"><div className="s360-intro s360-subpage-intro"><h1>Tengo saldo.</h1><p>Prepara tu oferta.</p></div><div className="s360-card s360-sell-form">
 <label className="s360-label" htmlFor="stock">¿Cuánto tienes? (CUP)</label><input id="stock" type="number" min="1" max="100000" value={monto} onChange={e=>{setMonto(e.target.value);setDone(false)}}/>
 <label className="s360-label" htmlFor="rate">¿Cuánto cobras por 100 CUP de saldo?</label><input id="rate" type="number" min="0.01" max="1000000" step="0.01" placeholder="Ej. 400" value={precio} onChange={e=>{setPrecio(e.target.value);setDone(false)}}/>
 <label className="s360-label" htmlFor="method">¿Cómo recibes el pago?</label><select id="method" value={medio} onChange={e=>{setMedio(e.target.value);setDone(false)}}>{["Transfermóvil","EnZona","Efectivo"].map(x=><option key={x}>{x}</option>)}</select>
 <button className="s360-primary" disabled={!ok} onClick={copy}>Copiar oferta</button>
 {done&&<p role="status" className="s360-success">Oferta copiada. Envíala por WhatsApp al equipo que te invitó.</p>}
 {copyError&&<p role="alert" className="s360-error">No se pudo copiar. Selecciona y copia el texto manualmente:</p>}
 {copyError&&<textarea readOnly aria-label="Texto de la oferta" value={message}/>}
 </div><p className="s360-footnote">Registro y publicación automática aún no disponibles. Copiar una oferta no la publica ni envía mensajes.</p>
 </section></div></main>;
}