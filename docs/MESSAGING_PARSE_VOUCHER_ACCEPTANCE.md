# NEXO Messaging — parse-voucher acceptance

## Purpose

`POST /api/messaging/parse-voucher` converts an operational Casa Viva voucher into a structured draft. It does **not** create or mutate a Casa Viva order.

## Contract

Request:

```json
{ "rawVoucher": "<voucher text>" }
```

Response:

```json
{
  "draft": {
    "orderCode": "...",
    "store": "...",
    "manager": "...",
    "managerCode": "...",
    "products": [],
    "productTotals": [],
    "deliveryCharge": null,
    "customer": "...",
    "phones": [],
    "address": "...",
    "betweenStreets": "...",
    "reference": "...",
    "zone": "...",
    "notes": [],
    "scheduledDate": null,
    "scheduledTime": null,
    "changeRequired": [],
    "sourceUrl": null,
    "missing": [],
    "warnings": [],
    "confidence": 0.0
  },
  "meta": {
    "provider": "gemini",
    "requiresHumanConfirmation": true,
    "persisted": false,
    "createsOrder": false
  }
}
```

## Acceptance corpus

The initial parser contract was derived from six real Casa Viva delivery patterns observed on 21 Aug 2026. The repository keeps only sanitized structural cases; it does not commit customer PII.

### Case A — normal delivery

- one product line
- USD product total
- CUP delivery charge
- one phone
- apartment-style address
- textual landmark/reference

Expected: product amount and delivery amount remain separate.

### Case B — change required

- product total in USD
- delivery in CUP
- note: bring change for 10 USD

Expected: `changeRequired=[{"amount":10,"currency":"USD"}]`; the 10 USD must not be treated as a delivery fee.

### Case C — multiple products and multiple contacts

- four pillows + four pillowcases
- two contact phone numbers
- delivery charge expressed in USD
- afternoon-only delivery
- call before arrival

Expected: preserve both contacts, both product lines, currency of delivery, and timing/call notes.

### Case D — manager + manager code + landmark

- two products
- manager name and numeric code
- delivery in CUP
- bring USD change
- church landmark

Expected: manager and manager code are separate; landmark belongs in `reference`; change belongs in `changeRequired`.

### Case E — commission adjustment

- product total in USD
- customer delivery charge in CUP
- separate CUP amount deducted from manager commission
- requested morning delivery

Expected: delivery charged to customer remains distinct from `commissionAdjustment`; no arithmetic or policy is invented.

### Case F — incomplete/original-link unavailable

- order data is usable but source URL is unavailable

Expected: `sourceUrl=null`; if the absence is operationally relevant it can appear in `missing`, but the parser must not fabricate a link.

## Required invariants

1. Never convert currencies.
2. Never invent a Casa Viva tariff.
3. Never invent customer, phone, address, location, product, manager or order state.
4. Preserve Cuban address wording and references.
5. Distinguish product amount, delivery charge, change required and commission adjustments.
6. Keep multiple phone numbers.
7. Missing data must remain null/empty and be reported.
8. Every response requires human confirmation.
9. The endpoint never persists and never creates an order.
10. Gemini is attempted first; OpenAI is fallback only.

## Human review UI

Route: `/mensajeria/interpretar-vale`

The mobile-first review surface sends the pasted text to this endpoint, displays missing fields, warnings and extraction confidence, and lets an operator correct the draft. Confirming only creates a client-side payload with contract `casa-viva.messaging.confirmed-voucher-draft.v1`. It does not persist data, create an order, assign a workflow state, or mutate Casa Viva.

## Next integration gate

After CI and deployment, validate the endpoint against the six operational vouchers outside the repository. Only after extraction is reliable should Casa Viva consume the draft in a confirmation UI and persist the confirmed order through Casa Viva's canonical services.
