"use client";
import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import type { Cart, CommercePhase } from "../../lib/commerce/cart";
import { formatMoney, itemCount } from "../../lib/commerce/cart";
type Mode = "" | "delivery" | "pickup";
type Draft = {
  fullName: string;
  phone: string;
  alternatePhone: string;
  email: string;
  postcode: string;
  mode: Mode;
  municipality: string;
  locality: string;
  localityId: string;
  manualLocalityText: string;
  manualLocality: boolean;
  address: string;
  reference: string;
  notes: string;
  deliveryWindow: string;
  latitude: string;
  longitude: string;
  locationAccuracy: string;
  locationTimestamp: string;
};
type Config = {
  province: { code: string; name: string };
  municipalities: string[];
  localities: Record<string, string[]>;
  localityOptions: Record<string, Array<{ id: string; label: string }>>;
  rateVersion: string;
  pickup: { name: string; address: string; instructions: string };
};
type Quote = {
  status: "zone" | "pending" | "pickup";
  feeCup: number;
  label: string;
  version: string;
  ruleId: string;
  amount: number;
  currency: "CUP";
  source: string;
};
const empty: Draft = {
  fullName: "",
  phone: "",
  alternatePhone: "",
  email: "",
  postcode: "",
  mode: "",
  municipality: "",
  locality: "",
  localityId: "",
  manualLocalityText: "",
  manualLocality: false,
  address: "",
  reference: "",
  notes: "",
  deliveryWindow: "",
  latitude: "",
  longitude: "",
  locationAccuracy: "",
  locationTimestamp: "",
};
const msg = (e: unknown) => {
  if (e instanceof Error && e.name === "TimeoutError")
    return "La conexión tardó demasiado. Tus datos siguen guardados; inténtalo nuevamente.";
  if (e instanceof TypeError || (e instanceof Error && /failed to fetch|networkerror/i.test(e.message)))
    return "No pudimos conectar con NEXO. Revisa tu conexión e inténtalo nuevamente.";
  return e instanceof Error && e.message
    ? e.message
    : "No pudimos continuar. Revisa tu conexión e inténtalo nuevamente.";
};
export default function CheckoutClient({
  initialReferral,
}: {
  initialReferral: string;
}) {
  const [phase, setPhase] = useState<CommercePhase>("restoring"),
    [cart, setCart] = useState<Cart | null>(null),
    [referral, setReferral] = useState(initialReferral),
    [draft, setDraft] = useState<Draft>(empty),
    [config, setConfig] = useState<Config | null>(null),
    [quote, setQuote] = useState<Quote | null>(null),
    [quoteBusy, setQuoteBusy] = useState(false),
    [error, setError] = useState(""),
    [key, setKey] = useState("");
  const [locating, setLocating] = useState(false),
    [locationMessage, setLocationMessage] = useState("");
  const restore = useCallback(async () => {
    setPhase("validating");
    setError("");
    const [c, d] = await Promise.all([
      fetch(`/api/commerce/checkout?n=${Date.now()}`, {
        cache: "no-store",
        signal: AbortSignal.timeout(25000),
      }),
      fetch("/api/commerce/delivery", {
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      }),
    ]);
    const a = await c.json(),
      b = await d.json();
    if (!c.ok) throw new Error(a.error || "No pudimos comprobar tu carrito.");
    if (!d.ok) throw new Error(b.error || "No pudimos cargar la entrega.");
    setCart(a.cart);
    setReferral(a.referral || initialReferral);
    setConfig(b);
    setPhase(a.cart.items?.length ? "ready" : "empty");
  }, [initialReferral]);
  useEffect(() => {
    const t = setTimeout(() => {
      const saved = sessionStorage.getItem("nexo_checkout_draft");
      if (saved)
        try {
          setDraft({ ...empty, ...JSON.parse(saved) });
        } catch {
          sessionStorage.removeItem("nexo_checkout_draft");
        }
      setKey(crypto.randomUUID());
      void restore().catch((e) => {
        setError(msg(e));
        setPhase("error");
      });
    }, 0);
    return () => clearTimeout(t);
  }, [restore]);
  useEffect(() => {
    if (phase !== "restoring")
      sessionStorage.setItem("nexo_checkout_draft", JSON.stringify(draft));
  }, [draft, phase]);
  useEffect(() => {
    const c = new AbortController(),
      t = setTimeout(
        async () => {
          if (
            draft.mode !== "delivery" ||
            !draft.municipality ||
            !draft.locality
          ) {
            setQuote(
              draft.mode === "pickup"
                ? {
                    status: "pickup",
                    feeCup: 0,
                    label: "Recogida en tienda",
                    version: config?.rateVersion || "",
                    ruleId: "pickup",
                    amount: 0,
                    currency: "CUP",
                    source: "pickup",
                  }
                : null,
            );
            return;
          }
          setQuoteBusy(true);
          try {
            const r = await fetch("/api/commerce/delivery", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  municipality: draft.municipality,
                  locality: draft.locality,
                  manual: draft.manualLocality,
                }),
                signal: c.signal,
              }),
              data = await r.json();
            if (!r.ok) throw new Error();
            setQuote(data);
          } catch {
            if (!c.signal.aborted) setQuote(null);
          } finally {
            if (!c.signal.aborted) setQuoteBusy(false);
          }
        },
        draft.mode === "delivery" ? 350 : 0,
      );
    return () => {
      clearTimeout(t);
      c.abort();
    };
  }, [
    draft.mode,
    draft.municipality,
    draft.locality,
    draft.manualLocality,
    config?.rateVersion,
  ]);
  const query = useMemo(
      () => (referral ? `?ref=${encodeURIComponent(referral)}` : ""),
      [referral],
    ),
    set = (n: keyof Draft, v: string | boolean) =>
      setDraft((x) => ({ ...x, [n]: v }));
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (phase !== "ready" || !draft.mode) return;
    setPhase("submitting");
    setError("");
    try {
      const r = await fetch("/api/commerce/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...draft,
            idempotencyKey: key,
            shippingQuote: quote,
          }),
          signal: AbortSignal.timeout(90000),
        }),
        data = await r.json();
      if (!r.ok)
        throw new Error(data.error || "No pudimos registrar el pedido.");
      sessionStorage.removeItem("nexo_checkout_draft");
      setPhase("success");
      window.location.assign(data.whatsappUrl || data.confirmationUrl);
    } catch (e) {
      setError(msg(e));
      // Keep the completed form actionable so the customer can retry with the
      // same idempotency key without re-entering any information.
      setPhase("ready");
    }
  }
  async function locate() {
    if (!window.isSecureContext) {
      setLocationMessage(
        "La ubicación necesita una conexión segura. Puedes continuar con la dirección escrita.",
      );
      return;
    }
    if (!navigator.geolocation) {
      setLocationMessage(
        "Este dispositivo no permite compartir la ubicación desde el navegador.",
      );
      return;
    }
    setLocating(true);
    setLocationMessage("");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        set("latitude", String(p.coords.latitude));
        set("longitude", String(p.coords.longitude));
        set("locationAccuracy", String(Math.round(p.coords.accuracy)));
        set("locationTimestamp", new Date(p.timestamp).toISOString());
        setLocationMessage("Ubicación añadida");
        setLocating(false);
      },
      (error) => {
        const reason =
          error.code === error.PERMISSION_DENIED
            ? "No pudimos acceder a tu ubicación. Puedes continuar con la dirección escrita."
            : error.code === error.TIMEOUT
              ? "La ubicación tardó demasiado. Inténtalo nuevamente o continúa con la dirección escrita."
              : "No pudimos determinar tu ubicación. Puedes continuar con la dirección escrita.";
        setLocationMessage(reason);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 60000 },
    );
  }
  if (phase === "restoring" || phase === "validating")
    return (
      <section className="checkout-state" aria-live="polite">
        <span className="checkout-spinner" />
        <h1>Comprobando carrito…</h1>
      </section>
    );
  if (phase === "empty")
    return (
      <section className="checkout-state">
        <h1>Tu carrito está vacío</h1>
        <Link href={`/marketplace${query}`}>Explorar productos</Link>
      </section>
    );
  if (!cart || !config)
    return (
      <section className="checkout-state error">
        <h1>No pudimos abrir el checkout</h1>
        <p>{error}</p>
        <button onClick={() => void restore()}>Reintentar</button>
      </section>
    );
  const busy = phase === "submitting",
    count = itemCount(cart),
    products = formatMoney(cart.totals.total_items, cart.totals),
    localities =
      config.localityOptions?.[draft.municipality] ||
      (config.localities[draft.municipality] || []).map((label) => ({
        id: label,
        label,
      }));
  return (
    <div className="checkout-shell">
      <form className="checkout-form" onSubmit={submit}>
        <header>
          <h1>Completa tu pedido</h1>
          <p>
            {count} {count === 1 ? "producto" : "productos"} · {products}
          </p>
        </header>
        {error && (
          <div className="checkout-error" role="alert">
            <strong>No pudimos registrar el pedido.</strong>
            <p>Tus datos siguen guardados. {error}</p>
          </div>
        )}
        <fieldset disabled={busy}>
          <legend>¿Cómo quieres recibir tu pedido?</legend>
          <div className="mode-options">
            {[
              ["delivery", "Entrega a domicilio"],
              ["pickup", "Recoger en tienda"],
            ].map(([v, l]) => (
              <label key={v}>
                <input
                  type="radio"
                  name="mode"
                  required
                  checked={draft.mode === v}
                  onChange={() => {
                    set("mode", v);
                    set("municipality", "");
                    set("locality", "");
                    set("localityId", "");
                    set("manualLocalityText", "");
                  }}
                />
                <span>
                  <strong>{l}</strong>
                  <small>
                    {v === "delivery"
                      ? "Calcularemos la mensajería según tu zona."
                      : "Sin costo de mensajería."}
                  </small>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <fieldset disabled={busy}>
          <legend>Contacto</legend>
          <label>
            <span>Nombre y apellidos</span>
            <input
              required
              minLength={4}
              autoComplete="name"
              value={draft.fullName}
              onChange={(e) => set("fullName", e.target.value)}
            />
          </label>
          <div className="field-grid two">
            <label>
              <span>Teléfono</span>
              <input
                required
                type="tel"
                autoComplete="tel"
                value={draft.phone}
                onChange={(e) => set("phone", e.target.value)}
              />
            </label>
            <label>
              <span>Teléfono alternativo (opcional)</span>
              <input
                type="tel"
                value={draft.alternatePhone}
                onChange={(e) => set("alternatePhone", e.target.value)}
              />
            </label>
          </div>
          <label>
            <span>Correo</span>
            <input
              required
              type="email"
              autoComplete="email"
              value={draft.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </label>
          <label>
            <span>Código postal</span>
            <input
              required
              inputMode="numeric"
              autoComplete="postal-code"
              minLength={3}
              maxLength={12}
              value={draft.postcode}
              onChange={(e) => set("postcode", e.target.value)}
            />
          </label>
        </fieldset>
        {draft.mode === "delivery" && (
          <fieldset disabled={busy}>
            <legend>Entrega</legend>
            <label>
              <span>Provincia</span>
              <input value={config.province.name} readOnly />
            </label>
            <label>
              <span>Municipio</span>
              <select
                required
                value={draft.municipality}
                onChange={(e) => {
                  set("municipality", e.target.value);
                  set("locality", "");
                  set("localityId", "");
                  set("manualLocalityText", "");
                  set("manualLocality", false);
                }}
              >
                <option value="">Selecciona tu municipio</option>
                {config.municipalities.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Localidad o zona</span>
              <select
                required
                disabled={!draft.municipality}
                value={draft.localityId}
                onChange={(e) => {
                  const option = localities.find(
                    (item) => item.id === e.target.value,
                  );
                  set("localityId", e.target.value);
                  set("locality", option?.label || "");
                  set("manualLocality", false);
                }}
              >
                <option value="">
                  {draft.municipality
                    ? "Selecciona tu localidad"
                    : "Selecciona primero el municipio"}
                </option>
                {localities.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.label}
                  </option>
                ))}
              </select>
              {draft.municipality && (
                <button
                  type="button"
                  className="manual-locality"
                  onClick={() => {
                    set("manualLocality", true);
                    set("localityId", "manual");
                    set("locality", draft.manualLocalityText);
                  }}
                >
                  No encuentro mi localidad
                </button>
              )}
            </label>
            {draft.manualLocality && (
              <label className="field-help">
                <span>Escribe tu localidad</span>
                <input
                  required
                  value={draft.manualLocalityText}
                  onChange={(e) => {
                    set("manualLocalityText", e.target.value);
                    set("locality", e.target.value);
                  }}
                />
                <small>La mensajería quedará pendiente de confirmación.</small>
              </label>
            )}
            <label>
              <span>Dirección</span>
              <input
                required
                minLength={8}
                autoComplete="street-address"
                value={draft.address}
                onChange={(e) => set("address", e.target.value)}
              />
            </label>
            <div className="location-box">
              <strong>Ubicación de entrega</strong>
              <p>Añade tu ubicación para precisar la entrega.</p>
              <button type="button" onClick={locate} disabled={locating}>
                {locating
                  ? "Obteniendo ubicación…"
                  : "Usar mi ubicación actual"}
              </button>
              <p aria-live="polite">{locationMessage}</p>
              {locationMessage && !draft.latitude && (
                <button
                  className="location-retry"
                  type="button"
                  onClick={() => void locate()}
                >
                  Intentar de nuevo
                </button>
              )}
              {draft.latitude && draft.longitude && (
                <div className="location-success">
                  <small>
                    Precisión aproximada: {draft.locationAccuracy || "—"} m
                  </small>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${draft.latitude},${draft.longitude}`)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Ver en el mapa
                  </a>
                  <button
                    type="button"
                    onClick={() => void locate()}
                    disabled={locating}
                  >
                    Actualizar ubicación
                  </button>
                </div>
              )}
            </div>
            <label>
              <span>Referencia para llegar (opcional)</span>
              <input
                value={draft.reference}
                onChange={(e) => set("reference", e.target.value)}
              />
            </label>
            <label>
              <span>Horario preferido (opcional)</span>
              <select
                value={draft.deliveryWindow}
                onChange={(e) => set("deliveryWindow", e.target.value)}
              >
                <option value="">Sin preferencia</option>
                <option>Mañana</option>
                <option>Tarde</option>
              </select>
            </label>
          </fieldset>
        )}
        {draft.mode === "pickup" && (
          <section className="pickup-card">
            <strong>{config.pickup.name}</strong>
            <p>{config.pickup.address}</p>
            <p>{config.pickup.instructions}</p>
          </section>
        )}
        <fieldset disabled={busy}>
          <legend>Notas (opcional)</legend>
          <textarea
            rows={2}
            maxLength={500}
            value={draft.notes}
            onChange={(e) => set("notes", e.target.value)}
          />
        </fieldset>
        <section className="final-summary" aria-live="polite">
          <h2>Resumen</h2>
          <div>
            <span>Productos</span>
            <strong>{products}</strong>
          </div>
          <div>
            <span>
              {draft.mode === "pickup" ? "Recogida en tienda" : "Mensajería"}
            </span>
            <strong>
              {draft.mode === "pickup"
                ? "Sin costo"
                : quoteBusy
                  ? "Calculando…"
                  : quote?.status === "zone"
                    ? `${quote.feeCup.toLocaleString("es-ES")} CUP`
                    : "Por confirmar"}
            </strong>
          </div>
          {draft.mode === "delivery" && quote?.status !== "zone" && (
            <p>La mensajería se confirmará por WhatsApp.</p>
          )}
        </section>
        <button
          className="checkout-submit"
          type="submit"
          disabled={busy || phase !== "ready" || !draft.mode}
        >
          {busy
            ? "Registrando pedido…"
            : "Confirmar pedido y continuar por WhatsApp"}
        </button>
        <Link className="back-cart" href={`/carrito${query}`}>
          Volver al carrito
        </Link>
      </form>
      <aside className="checkout-summary">
        <span>RESUMEN</span>
        <p className="summary-count">
          {count} {count === 1 ? "producto" : "productos"} · {products}
        </p>
        <details>
          <summary>Ver detalles del pedido</summary>
          <ul>
            {cart.items.map((i) => (
              <li key={i.key}>
                <span>
                  {i.quantity} × {i.name}
                </span>
                <strong>{formatMoney(i.totals.line_total, i.totals)}</strong>
              </li>
            ))}
          </ul>
        </details>
      </aside>
    </div>
  );
}
