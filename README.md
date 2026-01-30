# Eksido Simple Web Agent

Standalone chat API + widget snippet for eksido.com. Built as a single, independent service.

## One-click Heroku deploy

1) Confirm `app.json` uses your GitHub repo URL.
2) Commit and push to GitHub.
3) Click the button:

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/eksido/SimpleWebAgent)

## Install (local)
Prerequisites:
- Node.js 18+
- npm

1) Install dependencies:

```bash
npm install
```

2) Create environment file:

```bash
cp .env.example .env
```

3) Fill in required env vars in `.env` (see below).

4) Start the server:

```bash
npm start
```

5) Verify health:

```bash
curl http://localhost:3000/health
```

## GitHub (public repo) setup
1) Create a new public repo in GitHub.
2) Update `app.json` with your repo URL.
3) Push code:

```bash
git init
git add .
git commit -m "Initial Eksido Simple Web Agent"
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_ORG>/<YOUR_REPO>.git
git push -u origin main
```
4) Update the Heroku button link in this README to:

```
https://heroku.com/deploy?template=https://github.com/<YOUR_GITHUB_ORG>/<YOUR_REPO>
```

## Indexing script
1) Put content files in `content/` (.md, .txt, .pdf only).
2) Run:

```bash
npm run index:content
```

3) Copy the printed `VECTOR_STORE_ID` into `.env` as `VECTOR_STORE_ID_SITE_1`.

## Heroku deploy
1) Create app:

```bash
heroku create <YOUR_APP_NAME>
```

2) Set config vars (required):

```bash
heroku config:set OPENAI_API_KEY=sk-... \
  OPENAI_MODEL=gpt-5-mini \
  VECTOR_STORE_ID_SITE_1=vs_... \
  ALLOWED_ORIGINS=https://eksido.com,https://www.eksido.com
```

Optional (token protection):

```bash
heroku config:set REQUIRE_TOKEN=true CONCIERGE_TOKEN_SITE_1=your-token
```

3) Deploy:

```bash
git push heroku main
```

4) Health check:

```bash
curl https://<YOUR_APP_NAME>.herokuapp.com/health
```

## Required env vars
- `OPENAI_API_KEY`
- `VECTOR_STORE_ID_SITE_1`
- `ALLOWED_ORIGINS`

Optional:
- `OPENAI_MODEL` (default `gpt-5-mini`)
- `REQUIRE_TOKEN` (`true` or `false`)
- `CONCIERGE_TOKEN_SITE_1` (required if `REQUIRE_TOKEN=true`)
- `PORT` (Heroku sets this automatically)

## GTM install and verify
1) In Google Tag Manager, add a **Custom HTML** tag.
2) Paste the snippet (see below) and set the trigger to **All Pages**.
3) Replace `<HEROKU_APP>` in the snippet with your Heroku app name.
4) Publish the container.

Verify:
- Visit `https://eksido.com` and click **Chat with Eksido**.
- Send a message and confirm the `/chat?site=eksidocom` request returns `200`.

## Troubleshooting
- **CORS errors**: Ensure `ALLOWED_ORIGINS` matches the exact site origin
  (e.g., `https://eksido.com` and `https://www.eksido.com`, no trailing slash).
- **Vector store missing**: Run the indexing script and set
  `VECTOR_STORE_ID_SITE_1` in your environment. Confirm you are calling
  `/chat?site=eksidocom`.

## Configuration overview
Environment variables:
- `OPENAI_API_KEY`: OpenAI API key used by the server and indexing script.
- `OPENAI_MODEL`: (Optional) Model name. Defaults to `gpt-5-mini`.
- `ALLOWED_ORIGINS`: Comma-separated list of allowed browser origins. Requests with no origin (curl/server-to-server) are allowed.
- `VECTOR_STORE_ID_SITE_1`: Vector store ID created by the indexing script.
- `REQUIRE_TOKEN`: Set to `true` to require `X-Concierge-Token` header.
- `CONCIERGE_TOKEN_SITE_1`: Token value expected when `REQUIRE_TOKEN=true`.

Multi-tenant routing:
- Requests must include `?site=eksidocom`.
- Additional sites can be added in `server.js` under the `SITES` map with different vector store IDs and tokens.
