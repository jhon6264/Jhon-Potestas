# Deployment Guide

## GitHub Pages (React + Vite)

1. Build the project:
   - `npm run build`
2. Publish the `dist/` output to GitHub Pages.
3. If your repository is a project site (not user/org root), set Vite `base` in `vite.config.js` before deploy.

## Chat Backend (Cloudflare Worker) - Later Integration

Current status:
- Chat UI is implemented in frontend.
- Backend integration is intentionally disabled for now.

When ready to integrate:

1. Create a Cloudflare Worker endpoint (example: `/chat`).
2. Store provider secrets in Worker environment variables, not frontend code:
   - `NVIDIA_NIM_API_KEY` or `GROQ_API_KEY`
   - Optional model name variable
3. Add CORS allowlist for portfolio origin.
4. Validate request body and return structured JSON:
   - Request: `{ message: string }`
   - Response: `{ reply: string }`
5. Update chat widget frontend to call Worker endpoint via `fetch`.

## Security Checklist

- Do not expose API keys in Vite client bundles.
- Restrict Worker CORS to trusted domains.
- Add basic rate limiting and error handling in Worker.
