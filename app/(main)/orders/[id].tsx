import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  MapPin,
  Store,
  CreditCard,
  MessageCircle,
  ShieldCheck,
  ShoppingBag,
  Truck,
  ChevronRight,
  XCircle,
} from 'lucide-react-native';

import { mobileApiFetch } from '@/lib/api-client';
import { Order, OrderItem } from '@/types/api';

export default function OrderTrackingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ id?: string }>();
  const orderId = params.id && params.id !== 'index' ? params.id : '1';

  // Real-time polling API GET /api/orders/:id every 5 seconds
  const { data: orderData, isLoading } = useQuery({
    queryKey: ['order-detail', orderId],
    queryFn: async () => {
      try {
        const res = await mobileApiFetch<Order>(`/api/orders/${orderId}`);
        return res || null;
      } catch {
        return null;
      }
    },
    refetchInterval: 5000, // Poll every 5s while active
  });

  const order = orderData;
  const [loadingPayment, setLoadingPayment] = useState<boolean>(false);
  const [simulatingPayment, setSimulatingPayment] = useState<boolean>(false);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(main)/orders' as any);
    }
  };

  const handleContactWhatsApp = () => {
    const outletPhone = '6285155433847';
    const message = `Halo ER Coffee Lab, saya ingin menanyakan status pesanan nomor #${order?.orderNumber || orderId}.`;
    const url = `https://wa.me/${outletPhone}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {});
  };

  const handleContinuePayment = async () => {
    if (!order || loadingPayment) return;

    setLoadingPayment(true);
    try {
      const res = await mobileApiFetch<{ snapToken: string; redirectUrl?: string }>(
        '/api/payments/midtrans/charge',
        {
          method: 'POST',
          body: JSON.stringify({ orderId: order.id }),
        }
      );

      if (res?.snapToken) {
        router.push({
          pathname: '/modal/payment-webview',
          params: {
            orderId: String(order.id),
            orderNumber: order.orderNumber || `ERC-ORD-${order.id}`,
            snapToken: res.snapToken,
            redirectUrl: res.redirectUrl || '',
          },
        } as any);
      } else {
        alert('Gagal mendapatkan token pembayaran. Silakan coba kembali.');
      }
    } catch (err: any) {
      alert(err?.message || 'Gagal memproses pembayaran. Silakan coba beberapa saat lagi.');
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleSimulatePayment = async () => {
    if (!order || simulatingPayment) return;

    setSimulatingPayment(true);
    try {
      await mobileApiFetch('/api/payments/midtrans/simulate', {
        method: 'POST',
        body: JSON.stringify({
          orderId: String(order.id),
          result: 'success',
        }),
      });
    } catch {
      // Ignored
    } finally {
      setSimulatingPayment(false);
    }
  };

  const formatRupiah = (val: number) => {
    return 'Rp ' + (val || 0).toLocaleString('id-ID');
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

  // Stepper logic: 5 Steps
  const getStepIndex = (orderStatus?: string, paymentStatus?: string) => {
    const status = (orderStatus || '').toLowerCase();
    const pay = (paymentStatus || '').toLowerCase();

    if (status === 'cancelled') return -1;
    if (pay === 'unpaid') return 1;
    if (status === 'checkout' || status === 'paid') return 2;
    if (status === 'processing') return 3;
    if (status === 'ready' || status === 'delivering') return 4;
    if (status === 'completed') return 5;
    return 3;
  };

  const activeStep = getStepIndex(order?.orderStatus, order?.paymentStatus);
  const isCancelled = (order?.orderStatus || '').toLowerCase() === 'cancelled';

  const steps = [
    { step: 1, title: 'Menunggu Pembayaran', sub: 'Menunggu konfirmasi Snap Midtrans' },
    { step: 2, title: 'Sudah Dibayar', sub: 'Pembayaran terverifikasi' },
    { step: 3, title: 'Diproses Barista', sub: 'Pesanan sedang diracik barista' },
    { step: 4, title: 'Siap / Dikirim', sub: order?.fulfillmentType === 'delivery' ? 'Kurir mengirimkan pesanan' : 'Silakan ambil di counter store' },
    { step: 5, title: 'Pesanan Selesai', sub: 'Terima kasih telah berbelanja' },
  ];

  if (isLoading || !order) {
    return (
      <View style={styles.container}>
        <View style={styles.topHeader}>
          <TouchableOpacity onPress={handleBack} style={styles.backIconButton} activeOpacity={0.7}>
            <ArrowLeft size={20} color="#181F4B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Detail Pesanan</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#181F4B" />
          <Text style={{ fontFamily: 'SourceSans3_400Regular', color: '#6B7088', marginTop: 12 }}>
            Memuat data pesanan...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={handleBack} style={styles.backIconButton} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#181F4B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Pesanan</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <>
          {/* Header Card: Order Number & Time */}
          <View style={styles.orderHeaderCard}>
            <View style={styles.orderHeaderTop}>
              <View>
                <Text style={styles.orderNumberTitle}>{order.orderNumber || `ERC-ORD-${order.id}`}</Text>
                <Text style={styles.orderDateSub}>{formatDate(order.createdAt)}</Text>
              </View>
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
              </View>
            </View>

            {/* Cancelled Alert Banner OR Live Progress Stepper Card */}
            {isCancelled ? (
              <View style={styles.cancelledCard}>
                <View style={styles.cancelledHeaderRow}>
                  <XCircle size={22} color="#C9576B" style={{ marginRight: 8 }} />
                  <Text style={styles.cancelledTitle}>Pesanan Dibatalkan</Text>
                </View>
                <Text style={styles.cancelledSubText}>
                  Pesanan ini telah dibatalkan oleh pihak toko/sistem. Silakan hubungi kasir atau outlet kami via WhatsApp jika memerlukan informasi lebih lanjut.
                </Text>
              </View>
            ) : (
              <View style={styles.stepperCard}>
                <View style={styles.stepperHeader}>
                  <Clock size={18} color="#C9A876" style={{ marginRight: 6 }} />
                  <Text style={styles.stepperHeaderTitle}>Status Progres Pesanan (Real-Time)</Text>
                </View>

                <View style={styles.stepperList}>
                  {steps.map((item, idx) => {
                    const isDone = item.step < activeStep;
                    const isCurrent = item.step === activeStep;

                    return (
                      <View key={item.step} style={styles.stepRow}>
                        {/* Left Circle Indicator */}
                        <View style={styles.stepIndicatorWrapper}>
                          <View
                            style={[
                              styles.stepCircle,
                              isDone && styles.stepCircleDone,
                              isCurrent && styles.stepCircleCurrent,
                            ]}
                          >
                            {isDone ? (
                              <CheckCircle2 size={16} color="#FFFFFF" />
                            ) : isCurrent ? (
                              <Clock size={16} color="#C9A876" />
                            ) : (
                              <Text style={styles.stepCircleText}>{item.step}</Text>
                            )}
                          </View>
                          {idx < steps.length - 1 && (
                            <View
                              style={[
                                styles.stepLine,
                                isDone && styles.stepLineDone,
                              ]}
                            />
                          )}
                        </View>

                        {/* Right Title & Subtitle */}
                        <View style={styles.stepTextWrapper}>
                          <Text
                            style={[
                              styles.stepTitle,
                              (isDone || isCurrent) && styles.stepTitleActive,
                            ]}
                          >
                            {item.title}
                          </Text>
                          <Text style={styles.stepSubtitle}>{item.sub}</Text>
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Pending Payment Call to Action Banner (If still unpaid) */}
            {!isCancelled && order.paymentStatus !== 'paid' && (
              <View style={styles.pendingPaymentCard}>
                <View style={styles.pendingHeaderRow}>
                  <Clock size={20} color="#C9A876" style={{ marginRight: 8 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pendingTitle}>Menunggu Pembayaran</Text>
                    <Text style={styles.pendingSubText}>
                      Pesanan belum dibayar. Selesaikan pembayaran agar pesanan segera dibuat oleh barista.
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.continuePaymentBtn}
                  onPress={handleContinuePayment}
                  disabled={loadingPayment}
                  activeOpacity={0.85}
                >
                  {loadingPayment ? (
                    <ActivityIndicator size="small" color="#FFFFFF" style={{ marginRight: 8 }} />
                  ) : (
                    <CreditCard size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  )}
                  <Text style={styles.continuePaymentBtnText}>
                    {loadingPayment ? 'Menghubungkan Midtrans...' : `Lanjutkan Pembayaran (${formatRupiah(order.total)})`}
                  </Text>
                </TouchableOpacity>

                {/* Dev simulation button */}
                <TouchableOpacity
                  style={styles.simPaymentBtn}
                  onPress={handleSimulatePayment}
                  disabled={simulatingPayment}
                  activeOpacity={0.8}
                >
                  <CheckCircle2 size={15} color="#181F4B" style={{ marginRight: 6 }} />
                  <Text style={styles.simPaymentBtnText}>
                    {simulatingPayment ? 'Memproses Simulasi...' : 'Simulasi Bayar Lunas (Dev)'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Outlet Info & Contact Button Card */}
            <View style={styles.outletCard}>
              <View style={styles.outletHeaderRow}>
                <Store size={18} color="#181F4B" style={{ marginRight: 8 }} />
                <Text style={styles.outletTitle}>{order.outletName || 'ER Coffee Lab'}</Text>
              </View>

              {order.fulfillmentType === 'delivery' && order.deliveryAddress ? (
                <View style={styles.addressBox}>
                  <MapPin size={16} color="#C9A876" style={{ marginRight: 6 }} />
                  <Text style={styles.addressText}>{order.deliveryAddress}</Text>
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.waButton}
                onPress={handleContactWhatsApp}
                activeOpacity={0.85}
              >
                <MessageCircle size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.waButtonText}>Hubungi Outlet via WhatsApp</Text>
              </TouchableOpacity>
            </View>

            {/* Order Items Breakdown Card */}
            <View style={styles.itemsCard}>
              <Text style={styles.itemsCardTitle}>Rincian Pesanan Menu</Text>

              {order.items && order.items.length > 0 ? (
                order.items.map((item: OrderItem, idx: number) => (
                  <View key={idx} style={styles.itemRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>
                        {item.qty}x {item.productNameSnapshot}
                      </Text>
                      {item.temperature || item.sugar || item.ice ? (
                        <Text style={styles.itemOptions}>
                          {[item.temperature, item.ice, item.sugar].filter(Boolean).join(' · ')}
                        </Text>
                      ) : null}
                    </View>
                    <Text style={styles.itemPrice}>
                      {formatRupiah(item.unitPrice * item.qty)}
                    </Text>
                  </View>
                ))
              ) : (
                <Text style={styles.noItemsText}>1 Menu Pesanan Kopi</Text>
              )}

              <View style={styles.divider} />

              <View style={styles.costRow}>
                <Text style={styles.costLabel}>Subtotal Menu</Text>
                <Text style={styles.costValue}>{formatRupiah(order.subtotal || order.total)}</Text>
              </View>

              {(order.fulfillmentType === 'delivery' || (order.deliveryFee ?? 0) > 0) && (
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>
                    Ongkos Kirim (Delivery){order.deliveryDistanceKm ? ` [${order.deliveryDistanceKm} km]` : ''}
                  </Text>
                  <Text style={styles.costValue}>{formatRupiah(order.deliveryFee || 0)}</Text>
                </View>
              )}

              {(order.serviceFee ?? 0) > 0 && (
                <View style={styles.costRow}>
                  <Text style={styles.costLabel}>Biaya Layanan</Text>
                  <Text style={styles.costValue}>{formatRupiah(order.serviceFee || 0)}</Text>
                </View>
              )}

              {order.discount ? (
                <View style={styles.costRow}>
                  <Text style={styles.costLabelDiscount}>Diskon Voucher</Text>
                  <Text style={styles.costValueDiscount}>-{formatRupiah(order.discount)}</Text>
                </View>
              ) : null}

              <View style={[styles.costRow, { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: '#F0F1F6' }]}>
                <Text style={styles.totalLabel}>Total Pembayaran</Text>
                <Text style={styles.totalValue}>{formatRupiah(order.total)}</Text>
              </View>

              <View style={styles.paymentMethodRow}>
                <CreditCard size={14} color="#181F4B" style={{ marginRight: 6 }} />
                <Text style={styles.paymentMethodText}>
                  Metode: {order.paymentMethodName || 'Midtrans Payment'} ({order.paymentStatus === 'paid' ? 'LUNAS' : 'PENDING'})
                </Text>
              </View>
            </View>
          </>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F4F5F9',
  },
  backIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 18,
    color: '#181F4B',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  orderHeaderCard: {
    backgroundColor: '#181F4B',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
  },
  orderHeaderTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  orderNumberTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  orderDateSub: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  fulfillmentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  fulfillmentText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 12,
    color: '#181F4B',
  },
  cancelledCard: {
    backgroundColor: '#FDF0F2',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#FAF1F3',
  },
  cancelledHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  cancelledTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 16,
    color: '#C9576B',
  },
  cancelledSubText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#6B7088',
    lineHeight: 18,
  },
  pendingPaymentCard: {
    backgroundColor: '#FFF8EC',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#F7E5C4',
  },
  pendingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  pendingTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 15,
    color: '#181F4B',
  },
  pendingSubText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#6B7088',
    marginTop: 2,
    lineHeight: 17,
  },
  continuePaymentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#181F4B',
    height: 48,
    borderRadius: 24,
    elevation: 2,
    marginBottom: 8,
  },
  continuePaymentBtnText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  simPaymentBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#C9A876',
    height: 42,
    borderRadius: 21,
  },
  simPaymentBtnText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#181F4B',
  },
  stepperCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
  },
  stepperHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F5F9',
  },
  stepperHeaderTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 15,
    color: '#181F4B',
  },
  stepperList: {
    paddingLeft: 4,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  stepIndicatorWrapper: {
    alignItems: 'center',
    marginRight: 14,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F4F5F9',
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCircleDone: {
    backgroundColor: '#3E8A5A',
    borderColor: '#3E8A5A',
  },
  stepCircleCurrent: {
    backgroundColor: '#181F4B',
    borderColor: '#181F4B',
  },
  stepCircleText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 12,
    color: '#9AA0A6',
  },
  stepLine: {
    width: 2,
    height: 28,
    backgroundColor: '#E7E8F0',
    marginVertical: 2,
  },
  stepLineDone: {
    backgroundColor: '#3E8A5A',
  },
  stepTextWrapper: {
    flex: 1,
    paddingTop: 2,
    paddingBottom: 16,
  },
  stepTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#9AA0A6',
  },
  stepTitleActive: {
    fontFamily: 'AlbertSans_700Bold',
    color: '#181F4B',
  },
  stepSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#6B7088',
    marginTop: 2,
  },
  outletCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
  },
  outletHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  outletTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 15,
    color: '#181F4B',
  },
  addressBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F6F3EC',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  addressText: {
    flex: 1,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#181F4B',
  },
  waButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: 16,
  },
  waButtonText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
  itemsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
  },
  itemsCardTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 15,
    color: '#181F4B',
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  itemName: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#181F4B',
  },
  itemOptions: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#6B7088',
    marginTop: 1,
  },
  itemPrice: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 13,
    color: '#181F4B',
  },
  noItemsText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#6B7088',
  },
  divider: {
    height: 1,
    backgroundColor: '#F4F5F9',
    marginVertical: 12,
  },
  costRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  costLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#6B7088',
  },
  costValue: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#181F4B',
  },
  costLabelDiscount: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#3E8A5A',
  },
  costValueDiscount: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 13,
    color: '#3E8A5A',
  },
  totalLabel: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 15,
    color: '#181F4B',
  },
  totalValue: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 17,
    color: '#181F4B',
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F3EC',
    borderRadius: 10,
    padding: 10,
    marginTop: 14,
  },
  paymentMethodText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#181F4B',
  },
});
