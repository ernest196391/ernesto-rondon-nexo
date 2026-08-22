"use client";

import { useMemo, useState } from "react";

type Money = { amount: number; currency: string };
type Product = { name: string; quantity: number; unitPrice: number | null; currency: string | null };
type DeliveryCharge = Money & { payer: string | null; commissionAdjustment: number | null };
type VoucherDraft = {
  orderCode: string | null; store: string | null; manager: string | null; managerCode: string | null;
  products: Product[]; productTotals: Money[]; deliveryCharge: DeliveryCharge | null;
  customer: string | null; phones: string[]; address: string | null; betweenStreets?: string | null;
  reference: string | null; zone: string | null; notes: string[]; scheduledDate?: string | null;
  scheduledTime?: string | null; changeRequired: Money[]; sourceUrl: string | null;
  missing: string[]; warnings: string[]; confidence: number;
};
type ParserResponse = { draft: VoucherDraft; meta: { provider: string | null; requiresHumanConfirmation: true; persisted: false; createsOrder: false } };
type ConfirmedPayload = {
  contract: "casa-viva.messaging.confirmed-voucher-draft.v1"; confirmedAt: string; draft: VoucherDraft;
  meta: { source: "nexo-voucher-review"; humanConfirmed: true; persisted: false; createsOrder: false };
};

const requiredFields: Array<[keyof VoucherDraft, string]> = [
  ["orderCode", "ID del pedido"], ["customer", "cliente"], ["phones", "teléfono"],
  ["address", "dirección"], ["zone", "zona"], ["products", "productos"],
  ["productTotals", "importe de productos"],
];
const missingAliases: Partial<Record<keyof VoucherDraft, string[]>> = {
  orderCode: ["ordercode", "order code", "id pedido", "pedido"],
  customer: ["customer", "cliente"], phones: ["phone", "telefono", "teléfono"],
  address: ["address", "direccion", "dirección"], zone: ["zone", "zona"],
  products: ["product", "producto"], productTotals: ["producttotal", "total producto", "importe producto"],
};
const text = (value: string | null | undefined) => value ?? "";
const numberValue = (value: string) => value.trim() && Number.isFinite(Number(value)) ? Number(value) : null;
const normalized = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]/g, "");
const hasValue = (value: VoucherDraft[keyof VoucherDraft]) => value != null && value !== "" && (!Array.isArray(value) || value.length > 0);

