"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import "../impulsa.css";
import "../impulsa-enhancements.css";

export default function Login(){
 const[view,setView]=useState<"login"|"register"|"code">("login"),[form,setForm]=useState({email:"",password:"",publicName:"",whatsapp:"",accessKey:""}),[error,setError]=useState(""),[busy,setBusy]=useState(false),[showPassword,setShowPassword]=useState(false),router=useRouter();
 const set=(name:string,value:string)=>setForm(x=>({...x,[name]:value}));
 function change(next:"login"|"register"|"code"){setView(next);setError("")}
 async function submit(e:FormEvent){e.preventDefault();setBusy(true);setError("");try{const endpoint=view==="register"?"/api/gestoras/auth/register":"/api/gestoras/auth/login",body=view==="code"?{accessKey:form.accessKey}:view==="register"?form:{email:form.email,password:form.password},r=await fetch(endpoint,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify(body)}),d=await r.json();if(!r.ok)throw new Error(d.error||"Revisa los datos e inténtalo otra vez.");router.replace("/impulsa");router.refresh()}catch(e){setError(e instanceof Error?e.message:"No pudimos continuar.")}finally{setBusy(false)}}
 const title=view==="register"?"Crea tu oficina.":view==="code"?"Acceso temporal.":"Vende desde una sola oficina.";
 const copy=view==="register"?"Abre tu tienda NEXO y empieza a seleccionar productos.":view==="code"?"Introduce el código que te entregó el equipo NEXO.":"Administra productos, margen, pedidos y ganancias.";
 return <main className="impulsa-login"><form onSubmit={submit} noValidate><img className="login-logo" src="/brand/nexo-logo-001g.png" alt="NEXO"/><span>IMPULSA</span><h1>{title}</h1><p>{copy}</p>
  {view==="register"&&<><label>Nombre de tu tienda<input value={form.publicName} onChange={e=>set("publicName",e.target.value)} autoComplete="organization" required/></label><label>WhatsApp<input value={form.whatsapp} onChange={e=>set("whatsapp",e.target.value)} inputMode="tel" autoComplete="tel" required/></label></>}
  {view!=="code"&&<><label>Correo<input value={form.email} onChange={e=>set("email",e.target.value)} type="email" autoComplete="email" required/></label><label>Contraseña<div className="password-row"><input value={form.password} onChange={e=>set("password",e.target.value)} type={showPassword?"text":"password"} minLength={8} autoComplete={view==="register"?"new-password":"current-password"} required/><button type="button" onClick={()=>setShowPassword(x=>!x)} aria-label={showPassword?"Ocultar contraseña":"Mostrar contraseña"}>{showPassword?"Ocultar":"Ver"}</button></div></label></>}
  {view==="code"&&<label>Código temporal<input value={form.accessKey} onChange={e=>set("accessKey",e.target.value)} type="password" autoComplete="one-time-code" required/></label>}
  {error&&<div role="alert">{error}</div>}<button disabled={busy}>{busy?"Procesando…":view==="register"?"Crear mi oficina":"Entrar"}</button>
  <div className="auth-switch">{view!=="login"&&<button type="button" onClick={()=>change("login")}>Ya tengo cuenta</button>}{view!=="register"&&<button type="button" onClick={()=>change("register")}>Crear cuenta</button>}{view!=="code"&&<button type="button" onClick={()=>change("code")}>Código temporal</button>}</div>
  <a className="help" href="https://wa.me/5354056173" target="_blank" rel="noreferrer">Ayuda por WhatsApp</a>
 </form></main>
}