# ResQAI — Audit & MVP Implementation Plan

## Audit

**1. Frontend features (all present, working, keep as-is)**
Dashboard (`/`), Emergency Map (`/emergency-map`), Report Disaster (`/report`), Find Help (`/find-help`), AI Assistant (`/ai-assistant`), SOS (`/sos`), Admin Command Center (`/admin`). Shared components: header, sidebar, alert banner, severity badge, report/shelter/hospital cards, map markers, Google map canvas, SOS button, stat cards, loading/empty/error states.

**2. Database tables (already created & seeded)**
`profiles` (0 rows), `user_roles` (citizen/responder/admin enum), `reports` (6 seeded incidents + AI triage columns), `sos_alerts` (0 rows), `facilities` (8 seeded shelters/camps/hospitals). Realtime enabled on `reports` and `sos_alerts`.

**3. Backend functions**
Database: `handle_new_user` (auto profile + citizen role on signup), `has_role`, `is_operator`, `set_updated_at` + triggers. App server functions: `ai-analysis.functions.ts` (mock triage), `directions.functions.ts` (Google Routes API). No edge functions (correct for this stack).

**4. Authentication**
Backend fully prepared (signup trigger, roles, RLS). **Frontend has none** — no `/auth` page, no `useAuth` hook, no sign-out, no protected routes. `/admin` is publicly reachable.

**5. Mock / static data**
`src/data/demo.ts` (reports, shelters, hospitals, blocked roads, alerts, metrics), `report-store.ts` and `sos-store.ts` (localStorage), `ai-analysis.ts` mock engine, `ai-chat-window.tsx` mock assistant. Every page reads demo data — the database is currently unused by the UI.

**6. Non-functional features**
Reports vanish per-browser (localStorage only); SOS never reaches responders; Admin triage queue and metrics are static; AI triage and assistant are heuristic, not real AI; no role gating; blocked roads remain demo-only.

**7. API integrations present**
Google Maps JS API + Routes API via managed connector keys (server-side); Lovable AI key available but unused.

**8. Missing backend wiring**
Server functions for: submit report, list reports, update report status (operator), send SOS, list SOS, acknowledge/dispatch SOS, list facilities. Real AI triage + assistant via Lovable AI. Realtime subscriptions in Admin.

**9. Security / RLS**
RLS enabled with correct grants everywhere. Gaps: public `EXECUTE` on the three `SECURITY DEFINER` functions should be revoked; no client-side auth gate on `/admin`; no role-assignment path for responders/admins (roles table is insert-denied by design, needs an admin-only route or seeded grant); AI/assistant inputs need server-side Zod limits and rate sanity checks.

**10. Needed for a functional MVP**
Auth + roles in the UI, database-backed reports/SOS/facilities with realtime, real AI triage and assistant, role-gated Command Center, then docs/deck/video/publish.

---

## Implementation plan (small milestones)

**M1 — Security cleanup**
Revoke `EXECUTE` on `has_role` / `is_operator` / `handle_new_user` from `anon`/`authenticated` where not needed; re-run linter.

**M2 — Auth foundation**
`useAuth` hook, public `/auth` page (email+password and Google, configured same turn), sign-out + user chip in existing header. No visual redesign — reuse current card/badge styles.

**M3 — Role gating for operations**
Move Command Center to `_authenticated/admin`, keep `/admin` redirect, hide operator nav items for citizens, add `useRole` check.

**M4 — Facilities from database**
`facilities.functions.ts` public read; Find Help, Dashboard "Nearby Help", and map facility markers read live rows; demo data becomes fallback only.

**M5 — Reports from database**
`reports.functions.ts` (public list, authenticated submit, operator status update); rewire Report page, Dashboard, Emergency Map, Admin triage queue; keep localStorage as offline fallback for unsigned users.

**M6 — SOS from database**
`sos.functions.ts` (send, list own, operator list + status update); SOS page history reads real rows; Admin pending-SOS panel live.

**M7 — Realtime Command Center**
Subscribe to `reports` and `sos_alerts` changes; live badge counts and toast on new critical incident.

**M8 — Real AI**
Replace mock triage and assistant with Lovable AI Gateway calls in existing server functions, keeping the mock as fallback and the identical `AnalysisResult` shape so the UI is untouched.

**M9 — Metrics on live data**
`ops-metrics.ts` computes from database rows instead of constants.

**M10 — Submission deliverables**
README/architecture + security doc, pitch deck, Remotion demo video, publish to public URL.

## Technical notes
- All backend access goes through `createServerFn` (no edge functions); admin/service-role imports stay inside handlers.
- Protected fetches rely on the already-registered bearer middleware in `src/start.ts`.
- No `.env` file, no keys in client code; server keys read inside handlers only.