export default function VoucherReviewPage() {
  const [rawVoucher, setRawVoucher] = useState("");
  const [draft, setDraft] = useState<VoucherDraft | null>(null);
  const [meta, setMeta] = useState<ParserResponse["meta"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState<ConfirmedPayload | null>(null);
  const [copied, setCopied] = useState(false);

  const currentMissing = useMemo(() => {
    if (!draft) return [];
    const missing = new Set(draft.missing);
    for (const [field, label] of requiredFields) {
      const value = draft[field];
      if (value == null || value === "" || (Array.isArray(value) && value.length === 0)) missing.add(label);
    }
    return [...missing];
  }, [draft]);

  function update<K extends keyof VoucherDraft>(field: K, value: VoucherDraft[K]) {
    setDraft((current) => {
      if (!current) return current;
      const aliases = missingAliases[field] || [];
      const missing = hasValue(value) && aliases.length > 0
        ? current.missing.filter((item) => !aliases.some((alias) => normalized(item).includes(normalized(alias))))
        : current.missing;
      return { ...current, [field]: value, missing };
    });
    setConfirmed(null);
  }

  async function interpretVoucher() {
    if (loading || rawVoucher.trim().length < 20) return;
    setLoading(true); setError(""); setDraft(null); setMeta(null); setConfirmed(null);
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 45000);
    try {
      const response = await fetch("/api/messaging/parse-voucher", {
        method: "POST", cache: "no-store", signal: controller.signal,
        headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rawVoucher }),
      });
      const payload = (await response.json()) as ParserResponse & { error?: string };
      if (!response.ok || !payload.draft) { setError(payload.error || "NEXO no pudo interpretar este vale."); return; }
      setDraft({ ...payload.draft, betweenStreets: payload.draft.betweenStreets ?? null, scheduledDate: payload.draft.scheduledDate ?? null, scheduledTime: payload.draft.scheduledTime ?? null });
      setMeta(payload.meta);
    } catch (requestError) {
      setError(requestError instanceof Error && requestError.name === "AbortError" ? "La interpretación tardó demasiado. Inténtalo nuevamente." : "No se pudo conectar con el intérprete de vales.");
    } finally { window.clearTimeout(timeout); setLoading(false); }
  }

  function confirmDraft() {
    if (!draft) return;
    setConfirmed({
      contract: "casa-viva.messaging.confirmed-voucher-draft.v1", confirmedAt: new Date().toISOString(),
      draft: { ...draft, missing: currentMissing },
      meta: { source: "nexo-voucher-review", humanConfirmed: true, persisted: false, createsOrder: false },
    });
    setCopied(false);
  }

  async function copyPayload() {
    if (!confirmed) return;
    try { await navigator.clipboard.writeText(JSON.stringify(confirmed, null, 2)); setCopied(true); }
    catch { setCopied(false); }
  }

  return (
    <main className="section voucher-page" id="main-content">
      <div className="eyebrow">Casa Viva · Revisión humana</div>
      <h1>NEXO entendió esto</h1>
      <p className="lead small-lead">Pega un vale real, revisa la interpretación y corrige cualquier dato antes de preparar el payload para Casa Viva.</p>
      <section className="voucher-boundary" aria-label="Límite de responsabilidad"><strong>NEXO no crea ni actualiza pedidos.</strong><span>Casa Viva continúa siendo la única fuente de verdad de pedidos, estados, roles y cobros.</span></section>

      <section className="voucher-input-card">
        <label className="voucher-label" htmlFor="raw-voucher">1. Pega el vale</label>
        <textarea id="raw-voucher" value={rawVoucher} maxLength={12000} onChange={(event) => setRawVoucher(event.target.value)} placeholder="Pega aquí el vale completo recibido por WhatsApp…" aria-describedby="voucher-help" />
        <div className="voucher-input-meta" id="voucher-help"><span>El texto se procesa sin guardarse en una base de pedidos de NEXO.</span><span>{rawVoucher.length}/12000</span></div>
        <button className="voucher-primary" onClick={interpretVoucher} disabled={loading || rawVoucher.trim().length < 20}>{loading ? "NEXO está interpretando…" : "Interpretar con NEXO"}</button>
      </section>

      {loading && <div className="voucher-status" role="status"><span className="status-dot" aria-hidden="true" />Separando cliente, dirección, productos e importes…</div>}
      {error && <div className="voucher-alert voucher-alert-error" role="alert"><strong>No se pudo interpretar.</strong><span>{error}</span></div>}

      {draft && <section className="voucher-review" aria-live="polite">
        <header className="voucher-review-header"><div><div className="eyebrow">2. Revisa y corrige</div><h2>Resultado estructurado</h2></div><div className="confidence"><strong>{Math.round(draft.confidence * 100)}%</strong><span>confianza de extracción</span></div></header>
        {(currentMissing.length > 0 || draft.warnings.length > 0) && <div className="voucher-alerts">
          {currentMissing.length > 0 && <div className="voucher-alert voucher-alert-missing"><strong>Faltan datos</strong><ul>{currentMissing.map((item) => <li key={item}>{item}</li>)}</ul></div>}
          {draft.warnings.length > 0 && <div className="voucher-alert voucher-alert-warning"><strong>Revisa estas advertencias</strong><ul>{draft.warnings.map((item) => <li key={item}>{item}</li>)}</ul></div>}
        </div>}
        <div className="voucher-form-grid">
          <Field label="ID del pedido" value={text(draft.orderCode)} onChange={(value) => update("orderCode", value || null)} />
          <Field label="Tienda" value={text(draft.store)} onChange={(value) => update("store", value || null)} />
          <Field label="Gestor/a" value={text(draft.manager)} onChange={(value) => update("manager", value || null)} />
          <Field label="Código del gestor" value={text(draft.managerCode)} onChange={(value) => update("managerCode", value || null)} />
          <Field label="Cliente" value={text(draft.customer)} onChange={(value) => update("customer", value || null)} wide />
          <ListField label="Teléfonos" values={draft.phones} onChange={(values) => update("phones", values)} placeholder="+53…" />
          <Field label="Zona" value={text(draft.zone)} onChange={(value) => update("zone", value || null)} />
          <Field label="Dirección" value={text(draft.address)} onChange={(value) => update("address", value || null)} wide multiline />
          <Field label="Entrecalles" value={text(draft.betweenStreets)} onChange={(value) => update("betweenStreets", value || null)} wide />
          <Field label="Punto de referencia" value={text(draft.reference)} onChange={(value) => update("reference", value || null)} wide multiline />
          <Field label="Fecha solicitada" value={text(draft.scheduledDate)} onChange={(value) => update("scheduledDate", value || null)} />
          <Field label="Horario / ventana" value={text(draft.scheduledTime)} onChange={(value) => update("scheduledTime", value || null)} />
          <Field label="URL de origen" value={text(draft.sourceUrl)} onChange={(value) => update("sourceUrl", value || null)} wide />
        </div>
        <EditableProducts products={draft.products} onChange={(products) => update("products", products)} />
        <MoneyList title="Importes de productos por moneda" items={draft.productTotals} onChange={(items) => update("productTotals", items)} />
        <section className="voucher-subsection">
          <div className="voucher-section-title"><h3>Mensajería</h3>{draft.deliveryCharge && <button type="button" onClick={() => update("deliveryCharge", null)}>Eliminar</button>}</div>
          {draft.deliveryCharge ? <div className="money-grid">
            <NumberField label="Importe" value={draft.deliveryCharge.amount} onChange={(amount) => update("deliveryCharge", { ...draft.deliveryCharge!, amount: amount ?? 0 })} />
            <Field label="Moneda" value={draft.deliveryCharge.currency} onChange={(currency) => update("deliveryCharge", { ...draft.deliveryCharge!, currency })} />
            <Field label="Pagador" value={text(draft.deliveryCharge.payer)} onChange={(payer) => update("deliveryCharge", { ...draft.deliveryCharge!, payer: payer || null })} />
            <NumberField label="Ajuste de comisión" value={draft.deliveryCharge.commissionAdjustment} onChange={(commissionAdjustment) => update("deliveryCharge", { ...draft.deliveryCharge!, commissionAdjustment })} />
          </div> : <button className="voucher-add" type="button" onClick={() => update("deliveryCharge", { amount: 0, currency: "CUP", payer: null, commissionAdjustment: null })}>+ Añadir mensajería</button>}
        </section>
        <MoneyList title="Vuelto necesario" items={draft.changeRequired} onChange={(items) => update("changeRequired", items)} />
        <ListField label="Notas operativas" values={draft.notes} onChange={(values) => update("notes", values)} placeholder="Añadir nota" wide />
        <div className="voucher-confirm-area"><div><strong>3. Confirmar revisión</strong><p>Solo prepara el JSON. No guarda ni envía el pedido al Core Casa Viva todavía.</p></div><button className="voucher-primary" type="button" onClick={confirmDraft}>Confirmar y preparar payload</button></div>
        {meta && <p className="voucher-meta">Proveedor: {meta.provider || "no informado"} · Revisión humana obligatoria · Persistido: no · Crea pedido: no</p>}
      </section>}

      {confirmed && <section className="voucher-payload" aria-live="polite"><div className="voucher-section-title"><div><div className="eyebrow">Payload confirmado</div><h2>Listo para futura integración</h2></div><button type="button" onClick={copyPayload}>{copied ? "Copiado" : "Copiar JSON"}</button></div><p>No se ha persistido ni creado ningún pedido.</p><pre>{JSON.stringify(confirmed, null, 2)}</pre></section>}
    </main>
  );
}

