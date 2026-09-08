"use client";
import {useRouter} from "next/navigation";
import {useState} from "react";
import styles from "./OrderActions.module.css";

type Action="delivered_paid"|"cancelled"|"refunded";

export default function OrderActions({orderId,status}:{orderId:number;status:string}){
 const router=useRouter();
 const[busy,setBusy]=useState<Action|null>(null);
 const[message,setMessage]=useState("");
 async function run(action:Action){
  setBusy(action);setMessage("");
  try{
   const response=await fetch("/api/admin/orders",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({orderId,action})});
   const body=await response.json();
   if(!response.ok)throw new Error(body.error||"No se pudo actualizar el pedido");
   setMessage("Pedido actualizado.");
   router.refresh();
  }catch(error){setMessage(error instanceof Error?error.message:"No se pudo actualizar el pedido");}
  finally{setBusy(null);}
 }
 const closed=["cancelled","refunded"].includes(status);
 return <div className={styles.actions} aria-label="Acciones del pedido">
  {!closed&&status!=="completed"&&<button disabled={busy!==null} onClick={()=>run("delivered_paid")}>Marcar entregado y cobrado</button>}
  {!closed&&status!=="completed"&&<button className={styles.secondary} disabled={busy!==null} onClick={()=>run("cancelled")}>Cancelar pedido</button>}
  {status==="completed"&&<button className={styles.secondary} disabled={busy!==null} onClick={()=>run("refunded")}>Registrar reembolso</button>}
  {closed&&<span className={styles.note}>Este pedido está cerrado. No hay acciones operativas pendientes.</span>}
  {message&&<span className={styles.feedback} role="status">{message}</span>}
 </div>;
}
