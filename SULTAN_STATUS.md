# SULTAN App — Current Status

_Generated: 2026-08 — Audit of the entire codebase at `/app`_
_Repo: https://github.com/CultLeaderZiad/SULTAN-App_
_Stack: Expo Router (React Native) + Convex (live DB) + FastAPI/MongoDB (auxiliary services)_

---

## What Is Built (confirmed working)

### Frontend Screens

| Screen | File path | State |
|---|---|---|
| Welcome / Splash with gold-particle animation | `frontend/app/index.tsx` | working |
| Auth (Email + Google tabs, Sign-in / Sign-up) | `frontend/app/auth.tsx` | working |
| Forgot Password (3-step flow: email → OTP → reset) | `frontend/app/forgot-password.tsx` | working |
| Onboarding wizard (4 steps: language, currency, income, goals) | `frontend/app/onboarding.tsx` | working |
| Tab layout (Home / Community / Transactions / Invest / Profile) | `frontend/app/(tabs)/_layout.tsx` | working |
| Dashboard / Home (greeting, net-worth, gold widget, inflation banner, recent txns, prayer widget, quick actions) | `frontend/app/(tabs)/index.tsx` | working |
| Community feed (posts, likes, comments, categories) | `frontend/app/(tabs)/community.tsx` | working |
| Transactions list + add modal (categories, halal flag, filter) | `frontend/app/(tabs)/transactions.tsx` | working |
| Invest (sub-tabs: Gold holdings, Investments, Calculator + Zakat) | `frontend/app/(tabs)/invest.tsx` | working |
| Profile (settings, language, theme, plan badge, logout, admin link) | `frontend/app/(tabs)/profile.tsx` | working |
| AI Advisor chat (Gemini-backed, quick prompts) | `frontend/app/(tabs)/advisor.tsx` | partial (orphaned — `href: null`, no navigation entry from UI) |
| Savings Goals (CRUD + deposit modal) | `frontend/app/savings.tsx` | working |
| Inflation Survival (3 sub-tabs: Alert, Survival, Hustles) | `frontend/app/inflation.tsx` | working |
| Subscription / Pricing plans | `frontend/app/subscription.tsx` | partial (UI only — Subscribe button has no handler) |
| Admin Dashboard (4 sub-tabs: Overview, Users, Content, Pricing) | `frontend/app/admin.tsx` | partial (read-only, no edit/delete actions wired) |
| Web HTML wrapper | `frontend/app/+html.tsx` | working |

### Frontend Contexts / Services

| Component | File path | State |
|---|---|---|
| AuthContext (login/register/google/logout, AsyncStorage persistence) | `frontend/src/contexts/AuthContext.tsx` | working |
| ThemeContext (dark/light + persistence) | `frontend/src/contexts/ThemeContext.tsx` | working |
| LanguageContext (ar/en + RTL flag) | `frontend/src/contexts/LanguageContext.tsx` | working |
| Theme color tokens | `frontend/src/theme/colors.ts` | working |
| Notification helpers (push register, gold/inflation/budget alerts, daily schedule) | `frontend/src/services/notifications.ts` | partial (TS error — see TS section) |

### Backend (FastAPI) Endpoints

| Endpoint | File | State |
|---|---|---|
| `POST /api/auth/register` | `backend/server.py` | working |
| `POST /api/auth/login` | `backend/server.py` | working |
| `POST /api/auth/google-session` | `backend/server.py` | working (relies on Emergent OAuth bridge) |
| `GET /api/auth/me` | `backend/server.py` | working |
| `POST /api/auth/forgot-password` (with SendGrid email) | `backend/server.py` | working |
| `POST /api/auth/verify-otp` | `backend/server.py` | working |
| `POST /api/auth/reset-password` | `backend/server.py` | working |
| `POST /api/auth/avatar` | `backend/server.py` | working (no UI consumer yet) |
| `POST /api/ai/chat` (Gemini 2.5 Flash via emergentintegrations) | `backend/server.py` | working |
| `GET /api/gold/prices` (gold-api.com + 60s cache) | `backend/server.py` | working |
| `GET /api/prayer-times` (aladhan.com) | `backend/server.py` | working |
| `GET /api/currency/rates` | `backend/server.py` | partial (returns hardcoded rates, not a live API) |
| `GET /api/` | `backend/server.py` | working |

