# NEXO Business — Outbox push contract v1

**Status:** LIVE (2026-10-03). Supabase `nexo-production` (`viwwlriwlwodrfukbgbj`), schema `nexo_business`, Edge Function `nexo-sync-push` deployed. Both pilot devices are provisioned and have pushed their full outbox.
**Read with:** `ADR-001-OFFLINE-SYNC.md`.

## Request
`POST https://viwwlriwlwodrfukbgbj.supabase.co/functions/v1/nexo-sync-push` with header `x-nexo-device-token: <device token>` and JSON:

```json
{
  "contractVersion": 1,
  "businessId": "casa-viva",
  "deviceId": "android-pilot-01",
  "events": [
    {
      "eventId": "uuid",
      "businessId": "casa-viva",
      "deviceId": "android-pilot-01",
      "operationType": "sale.completed",
      "entityType": "sale",
      "entityId": "uuid",
      "occurredAt": "2026-10-02T22:48:03.067Z",
      "envelope": { "contract_version": 1, "event_id": "uuid", "idempotency_key": "…", "payload": { } }
    }
  ]
}
```

Batches hold up to 100 events, oldest first. `envelope` is the exact JSON stored in `local_outbox.payload_json`.

## Response
`200` with one result per event sent, no more and no less:

```json
{ "results": [ { "eventId": "uuid", "status": "applied" } ] }
```

| status | meaning | client effect |
|---|---|---|
| `applied` | stored now | marked synced |
| `duplicate` | already stored (normal answer to a retry) | marked synced |
| `rejected` | failed validation/invariant; include `error` | kept, retried with backoff |

Any non-200, malformed or incomplete response is a transport failure: every event of the batch is kept and retried with backoff (30 s, 1 min, 2 min… capped at 1 h). The queue is never cleared destructively.

## Server obligations
1. Authenticate the device and its business (to be designed with device provisioning).
2. Store `eventId` uniquely **in the same transaction** that applies the effect, so a retry can never duplicate a sale, payment, cash movement or stock movement.
3. Reject events of another business. Every stored event is attributed to the authenticated sender device (`sync_events.device_id`); the device label the event was written with stays in `envelope` (early Android builds labelled sales `windows-pilot-01`).
4. Apply append-only semantics from `FINANCIAL_MODEL.md`; never last-write-wins for money or stock.

`packages/business-domain/src/sync-contract.ts` holds the types, the client-side response check (`validatePushResponse`) and a reference classifier for the server (`classifyPush`).

## Operation types emitted today
`sale.completed`, `cash_shift.opened`, `cash_movement.recorded`, `cash_shift.closed`, `receivable.opened`, `receivable.payment_recorded`, `receivable.written_off`, `messenger_custody.collected`, `messenger_custody.returned`, `messenger_custody.written_off`, `sale.returned`, `location.created`, `inventory.transferred`, `inventory.counted`, `consignment.account_opened`, `consignment.settled`.

## Cloud side (Supabase `nexo-production`)
- Migration `supabase/migrations/20261003010000_nexo_business_sync.sql` (applied): schema `nexo_business` with `devices` (token stored only as SHA-256) and append-only `sync_events` (unique `event_id`), RLS on, no anon/authenticated access. `nexo_business.push_events(token, request)` authenticates the device and stores each event once; `public.nexo_business_push_events` is its service-role-only RPC wrapper.
- Verified inside a rolled-back transaction: new event → `applied`, retry → `duplicate`, foreign event → `rejected`, wrong token → `unauthorized`; tables left empty.
- Migration `20261003020000_nexo_business_sync_sender_device.sql` (applied): sender-device attribution, so a mislabelled legacy event no longer blocks the batch.
- Edge Function `nexo-sync-push` (deployed 2026-10-03) forwards the batch with the service role. Redeploy from the repo root: `npx supabase functions deploy nexo-sync-push --project-ref viwwlriwlwodrfukbgbj --no-verify-jwt`.
- Device provisioning: insert a row in `nexo_business.devices` with `encode(extensions.digest(<token>, sha256), hex)` and enter the token in the POS (Operaciones → Sincronización).

## Not built yet
- Projections from `sync_events` into cloud sales/cash/stock tables.
- Pull side (ordered changes + checkpoint) and admin UI for provisioning devices.
