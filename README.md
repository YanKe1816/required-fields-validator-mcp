# Required Fields Validator

Cloudflare Workers + TypeScript MCP server for the single app `required-fields-validator`.

## Project purpose

Required Fields Validator checks whether submitted fields include required fields and returns a structured validation result. The app is read-only, deterministic, and scoped to field completeness validation.

## Project structure

- `src/index.ts` - Cloudflare Worker routes, review shell pages, challenge route, MCP methods, and tool logic.
- `tests/routes.test.ts` - Route, challenge, and MCP regression tests.
- `wrangler.jsonc` - Cloudflare Worker configuration.
- `package.json` - Local scripts and development dependencies.
- `README.md` - Setup, deployment, and operations notes.

## Routes

- `GET /`
- `GET /privacy`
- `GET /terms`
- `GET /support`
- `GET /health`
- `GET /.well-known/openai-apps-challenge`
- `POST /mcp`

## MCP Methods

- `initialize`
- `tools/list`
- `tools/call`

## Tool

- `validate_required_fields`

The tool checks submitted field keys against required field names and returns `structuredContent` matching the declared `outputSchema`. It is deterministic and does not call external APIs, write to databases, submit forms, or update external systems.

## Local development

```bash
npm install
npm run typecheck
npm test
npm run dev
```

When running locally, set `OPENAI_APPS_CHALLENGE` if you need to test the challenge route with a non-empty value.

PowerShell example:

```powershell
$env:OPENAI_APPS_CHALLENGE = "your-token"
npm run dev
```

## Deployment

Deploy with Wrangler:

```bash
npm run deploy
```

The deployed Worker must expose `POST /mcp` directly. Do not use an app slug prefix for the MCP endpoint.

## Environment variables

- `OPENAI_APPS_CHALLENGE` - Plain text token returned by `GET /.well-known/openai-apps-challenge`.

The challenge route returns the environment variable value as plain text. It does not return JSON and does not hard-code a token.

## Online URLs

- Home: `https://required-fields-validator.<your-workers-subdomain>.workers.dev/`
- Privacy: `https://required-fields-validator.<your-workers-subdomain>.workers.dev/privacy`
- Terms: `https://required-fields-validator.<your-workers-subdomain>.workers.dev/terms`
- Support: `https://required-fields-validator.<your-workers-subdomain>.workers.dev/support`
- Health: `https://required-fields-validator.<your-workers-subdomain>.workers.dev/health`
- Challenge: `https://required-fields-validator.<your-workers-subdomain>.workers.dev/.well-known/openai-apps-challenge`
- MCP: `https://required-fields-validator.<your-workers-subdomain>.workers.dev/mcp`

Replace `<your-workers-subdomain>` with the deployed Cloudflare Workers subdomain shown by Wrangler.

## Common failures

- Challenge route is empty: set `OPENAI_APPS_CHALLENGE` in the Worker environment and redeploy.
- MCP route returns not found: call `POST /mcp`, not an app-prefixed route.
- TypeScript fails after dependency changes: run `npm install`, then `npm run typecheck`.
- Local route tests fail: run `npm test` and inspect the failing route or MCP method.
- Deploy fails due to authentication: sign in with Wrangler for the target Cloudflare account, then rerun the deploy command.