---

## What Is Broken or Incomplete

| Issue | File | Detail |
|---|---|---|
| AI Advisor tab orphaned | `frontend/app/(tabs)/_layout.tsx` line 64 | Tab declared with `href: null`, so it is hidden from the bottom bar. No screen in the app links to `/(tabs)/advisor`, making the AI chat unreachable from the UI. |
| Subscription "Subscribe" button is a no-op | `frontend/app/subscription.tsx` line 99 | `select-plan-{id}` `TouchableOpacity` has no `onPress` — no Stripe / payment integration. |
| Admin dashboard read-only | `frontend/app/admin.tsx` | `updatePlan` mutation imported but never called. No delete-user, no edit-pricing, no log entry, no role-promote UI. |
| Currency conversion is fake | `backend/server.py` `get_currency_rates` | Rates are hardcoded constants, not fetched from any provider; description says "Currency API" but no integration exists. |
| Gold change percent always 0 in dashboard widget | `frontend/app/(tabs)/index.tsx` line 156 | Hardcoded `▲ 0.8% today` instead of `liveGoldPrices[].change24h`. |
| `amountEGP` set to raw amount | `frontend/app/(tabs)/transactions.tsx` line 75 | When `currency` is SAR/AED the `amountEGP` is incorrectly stored as `amount`; no FX conversion done before insert. |
| TypeScript error in notifications | `frontend/src/services/notifications.ts` line 9 | `setNotificationHandler` return type missing `shouldShowBanner` & `shouldShowList` (expo-notifications v0.32 API change). |
| Hidden routes referenced at root layout | `frontend/app/_layout.tsx` | Stack registers `admin`, `subscription`, `forgot-password`, `inflation`, `savings` as modals but the layout has `headerShown: false` everywhere — visually fine, but no native back-gesture indicator on Android. |
| Push token never sent to backend | `frontend/src/services/notifications.ts` | `registerForPushNotifications` returns the Expo token but no caller stores it in Convex `users.expoPushToken` or anywhere — server-side push is impossible. |
| `aiInsights`, `budgets`, `prayerSettings`, `subscriptions`, `notifications` tables unused | `frontend/convex/schema.ts` | Tables defined but **no Convex queries/mutations** exist for them — no read/write paths. |
| Side hustles tab uses hardcoded list | `frontend/app/inflation.tsx` lines 14-25 | `sideHustles` Convex table is empty; UI shows a static array instead of querying the table. |

---

## Database Status

### Is Convex initialized and connected?
**Yes.** Deployment URL `https://pastel-wildebeest-832.convex.cloud` is live and responding (`This Convex deployment is running.`). Wired in `frontend/app/_layout.tsx` via `ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL!)`.

### Tables defined in `convex/schema.ts`

