import {createHash} from "node:crypto";
import {Pool} from "pg";
import {hashPassword,verifyPassword} from "./password";

let pool:Pool|undefined;
let schemaReady:Promise<void>|undefined;
function db(){const connectionString=process.env.DATABASE_URL;if(!connectionString)throw new Error("DATABASE_URL is not configured");pool??=new Pool({connectionString,max:2,idleTimeoutMillis:30_000});return pool;}
function emailHash(email:string){return createHash("sha256").update(email.trim().toLowerCase()).digest("hex");}
const INITIAL_ADMIN_EMAIL_HASH="40a7d08fd68946ebdd0f81d50e2b9d9c70ed0cd3a1ec5eabd8abaf47c2525533";
async function ensureSchema(){schemaReady??=db().query(`CREATE TABLE IF NOT EXISTS nexo_admin_accounts(
 email_hash TEXT PRIMARY KEY,password_hash TEXT NOT NULL,status TEXT NOT NULL DEFAULT 'active',created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);`).then(()=>undefined);return schemaReady;}
export async function authenticateAdmin(email:string,password:string){await ensureSchema();const normalized=email.trim().toLowerCase(),hash=emailHash(normalized);const found=await db().query("SELECT password_hash,status FROM nexo_admin_accounts WHERE email_hash=$1",[hash]);if(found.rowCount){const row=found.rows[0];return row.status==='active'&&await verifyPassword(password,row.password_hash)?{userId:normalized,gestoraId:'admin',role:'admin' as const}:null;}
 const count=await db().query("SELECT COUNT(*)::int count FROM nexo_admin_accounts");if(Number(count.rows[0]?.count)!==0||hash!==INITIAL_ADMIN_EMAIL_HASH)return null;if(password.length<12)return null;const stored=await hashPassword(password);try{await db().query("INSERT INTO nexo_admin_accounts(email_hash,password_hash,status) VALUES($1,$2,'active')",[hash,stored]);}catch{const retry=await db().query("SELECT password_hash,status FROM nexo_admin_accounts WHERE email_hash=$1",[hash]);if(!retry.rowCount||retry.rows[0].status!=='active'||!(await verifyPassword(password,retry.rows[0].password_hash)))return null;}return{userId:normalized,gestoraId:'admin',role:'admin' as const};}
