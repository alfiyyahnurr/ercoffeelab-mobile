import { Tabs } from 'expo-router';
import { Home, Ticket, Receipt, User } from 'lucide-react-native';
import { Platform } from 'react-native';

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#181F4B',
        tabBarInactiveTintColor: '#9CA3AF',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E7E8F0',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 72,
          paddingBottom: Platform.OS === 'ios' ? 26 : 10,
          paddingTop: 6,
          ...(Platform.OS === 'web'
            ? { boxShadow: '0px -4px 12px rgba(24, 31, 75, 0.08)' }
            : {
                shadowColor: '#181F4B',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 8,
              }),
        },
        tabBarLabelStyle: {
          fontFamily: 'SourceSans3_600SemiBold',
          fontSize: 12,
          paddingBottom: 4,
        },
      }}
    >
      {/* 1. Tab Home */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Home size={size || 22} color={color} strokeWidth={2} />
          ),
        }}
      />

      {/* Hidden Route: Menu Cabang Screen */}
      <Tabs.Screen
        name="menu"
        options={{
          href: null,
        }}
      />

      {/* Hidden Route: Cart Screen */}
      <Tabs.Screen
        name="cart"
        options={{
          href: null,
        }}
      />

      {/* Hidden Route: Checkout Screen */}
      <Tabs.Screen
        name="checkout"
        options={{
          href: null,
        }}
      />

      {/* Hidden Route: Order Tracking Screen */}
      <Tabs.Screen
        name="orders/[id]"
        options={{
          href: null,
        }}
      />

      {/* 2. Tab Voucher */}
      <Tabs.Screen
        name="vouchers"
        options={{
          title: 'Voucher',
          tabBarIcon: ({ color, size }) => (
            <Ticket size={size || 22} color={color} strokeWidth={2} />
          ),
        }}
      />

      {/* 3. Tab Pesanan */}
      <Tabs.Screen
        name="orders/index"
        options={{
          title: 'Pesanan',
          tabBarIcon: ({ color, size }) => (
            <Receipt size={size || 22} color={color} strokeWidth={2} />
          ),
        }}
      />

      {/* 4. Tab Akun */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Akun',
          tabBarIcon: ({ color, size }) => (
            <User size={size || 22} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}