| # | Table | Indexes | Has Convex functions? | Has data path? |
|---|---|---|---|---|
| 1 | `users` | by_authId, by_email | ✅ `users.ts` | populated on signup |
| 2 | `transactions` | by_user, by_user_date | ✅ `transactions.ts` | user-generated |
| 3 | `budgets` | by_user | ❌ none | **empty (no UI, no functions)** |
| 4 | `goldTracking` | by_user | ✅ `gold.ts` | user-generated |
| 5 | `goldPrices` | by_karat | ✅ `gold.ts` | seeded on first dashboard load |
| 6 | `investments` | by_user | ✅ `investments.ts` | user-generated |
| 7 | `savingsGoals` | by_user | ✅ `savingsGoals.ts` | user-generated |
| 8 | `sideHustles` | by_user | ✅ `sideHustles.ts` | **empty (UI uses hardcoded list)** |
| 9 | `aiInsights` | by_user, by_user_unread | ❌ none | **empty (no functions)** |
| 10 | `inflationData` | by_year_month | ✅ `inflation.ts` | seeded on first dashboard load (12 months 2025) |
| 11 | `prayerSettings` | by_user | ❌ none | **empty (no functions)** |
| 12 | `subscriptions` | by_user | ❌ none | **empty (no functions, no payment flow)** |
| 13 | `pricingPlans` | — | ✅ `pricingPlans.ts` | seeded on first dashboard load (basic/pro/sultan) |
| 14 | `adminLogs` | by_admin | ✅ `admin.ts` (`logAdminAction`, `getAdminLogs`) | **empty (no caller writes)** |
| 15 | `notifications` | by_user | ❌ none | **empty (no functions)** |
| 16 | `halalGuide` | — | ✅ `halalGuide.ts` | seeded on first dashboard load (7 entries) |
| 17 | `chatMessages` | by_user | ✅ `chatMessages.ts` | populated by AI advisor |
| 18 | `communityPosts` | by_user, by_created | ✅ `community.ts` | user-generated |
| 19 | `communityComments` | by_post, by_user | ✅ `community.ts` | user-generated |
| 20 | `communityLikes` | by_post, by_user_post | ✅ `community.ts` | user-generated |
| 21 | `follows` | by_follower, by_following, by_pair | ✅ `community.ts` (`toggleFollow`, counts) | **empty (no follow UI yet)** |

### Likely populated vs empty (without live admin access)

- **Auto-seeded on first home load:** `goldPrices`, `inflationData`, `pricingPlans`, `halalGuide`
- **User-generated:** `users`, `transactions`, `goldTracking`, `investments`, `savingsGoals`, `chatMessages`, `communityPosts`, `communityComments`, `communityLikes`
- **Empty (no caller / no UI):** `budgets`, `sideHustles`, `aiInsights`, `prayerSettings`, `subscriptions`, `adminLogs`, `notifications`, `follows`

### MongoDB (FastAPI backend)
Used only for auth side-data: `users` (auth_id, email, password_hash, picture, avatar_base64), `password_otps`. All financial business data lives in Convex.

---

## Screen Inventory

| Screen name | File path | State |
|---|---|---|
| Welcome / Splash | `frontend/app/index.tsx` | works |
| Auth (login + register + Google) | `frontend/app/auth.tsx` | works |
| Forgot Password | `frontend/app/forgot-password.tsx` | works |
| Onboarding 4-step | `frontend/app/onboarding.tsx` | works |
| Dashboard (Home tab) | `frontend/app/(tabs)/index.tsx` | works |
| Community (tab) | `frontend/app/(tabs)/community.tsx` | works |
| Transactions (tab) | `frontend/app/(tabs)/transactions.tsx` | works |
| Invest (tab) | `frontend/app/(tabs)/invest.tsx` | works |
| Profile (tab) | `frontend/app/(tabs)/profile.tsx` | works |
| AI Advisor | `frontend/app/(tabs)/advisor.tsx` | broken (unreachable from UI — orphaned route) |
| Tab layout | `frontend/app/(tabs)/_layout.tsx` | works |
| Savings Goals (modal) | `frontend/app/savings.tsx` | works |
| Inflation Survival Guide (modal) | `frontend/app/inflation.tsx` | works |
| Subscription / Plans (modal) | `frontend/app/subscription.tsx` | partial (no payment) |
| Admin Dashboard (modal) | `frontend/app/admin.tsx` | partial (read-only) |
| Root stack layout | `frontend/app/_layout.tsx` | works |
| Web HTML wrapper | `frontend/app/+html.tsx` | works |

---

## Navigation Structure

