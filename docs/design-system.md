# Design System & Visual Tokens — ERCoffeeLab Mobile App

## 1. Typography System

The Mobile App design strictly uses **Fraunces** for headings and price tags to project a warm premium coffee aesthetic, and **Source Sans 3** for body text and UI controls.

```typescript
export const fontTokens = {
  // Headings, Titles, Prices, Badges
  heading: 'Fraunces_700Bold',
  headingSemi: 'Fraunces_600SemiBold',
  
  // Body text, Inputs, Descriptions
  body: 'SourceSans3_400Regular',
  bodyMedium: 'SourceSans3_600SemiBold',
  bodyBold: 'SourceSans3_700Bold',
};
```

---

## 2. Color Palette System

| Color Token | Hex Code | Purpose & Usage | NativeWind Class |
|---|---|---|---|
| **Primary Navy** | `#181F4B` | Main brand color, header background, primary buttons | `bg-[#181F4B]`, `text-[#181F4B]` |
| **Accent Gold** | `#C9A876` | Highlights, icons, badges, borders, active states | `bg-[#C9A876]`, `text-[#C9A876]`, `border-[#C9A876]` |
| **Background Cream** | `#F6F3EC` | Main app background, subtle container fills | `bg-[#F6F3EC]` |
| **Card White** | `#FFFFFF` | Card surfaces, modal backgrounds | `bg-white` |
| **Text Dark** | `#1E202B` | Primary headings, product names, price values | `text-[#1E202B]` |
| **Text Muted** | `#6B7088` | Secondary labels, descriptions, timestamps | `text-[#6B7088]` |
| **Success Green** | `#3E8A5A` | Operating status 🟢, completed orders, discounts | `bg-[#EAF5EE]`, `text-[#3E8A5A]` |
| **Danger Red** | `#C9576B` | Outlet closed 🔴, error alerts, remove cart item | `bg-[#FDF0F2]`, `text-[#C9576B]` |

---

## 3. UI Component Specs & NativeWind Classes

### 3.1 Primary Button Component
```tsx
// Gold/Navy Button with Fraunces bold font
<Pressable className="bg-[#181F4B] active:bg-[#0E1230] py-3.5 px-6 rounded-2xl shadow-md flex-row items-center justify-center space-x-2">
  <Text className="text-white font-bold text-base font-albert">Proceed to Checkout</Text>
</Pressable>
```

### 3.2 Product Card Component
```tsx
<View className="bg-white rounded-2xl border border-[#E7E8F0] overflow-hidden p-3 shadow-sm">
  <Image source={{ uri: product.imageUrl }} className="w-full h-32 rounded-xl" />
  <View className="mt-2.5">
    <Text className="text-xs font-bold text-[#C9A876] uppercase">COFFEE</Text>
    <Text className="text-base font-bold text-[#1E202B] font-albert line-clamp-1">{product.name}</Text>
    <View className="flex-row items-center justify-between mt-2">
      <Text className="text-sm font-bold text-[#181F4B] font-albert">Rp {product.price.toLocaleString('id-ID')}</Text>
      <Pressable className="bg-[#181F4B] px-3 py-1.5 rounded-lg">
        <Text className="text-white text-xs font-bold font-albert">+ Add</Text>
      </Pressable>
    </View>
  </View>
</View>
```

### 3.3 Status Badge Component
```tsx
// Operating Status Badge
<View className={`flex-row items-center px-3 py-1 rounded-full border ${isOpen ? 'bg-[#EAF5EE] border-[#C6E7D2]' : 'bg-[#FDF0F2] border-[#FAF1F3]'}`}>
  <View className={`w-2 h-2 rounded-full mr-1.5 ${isOpen ? 'bg-[#3E8A5A]' : 'bg-[#C9576B]'}`} />
  <Text className={`text-xs font-semibold ${isOpen ? 'text-[#3E8A5A]' : 'text-[#C9576B]'}`}>
    {isOpen ? 'Operating' : 'Closed'}
  </Text>
</View>
```
