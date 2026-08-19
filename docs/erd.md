# Data Contracts & DTO Reference (ERD) — ERCoffeeLab Mobile App

## 1. Customer & Auth DTOs

### 1.1 Customer Profile DTO (`GET /api/customers/me`)
```json
{
  "id": 1,
  "name": "Budi Santoso",
  "phone": "081234567890",
  "email": "budi@gmail.com",
  "loyaltyPoints": 350,
  "tier": "Gold",
  "nextTierPoints": 700,
  "birthDate": "1995-08-19T00:00:00.000Z",
  "createdAt": "2026-01-15T08:00:00.000Z"
}
```

### 1.2 OTP Request & Verification
- **Request OTP (`POST /api/auth/otp/request`)**:
  - Request: `{ "target": "081234567890", "channel": "whatsapp" }`
  - Response: `{ "message": "OTP terkirim", "isNewCustomer": false }`
- **Verify OTP (`POST /api/auth/otp/verify`)**:
  - Request: `{ "target": "081234567890", "code": "556436" }`
  - Response: `{ "token": "jwt_token_string", "customer": { ... } }`

---

## 2. Outlet & Dynamic Menu DTOs

### 2.1 Outlets List (`GET /api/outlets`)
```json
{
  "data": [
    {
      "id": 1,
      "name": "ERCoffeeLab Bandung Grand City",
      "address": "Jl. Merdeka No. 45, Bandung",
      "openHour": "07:00:00",
      "closeHour": "22:00:00",
      "isOpen": true,
      "latitude": -6.917463,
      "longitude": 107.619123
    }
  ]
}
```

### 2.2 Outlet Dynamic Menu (`GET /api/outlets/:id/menu`)
```json
{
  "data": [
    {
      "id": 101,
      "name": "Es Kopi Milk Aren",
      "description": "Espresso blend spesial dengan susu segar dan gula aren murni",
      "basePrice": 25000,
      "price": 25000,
      "priceOverride": null,
      "categoryName": "Coffee",
      "categoryId": 1,
      "categoryGroup": "beverage",
      "type": "beverage",
      "rating": 4.8,
      "ratingCount": 124,
      "isBestseller": true,
      "isNew": false,
      "imageUrl": "/uploads/products/es_kopi_milk.jpg",
      "isAvailable": true,
      "stockNote": null,
      "addons": [
        { "id": 1, "name": "Extra Shot Espresso", "extraPrice": 5000, "isPopular": true },
        { "id": 2, "name": "Oat Milk Substitute", "extraPrice": 8000, "isPopular": false }
      ]
    }
  ]
}
```

---

## 3. Order & Checkout DTOs

### 3.1 Create Order Payload (`POST /api/orders`)
```json
{
  "outletId": 1,
  "orderType": "delivery",
  "deliveryAddress": "Jl. Dago No. 120, Bandung",
  "customerNotes": "Kurangi gula, tolong kirim cepat",
  "voucherCode": "WELCOME20",
  "items": [
    {
      "productId": 101,
      "quantity": 2,
      "notes": "Less Ice",
      "addonIds": [1]
    }
  ]
}
```

### 3.2 Create Order Response
```json
{
  "id": 501,
  "orderNumber": "ERC-20260819-0501",
  "outletId": 1,
  "orderType": "delivery",
  "status": "pending",
  "paymentStatus": "unpaid",
  "subtotal": 60000,
  "discountTotal": 12000,
  "deliveryFee": 10000,
  "total": 58000,
  "snapToken": "midtrans_snap_token_xyz",
  "snapUrl": "https://app.sandbox.midtrans.com/snap/v2/vtweb/midtrans_snap_token_xyz",
  "createdAt": "2026-08-19T10:15:00.000Z"
}
```

---

## 4. Voucher & Loyalty DTOs

### 4.1 Applicable Vouchers (`GET /api/vouchers`)
```json
{
  "data": [
    {
      "id": 1,
      "name": "Diskon Pelanggan Baru 20%",
      "code": "WELCOME20",
      "discountType": "percent",
      "discountValue": 20,
      "maxDiscount": 15000,
      "minPurchase": 30000,
      "isActive": true
    }
  ]
}
```
