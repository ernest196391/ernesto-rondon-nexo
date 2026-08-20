# NEXO deployment readiness

## Target

Primary public target: `nexo.casavivadecuba.com`.

This repository is the source of truth for the NEXO site and Ernesto Rondón portfolio. Deployment must not modify the existing Casa Viva production site.

## Runtime

- Node.js 20+
- Next.js application
- Server-side environment variables only

## Required environment variables

- `OPENAI_API_KEY` — required for the live NEXO Business Analyzer. Never commit this value.
- `OPENAI_MODEL` — optional model override. If omitted, the application uses its coded default.

## Pre-deploy gate

1. CI build must complete successfully.
2. Confirm no secrets are present in tracked files.
3. Confirm `nexo.casavivadecuba.com` points to an isolated website/application target.
4. Configure environment variables in the hosting control plane, not in the repository.
5. Deploy the application source as a Node.js application.
6. Verify the public URL returns the NEXO homepage and that `/herramientas` loads.
7. Test the Analyzer once with a non-sensitive sample idea after the API key is configured.

## Rollback

If deployment validation fails, restore the previous deployment/build in Hostinger rather than changing the Casa Viva site or its document root.

## Current deployment status

Prepared for deployment, not yet approved as production-ready. Hostinger runtime capabilities and subdomain isolation still need to be verified before publishing.
