import { invoke } from "@tauri-apps/api/core";
import { attribution } from "./attribution";
import { onEverySync, requestSync } from "./sync";

type Count = { currency: string; expectedMinor: number; countedMinor: number; differenceMinor: number };
type Preview = { applied: boolean; synced: boolean; originalCounts: Count[]; revisedCounts: Count[] };
let busy = false;
let lastBox: HTMLElement | null = null;
const money = (n: number) => (n / 100).toFixed(2);
onEverySync(async () => { if (lastBox?.isConnected) await renderRectification1258(lastBox); });

export async function renderRectification1258(shiftBox: HTMLElement) {
  lastBox = shiftBox;
  let box = shiftBox.parentElement?.querySelector<HTMLElement>("#rectification-1258");
  try {
    const state = await invoke<Preview | null>("preview_1258");
    if (!state) { box?.remove(); return; }
    if (!box) {
      box = document.createElement("section");
      box.id = "rectification-1258";
      box.className = "card";
      shiftBox.after(box);
    }
    const cup = state.revisedCounts.find(r => r.currency === "CUP")!;
    box.innerHTML = `<h3>Corrección autorizada · 8 de noviembre</h3>
      <p>La salida de <b>2 CUP</b> por «pago a gestora Ely» fue un error de moneda. El pago de <b>2 USD se conserva</b>.</p>
      <p>Se guarda una rectificación junto al cierre original. No entra efectivo nuevo ni cambia la caja del próximo turno.</p>
      <p>Con la rectificación: esperado ${money(cup.expectedMinor)} CUP; contado ${money(cup.countedMinor)} CUP; diferencia ${money(cup.differenceMinor)} CUP.</p>
      <p data-status></p>`;
    const status = box.querySelector<HTMLElement>("[data-status]")!;
    if (state.applied) {
      status.textContent = state.synced ? "Rectificación guardada y sincronizada. Historial y USD conservados." : "Rectificación guardada en esta caja; falta sincronizar. No vuelvas a aplicarla.";
      return;
    }
    status.textContent = "Ernesto autorizó esta corrección (#1258). Se hará una copia local antes de aplicarla.";
    const button = document.createElement("button");
    button.className = "btn btn-primary btn-block";
    button.textContent = "Aplicar rectificación de 2 CUP";
    button.disabled = busy;
    box.append(button);
    button.onclick = async () => {
      if (busy) return;
      if (!attribution.staffId) { status.textContent = "Primero elige quién eres en la caja."; return; }
      busy = true; button.disabled = true;
      try {
        await invoke("apply_1258", { operatorId: attribution.staffId });
        requestSync();
        await renderRectification1258(shiftBox);
      } catch (e) { status.textContent = `No se pudo completar: ${String(e)}`; }
      finally { busy = false; button.disabled = false; }
    };
  } catch (e) {
    // Fail visibly on the target device rather than offer an unsafe workaround.
    if (!box) { box = document.createElement("section"); box.id = "rectification-1258"; shiftBox.after(box); }
    box.textContent = `Corrección #1258 pendiente de revisión: ${String(e)}`;
  }
}