function Field({ label, value, onChange, wide = false, multiline = false }: { label: string; value: string; onChange: (value: string) => void; wide?: boolean; multiline?: boolean }) {
  return <label className={`voucher-field${wide ? " voucher-field-wide" : ""}`}><span>{label}</span>{multiline ? <textarea value={value} onChange={(event) => onChange(event.target.value)} /> : <input value={value} onChange={(event) => onChange(event.target.value)} />}</label>;
}
function NumberField({ label, value, onChange }: { label: string; value: number | null; onChange: (value: number | null) => void }) {
  return <label className="voucher-field"><span>{label}</span><input type="number" inputMode="decimal" value={value ?? ""} onChange={(event) => onChange(numberValue(event.target.value))} /></label>;
}
function ListField({ label, values, onChange, placeholder, wide = false }: { label: string; values: string[]; onChange: (values: string[]) => void; placeholder: string; wide?: boolean }) {
  return <section className={`voucher-list-field${wide ? " voucher-field-wide" : ""}`}><div className="voucher-section-title"><h3>{label}</h3><button type="button" onClick={() => onChange([...values, ""])}>+ Añadir</button></div>{values.length === 0 && <p className="voucher-empty">Sin datos.</p>}{values.map((value, index) => <div className="voucher-list-row" key={`${label}-${index}`}><input aria-label={`${label} ${index + 1}`} value={value} placeholder={placeholder} onChange={(event) => onChange(values.map((item, itemIndex) => itemIndex === index ? event.target.value : item))} /><button type="button" aria-label={`Eliminar ${label} ${index + 1}`} onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))}>Eliminar</button></div>)}</section>;
}
function MoneyList({ title, items, onChange }: { title: string; items: Money[]; onChange: (items: Money[]) => void }) {
  return <section className="voucher-subsection"><div className="voucher-section-title"><h3>{title}</h3><button type="button" onClick={() => onChange([...items, { amount: 0, currency: "CUP" }])}>+ Añadir</button></div>{items.length === 0 && <p className="voucher-empty">Sin importes.</p>}{items.map((item, index) => <div className="money-row" key={`${title}-${index}`}><NumberField label="Importe" value={item.amount} onChange={(amount) => onChange(items.map((current, itemIndex) => itemIndex === index ? { ...current, amount: amount ?? 0 } : current))} /><Field label="Moneda" value={item.currency} onChange={(currency) => onChange(items.map((current, itemIndex) => itemIndex === index ? { ...current, currency } : current))} /><button type="button" onClick={() => onChange(items.filter((_, itemIndex) => itemIndex !== index))}>Eliminar</button></div>)}</section>;
}
function EditableProducts({ products, onChange }: { products: Product[]; onChange: (products: Product[]) => void }) {
  return <section className="voucher-subsection"><div className="voucher-section-title"><h3>Productos y cantidades</h3><button type="button" onClick={() => onChange([...products, { name: "", quantity: 1, unitPrice: null, currency: null }])}>+ Añadir</button></div>{products.length === 0 && <p className="voucher-empty">No se detectaron productos.</p>}{products.map((product, index) => <div className="product-editor" key={`product-${index}`}><Field label="Producto" value={product.name} onChange={(name) => onChange(products.map((current, itemIndex) => itemIndex === index ? { ...current, name } : current))} wide /><NumberField label="Cantidad" value={product.quantity} onChange={(quantity) => onChange(products.map((current, itemIndex) => itemIndex === index ? { ...current, quantity: quantity ?? 0 } : current))} /><NumberField label="Precio unitario" value={product.unitPrice} onChange={(unitPrice) => onChange(products.map((current, itemIndex) => itemIndex === index ? { ...current, unitPrice } : current))} /><Field label="Moneda" value={text(product.currency)} onChange={(currency) => onChange(products.map((current, itemIndex) => itemIndex === index ? { ...current, currency: currency || null } : current))} /><button type="button" onClick={() => onChange(products.filter((_, itemIndex) => itemIndex !== index))}>Eliminar producto</button></div>)}</section>;
}
