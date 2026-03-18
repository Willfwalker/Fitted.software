# New Feature Setup Guide

Post-implementation setup for the 6 new features added to Fitted Agency.

---

## 1. Install Dependencies

```bash
cd Base
npm install stripe googleapis
```

---

## 2. Environment Variables

Add these to your `.env.local`:

```env
# ── Stripe (Phase 2) ──────────────────────────
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# ── Resend Inbound (Phase 4) ──────────────────
RESEND_WEBHOOK_SECRET=               # from Resend dashboard → Webhooks
RESEND_INBOUND_DOMAIN=               # e.g. inbound.yourdomain.com

# ── Google Calendar (Phase 6) ─────────────────
GOOGLE_CLIENT_ID=                    # from Google Cloud Console
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google-calendar
# For production: https://your-app.vercel.app/api/auth/google-calendar

# Also expose client ID to the browser for the OAuth redirect:
NEXT_PUBLIC_GOOGLE_CLIENT_ID=        # same as GOOGLE_CLIENT_ID

# ── Cron Auth (Phase 6) ───────────────────────
CRON_SECRET=642fe8ba-6872-4fc1-907d-071f0febb0b2
# Uncomment the existing CRON_SECRET in .env.local — it's already there
```

---

## 3. Database Migrations

Run each new schema file in your Supabase SQL editor **in order**:

1. `supabase/schemas/013_integrations.sql` — OAuth token storage
2. `supabase/schemas/014_time_tracking.sql` — time_entries table
3. `supabase/schemas/015_stripe.sql` — Stripe columns on invoices + stripe_customers
4. `supabase/schemas/016_client_portal.sql` — client_portals table
5. `supabase/schemas/017_email_threads.sql` — thread/direction columns on messages
6. `supabase/schemas/018_automations.sql` — automations + automation_logs tables
7. `supabase/schemas/019_google_calendar.sql` — Google fields on calendar_events

Or run the consolidated file if starting fresh:
```bash
bash scripts/build-schema.sh
# Then run supabase/schema_full.sql in the SQL editor
```

---

## 4. Stripe Setup

### 4a. Create Stripe Account
1. Go to [dashboard.stripe.com](https://dashboard.stripe.com)
2. Get your test API keys from Developers → API keys
3. Set `STRIPE_SECRET_KEY` and `STRIPE_PUBLISHABLE_KEY` in `.env.local`

### 4b. Configure Webhook
1. Stripe Dashboard → Developers → Webhooks → Add endpoint
2. **Endpoint URL**: `https://your-app.vercel.app/api/webhooks/stripe`
3. **Events**: Select `checkout.session.completed`
4. Copy the signing secret → set `STRIPE_WEBHOOK_SECRET`

### 4c. Local Testing
```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe listen --forward-to localhost:3000/api/webhooks/stripe
# Copy the webhook signing secret it prints
```

---

## 5. Resend Inbound Email Setup

### 5a. Webhook for Delivery Tracking
1. Resend Dashboard → Webhooks → Add webhook
2. **URL**: `https://your-app.vercel.app/api/webhooks/resend`
3. **Events**: `email.delivered`, `email.bounced`, `email.opened`
4. Copy the signing secret → set `RESEND_WEBHOOK_SECRET`

### 5b. Inbound Email (Receiving Emails)
1. Resend Dashboard → Domains → Add inbound domain
2. Configure MX records for your inbound domain
3. Set inbound webhook URL: `https://your-app.vercel.app/api/email/inbound`
4. Set `RESEND_INBOUND_DOMAIN` in `.env.local`

---

## 6. Google Calendar Setup

### 6a. Google Cloud Console
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use existing)
3. Enable **Google Calendar API** (APIs & Services → Library)
4. Create OAuth 2.0 credentials:
   - Application type: **Web application**
   - Authorized redirect URI: `http://localhost:3000/api/auth/google-calendar`
   - For production add: `https://your-app.vercel.app/api/auth/google-calendar`
5. Copy Client ID and Client Secret

### 6b. OAuth Consent Screen
1. APIs & Services → OAuth consent screen
2. Set user type to **External** (or Internal for workspace)
3. Add scope: `https://www.googleapis.com/auth/calendar`
4. Add test users (your email) while in testing mode

### 6c. Connect in App
- Go to Settings in your Fitted dashboard
- The "Google Calendar" integration section will show a Connect button
- Clicking it redirects to Google OAuth → back to /settings on success

---

## 7. Vercel Deployment

### 7a. Environment Variables on Vercel
Add all the env vars from step 2 to your Vercel project:
- Project Settings → Environment Variables
- Add each variable for Production (and Preview if needed)

### 7b. Cron Jobs
The `vercel.json` already includes the Google Calendar sync cron:
```json
{
  "path": "/api/cron/google-calendar-sync",
  "schedule": "*/15 * * * *"
}
```
This runs every 15 minutes. Vercel will pass `CRON_SECRET` automatically on Pro/Enterprise plans. On Hobby, set the `CRON_SECRET` env var manually.

---

## 8. Provisioning App Updates

If you deploy new clients via `fitted-software/`, these files need updating:

| File | What to add |
|------|-------------|
| `fitted-software/lib/provisioning/steps/05-vercel.ts` | Add `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_WEBHOOK_SECRET`, `RESEND_INBOUND_DOMAIN`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`, `CRON_SECRET` to env vars |
| `fitted-software/components/provision-form.tsx` | Add `"automations"` to module checkbox list |
| `fitted-software/lib/provisioning/steps/06-finalize.ts` | Add Stripe webhook URL to `client.config.json` |

Run `bash scripts/build-schema.sh` after any schema changes to keep `schema_full.sql` in sync — this is the file provisioning uses.

---

## 9. Feature-Specific Notes

### Time Tracking
- Integrated into TaskDetailSheet — timer + manual entry appear on every task
- "Generate Invoice from Time" creates a DRAFT invoice from selected billable entries
- No new module toggle needed — it's part of the tasks module

### Client Portal
- Lives at `/portal/[token]` — no auth required (token-based access)
- Create portals from CRM contact/company detail views
- Portal respects the `permissions` object (invoices/projects/files/forms)
- "Pay Now" button on portal invoices links to Stripe checkout

### Automations
- New toggleable module — enable via Settings → Modules
- Trigger configs filter when automations fire (e.g. `{"to_stage": "WON"}`)
- Action configs use `{{variable}}` template substitution from trigger data
- Available template variables depend on the trigger type

### Google Calendar
- Two-way sync: push on create/update/delete, pull via cron every 15 min
- Conflict resolution: last-write-wins (compares Google's `updated` vs local `last_synced_at`)
- Only syncs for users who have connected their Google account

---

## 10. Quick Verification

After setup, verify everything works:

```bash
# Type check + all tests
npm run check

# Should see: 185 passed (15 test files)
```

Manual checks:
- [ ] Create a time entry on a task → verify it shows in TaskDetailSheet
- [ ] Send an invoice → click "Pay Now" → completes Stripe checkout → invoice marked PAID
- [ ] Create a client portal for a contact → visit `/portal/[token]` → see invoices/projects
- [ ] Send a message → check thread view → reply works
- [ ] Create an automation (e.g. DEAL_STAGE_CHANGED → SEND_NOTIFICATION) → move a deal → check notification
- [ ] Connect Google Calendar in settings → create an event → verify it appears in Google Calendar