```
RootLayout (Stack, headerShown: false, animation: fade)
├── index                 → Welcome / Splash
│       ├─ "Start Free"   → /auth?mode=register
│       └─ "Sign In"      → /auth?mode=login
│       (auto-redirect to /(tabs) if user.convexUserId is present)
│
├── auth                  → Email/Google login & register
│       ├─ submit         → /onboarding
│       └─ "Forgot?"      → /forgot-password (modal)
│
├── onboarding            → 4-step wizard
│       └─ finish         → /(tabs)
│
├── (tabs) [Tabs layout]
│   ├── index             → Home / Dashboard
│   │     ├─ goldWidget   → /(tabs)/invest
│   │     ├─ inflBanner   → /inflation
│   │     ├─ "See All"    → /(tabs)/transactions
│   │     └─ quickActions → /(tabs)/transactions, /savings, /inflation
│   ├── community         → Feed + post + comments
│   ├── transactions      → List + add modal
│   ├── invest            → Gold / Investments / Calculator
│   ├── profile           → Settings, language, theme
│   │     ├─ Subscription → /subscription
│   │     ├─ Goals        → /savings
│   │     ├─ Inflation    → /inflation
│   │     ├─ Admin        → /admin (only role==='admin')
│   │     └─ Logout       → / (welcome)
│   └── advisor           ← ⚠️ HIDDEN (href: null), no caller in app
│
├── savings (modal)       → Savings goals CRUD
├── inflation (modal)     → Alert / Survival / Hustles tabs
├── subscription (modal)  → Pricing plans (Subscribe = no-op)
├── forgot-password (modal) → email → otp → reset
└── admin (modal)         → Overview / Users / Content / Pricing tabs
```

---

## API Integrations

| Integration | Connected? | Where |
|---|---|---|
| Gemini (gemini-2.5-flash) | **yes** | `backend/server.py` `/api/ai/chat` via `emergentintegrations.llm.chat` using `EMERGENT_LLM_KEY` |
| Prayer Times API (aladhan.com) | **yes** | `backend/server.py` `/api/prayer-times` |
| Gold Price API (gold-api.com) | **yes** | `backend/server.py` `/api/gold/prices` (60-second cache, fallback to constants on error) |
| Currency API | **no** | `/api/currency/rates` returns hardcoded EGP→USD/SAR/AED/EUR; no provider hit. `GOLD_API_KEY` is set in `.env` but currency endpoint never uses an external provider. |
| SendGrid (transactional email for OTP) | yes | `backend/server.py` `send_otp_email`; falls back to logging OTP in dev if not configured |
| Emergent Google OAuth bridge | yes | `frontend/app/auth.tsx` → `https://auth.emergentagent.com/?redirect=...` → `/api/auth/google-session` |

---

## Auth Status

The following auth methods work today:

1. **Email + Password (register / login)** — FastAPI endpoint with bcrypt, JWT (HS256, 30-day expiry), persisted in MongoDB and AsyncStorage. Implemented in `frontend/src/contexts/AuthContext.tsx` and `backend/server.py`.
2. **Google Sign-In** — via Emergent Auth bridge (`expo-web-browser.openAuthSessionAsync` → session_id → `/api/auth/google-session`). Auto-creates a user on first sign-in.
3. **Forgot Password / Reset** — 6-digit OTP delivered by SendGrid (or logged in dev), 10-minute expiry, then password reset via OTP.
4. **JWT verification on protected routes** — `Authorization: Bearer <jwt>` header, used by `/api/auth/me`, `/api/auth/avatar`, and AI chat.
5. **Convex user creation** — on completing onboarding, a Convex `users` row is created via `api.users.createUser` and linked to the FastAPI authId.

Not implemented: phone/SMS OTP login, biometric / device PIN, MFA, refresh-token rotation.

---

## Missing vs Original Plan

The repo lacks a written PRD; the plan is reconstructed from `design_guidelines.json`, schema, and seeded data. Items planned (or strongly implied) but not built:

