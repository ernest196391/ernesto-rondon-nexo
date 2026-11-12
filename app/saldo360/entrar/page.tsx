import { Top } from "../ui";
import Entrar from "./Entrar";
import "../saldo360.css";

export default async function EntrarPage({ searchParams }: { searchParams: Promise<{ modo?: string; rol?: string }> }) {
  const q = await searchParams;
  return <main className="s360"><div className="s360-shell">
    <Top/>
    <Entrar initialMode={q.modo === "registro" ? "signup" : "login"} seller={q.rol === "vendedor"}/>
  </div></main>;
}
