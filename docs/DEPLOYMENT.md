# NEXO — Deployment Runbook

Target production hostname: `nexo.casavivadecuba.com`

## Preconditions

- `main` is the production source of truth.
- GitHub Actions build must pass before production deployment.
- No secrets are committed to the repository.
- `OPENAI_API_KEY` must be configured only in the hosting environment.
- Optional `OPENAI_MODEL` can override the server-side default.

## Runtime

This application is a Next.js Node.js application. Deploy the source application, not a static export, because `/api/analyze` and `/api/health` require a server runtime.

Expected commands:

```text
Install: npm install
Build: npm run build
Start: npm run start
Node: 20+
```

## Environment

Required for the AI analyzer:

```text
OPENAI_API_KEY=<server secret>
```

Optional:

```text
OPENAI_MODEL=<supported model id>
```

Never place real values in `.env.example`, client-side code, GitHub issues, logs, or deployment documentation.

## Verification after deploy

1. Open `/` and confirm the homepage renders.
2. Open `/negocios`, `/herramientas`, `/sobre-mi`, and `/contacto`.
3. Request `/api/health`; expect HTTP 200 and `ok: true`.
4. Confirm `analyzerConfigured: true` only after the server secret is configured.
5. Submit a short valid business idea in NEXO Business Analyzer and verify a structured result.
6. Test a too-short idea and verify the UI handles HTTP 400 safely.
7. Verify mobile navigation and layout on a narrow viewport.
8. Confirm HTTPS is active on `nexo.casavivadecuba.com`.
9. Confirm no secret is visible in page source, browser requests, repository files, or logs.

## Rollback

If production verification fails, restore the immediately previous known-good deployment/commit and keep the failing commit out of production until diagnosed. Do not modify Casa Viva production resources as part of a NEXO rollback.
