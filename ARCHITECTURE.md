# Architecture Overview - RedeemGrid Customer

This document outlines the high-level architecture and data flow for the Customer PWA.

## 🏗️ System Design

RedeemGrid follows a **Distributed Frontend Architecture**. This repository contains only the customer-facing logic. It shares a common PostgreSQL schema with the Merchant and Admin apps but operates as a completely independent service.

### 1. Data Flow (Client-Server)
- **Auth**: Handled via Supabase Auth (Google OAuth). Successful auth triggers a PostgreSQL trigger that synchronizes the `public.profiles` table.
- **Discovery**: The `Home.jsx` page calls the `get_nearby_branches` RPC function in PostgreSQL. This function calculates distances using **PostGIS** on the server side to minimize client-side processing.
- **Real-time Sync**: Uses Supabase real-time subscriptions for notifications (e.g., when a coupon is about to expire).

### 2. UI/UX Principles
- **Glassmorphism**: Built using Tailwind 4's advanced backdrop filters and transparency layers.
- **Responsive**: Mobile-first design focusing on native-like interactions (Bottom navigation, Modals with pull-to-dismiss behavior).
- **Internationalization**: Handled by `react-i18next`. Category names from the database are translated on-the-fly using a dictionary mapping strategy.

### 3. Database Integration (Link to [redeemgrid-db](../redeemgrid-db))
- **RLS (Row Level Security)**: Every query from this app is filtered at the database level using `auth.uid()`.
- **Enums**: All statuses (`pending`, `redeemed`) and user roles are strictly typed via ENUMs to prevent data corruption.

### 4. Deployment & PWA
- **Service Workers**: Managed by `vite-plugin-pwa` for caching static assets and API responses.
- **Hosting**: Designed for Vercel/Netlify with seamless deployment from the main branch.

---
*For schema details, please refer to the centralization migration in the [redeemgrid-db](file:///c:/Repos/RedeemGrid/redeemgrid-db/) repository.*
