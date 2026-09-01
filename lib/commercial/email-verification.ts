import { createHmac, randomInt, timingSafeEqual } from "node:crypto";

export const EMAIL_CHALLENGE_COOKIE="nexo_email_challenge";
export const EMAIL_VERIFIED_COOKIE="nexo_email_verified";
type Challenge={email:string;hash:string;expires:number;attempts:number};
const secret=()=>process.env.NEXO_GESTORA_SESSION_SECRET||"";
const sign=(value:string)=>createHmac("sha256",secret()).update(value).digest("base64url");
const pack=(value:object)=>{const payload=Buffer.from(JSON.stringify(value)).toString("base64url");return `${payload}.${sign(payload)}`};
const unpack=<T>(token?:string):T|null=>{if(!token||!secret())return null;const[payload,supplied,...rest]=token.split(".");if(!payload||!supplied||rest.length)return null;const expected=sign(payload);if(expected.length!==supplied.length||!timingSafeEqual(Buffer.from(expected),Buffer.from(supplied)))return null;try{return JSON.parse(Buffer.from(payload,"base64url").toString()) as T}catch{return null}};
const codeHash=(email:string,code:string)=>createHmac("sha256",secret()).update(`${email}:${code}`).digest("base64url");
export function createEmailChallenge(email:string){const code=String(randomInt(100000,1000000)),value:Challenge={email,hash:codeHash(email,code),expires:Date.now()+10*60_000,attempts:0};return{code,token:pack(value)}}
export function checkEmailChallenge(token:string|undefined,code:string){const value=unpack<Challenge>(token);if(!value||value.expires<Date.now())return{ok:false,error:"expired" as const};if(value.attempts>=5)return{ok:false,error:"locked" as const};const expected=codeHash(value.email,code),ok=expected.length===value.hash.length&&timingSafeEqual(Buffer.from(expected),Buffer.from(value.hash));if(!ok)return{ok:false,error:"invalid" as const,token:pack({...value,attempts:value.attempts+1})};return{ok:true as const,email:value.email,verified:pack({email:value.email,expires:Date.now()+20*60_000})}}
export function verifiedEmail(token?:string){const value=unpack<{email:string;expires:number}>(token);return value&&value.expires>Date.now()?value.email:null}
