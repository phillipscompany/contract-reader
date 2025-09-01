# Contract AI – "Understand Any Contract in Plain English"

**What it is:** A web app that explains contracts (leases, service agreements, NDAs, etc.) in clear language and highlights key risks and obligations. Users upload a PDF/DOCX; the app extracts text, prompts an AI model, and returns a structured summary. Files are deleted immediately after processing.

## Pages & UX
1. **Landing** – Hero headline, subtext, "Upload Your Contract."
2. **Upload** – Drag-and-drop PDF/DOCX; notes on supported files and deletion.
3. **Processing** – Spinner: "Analyzing your contract with AI…"
4. **Results** – Two panels:
   - Plain-English Summary: what the contract is about, parties, length/renewal
   - **Key Things to Watch Out For:** unusual fees, auto-renewals, restrictions/penalties, your obligations
   - "Download Summary as PDF"
   - Disclaimer: *This tool provides AI-powered explanations. It is not legal advice.*
5. **Pricing** – 1 free demo (first page only), full analysis $5 via Stripe, optional credits bundle.

## Data Flow (concept)
Upload → Extract text (PDF/DOCX) → AI summarization (pre-engineered prompt) → Structured output (summary + risks) → Render results → Optional PDF export → Delete buffers.

## Security & Privacy (requirements)
- Accept only PDF/DOCX; validate MIME and size; reject large/malicious files.
- Use in-memory processing or immediate cleanup; no persistent storage of files or prompts.
- Never expose secrets client-side. Verify Stripe webhooks. Add rate limiting & request size limits.
- Clear disclaimer that this is not legal advice.

## Pricing & Gating
- **Free demo:** analyze the first page only (one time per user/device).
- **Paid:** full contract analysis for $5/document via Stripe Checkout.
- Optional: credits bundle for repeat users.

## Target File Structure (Next.js, to be created later)
contract-ai/
public/
favicon.ico
pages/
index.tsx
upload.tsx
results.tsx
pricing.tsx
api/
analyze.ts
stripe-webhook.ts
checkout.ts
components/
FileUploader.tsx
Spinner.tsx
ContractSummary.tsx
PricingTable.tsx
Layout.tsx
lib/
extractText.ts
summarizeContract.ts
stripe.ts
validators.ts
styles/
globals.css
.env.local
next.config.js
package.json
README.md

lua
Copy code

## MVP Next Steps (not to be done now)
- Minimal `package.json` + one-line `pages/index.tsx` + healthcheck API route.
- File validation & size limits.
- Text extraction (PDF/DOCX).
- AI summarization prompt & schema.
- Results renderer + PDF export.
- Stripe Checkout + webhook verification.
- Rate limiting + logging hygiene.

##Quick start
1. Copy env template: `cp .env.example .env.local` and fill values.
2. Install deps: `npm install`
3. Run dev server: `npm run dev` → visit http://localhost:3000
4. Health check: open `/api/health` → expect `{"ok":true}`
5. Deploy (Vercel): connect repo → add env vars from `.env.local` → deploy.