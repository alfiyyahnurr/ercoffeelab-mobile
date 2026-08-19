# Actionable Development Checklist — ERCoffeeLab Mobile App

## 📋 Execution Roadmap Summary

---

### Phase 1: Project Scaffolding & Core Architecture Setup
- [ ] Initialize Expo SDK 52 project with Expo Router in `apps/mobile`
- [ ] Install and configure NativeWind v4 (Tailwind CSS for React Native)
- [ ] Install `@expo-google-fonts/fraunces` and `@expo-google-fonts/source-sans-3`
- [ ] Install `@tanstack/react-query`, `expo-secure-store`, `react-native-webview`, and `lucide-react-native`
- [ ] Create `lib/api-client.ts` fetch wrapper supporting `EXPO_PUBLIC_API_URL` and `Authorization: Bearer <token>`
- [ ] Setup `app/_layout.tsx` with QueryClientProvider and Google Fonts loader
- [ ] Create `.env.example` and `.env.local` templates

---

### Phase 2: Customer Passwordless Auth Flow (OTP via WhatsApp Fonnte)
- [ ] Build Login Screen (`app/(auth)/login.tsx`) with Phone / Email input field
- [ ] Build OTP Screen (`app/(auth)/otp.tsx`) with 6-digit PIN input & 60s resend timer
- [ ] Connect `POST /api/auth/otp/request` (triggers Fonnte WhatsApp OTP delivery)
- [ ] Connect `POST /api/auth/otp/verify` (verifies code & returns JWT)
- [ ] Store customer JWT securely in `expo-secure-store`
- [ ] Build Auth state listener & route guard (redirects unauthenticated users to `/login`)

---

### Phase 3: Store Outlet Selection & Home Screen
- [ ] Build Header Bar (`components/Header.tsx`) with Active Outlet Badge (🟢 Open / 🔴 Closed)
- [ ] Build Outlet Picker Modal (`app/modal/outlet-picker.tsx`) consuming `GET /api/outlets`
- [ ] Build Home Screen (`app/(main)/index.tsx`) with Promo Banners Carousel
- [ ] Display Customer Greeting & Loyalty Points Balance Card
- [ ] Display Bestseller Coffee Products Carousel

---

### Phase 4: Dynamic Outlet Menu Browser & Item Customization
- [ ] Build Menu Screen (`app/(main)/menu.tsx`) consuming `GET /api/outlets/:id/menu`
- [ ] Add Category Pills Filter (`All`, `Coffee`, `Non-Coffee`, `Pastry`, `Snacks`)
- [ ] Add Search Bar for real-time menu item filtering
- [ ] Build Product Customization Modal (`app/modal/product-[id].tsx`):
  - Addon / Topping Checkboxes (Extra Shot, Oat Milk, etc.)
  - Order Notes Input Box ("Less Ice", "Extra Hot")
  - Quantity Counter (+/-) with real-time subtotal calculation
- [ ] Manage Cart Local State (Add item, update quantity, remove item)

---

### Phase 5: Cart & Checkout Flow (Pickup/Delivery & Midtrans Payment)
- [ ] Build Cart Screen (`app/(main)/cart.tsx`) with item list & quantity modifiers
- [ ] Build Checkout Screen (`app/(main)/checkout.tsx`):
  - Toggle Mode: **Pickup** (Store Pickup) vs **Delivery** (Home Delivery)
  - Delivery Address Input & Contact Details
  - Promo Voucher Input Box consuming `GET /api/vouchers` with instant discount preview
  - Subtotal, Discount, Delivery Fee & Grand Total breakdown
- [ ] Connect `POST /api/orders` (triggers Midtrans charge token generation)
- [ ] Build Midtrans WebView Modal (`app/modal/payment-webview.tsx`) using `react-native-webview`
- [ ] Handle payment completion redirect and navigate to Order Tracking Screen

---

### Phase 6: Real-Time Order Tracking & Customer Loyalty Profile
- [ ] Build Order Tracking Screen (`app/(main)/orders/[id].tsx`):
  - Live Status Stepper: `Pending` ➔ `Paid` ➔ `Preparing` ➔ `Ready / Delivery` ➔ `Completed`
  - React Query Polling (`refetchInterval: 5000`) while order is active
  - Order details breakdown & WhatsApp contact store button
- [ ] Build Order History Screen (`app/(main)/orders/index.tsx`) listing past orders
- [ ] Build Customer Profile Screen (`app/(main)/profile.tsx`):
  - Loyalty Tier Card (Bronze/Silver/Gold/Platinum) with Points Progress Bar
  - Customer personal details & Logout button (clears SecureStore token)
