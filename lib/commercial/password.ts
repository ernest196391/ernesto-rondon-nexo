import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCallback);
export async function hashPassword(password:string){const salt=randomBytes(16).toString("base64url"),derived=await scrypt(password,salt,64) as Buffer;return `scrypt:${salt}:${derived.toString("base64url")}`;}
export async function verifyPassword(password:string,stored:string){const [scheme,salt,encoded]=stored.split(":");if(scheme!=="scrypt"||!salt||!encoded)return false;const expected=Buffer.from(encoded,"base64url"),derived=await scrypt(password,salt,expected.length) as Buffer;return expected.length===derived.length&&timingSafeEqual(expected,derived);}
