# NEXO — Deployment Runbook

Target production hostname: `nexo.casavivadecuba.com`

## Release gate

A deployment is allowed only when all of the following are true:

- `main` is the production source of truth and its latest CI build is green.
- The release commit contains no secrets.
- The hosting runtime supports a Next.js Node.js application (not static-only hosting).
- `OPENAI_API_KEY` is stored only as a server-side environment secret.
- A rollback target (the immediately previous known-good commit/deployment) is identified before publishing.

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
NEXO_ANALYZER_RATE_LIMIT_PER_HOUR=8
```

Never place real values in `.env.example`, client-side code, GitHub issues, logs, PR comments, or deployment documentation.

## Hostinger deployment sequence

1. Inspect the existing Hostinger hosting plan and `nexo.casavivadecuba.com` before changing anything.
2. Confirm the target supports Node.js 20+ and a persistent Next.js server process.
3. Keep Casa Viva's existing production site and document root untouched.
4. Point the NEXO application only at the dedicated NEXO subdomain/application target.
5. Configure server environment variables in Hostinger; never upload a real `.env` to GitHub.
6. Install dependencies and run the production build.
7. Start the application and attach `nexo.casavivadecuba.com` to that application.
8. Enable/verify HTTPS before announcing the URL.
9. Run the smoke tests below. If a critical smoke test fails, roll back instead of patching blindly in production.

## Production smoke tests

- `/` renders NEXO Home and primary navigation works.
- `/negocios` renders the project portfolio.
- `/herramientas` renders NEXO Business Analyzer.
- `/sobre-mi` renders Ernesto's portfolio.
- `/contacto` renders without runtime errors.
- `/robots.txt` and `/sitemap.xml` respond successfully.
- `/api/health` returns HTTP 200 and `ok: true`.
- `analyzerConfigured: true` appears only after the server secret is configured.
- A valid business idea produces a structured score/decision/result.
- A too-short idea is rejected safely.
- Repeated requests eventually receive the configured rate-limit response rather than consuming unlimited API calls.
- Analyzer responses are not cached (`Cache-Control: no-store`).
- Mobile navigation, Analyzer input, score and result sections fit a narrow viewport without horizontal scrolling.
- Keyboard focus is visible and the skip link works.
- HTTPS is active on `nexo.casavivadecuba.com`.
- No secret is visible in page source, browser-delivered JavaScript, repository files or public logs.

## Rollback

Before deployment, record the current production deployment/commit. If production verification fails, restore the immediately previous known-good deployment/commit and keep the failing release out of production until diagnosed. Do not modify Casa Viva production resources as part of a NEXO rollback.

## Release record

For each production release, record at minimum:

- Git commit SHA deployed;
- deployment date/time;
- CI run used as evidence;
- smoke-test result;
- rollback commit/deployment;
- any known limitation accepted for the release.
