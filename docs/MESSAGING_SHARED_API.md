# NEXO Shared Messaging API — Contract v1

Status: MVP contract, versioned, additive changes only within v1.

## Scope boundary

NEXO/Render provides stateless shared services only: voucher parsing, normalization, missing-field detection, geocoding, route suggestion, and conversational assistance. Casa Viva remains the source of truth for orders, users/roles, workflow states, assignments, payments, reconciliation, tariffs, and messenger operations. These APIs MUST NOT create a parallel order database or state machine.

Base URL: `https://ernesto-rondon-nexo.onrender.com`

## Priority endpoints
- `POST /api/messaging/parse-voucher`
- `POST /api/messaging/geocode`
- `POST /api/messaging/route-suggest`
- `POST /api/assistant/query`

## Common contract
- JSON UTF-8.
- Echo `requestId` when supplied.
- Never invent price, stock, tariff, payment status, coordinates, or policy.
- Missing/uncertain values are explicit.
- No persistence of customer/order payloads by default.
- Secrets remain server-side.
- Breaking changes go to `/v2`; v1 changes are additive.

## parse-voucher
Input: raw text + business/source/locale context. Output: normalized draft, missing fields, warnings, confidence, provider/model. Draft is proposal only; Casa Viva confirms and persists.

## geocode
Input: address/zone/reference/country. Output: candidate coordinates + confidence + provider + `needsConfirmation`. Never fabricate coordinates.

## route-suggest
Input: origin + canonical stop IDs/coordinates/priorities/windows/constraints. Output: suggested stop order, legs/warnings, manual override allowed. Client restrictions outrank distance; messenger has final authority.

## assistant/query
Input: business, role, query, canonical data supplied by Casa Viva, allowed actions. Output: grounded answer, proposed actions, human handoff flag, provider/model. No operational mutation occurs in NEXO.

## Error envelope
`{ "error": { "code":"INVALID_REQUEST", "message":"...", "details":[] }, "requestId":"..." }`

Recommended statuses: 400 invalid request, 401/403 auth, 422 insufficient data, 429 rate limit, 502 upstream provider failure, 503 dependency unavailable.

## Rollout order
1. `parse-voucher`: text first, Gemini-first/OpenAI fallback, deterministic validation.
2. `geocode`: provider adapter + candidate confirmation.
3. `route-suggest`: deterministic constraints-first suggestion.
4. `assistant/query`: read-only grounded answers; proposed actions later.

## Integration principle
Casa Viva sends the minimum required context, receives a draft/suggestion, validates it, and remains the only system persisting operational truth. NEXO remains replaceable and stateless relative to Casa Viva orders.
