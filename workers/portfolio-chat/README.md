# Jhon Portfolio Chat Worker

Cloudflare Worker endpoint for the portfolio chatbot. The frontend calls this Worker, and the Worker calls Groq with the API key stored as a Cloudflare secret.

The Worker also fetches `https://jhonpotestas.vercel.app/portfolio-context.json` on each chat request. That context is generated from `src/data/site.js` during `npm run build`, so the chatbot can answer from the currently deployed portfolio content, including the resume page and resume PDF.

## Local Setup

1. Copy the local secrets example:

```bash
copy workers\portfolio-chat\.dev.vars.example workers\portfolio-chat\.dev.vars
```

2. Put your Groq key in `workers\portfolio-chat\.dev.vars`.

3. Run the Worker locally:

```bash
npx wrangler dev --config workers/portfolio-chat/wrangler.toml
```

## Deploy

1. Login if needed:

```bash
npx wrangler login
```

2. Add the Groq API key as a Cloudflare Worker secret:

```bash
npx wrangler secret put GROQ_API_KEY --config workers/portfolio-chat/wrangler.toml
```

3. Deploy:

```bash
npx wrangler deploy --config workers/portfolio-chat/wrangler.toml
```

4. Build and deploy the portfolio so `portfolio-context.json` is available on Vercel:

```bash
npm run build
```

5. Copy the deployed Worker URL and add it to Vercel as:

```txt
VITE_CHAT_WORKER_URL=https://your-worker-name.your-subdomain.workers.dev
```

Then redeploy the Vercel project.
