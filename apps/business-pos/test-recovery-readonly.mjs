import { readFileSync } from "node:fs";
import assert from "node:assert/strict";
import { test } from "node:test";
const src = readFileSync(new URL("./src/weborders.ts", import.meta.url), "utf8");
test("recovery lock persists and disables all Caja mutation entry points", () => {
  for (const marker of [
    'localStorage.getItem(RECOVERY_KEY) === "true"',
    'localStorage.setItem(RECOVERY_KEY, String(value))',
    'if (recoveryReadOnly || sending',
    'if (recoveryReadOnly) break;',
    'if (!payments || !allowOrderMutation()) return;',
    'if (!allowOrderMutation()) return void (msg.textContent = readOnlyWarning);',
    'if (!allowOrderMutation()) return readOnlyWarning;',
    'for (const [currency, amountMinor] of parts) {\n      if (!allowOrderMutation()) return;',
    'r.orders.map(o => ({ ...o, chargeable: false }))',
    '!recoveryReadOnly && o.kind !== "pickup"',
    '!recoveryReadOnly && inStreet.length',
    'void load().then(() => sendQueued());',
    'return pendingLoad ??= loadOrders().finally(() => { pendingLoad = undefined; });',
  ]) assert.ok(src.includes(marker), marker);
});
