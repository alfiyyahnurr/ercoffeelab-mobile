# Technical Architecture & Guidelines — ERCoffeeLab Mobile App

## 1. Technology Stack

| Layer | Technology | Purpose & Rationale |
|---|---|---|
| **Framework** | Expo SDK 52+ (React Native) | Cross-platform development with Expo Go instant physical device testing |
| **Routing** | Expo Router v4 | File-based routing matching Next.js App Router conventions |
| **Styling** | NativeWind v4 (Tailwind CSS) | Direct utility class conversion from `_reference/ERCoffeeLab.tsx` |
| **State & Data Fetching** | `@tanstack/react-query` v5 | Caching, background refetching, and order status polling |
| **Secure Storage** | `expo-secure-store` | Hardware-encrypted JWT storage (iOS Keychain / Android Keystore) |
| **Payment WebView** | `react-native-webview` | Embedded Midtrans Snap Checkout payment flow |
| **Icons** | `lucide-react-native` | Consistent icon set matching admin panel & web reference |
| **Typography** | `@expo-google-fonts` | Fraunces (Display/Price) & Source Sans 3 (Body) |

---

## 2. Directory & App Router Structure

```
apps/mobile/
├── app/                        # Expo Router Pages
│   ├── _layout.tsx             # Root Provider (QueryClient, Fonts, Toast)
│   ├── (auth)/                 # Unauthenticated Flow
│   │   ├── _layout.tsx
│   │   ├── login.tsx           # Phone / Email Input Screen
│   │   └── otp.tsx             # 6-Digit OTP Verification Screen
│   ├── (main)/                 # Authenticated Customer Flow
│   │   ├── _layout.tsx         # Bottom Tab Bar Navigation
│   │   ├── index.tsx           # Home Screen (Outlet Selector & Banners)
│   │   ├── menu.tsx            # Outlet Menu Browser & Category Tabs
│   │   ├── cart.tsx            # Shopping Cart & Order Summary
│   │   ├── checkout.tsx        # Pickup/Delivery & Voucher Selection
│   │   ├── orders/
│   │   │   ├── index.tsx       # Order History & Active Orders List
│   │   │   └── [id].tsx        # Real-time Order Tracking Screen
│   │   └── profile.tsx         # Customer Profile & Loyalty Tier Card
│   ├── modal/
│   │   ├── outlet-picker.tsx   # Outlet Selection Modal
│   │   ├── product-[id].tsx    # Product Detail & Customization Modal
│   │   └── payment-webview.tsx # Midtrans Snap WebView Modal
├── components/                 # Reusable UI Components
│   ├── ui/                     # Button, Card, Badge, Input, Modal
│   ├── Header.tsx              # Top App Bar with Active Outlet Badge
│   ├── ProductCard.tsx         # Menu Product Card Component
│   ├── CartFloatingBar.tsx     # Floating Cart Summary Bar
│   └── LoyaltyTierCard.tsx     # Customer Loyalty Points Card
├── lib/
│   ├── api-client.ts           # Centralized Fetch Wrapper (Injects Bearer JWT)
│   ├── auth-store.ts           # SecureStore Token Manager
│   └── utils.ts                # Price Formatter (IDR) & Date Helpers
├── types/
│   └── api.ts                  # TypeScript DTO Definitions
└── docs/                       # Project Documentation
```

---

## 3. Web-to-Native Conversion Rules (Reference Alignment)

The reference file `apps/mobile/_reference/ERCoffeeLab.tsx` is written as a React Web component. When building React Native screens, convert elements according to this strict mapping:

| Web HTML Element | React Native Component | NativeWind Notes |
|---|---|---|
| `<div>` | `<View>` | Default container element |
| `<span>`, `<p>`, `<h1>`-`<h6>` | `<Text>` | All raw text MUST be wrapped in `<Text>` |
| `<button>`, `<a>` | `<Pressable>` or `<TouchableOpacity>` | Interactive touch elements with feedback |
| `<img>` | `<Image source={{ uri }}>` | Explicit width & height required |
| `<input type="text">` | `<TextInput>` | Custom placeholder styling |
| `<div>` (Overflow scroll) | `<ScrollView>` or `<FlatList>` | Use `<FlatList>` for long menu grids |

---

## 4. API Communication & Base URL Configuration

### 4.1 Base URL Management (`EXPO_PUBLIC_API_URL`)
To allow seamless connection from physical mobile devices via Expo Go, configure `.env.local`:

```env
# Local Computer IP Address (Replace 192.168.1.X with your LAN IP)
EXPO_PUBLIC_API_URL=http://192.168.1.15:3000
```

### 4.2 API Client (`lib/api-client.ts`)
All requests automatically attach JWT tokens retrieved from `expo-secure-store`:

```typescript
import * as SecureStore from 'expo-secure-store';

export async function mobileApiFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';
  const token = await SecureStore.getItemAsync('customer_jwt');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${baseUrl}${endpoint}`, { ...options, headers });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data as T;
}
```
