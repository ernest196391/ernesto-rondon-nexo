const required = ["WOOCOMMERCE_URL", "WOOCOMMERCE_CONSUMER_KEY", "WOOCOMMERCE_CONSUMER_SECRET"];

if (required.some((key) => !process.env[key])) {
  console.log("[nexo-catalog-reconcile] WooCommerce no configurado; se omiten correcciones.");
  process.exit(0);
}

const storeUrl = process.env.WOOCOMMERCE_URL.replace(/\/$/, "");

async function woo(path, init = {}) {
  const url = new URL(`${storeUrl}/wp-json/wc/v3${path}`);
  url.searchParams.set("consumer_key", process.env.WOOCOMMERCE_CONSUMER_KEY);
  url.searchParams.set("consumer_secret", process.env.WOOCOMMERCE_CONSUMER_SECRET);
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init.headers || {}) },
    signal: AbortSignal.timeout(60_000),
    cache: "no-store",
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${path} (${response.status}): ${JSON.stringify(body)?.slice(0, 500)}`);
  return body;
}

async function productBySku(sku) {
  const products = await woo(`/products?sku=${encodeURIComponent(sku)}&status=any&per_page=20`);
  return Array.isArray(products) ? products[0] || null : null;
}

async function reconcile() {
  const split = await productBySku("NEXO-PARKER-SPLIT");
  if (split) {
    const updated = await woo(`/products/${split.id}`, {
      method: "PUT",
      body: JSON.stringify({
        regular_price: "365.00",
        sale_price: "",
        meta_data: [
          ...(Array.isArray(split.meta_data) ? split.meta_data.filter((item) => item?.key !== "nexo_manual_price_correction") : []),
          { key: "nexo_manual_price_correction", value: "365.00 USD confirmed 2026-09-02" },
        ],
      }),
    });
    console.log(`[nexo-catalog-reconcile] SPLIT ${updated.id} -> ${updated.price} USD`);
  } else {
    console.warn("[nexo-catalog-reconcile] No se encontró NEXO-PARKER-SPLIT.");
  }

  const yellowChair = await productBySku("NEXO-BUTACA-AMARILLA");
  if (yellowChair) {
    const updated = await woo(`/products/${yellowChair.id}`, {
      method: "PUT",
      body: JSON.stringify({
        status: "draft",
        meta_data: [
          ...(Array.isArray(yellowChair.meta_data) ? yellowChair.meta_data.filter((item) => item?.key !== "nexo_archived_reason") : []),
          { key: "nexo_archived_reason", value: "Duplicate/wrong imagery; archived by catalog reconciliation 2026-09-02" },
        ],
      }),
    });
    console.log(`[nexo-catalog-reconcile] BUTACA AMARILLA ${updated.id} -> ${updated.status}`);
  } else {
    console.log("[nexo-catalog-reconcile] NEXO-BUTACA-AMARILLA no existe; no hay nada que archivar.");
  }
}

reconcile().catch((error) => {
  console.error("[nexo-catalog-reconcile] error:", error instanceof Error ? error.message : error);
  process.exitCode = 0;
});
