# SULTAN (سلطان) — Product Requirements Document

## Overview
SULTAN is a premium Arabic finance mobile app for Egyptian young men aged 18-30. It teaches users how to beat inflation, track money, invest halal, and build wealth in Egypt's economic reality.

## App Identity
- **Name**: SULTAN (سلطان)
- **Tagline**: "كن سلطان مالك" / "Be the Sultan of Your Money"
- **Developer**: Ziad Sabry
- **Platform**: React Native + Expo (iOS + Android)

## Tech Stack
- **Frontend**: React Native (Expo SDK 54) with expo-router file-based navigation
- **Database**: Convex (https://pastel-wildebeest-832.convex.cloud)
- **Backend**: FastAPI (Python) for auth + AI chat
- **Auth**: JWT (email/password) + Emergent Google OAuth
- **AI**: Gemini 2.5 Flash via Emergent LLM Key
- **Auth Storage**: MongoDB (sessions/users), Convex (app data)

## Architecture
1. **FastAPI Backend (port 8001)**: Auth endpoints, AI chat proxy, gold/currency API proxy
2. **Convex Cloud**: All financial data (users, transactions, gold, investments, savings goals, inflation, etc.)
3. **Expo Frontend**: 12+ screens with 5-tab bottom navigation

## Screens Implemented
1. ✅ **Welcome/Splash** — Animated gold crescent, SULTAN branding, bilingual CTA buttons
2. ✅ **Auth** — Email/Google OAuth tabs, register/login toggle
3. ✅ **Onboarding** — 4-step (language, currency, income, goals) with progress bar
4. ✅ **Dashboard** — Net worth card, gold widget, inflation alert, recent transactions, quick actions
5. ✅ **Transactions** — Full CRUD with filters, categories, halal toggle, monthly summary
6. ✅ **Gold & Investments** — Live gold prices, holdings tracker, portfolio, Gold vs Bank calculator, Zakat calculator
7. ✅ **AI Advisor** — Chat with SULTAN AI (Gemini), quick prompts, bilingual support
8. ✅ **Profile** — User card, settings, dark/light mode toggle, language switch, logout
9. ✅ **Savings Goals** — Create goals, add deposits, progress tracking, status badges
10. ✅ **Inflation Survival** — Inflation rate, history chart, survival guide, side hustles list
11. ✅ **Subscription** — 3 plans (Basic/Pro/Sultan), monthly/yearly toggle, feature comparison
12. ✅ **Admin Dashboard** — User stats, plan breakdown, user management, halal guide, pricing

## Design System
- **Dark theme** (default): bg #0A0A0F, gold primary #C8A96E
- **Light theme**: bg #F5F5F0, same gold primary
- **Typography**: Cinzel (English headings), Arabic system fonts, Roboto Mono (numbers)
- **RTL/LTR**: Full bilingual Arabic/English support with direction switching

## Key Features
- Real-time data via Convex
- JWT + Google OAuth authentication
- AI-powered financial advisor (Gemini)
- Gold price tracking with investment calculator
- Inflation monitoring with survival guide
- Halal/Haram investment classification
- Savings goals with progress tracking
- Side hustle directory with earnings estimates
- Zakat calculator
- Admin dashboard for content management

## API Endpoints
- `POST /api/auth/register` — Register with email/password
- `POST /api/auth/login` — Login with email/password
- `POST /api/auth/google-session` — Google OAuth session exchange
- `GET /api/auth/me` — Get current user info
- `POST /api/ai/chat` — AI chat with SULTAN advisor
- `GET /api/gold/prices` — Gold prices (18k/21k/24k)
- `GET /api/currency/rates` — Currency exchange rates

## Mocked/Seed Data
- Gold prices: Static seed data in Convex (not live API)
- Inflation data: Seeded 12 months of data
- Currency rates: Static response
- Pricing plans: Seeded 3 plans
- Halal guide: Seeded 7 entries

## Business Enhancement
💡 **Referral Program**: Add a "Invite a Friend" feature where users earn 1 free month of Pro for each referral. Young Egyptian men are highly social — word-of-mouth referrals could drive 3-5x user growth with minimal marketing spend. Track via unique referral codes stored in Convex.
