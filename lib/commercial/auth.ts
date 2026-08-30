import { cookies } from "next/headers";
import { getGestora } from "./db";
import { GESTORA_SESSION_COOKIE, readGestoraSession } from "./session";

export async function currentCommercialActor(){const jar=await cookies(),session=readGestoraSession(jar.get(GESTORA_SESSION_COOKIE)?.value);if(!session)return null;if(session.role==="admin")return session;const profile=await getGestora(session.gestoraId);return profile&&profile.userId===session.userId&&profile.status!=="suspended"?session:null;}
export async function requireGestora(gestoraId?:string){const actor=await currentCommercialActor();if(!actor)throw Object.assign(new Error("Inicia sesión para continuar."),{status:401});if(actor.role!=="admin"&&gestoraId&&actor.gestoraId!==gestoraId)throw Object.assign(new Error("No tienes permiso para ver esta información."),{status:403});return actor;}
export function configuredAccess(raw:string){const entries=(process.env.NEXO_GESTORA_ACCESS_KEYS||"").split(",").map(x=>x.trim()).filter(Boolean);for(const entry of entries){const [key,userId,gestoraId]=entry.split(":");if(key&&userId&&gestoraId&&key===raw)return{userId,gestoraId,role:"gestora" as const};}if(raw&&raw===process.env.NEXO_GESTORA_ADMIN_KEY)return{userId:"admin",gestoraId:"admin",role:"admin" as const};return null;}