- **Phone authentication** — schema has `phone` on `users` but no OTP/SMS flow exists.
- **Budgets** — `budgets` table fully designed (limit, period, alerts) but **zero functions and zero UI**. `notifications.ts` has `checkBudgetAlerts` ready but it has no caller.
- **AI Insights feed** — `aiInsights` table designed (spending advice, gold rec, budget warning, etc.) — **no producer/consumer**. The AI advisor only powers a chat, not insights.
- **Prayer Settings** — table designed (madhab, quiet hours, notifications) — **no UI**. Dashboard hard-codes Cairo.
- **Subscriptions** — `subscriptions` table designed (status, billing cycle, payment method) — **no payment integration**. Subscribe button is a no-op. No Stripe / Fawry / Vodafone Cash / InstaPay handler.
- **Admin actions** — schema includes `adminLogs` and there's an `updateUserPlan` mutation, but the admin screen does not wire either button. No content management for `halalGuide` despite a Content tab existing.
- **Push Notifications backend** — Expo push token is fetched but never persisted to Convex; no server-side push (e.g. inflation alerts).
- **Side Hustle tracker** — `sideHustles` table + Convex CRUD exist, but the UI in `inflation.tsx` shows a hardcoded array; no "Add my own side hustle" form.
- **Follows / Social graph** — table + functions exist but no follow / unfollow UI in the community feed.
- **Currency conversion** — multi-currency wallet implied (`EGP`, `SAR`, `AED`), but txns store `amountEGP === amount`; no live FX conversion on input.
- **AI Advisor placement** — declared in the tabs layout but `href: null` — there is no entry-point in the UI. Likely intended as 6th tab or accessible from Profile / Dashboard.
- **Charts** — design_guidelines mentioned animated line charts; the inflation history uses simple bars and no real chart library is used (`react-native-gifted-charts`, `victory-native`, etc. not installed).
- **Recurring transactions** — schema has `isRecurring` and `recurringInterval`, but the UI hard-codes `isRecurring: false`.
- **Avatar upload** — backend `/api/auth/avatar` endpoint exists, but Profile screen never uses `expo-image-picker` to upload.
- **Family Plan (Sultan tier)** — listed as a feature but no multi-user/share-account model.
- **Zakat calculator** — implemented inline in `invest.tsx` but very simple (2.5% on gold + investments only); ignores cash, real estate, debts, hawl rule.

---

## Environment Variables

### `frontend/.env`
- `EXPO_TUNNEL_SUBDOMAIN`
- `EXPO_PACKAGER_HOSTNAME`
- `EXPO_PUBLIC_BACKEND_URL`  ← used by AuthContext, dashboard, advisor, forgot-password
- `EXPO_USE_FAST_RESOLVER`
- `METRO_CACHE_ROOT`
- `EXPO_PUBLIC_CONVEX_URL`   ← used by `_layout.tsx` to instantiate ConvexReactClient

### `backend/.env`
- `MONGO_URL`
- `DB_NAME`
- `JWT_SECRET`
- `EMERGENT_LLM_KEY`         ← Gemini via emergentintegrations
- `GOLD_API_KEY`             ← present but **not actually consumed** (gold-api.com endpoint used is unauthenticated)
- `SENDGRID_API_KEY`         ← OTP email delivery
- `SENDER_EMAIL`             ← noreply@sultan-app.com

### Code references summary
| Variable | Files that reference it |
|---|---|
| `EXPO_PUBLIC_BACKEND_URL` | `app/_layout.tsx` (no), `app/auth.tsx`, `app/(tabs)/index.tsx`, `app/(tabs)/advisor.tsx`, `app/forgot-password.tsx`, `src/contexts/AuthContext.tsx`, `src/services/notifications.ts` |
| `EXPO_PUBLIC_CONVEX_URL` | `app/_layout.tsx` |
| `MONGO_URL`, `DB_NAME` | `backend/server.py` |
| `JWT_SECRET` | `backend/server.py` |
| `EMERGENT_LLM_KEY` | `backend/server.py` |
| `GOLD_API_KEY` | `backend/server.py` (loaded, never used) |
| `SENDGRID_API_KEY`, `SENDER_EMAIL` | `backend/server.py` `send_otp_email` |

