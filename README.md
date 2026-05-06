# Tróvea Customer App 📱

The official customer-facing Progress Web Application (PWA) for the **Tróvea** ecosystem. This application allows end-users to discover local deals, claim coupons, and manage their rewards within a premium, high-performance interface.

## ✨ Features

- **📍 Location-Based Discovery**: Real-time geolocation to find the nearest deals using PostGIS spatial queries.
- **💎 Glassmorphism UI**: A modern, premium design system with smooth animations and dynamic blur effects.
- **🌍 Internationalization (i18n)**: Full support for English and Spanish with on-the-fly language switching.
- **⚡ Offline First (PWA)**: Fully installable with service worker support for offline coupon access.
- **🔐 Secure Redemption**: Unique QR code generation and secure claim logic backed by Supabase Auth and RLS.

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS 4.0 (Modern Engine)
- **Backend-as-a-Service**: Supabase (Auth, PostgreSQL, Storage)
- **Icons**: Lucide React
- **PWA**: Vite PWA Plugin + Workbox

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/RedemmGrid/redeemgrid-customer.git
   cd redeemgrid-customer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Create a `.env` file in the root and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

## 📂 Project Structure

- `src/pages`: Main application views (Home, Profile, My Coupons, etc.)
- `src/components`: Reusable UI components.
- `src/context`: React Context providers (Auth, etc.)
- `src/hooks`: Custom hooks (Geolocation, etc.)
- `src/locales`: i18n translation files (EN/ES).
- `src/lib`: External library configurations (Supabase client).

## 📄 License

© 2026 Tróvea. All rights reserved.
