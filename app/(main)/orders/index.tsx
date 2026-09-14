import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  Receipt,
  Clock,
  CheckCircle2,
  ChevronRight,
  Store,
  Truck,
  ShoppingBag,
  AlertCircle,
} from 'lucide-react-native';

import { mobileApiFetch } from '@/lib/api-client';
import { getToken } from '@/lib/auth-store';
import { Order, OrderItem } from '@/types/api';

export default function OrdersIndexScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  // Auth guard: If unauthenticated, redirect to onboarding screen
  useFocusEffect(
    useCallback(() => {
      async function checkAuth() {
        const token = await getToken();
        if (!token || token.trim().length === 0) {
          router.replace('/onboarding' as any);
        }
      }
      checkAuth();
    }, [router])
  );

  // Query customer orders from DB API GET /api/orders
  const { data: apiOrders, isLoading } = useQuery({
    queryKey: ['orders-list'],
    queryFn: async () => {
      try {
        const res = await mobileApiFetch<{ data: Order[] }>('/api/orders');
        return Array.isArray(res?.data) ? res.data : [];
      } catch {
        return [];
      }
    },
    refetchInterval: 5000, // Poll active orders every 5s
  });

  const orders = apiOrders || [];

  // Filter orders by active vs history
  const filteredOrders = orders.filter((o) => {
    const status = (o.orderStatus || '').toLowerCase();
    const isCompletedOrCancelled = status === 'completed' || status === 'cancelled';
    return activeTab === 'active' ? !isCompletedOrCancelled : isCompletedOrCancelled;
  });

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (orderStatus?: string, paymentStatus?: string) => {
    const status = (orderStatus || '').toLowerCase();
    const pay = (paymentStatus || '').toLowerCase();

    if (status === 'cancelled') {
      return { label: 'Dibatalkan', bg: '#FDF0F2', color: '#C9576B' };
    }
    if (pay === 'unpaid') {
      return { label: 'Menunggu Pembayaran', bg: '#FFF8E7', color: '#D97706' };
    }
    if (status === 'checkout' || status === 'paid') {
      return { label: 'Sudah Dibayar', bg: '#E8F1FD', color: '#181F4B' };
    }
    if (status === 'processing') {
      return { label: 'Sedang Diproses', bg: '#E8F1FD', color: '#181F4B' };
    }
    if (status === 'ready' || status === 'delivering') {
      return { label: 'Siap / Dikirim', bg: '#EAF5EE', color: '#3E8A5A' };
    }
    if (status === 'completed') {
      return { label: 'Pesanan Selesai', bg: '#EAF5EE', color: '#3E8A5A' };
    }

    return { label: 'Diproses', bg: '#E8F1FD', color: '#181F4B' };
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>Pesanan Saya</Text>
      </View>

      {/* Filter Tabs [ Pesanan Aktif | Riwayat Selesai ] */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'active' && styles.tabActive]}
          onPress={() => setActiveTab('active')}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'active' ? styles.tabTextActive : styles.tabTextInactive,
            ]}
          >
            Pesanan Aktif
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'history' && styles.tabActive]}
          onPress={() => setActiveTab('history')}
          activeOpacity={0.85}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'history' ? styles.tabTextActive : styles.tabTextInactive,
            ]}
          >
            Riwayat Selesai
          </Text>
        </TouchableOpacity>
      </View>

      {/* Orders List Content */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color="#181F4B" />
          </View>
        ) : filteredOrders.length === 0 ? (
          /* Empty State */
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Receipt size={40} color="#C9A876" strokeWidth={1.8} />
            </View>
            <Text style={styles.emptyTitle}>
              {activeTab === 'active' ? 'Tidak Ada Pesanan Aktif' : 'Belum Ada Riwayat Pesanan'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {activeTab === 'active'
                ? 'Semua pesananmu yang sedang berjalan akan ditampilkan di sini.'
                : 'Riwayat pesanan yang sudah selesai atau dibatalkan akan muncul di sini.'}
            </Text>
            <TouchableOpacity
              style={styles.orderNowButton}
              onPress={() => router.push('/(main)/menu' as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.orderNowText}>Pesan Kopi Sekarang</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filteredOrders.map((order) => {
            const badge = getStatusBadge(order.orderStatus, order.paymentStatus);
            const itemCount = order.items ? order.items.reduce((s: number, i: OrderItem) => s + i.qty, 0) : 1;

            return (
              <TouchableOpacity
                key={order.id}
                style={styles.orderCard}
                onPress={() => router.push(`/(main)/orders/${order.id}` as any)}
                activeOpacity={0.85}
              >
                {/* Card Top Header */}
                <View style={styles.cardHeaderRow}>
                  <View style={styles.fulfillmentBadge}>
                    {order.fulfillmentType === 'delivery' ? (
                      <Truck size={14} color="#181F4B" style={{ marginRight: 4 }} />
                    ) : (
                      <ShoppingBag size={14} color="#181F4B" style={{ marginRight: 4 }} />
                    )}
                    <Text style={styles.fulfillmentText}>
                      {order.fulfillmentType === 'delivery' ? 'Delivery' : 'Pick Up'}
                    </Text>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.statusText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                </View>

                {/* Outlet Name & Date */}
                <Text style={styles.orderNumberText}>{order.orderNumber || `ERC-ORD-${order.id}`}</Text>
                <View style={styles.outletRow}>
                  <Store size={14} color="#6B7088" style={{ marginRight: 4 }} />
                  <Text style={styles.outletNameText}>{order.outletName || 'ER Coffee Lab'}</Text>
                </View>
                <Text style={styles.dateText}>{formatDate(order.createdAt)}</Text>

                {/* Divider */}
                <View style={styles.cardDivider} />

                {/* Bottom Row */}
                <View style={styles.cardFooterRow}>
                  <View>
                    <Text style={styles.totalItemsLabel}>{itemCount} Menu Pesanan</Text>
                    <Text style={styles.totalPriceText}>{formatRupiah(order.total)}</Text>
                  </View>

                  <View style={styles.detailLink}>
                    <Text style={styles.detailLinkText}>Tracking Detail</Text>
                    <ChevronRight size={16} color="#181F4B" />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F3EC',
  },
  topHeader: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F4F5F9',
  },
  headerTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 20,
    color: '#181F4B',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E7E8F0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: '#F4F5F9',
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: '#181F4B',
  },
  tabText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 13,
  },
  tabTextActive: {
    color: '#C9A876',
  },
  tabTextInactive: {
    color: '#181F4B',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 90,
  },
  loadingBox: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#181F4B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 18,
    color: '#181F4B',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#6B7088',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  orderNowButton: {
    backgroundColor: '#181F4B',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 22,
    marginTop: 20,
  },
  orderNowText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 14,
    color: '#C9A876',
  },
  orderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
    elevation: 2,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 2px 8px rgba(24, 31, 75, 0.06)' }
      : {
          shadowColor: '#181F4B',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.06,
          shadowRadius: 6,
        }),
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  fulfillmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F3EC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  fulfillmentText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11,
    color: '#181F4B',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 11,
  },
  orderNumberText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 16,
    color: '#181F4B',
  },
  outletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  outletNameText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#6B7088',
  },
  dateText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#9AA0A6',
    marginTop: 2,
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F4F5F9',
    marginVertical: 12,
  },
  cardFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalItemsLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#6B7088',
  },
  totalPriceText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 16,
    color: '#181F4B',
  },
  detailLink: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLinkText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 13,
    color: '#181F4B',
    marginRight: 2,
  },
});
