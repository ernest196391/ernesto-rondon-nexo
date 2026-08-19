import {NextResponse} from "next/server";
export async function POST(req:Request){
 const {idea}=await req.json();
 if(!idea||typeof idea!=="string"||idea.trim().length<10)return NextResponse.json({error:"Describe la idea con un poco más de detalle."},{status:400});
 // MVP seguro: no inventa una integración de IA. OPENAI_API_KEY se conectará server-side en la siguiente iteración.
 const analysis=`ANÁLISIS NEXO — MVP

Idea: ${idea.trim()}

1. PROBLEMA
¿Qué problema concreto resuelve y con qué frecuencia ocurre?

2. CLIENTE
¿Quién sufre ese problema y quién realmente pagaría?

3. MONETIZACIÓN
Define una transacción o suscripción concreta antes de construir.

4. RIESGO PRINCIPAL
Todavía no hay evidencia de demanda. La primera prueba debe buscar conversaciones, reservas, solicitudes o pagos reales.

5. MVP
Construye únicamente el flujo necesario para probar la hipótesis principal.

DECISIÓN: TEST FIRST

Siguiente paso: conseguir evidencia de 5–10 clientes potenciales antes de ampliar el producto.`;
 return NextResponse.json({analysis});
}
