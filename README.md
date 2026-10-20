# Rounds — Railway deployment

This folder is a standalone deployable copy of the clinical workflow prototype.
It includes the full UI and a Node server with no third-party dependencies.

## Deploy through GitHub

1. Extract the ZIP and put **the contents of `rounds-railway`** at the root of a GitHub repository. The repository root should contain `Dockerfile`, `package.json`, `server.mjs`, and `public/`.
2. In Railway, create a project and choose **Deploy from GitHub repo**. Select that repository.
3. Railway detects the `Dockerfile`. The start command is already included; no build command, API keys, database, or volume is needed.
4. In the service settings, set the healthcheck path to **`/health`**.
5. Under **Settings → Networking → Public Networking**, choose **Generate Domain**. Open the generated HTTPS URL.

If this folder is inside a larger repository, set the Railway service root directory to that folder before deployment.

The server listens on `0.0.0.0` and uses Railway's `PORT` environment variable automatically. Do not hard-code a target port that conflicts with it. `EXPOSE 3000` is only the local Docker default.

## Deploy with the Railway CLI

With the official Railway CLI installed, run these commands from this folder:

```bash
railway login
railway init
railway up
railway domain
```

For an existing Railway project, use `railway link` instead of `railway init`, selecting the intended project and service. Set `/health` as the service healthcheck in the dashboard.

## Run locally

Use Node.js 22 or newer:

```bash
npm start
```

Open http://localhost:3000. No `npm install` is required.

To use another port:

```bash
PORT=4173 npm start
```

Or run the same container used on Railway:

```bash
docker build -t rounds-prototype .
docker run --rm -p 3000:3000 -e PORT=3000 rounds-prototype
```

## Verify

```bash
npm run check
npm test
```

The smoke test launches the actual entrypoint on an assigned port and checks health, HTML, CSS, JavaScript, HEAD requests, missing/private file handling, unsupported methods, and graceful shutdown.

## Demo flow

Choose an outpatient booking → Start voice consultation → Play sample dictation → Use transcript → review and edit the note and medication draft.

Switch to Inpatient for ward rounds, current-admission events, and prior diagnoses, procedures, and medications. Replace note placeholders and complete medication fields before finishing a demo encounter.

## Prototype scope

- All patient records are fictional; chat responses and sample dictation are scripted.
- Live microphone transcription depends on browser support, HTTPS and permission; a browser may process audio online.
- Conversation and draft changes live in browser memory and reset on refresh.
- No clinical AI service, hospital integration, real prescriptions, database or authentication is included.
- A generated Railway public domain makes this copy publicly reachable. The original private Sites access controls do not transfer to Railway. Use fictional data only.
- Fonts load from Google Fonts, with local font fallbacks.

## Official references

- [Railway Docker and GitHub deployment guide](https://docs.railway.com/guides/express)
- [Railway CLI deployments](https://docs.railway.com/cli/deploying)
- [Railway healthchecks](https://docs.railway.com/deployments/healthchecks)

The package uses Dockerfile detection rather than a legacy `railway.json` deployment file.
