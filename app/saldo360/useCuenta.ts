"use client";
import type { User } from "@supabase/supabase-js";
import { useCallback, useEffect, useState } from "react";
import { saldoSupabase, type Profile } from "../../lib/saldo360/supabase-browser";

/** Sesión y perfil del usuario. loading = todavía no sabemos si hay sesión. */
export function useCuenta() {
  const [state, setState] = useState<{ loading: boolean; user: User | null; profile: Profile | null }>({ loading: true, user: null, profile: null });

  const load = useCallback(async () => {
    const sb = saldoSupabase();
    if (!sb) return { loading: false, user: null, profile: null };
    const { data } = await sb.auth.getUser();
    const user = data.user ?? null;
    if (!user) return { loading: false, user: null, profile: null };
    const { data: profile } = await sb.from("profiles").select("id, display_name, role, status").eq("id", user.id).maybeSingle();
    return { loading: false, user, profile: (profile as Profile | null) ?? null };
  }, []);

  useEffect(() => {
    let alive = true;
    load().then((s) => { if (alive) setState(s); });
    const sb = saldoSupabase();
    const sub = sb?.auth.onAuthStateChange(() => { load().then((s) => { if (alive) setState(s); }); });
    return () => { alive = false; sub?.data.subscription.unsubscribe(); };
  }, [load]);

  const refresh = useCallback(() => load().then(setState), [load]);
  return { ...state, refresh };
}
