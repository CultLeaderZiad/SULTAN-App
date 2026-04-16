# SULTAN (سلطان) — Product Requirements Document

## Overview
SULTAN is a premium Arabic finance mobile app for Egyptian young men aged 18-30. It teaches users how to beat inflation, track money, invest halal, and build wealth in Egypt's economic reality.

## App Identity
- **Name**: SULTAN (سلطان)
- **Tagline**: "كن سلطان مالك" / "Be the Sultan of Your Money"
- **Developer**: Ziad Sabry (github.com/CultLeaderZiad)
- **Platform**: React Native + Expo (iOS + Android)

## Tech Stack
- **Frontend**: React Native (Expo SDK 54) with expo-router file-based navigation
- **Database**: Convex (https://pastel-wildebeest-832.convex.cloud)
- **Backend**: FastAPI (Python) for auth + AI chat + external APIs
- **Auth**: JWT (email/password) + Emergent Google OAuth + Forgot Password with OTP
- **AI**: Gemini 2.5 Flash via Emergent LLM Key
- **Live Data**: Gold-API.com (gold prices), Aladhan API (prayer times)

## Screens (14 total)
1. ✅ Welcome/Splash — Animated gold crescent, SULTAN branding
2. ✅ Auth — Email/Google OAuth tabs, register/login + Forgot Password link
3. ✅ Forgot Password — 3-step flow: email → 6-digit OTP → new password
4. ✅ Onboarding — 4-step (language, currency, income, goals)
5. ✅ Dashboard — Net worth, gold widget (LIVE), inflation alert, prayer times, quick actions
6. ✅ Community — Twitter-like social feed with posts, likes, comments, categories
7. ✅ Transactions — Full CRUD with categories, halal toggle, monthly summary
8. ✅ Gold & Investments — LIVE gold prices, holdings, portfolio, calculators (Gold vs Bank, Zakat)
9. ✅ AI Advisor — Chat with SULTAN AI (Gemini), quick prompts, bilingual
10. ✅ Profile — Image picker (camera+gallery), settings, dark/light mode, language, logout
11. ✅ Savings Goals — Create goals, deposits, progress tracking
12. ✅ Inflation Survival — Live rate, survival guide, side hustles directory
13. ✅ Subscription — 3 plans with InstaPay/VodafoneCash/Fawry + Contact Developer
14. ✅ Admin Dashboard — User stats, plan breakdown, user management, halal guide

## Navigation
- 5-tab bottom bar: Home | Community | Transactions | Invest | Profile
- AI Advisor accessible from Home tab

## New Features (Iteration 2)
- **Live Gold Prices** from Gold-API.com (XAU/USD → EGP conversion, 1min cache)
- **Prayer Times** from Aladhan API (supports all Egyptian + Gulf cities)
- **Community Social Feed** — Create posts, like, comment, follow users (real-time via Convex)
- **Forgot Password** — 6-digit OTP via email (dev mode shows OTP)
- **Profile Image** — Camera + gallery picker support
- **InstaPay Payment** — With contact developer option for subscriptions

## API Endpoints
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `POST /api/auth/google-session` — Google OAuth
- `GET /api/auth/me` — Current user
- `POST /api/auth/forgot-password` — Send OTP
- `POST /api/auth/verify-otp` — Verify code
- `POST /api/auth/reset-password` — Reset password
- `POST /api/auth/avatar` — Upload profile image
- `POST /api/ai/chat` — AI chat
- `GET /api/gold/prices` — LIVE gold prices
- `GET /api/prayer-times` — Prayer times
- `GET /api/currency/rates` — Currency rates

## Convex Tables (20+)
users, transactions, budgets, goldTracking, goldPrices, investments, savingsGoals, sideHustles, aiInsights, inflationData, prayerSettings, subscriptions, pricingPlans, adminLogs, notifications, halalGuide, chatMessages, communityPosts, communityComments, communityLikes, follows

## Business Enhancement
💡 **Referral Program**: "Invite a Friend" = 1 free month of Pro. Young Egyptian men are highly social — word-of-mouth could drive 3-5x growth.
💡 **Community Engagement**: The social feed creates network effects — users who connect stay longer and have 4x higher retention.
