# Product Requirements Document (PRD) — ERCoffeeLab Mobile App

## 1. Executive Summary
The **ERCoffeeLab Mobile App** is a customer-facing cross-platform mobile application (iOS & Android) built with **React Native & Expo**. It enables coffee lovers to discover store outlets, browse outlet-specific menus, customize coffee beverages and food items, place pickup or delivery orders, pay seamlessly via Midtrans payment gateway, track order statuses in real-time, and earn loyalty points across membership tiers (Bronze, Silver, Gold, Platinum).

---

## 2. Core Business Objectives & Features

### 2.1 OTP Authentication (Passwordless)
- **WhatsApp / Email OTP**: Customers log in or register using their Phone Number or Email without needing a password.
- **Automatic WhatsApp Delivery**: OTP codes are automatically delivered to customer WhatsApp numbers via Fonnte API (`/api/auth/otp/request`).
- **Secure Token Storage**: Authenticated JWT tokens are stored securely on the device using `expo-secure-store`.

### 2.2 Store Outlet Selection
- **Multi-Outlet Support**: Customers choose an active store outlet before browsing the menu.
- **Location-Aware / Operating Status**: Shows operating hours, address, distance/map coordinates, and current operating status (🟢 Open / 🔴 Closed).
- **Dynamic Menu Scoping**: Menus, prices, and stock availability are scoped per selected outlet (`/api/outlets/:id/menu`).

### 2.3 Interactive Menu & Item Customization
- **Category Filter**: Filter beverages and food items by category (Coffee, Non-Coffee, Pastry, Snacks).
- **Product Details & Customization**:
  - Choice of Addons / Toppings (e.g. Extra Espresso Shot, Oat Milk, Vanilla Syrup, Less Ice/Sugar).
  - Special Instructions / Order Notes.
  - Quantity counter with real-time subtotal calculation.
- **Product Images**: Render rich product thumbnails uploaded from backend (`imageUrl`).

### 2.4 Cart, Pickup/Delivery & Checkout Alur
- **Delivery Modes**:
  - **Pickup**: Customer collects order at the selected outlet.
  - **Delivery**: Customer inputs delivery address & contact details.
- **Voucher Discounts**: Input promo codes (e.g. `WELCOME20`, `HEMAT10K`) with real-time discount calculation and minimum purchase validation.
- **Price Calculation Safeguard**: All totals are recalculated server-side (`POST /api/orders`) to prevent client-side tampering.

### 2.5 Midtrans Payment Gateway Integration
- **Payment Methods**: Credit Card, GoPay, ShopeePay, QRIS, Bank Transfer (BCA, Mandiri, BNI, BRI Virtual Account).
- **In-App WebView Payment**: Opens Midtrans Snap URL inside an in-app WebView for seamless transaction completion.
- **Automatic Payment Verification**: Backend Midtrans Webhook automatically updates order status from `pending` to `paid`.

### 2.6 Real-Time Order Tracking & Status Polling
- **Live Status Progression**:
  - `pending` ➔ `paid` ➔ `preparing` ➔ `ready` (Pickup) / `on_delivery` (Delivery) ➔ `completed`.
- **Automatic Polling**: App polls order status every 5 seconds using React Query `refetchInterval` while order is active.

### 2.7 Customer Loyalty & Tier Program
- **Point Accumulation**: Points are automatically awarded upon completed transactions (Rp 10.000 = 1 Point).
- **Membership Tiers**:
  - 🥉 **Bronze**: 0 - 99 Points (1x multiplier)
  - 🥈 **Silver**: 100 - 299 Points (1.2x multiplier)
  - 🥇 **Gold**: 300 - 699 Points (1.5x multiplier + Free Birthday Voucher)
  - 💎 **Platinum**: 700+ Points (2x multiplier + Exclusive Rewards)
- **Voucher Redemption**: Exchange earned loyalty points for exclusive vouchers.

---

## 3. Non-Functional Requirements
- **Performance**: App startup time < 2 seconds, smooth 60 FPS UI transitions.
- **Design Alignment**: Must strictly follow visual design system from `apps/mobile/_reference/ERCoffeeLab.tsx` (Navy `#181F4B`, Gold `#C9A876`, Light Cream `#F6F3EC`, Fraunces & Source Sans 3 typography).
- **Offline Resiliency**: Cache outlet lists and menu items locally with `@tanstack/react-query`.
- **Security**: JWT tokens stored exclusively in `expo-secure-store` (iOS Keychain / Android Keystore).
