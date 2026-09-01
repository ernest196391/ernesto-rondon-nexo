export async function sendTransactionalEmail(input:{to:string;subject:string;html:string}){
 const key=process.env.RESEND_API_KEY,from=process.env.NEXO_EMAIL_FROM;
 if(!key||!from)throw new Error("Email service is not configured");
 const response=await fetch("https://api.resend.com/emails",{method:"POST",headers:{authorization:`Bearer ${key}`,"content-type":"application/json"},body:JSON.stringify({from,to:[input.to],subject:input.subject,html:input.html}),signal:AbortSignal.timeout(15000)});
 if(!response.ok)throw new Error(`Email provider failed (${response.status})`);
}
export function accessCodeEmail(code:string){return `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#17251e"><img src="https://nexotienda.casavivadecuba.com/brand/nexo-logo-001g.png" alt="NEXO" width="130"><h1>Tu código de acceso</h1><p>Usa este código para continuar en NEXO Impulsa:</p><p style="font-size:34px;font-weight:800;letter-spacing:8px">${code}</p><p>Vence en 10 minutos y solo puede utilizarse una vez.</p><p>Si no solicitaste este acceso, ignora este mensaje.</p><hr><small>NEXO · Lo que buscas, más cerca.</small></div>`}
