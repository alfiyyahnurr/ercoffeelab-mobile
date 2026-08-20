# Product Requirements Document (PRD) — ERCoffeeLab Mobile App

## 1. Executive Summary
The **ERCoffeeLab Mobile App** is a customer-facing cross-platform mobile application (iOS & Android) built with **React Native & Expo**. It enables coffee lovers to discover store outlets, browse outlet-specific menus, customize coffee beverages and food items, place pickup or delivery orders, pay seamlessly via Midtrans payment gateway, track order statuses in real-time, and earn loyalty points across membership tiers (Bronze, Silver, Gold, Platinum).

Design alignment is strictly derived from the reference UI prototype **`apps/mobile/_reference/ERCoffeeLab.tsx`**.

---

## 2. Core Business Objectives & Features

### 2.1 Passwordless WhatsApp OTP Authentication (No Email Input at Login)
- **WhatsApp Only OTP**: Customers log in or register using ONLY their **WhatsApp Phone Number**.
- **No Email at Login**: There is NO email input on the login/register screen.
- **Automatic WhatsApp OTP Delivery**: OTP codes are automatically delivered to customer WhatsApp numbers via Fonnte API (`POST /api/auth/otp/request`).
- **Optional Email Profile Completion**: Customer email data is stored as `null` initially. Customers can complete or update their email address later from the **Profile Screen** (`/profile`).
- **Secure Token Storage**: Authenticated JWT tokens are stored securely on the device using `expo-secure-store`.

### 2.2 Store Outlet Selection
- **Multi-Outlet Support**: Customers choose an active store outlet before browsing the menu.
- **Location-Aware / Operating Status**: Shows operating hours, address, distance/map coordinates, and current operating status (🟢 Open / 🔴 Closed).
- **Dynamic Menu Scoping**: Menus, prices, and stock availability are scoped per selected outlet (`/api/outlets/:id/menu`).

### 2.3 Interactive Menu & Item Customization
- **Category Filter**: Filter beverages (Coffee, Milk Based, Fruit Based, Tea, Others) and food items (Lite Bite, Soup, Pasta, Indonesian, Rice Bowl, Meat, Pastry, Salad, Add On).
- **Product Details & Customization**:
  - Choice of Addons / Toppings (e.g. Extra Shot Espresso, Oat Milk Substitute, Less Ice/Sugar).
  - Special Instructions / Order Notes.
  - Quantity counter with real-time subtotal calculation.
- **Product Images & Gradients**: Render rich product thumbnails uploaded from backend (`imageUrl`) and fallback brand gradients.

### 2.4 Cart, Pickup/Delivery & Checkout Flow
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

### 2.7 Customer Loyalty & Profile Management
- **Point Accumulation**: Points are automatically awarded upon completed transactions (Rp 10.000 = 1 Point).
- **Membership Tiers**:
  - 🥉 **Bronze**: 0 - 99 Points (1x multiplier)
  - 🥈 **Silver**: 100 - 299 Points (1.2x multiplier)
  - 🥇 **Gold**: 300 - 699 Points (1.5x multiplier + Free Birthday Voucher)
  - 💎 **Platinum**: 700+ Points (2x multiplier + Exclusive Rewards)
- **Profile Email Completion**: Customers can add/update their Email address, Name, and Birth Date in the Profile Screen.