---

## TypeScript Errors

Command: `cd /app/frontend && npx tsc --noEmit`

```
src/services/notifications.ts(9,35): error TS2322: Type 'Promise<{ shouldShowAlert: true; shouldPlaySound: true; shouldSetBadge: true; }>' is not assignable to type 'Promise<NotificationBehavior>'.
  Type '{ shouldShowAlert: true; shouldPlaySound: true; shouldSetBadge: true; }' is missing the following properties from type 'NotificationBehavior': shouldShowBanner, shouldShowList
```

Single error — caused by expo-notifications v0.32 introducing the iOS 14+ banner / notification-list flags. Fix is to add `shouldShowBanner: true, shouldShowList: true` to the handler return.

The rest of the codebase compiles cleanly.

---

## What Needs to Be Built Next

Prioritized list (P0 = blocker for a credible MVP, P3 = nice-to-have polish):

### P0 — Critical
1. **Re-attach the AI Advisor to navigation.** Either expose it as a visible tab (recommended given Sultan's positioning), a floating-action button on the dashboard, or a card under Profile. Right now an entire feature is unreachable.
2. **Fix the TypeScript error** in `notifications.ts` (add `shouldShowBanner`, `shouldShowList`).
3. **Persist the Expo push token** into a new `users.expoPushToken` field on the Convex users table from `registerForPushNotifications`. Without it, no server-driven notifications can ever be sent.
4. **Make Subscribe actually do something.** Either wire Stripe / Fawry / Vodafone Cash, or at minimum start a manual flow that creates a `subscriptions` row with status `pending` and notifies the admin.

### P1 — High
5. **Budgets feature.** Create `convex/budgets.ts` with CRUD, build a Budgets tab/modal, and call `checkBudgetAlerts` after each transaction insert.
6. **Currency FX conversion.** Replace the stub `/api/currency/rates` with a real API (e.g. exchangerate.host or open.er-api.com), and convert `amount` → `amountEGP` in the transaction add modal.
7. **Admin actions wired.** Wire `updateUserPlan`, `deleteUser`, `updatePlan` (pricing) buttons; add a halalGuide editor; log every action through `logAdminAction`.
8. **AI Insights producer.** Add a Convex action (cron) that scans transactions weekly and writes 1-3 entries to `aiInsights`. Surface them on the dashboard.
9. **Prayer Settings UI.** Add a settings screen so the user can pick city, madhab, and toggle notifications; replace the hard-coded "Cairo, Egypt" call.

### P2 — Medium
10. **Side hustle tracker UI.** Add an "Add side hustle" form so the empty `sideHustles` table fills up; combine with the static list as inspiration.
11. **Avatar upload UI.** Wire `expo-image-picker` in Profile to call the existing `/api/auth/avatar` endpoint.
12. **Charts.** Adopt `react-native-gifted-charts` (RN 0.81 + new architecture compatible) for the inflation history bar chart and category breakdown pie.
13. **Recurring transactions.** Implement scheduling using a Convex cron job + `recurringInterval`.
14. **Follows in community.** Add follow / unfollow buttons on each post header; show "Following" filter.

### P3 — Polish
15. **Real Zakat calculator** including hawl, debts, and cash holdings.
16. **Family plan multi-user model** for Sultan tier.
17. **Phone OTP login** to use the `users.phone` schema field.
18. **Replace hardcoded `0.8% gold change`** on dashboard widget with the real `change24h` from the live gold API.
19. **Fix `amountEGP` calculation** in transaction insertion using FX rates from item 6.
20. **i18n hardening** — add a real i18n library (`i18n-js`) instead of the homemade `t(en, ar)` helper, and apply `I18nManager.forceRTL` for Arabic.

---

_End of audit. All findings reference paths relative to `/app`. Convex deployment `pastel-wildebeest-832` was reachable at the time of audit._
