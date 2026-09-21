import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  ShoppingBag,
  Truck,
  MapPin,
  Ticket,
  CreditCard,
  ChevronRight,
  Check,
  AlertCircle,
  Clock,
  ShieldCheck,
  X,
  Navigation,
  Plus,
  Home,
  Briefcase,
} from 'lucide-react-native';

import { useCart } from '@/lib/cart-store';
import { getToken } from '@/lib/auth-store';
import { mobileApiFetch } from '@/lib/api-client';
import { useOutlet } from '@/lib/outlet-store';
import { calculateHaversineDistance, forwardGeocodeAddress } from '@/lib/location-service';

interface DeliveryQuoteResult {
  isDeliverable: boolean;
  distanceKm: number;
  deliveryFee: number;
  maxDistanceKm: number;
  tierId?: number | null;
  outletName?: string;
  message?: string;
}

interface PaymentMethodOption {
  id: number;
  code: string;
  displayName: string;
  provider?: string;
}

interface ActiveVoucherOption {
  id: number;
  code: string;
  name: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minPurchase?: number;
}

export default function CheckoutScreen() {
  const router = useRouter();
  const { items, totalAmount, clearCart } = useCart();
  const { selectedOutlet, selectedAddress, setSelectedAddress } = useOutlet();

  const [fulfillmentType, setFulfillmentType] = useState<'pickup' | 'delivery'>('pickup');
  const [deliveryAddress, setDeliveryAddress] = useState<string>(
    selectedAddress?.addressText || ''
  );
  const [courierNotes, setCourierNotes] = useState<string>('');
  const [deliveryTime, setDeliveryTime] = useState<string>('Kirim Secepatnya (15-30 Menit)');

  // Query customer saved addresses
  const { data: savedAddresses, isLoading: isLoadingAddresses } = useQuery({
    queryKey: ['saved-addresses'],
    queryFn: async () => {
      try {
        const res = await mobileApiFetch<{ data: any[] }>('/api/customers/me/addresses');
        return Array.isArray(res?.data) ? res.data : [];
      } catch {
        return [];
      }
    },
  });

  // Auto-sync deliveryAddress with selectedAddress
  useEffect(() => {
    if (selectedAddress?.addressText) {
      setDeliveryAddress(selectedAddress.addressText);
    }
  }, [selectedAddress]);

  // If selectedAddress is empty/default and savedAddresses exists, auto-select the first saved address
  useEffect(() => {
    if (
      savedAddresses &&
      savedAddresses.length > 0 &&
      (!selectedAddress || (!selectedAddress.id && !selectedAddress.isGps && !selectedAddress.addressText))
    ) {
      const first = savedAddresses[0];
      setSelectedAddress({
        id: first.id,
        label: first.label || 'Rumah',
        addressText: first.addressText,
        recipientName: first.recipientName,
        recipientPhone: first.recipientPhone,
        isGps: false,
        latitude: first.latitude ? Number(first.latitude) : undefined,
        longitude: first.longitude ? Number(first.longitude) : undefined,
      });
    }
  }, [savedAddresses, selectedAddress]);

  // Auto-resolve missing coordinates for legacy saved addresses with null latitude/longitude
  useEffect(() => {
    let isMounted = true;
    async function resolveCoordsIfNeeded() {
      if (
        selectedAddress?.addressText &&
        (selectedAddress.latitude === undefined ||
          selectedAddress.latitude === null ||
          selectedAddress.longitude === undefined ||
          selectedAddress.longitude === null)
      ) {
        try {
          const resolved = await forwardGeocodeAddress(selectedAddress.addressText);
          if (resolved && isMounted) {
            setSelectedAddress({
              ...selectedAddress,
              latitude: resolved.latitude,
              longitude: resolved.longitude,
            });
          }
        } catch (e) {
          console.warn('[checkout] Auto-resolve coords error:', e);
        }
      }
    }
    resolveCoordsIfNeeded();
    return () => {
      isMounted = false;
    };
  }, [selectedAddress]);

  // Voucher states
  const [voucherCodeInput, setVoucherCodeInput] = useState<string>('');
  const [appliedVoucher, setAppliedVoucher] = useState<{
    code: string;
    discount: number;
    name?: string;
  } | null>(null);
  const [voucherError, setVoucherError] = useState<string | null>(null);
  const [validatingVoucher, setValidatingVoucher] = useState<boolean>(false);

  // Selected Payment Method ID
  const [selectedPaymentId, setSelectedPaymentId] = useState<number>(1);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // PIN Modal Verification State
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [pinError, setPinError] = useState<string | null>(null);
  const pinInputRefs = useRef<(TextInput | null)[]>([]);

  // Delivery Quote & Coordinates
  const outletLat = selectedOutlet?.latitude ?? -6.9175;
  const outletLng = selectedOutlet?.longitude ?? 107.6191;
  const targetLat = selectedAddress?.latitude ?? -6.8722;
  const targetLng = selectedAddress?.longitude ?? 107.5420;
  const outletId = selectedOutlet?.id || 1;

  // Immediate Client-Side Haversine Distance (km)
  const clientDistanceKm = calculateHaversineDistance(
    targetLat,
    targetLng,
    outletLat,
    outletLng
  );

  const hasAddresses = Boolean(
    (savedAddresses && savedAddresses.length > 0) ||
      (selectedAddress && (selectedAddress.addressText || selectedAddress.isGps || selectedAddress.id))
  );

  const hasValidDeliveryAddress =
    fulfillmentType === 'pickup' ||
    Boolean(hasAddresses && (selectedAddress?.addressText || deliveryAddress.trim()));

  const { data: deliveryQuote, isLoading: isLoadingDeliveryQuote } = useQuery<DeliveryQuoteResult>({
    queryKey: ['delivery-quote', outletId, targetLat, targetLng],
    queryFn: async () => {
      try {
        return await mobileApiFetch<DeliveryQuoteResult>(
          `/api/delivery/calculate?outletId=${outletId}&latitude=${targetLat}&longitude=${targetLng}`
        );
      } catch (err: any) {
        const isDeliverableFallback = clientDistanceKm <= 10;
        const feeFallback = clientDistanceKm <= 5 ? 10000 : 15000;
        return {
          isDeliverable: isDeliverableFallback,
          distanceKm: clientDistanceKm,
          deliveryFee: isDeliverableFallback ? feeFallback : 0,
          maxDistanceKm: 10,
          outletName: selectedOutlet?.name || 'ER Coffee Lab',
          message: isDeliverableFallback
            ? `Ongkos kirim (${clientDistanceKm} km): Rp ${feeFallback.toLocaleString('id-ID')}`
            : `Alamat di luar jangkauan (Jarak: ${clientDistanceKm} km, Maksimal: 10 km)`,
        };
      }
    },
    enabled: fulfillmentType === 'delivery',
  });

  const isDeliverable =
    fulfillmentType === 'delivery'
      ? (deliveryQuote ? deliveryQuote.isDeliverable : true) && hasValidDeliveryAddress
      : true;
  const deliveryFee =
    fulfillmentType === 'delivery'
      ? deliveryQuote
        ? deliveryQuote.deliveryFee
        : 10000
      : 0;
  const serviceFee = items.length > 0 ? 2000 : 0;
  const discountAmount = appliedVoucher ? appliedVoucher.discount : 0;
  const grandTotal = Math.max(0, totalAmount - discountAmount + serviceFee + (isDeliverable ? deliveryFee : 0));

  // Fetch active payment methods from API
  const { data: paymentMethodsData } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      try {
        const res = await mobileApiFetch<{ data: PaymentMethodOption[] }>(
          '/api/payment-methods'
        );
        return res.data;
      } catch {
        return [
          { id: 1, code: 'qris', displayName: 'Midtrans QRIS / GoPay / ShopeePay' },
          { id: 2, code: 'bank_transfer', displayName: 'Midtrans Virtual Account' },
        ];
      }
    },
  });

  const rawMethods = paymentMethodsData && paymentMethodsData.length > 0
    ? paymentMethodsData
    : [
        { id: 1, code: 'qris', displayName: 'Midtrans QRIS / GoPay / ShopeePay' },
        { id: 2, code: 'bank_transfer', displayName: 'Midtrans Virtual Account' },
      ];

  const paymentMethods = rawMethods.filter((pm) => {
    const c = (pm.code || '').toLowerCase();
    const d = (pm.displayName || '').toLowerCase();
    return !c.includes('cash') && !c.includes('tunai') && !d.includes('cash') && !d.includes('tunai');
  });

  // Fetch active vouchers from API
  const { data: activeVouchersData } = useQuery({
    queryKey: ['vouchers-active'],
    queryFn: async () => {
      try {
        const res = await mobileApiFetch<{ data: ActiveVoucherOption[] }>(
          '/api/vouchers/active'
        );
        return res.data;
      } catch {
        return [
          {
            id: 1,
            code: 'DISKON25',
            name: 'Soft Launch Promo 25%',
            discountType: 'percent',
            discountValue: 25,
          },
        ];
      }
    },
  });

  const activeVouchers = activeVouchersData || [];

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(main)/cart' as any);
    }
  };

  const handleApplyVoucher = async (codeToTest?: string) => {
    const code = (codeToTest || voucherCodeInput).trim();
    setVoucherError(null);

    if (!code) {
      setVoucherError('Masukkan kode voucher.');
      return;
    }

    setValidatingVoucher(true);
    try {
      const res = await mobileApiFetch<{
        valid: boolean;
        discount?: number;
        reason?: string;
        voucherName?: string;
      }>('/api/vouchers/validate', {
        method: 'POST',
        body: JSON.stringify({
          code: code,
          subtotal: totalAmount,
        }),
      });

      if (res.valid && typeof res.discount === 'number') {
        setAppliedVoucher({
          code: code,
          discount: res.discount,
          name: res.voucherName || code,
        });
        setVoucherCodeInput(code);
      } else {
        setVoucherError(res.reason || 'Kode voucher tidak berlaku.');
        setAppliedVoucher(null);
      }
    } catch (err: any) {
      setVoucherError(err.message || 'Gagal memvalidasi kode voucher.');
      setAppliedVoucher(null);
    } finally {
      setValidatingVoucher(false);
    }
  };

  // Open PIN verification modal before checkout
  const handleOpenPinModal = async () => {
    setErrorMessage(null);
    setPinError(null);
    setPinDigits(['', '', '', '', '', '']);

    // Verify User Login Token
    const token = await getToken();
    if (!token) {
      router.push('/(auth)/login' as any);
      return;
    }

    if (items.length === 0) {
      setErrorMessage('Keranjang belanja kosong.');
      return;
    }

    if (fulfillmentType === 'delivery') {
      if (!hasValidDeliveryAddress || !deliveryAddress.trim()) {
        setErrorMessage('Silakan pilih atau tambahkan alamat pengiriman terlebih dahulu.');
        return;
      }

      if (deliveryQuote && !deliveryQuote.isDeliverable) {
        setErrorMessage(
          deliveryQuote.message || 'Alamat pengiriman di luar jangkauan cabang yang dipilih.'
        );
        return;
      }
    }

    setShowPinModal(true);
  };

  // Process payment with verified PIN
  const handleConfirmPinAndPay = async () => {
    const enteredPin = pinDigits.join('');
    if (enteredPin.length !== 6) {
      setPinError('PIN keamanan harus diisi 6 digit angka.');
      return;
    }

    setSubmitting(true);
    setPinError(null);

    try {
      // Format items payload for POST /api/orders
      const payloadItems = items.map((i) => ({
        productId: String(i.productId),
        qty: i.quantity,
        temperature: i.temperature,
        ice: i.iceLevel,
        sugar: i.sugarLevel,
        addons: i.addons.map((a) => ({ name: a.name, price: a.price })),
      }));

      const fullDeliveryAddress = courierNotes.trim()
        ? `${deliveryAddress.trim()} (Catatan: ${courierNotes.trim()})`
        : deliveryAddress.trim();

      // 1. Create Order POST /api/orders with PIN verification and distance coordinates
      const orderRes = await mobileApiFetch<{
        id: number;
        orderNumber: string;
        total: number;
      }>('/api/orders', {
        method: 'POST',
        body: JSON.stringify({
          pin: enteredPin,
          outletId: outletId,
          fulfillmentType: fulfillmentType,
          deliveryAddress: fulfillmentType === 'delivery' ? fullDeliveryAddress : undefined,
          deliveryLatitude: fulfillmentType === 'delivery' ? targetLat : undefined,
          deliveryLongitude: fulfillmentType === 'delivery' ? targetLng : undefined,
          paymentMethodId: selectedPaymentId,
          voucherCode: appliedVoucher ? appliedVoucher.code : undefined,
          items: payloadItems,
        }),
      });

      const orderId = orderRes.id;

      // 2. Request Midtrans Snap Transaction POST /api/payments/midtrans/charge
      const chargeRes = await mobileApiFetch<{
        snapToken: string;
        redirectUrl: string;
      }>('/api/payments/midtrans/charge', {
        method: 'POST',
        body: JSON.stringify({
          orderId: orderId,
        }),
      });

      // Clear local cart
      clearCart();
      setShowPinModal(false);

      // 3. Open Payment WebView Modal
      router.push({
        pathname: '/modal/payment-webview' as any,
        params: {
          orderId: String(orderId),
          orderNumber: orderRes.orderNumber,
          snapToken: chargeRes.snapToken,
          redirectUrl: chargeRes.redirectUrl,
        },
      });
    } catch (err: any) {
      setPinError(err.message || 'Gagal memproses pesanan.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={handleBack} style={styles.backIconButton} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#181F4B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Checkout Pesanan</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
        {/* Fulfillment Type Toggle Tabs (Pickup vs Delivery) */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Metode Pengambilan Pesanan</Text>

          <View style={styles.fulfillmentTabBg}>
            <TouchableOpacity
              style={[
                styles.fulfillmentTab,
                fulfillmentType === 'pickup' && styles.fulfillmentTabActive,
              ]}
              onPress={() => setFulfillmentType('pickup')}
              activeOpacity={0.8}
            >
              <ShoppingBag
                size={16}
                color={fulfillmentType === 'pickup' ? '#C9A876' : '#6B7088'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.fulfillmentTabText,
                  fulfillmentType === 'pickup' && styles.fulfillmentTabTextActive,
                ]}
              >
                Pick Up di Outlet
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.fulfillmentTab,
                fulfillmentType === 'delivery' && styles.fulfillmentTabActive,
              ]}
              onPress={() => setFulfillmentType('delivery')}
              activeOpacity={0.8}
            >
              <Truck
                size={16}
                color={fulfillmentType === 'delivery' ? '#C9A876' : '#6B7088'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.fulfillmentTabText,
                  fulfillmentType === 'delivery' && styles.fulfillmentTabTextActive,
                ]}
              >
                Delivery (Kurir)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Delivery Address Form if Delivery Mode */}
          {fulfillmentType === 'delivery' ? (
            <View style={styles.deliveryFormBox}>
              <View style={styles.deliveryAddressHeader}>
                <MapPin size={18} color="#181F4B" style={{ marginRight: 8 }} />
                <Text style={styles.deliveryAddressTitle}>Alamat Pengiriman</Text>
              </View>

              {isLoadingAddresses ? (
                <View style={styles.addressLoadingBox}>
                  <ActivityIndicator size="small" color="#181F4B" style={{ marginRight: 8 }} />
                  <Text style={styles.addressLoadingText}>Memuat alamat...</Text>
                </View>
              ) : hasAddresses ? (
                <View style={styles.selectedAddressCard}>
                  <View style={styles.selectedAddressHeaderRow}>
                    <View style={styles.addressBadge}>
                      {selectedAddress?.label?.toLowerCase() === 'kantor' ? (
                        <Briefcase size={12} color="#C9A876" style={{ marginRight: 5 }} />
                      ) : selectedAddress?.isGps ? (
                        <Navigation size={12} color="#C9A876" style={{ marginRight: 5 }} />
                      ) : (
                        <Home size={12} color="#C9A876" style={{ marginRight: 5 }} />
                      )}
                      <Text style={styles.addressBadgeText}>
                        {selectedAddress?.label || 'Alamat Terpilih'}
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={styles.changeAddressBtn}
                      onPress={() => router.push('/modal/address-picker' as any)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.changeAddressBtnText}>Ganti Alamat</Text>
                      <ChevronRight size={14} color="#181F4B" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.selectedAddressText} numberOfLines={2}>
                    {selectedAddress?.addressText || deliveryAddress}
                  </Text>

                  {(selectedAddress?.recipientName || selectedAddress?.recipientPhone) && (
                    <Text style={styles.recipientInfoText}>
                      Penerima: {selectedAddress.recipientName || 'Pelanggan'}{' '}
                      {selectedAddress.recipientPhone ? `(${selectedAddress.recipientPhone})` : ''}
                    </Text>
                  )}

                  <View style={styles.courierNotesBox}>
                    <TextInput
                      style={styles.courierNotesInput}
                      value={courierNotes}
                      onChangeText={setCourierNotes}
                      placeholder="Catatan kurir (opsional: no rumah, patokan, titip satpam)..."
                      placeholderTextColor="#9AA0A6"
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.emptyAddressCard}>
                  <View style={styles.emptyAddressIconCircle}>
                    <MapPin size={22} color="#C9A876" />
                  </View>
                  <Text style={styles.emptyAddressTitle}>Belum Ada Alamat Pengiriman</Text>
                  <Text style={styles.emptyAddressSubtitle}>
                    Tambahkan alamat tujuan pengiriman kamu untuk menghitung estimasi jarak & ongkir secara akurat.
                  </Text>
                  <TouchableOpacity
                    style={styles.addAddressPrimaryBtn}
                    onPress={() =>
                      router.push({
                        pathname: '/profile/add-address' as any,
                        params: { fromCheckout: 'true' },
                      })
                    }
                    activeOpacity={0.85}
                  >
                    <Plus size={16} color="#181F4B" style={{ marginRight: 6 }} />
                    <Text style={styles.addAddressPrimaryBtnText}>Tambah Alamat Baru</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* Real-time Distance & Fee Quote Badges */}
              {isLoadingDeliveryQuote ? (
                <View style={styles.quoteLoadingBox}>
                  <ActivityIndicator size="small" color="#C9A876" style={{ marginRight: 8 }} />
                  <Text style={styles.quoteLoadingText}>Menghitung estimasi jarak & ongkir...</Text>
                </View>
              ) : deliveryQuote ? (
                deliveryQuote.isDeliverable ? (
                  <View style={styles.quoteSuccessBadge}>
                    <View style={styles.quoteIconCircle}>
                      <Navigation size={13} color="#C9A876" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.quoteSuccessDistance}>
                        Jarak ke {deliveryQuote.outletName || selectedOutlet?.name || 'Outlet'}: {deliveryQuote.distanceKm} km
                      </Text>
                      <Text style={styles.quoteSuccessFee}>
                        Ongkir: {formatRupiah(deliveryQuote.deliveryFee)}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={styles.quoteErrorCard}>
                    <AlertCircle size={18} color="#C9576B" style={{ marginRight: 8 }} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.quoteErrorTitle}>
                        Di Luar Jangkauan ({deliveryQuote.distanceKm} km)
                      </Text>
                      <Text style={styles.quoteErrorDesc}>
                        {deliveryQuote.message ||
                          `Maksimal jangkauan delivery cabang ini adalah ${deliveryQuote.maxDistanceKm} km.`}
                      </Text>
                    </View>
                  </View>
                )
              ) : null}

              <View style={styles.deliveryTimeRow}>
                <Clock size={14} color="#6B7088" style={{ marginRight: 6 }} />
                <Text style={styles.deliveryTimeText}>{deliveryTime}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.outletLocationBox}>
              <View style={styles.outletLocationHeader}>
                <MapPin size={18} color="#C9A876" style={{ marginRight: 8 }} />
                <Text style={styles.outletLocationTitle}>
                  {selectedOutlet?.name || 'ER Coffee Lab Bandung'}
                </Text>
              </View>
              <Text style={styles.outletLocationAddress}>
                {selectedOutlet?.address || 'Jl. Soekarno Hatta No. 45, Bandung (Store Siap Dipickup)'}
              </Text>
            </View>
          )}
        </View>

        {/* Ordered Items Summary List */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Daftar Pesanan ({items.length} Menu)</Text>

          {items.map((item) => (
            <View key={item.cartId} style={styles.orderItemRow}>
              <View style={styles.orderItemInfo}>
                <Text style={styles.orderItemTitle}>
                  {item.quantity}x {item.name}
                </Text>
                <Text style={styles.orderItemSub}>
                  {item.temperature} • {item.sugarLevel} • {item.iceLevel}
                  {item.addons.length > 0
                    ? ` • +${item.addons.map((a) => a.name).join(', ')}`
                    : ''}
                </Text>
              </View>
              <Text style={styles.orderItemPrice}>{formatRupiah(item.subtotal)}</Text>
            </View>
          ))}
        </View>

        {/* Voucher & Promo Code Section */}
        <View style={styles.sectionCard}>
          <View style={styles.voucherHeaderRow}>
            <Ticket size={18} color="#C9A876" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitleNoMargin}>Voucher / Kode Promo</Text>
          </View>

          <View style={styles.voucherInputRow}>
            <TextInput
              style={styles.voucherInput}
              value={voucherCodeInput}
              onChangeText={(val) => {
                setVoucherCodeInput(val);
                setVoucherError(null);
              }}
              placeholder="Masukkan kode promo (contoh: DISKON25)"
              placeholderTextColor="#9AA0A6"
              autoCapitalize="characters"
            />

            <TouchableOpacity
              style={styles.applyVoucherButton}
              onPress={() => handleApplyVoucher()}
              disabled={validatingVoucher}
              activeOpacity={0.8}
            >
              {validatingVoucher ? (
                <ActivityIndicator size="small" color="#181F4B" />
              ) : (
                <Text style={styles.applyVoucherText}>Gunakan</Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Quick Active Voucher Options Pills */}
          {activeVouchers.length > 0 && !appliedVoucher ? (
            <View style={styles.activeVouchersPillsRow}>
              <Text style={styles.activeVouchersLabel}>Promo Tersedia: </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {activeVouchers.map((v) => (
                  <TouchableOpacity
                    key={v.id}
                    style={styles.voucherPillChip}
                    onPress={() => handleApplyVoucher(v.code)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.voucherPillText}>{v.code}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          ) : null}

          {/* Applied Voucher Success Badge */}
          {appliedVoucher ? (
            <View style={styles.appliedVoucherBadge}>
              <View style={{ flex: 1 }}>
                <Text style={styles.appliedVoucherTitle}>
                  Voucher Berhasil Dipasang ({appliedVoucher.code})
                </Text>

                <Text style={styles.appliedVoucherValue}>
                  Hemat -{formatRupiah(appliedVoucher.discount)}
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => {
                  setAppliedVoucher(null);
                  setVoucherCodeInput('');
                }}
                style={styles.removeVoucherButton}
              >
                <Text style={styles.removeVoucherText}>Batal</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {voucherError ? (
            <View style={styles.voucherErrorRow}>
              <AlertCircle size={14} color="#C9576B" style={{ marginRight: 4 }} />
              <Text style={styles.voucherErrorText}>{voucherError}</Text>
            </View>
          ) : null}
        </View>

        {/* Payment Method Selector Section */}
        <View style={styles.sectionCard}>
          <View style={styles.voucherHeaderRow}>
            <CreditCard size={18} color="#181F4B" style={{ marginRight: 8 }} />
            <Text style={styles.sectionTitleNoMargin}>Metode Pembayaran</Text>
          </View>

          <View style={styles.paymentMethodsList}>
            {paymentMethods.map((pm) => {
              const isSelected = selectedPaymentId === pm.id;
              return (
                <TouchableOpacity
                  key={pm.id}
                  style={[
                    styles.paymentMethodOptionCard,
                    isSelected && styles.paymentMethodOptionCardSelected,
                  ]}
                  onPress={() => setSelectedPaymentId(pm.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.radioCircle}>
                    {isSelected && <View style={styles.radioDot} />}
                  </View>

                  <Text style={styles.paymentMethodName}>{pm.displayName}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Cost Summary Breakdown Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Rincian Biaya</Text>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal Produk</Text>

            <Text style={styles.summaryValue}>{formatRupiah(totalAmount)}</Text>
          </View>

          {serviceFee > 0 && (
            <View style={[styles.summaryRow, { marginTop: 8 }]}>
              <Text style={styles.summaryLabel}>Biaya Layanan</Text>
              <Text style={styles.summaryValue}>{formatRupiah(serviceFee)}</Text>
            </View>
          )}

          {fulfillmentType === 'delivery' && (
            <View style={[styles.summaryRow, { marginTop: 8 }]}>
              <View>
                <Text style={styles.summaryLabel}>Biaya Ongkos Kirim</Text>
                {deliveryQuote && (
                  <Text style={styles.summarySubLabel}>
                    {deliveryQuote.isDeliverable
                      ? `Jarak ${deliveryQuote.distanceKm} km`
                      : 'Di luar radius'}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.summaryValue,
                  !isDeliverable && { color: '#C9576B', fontFamily: 'SourceSans3_700Bold' },
                ]}
              >
                {isDeliverable ? formatRupiah(deliveryFee) : 'Tidak Tersedia'}
              </Text>
            </View>
          )}

          {appliedVoucher && (
            <View style={[styles.summaryRow, { marginTop: 8 }]}>
              <Text style={styles.summaryLabel}>Diskon Voucher Promo</Text>
              <Text style={styles.summaryDiscountValue}>-{formatRupiah(discountAmount)}</Text>
            </View>
          )}

          <View style={styles.divider} />

          <View style={styles.summaryRow}>
            <Text style={styles.grandTotalLabel}>Total Bayar</Text>
            <Text style={styles.grandTotalValue}>{formatRupiah(grandTotal)}</Text>
          </View>
        </View>

        {/* Global Error Banner */}
        {errorMessage ? (
          <View style={styles.errorBanner}>
            <AlertCircle size={16} color="#C9576B" style={{ marginRight: 8 }} />
            <Text style={styles.errorBannerText}>{errorMessage}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky Bottom Footer Pay Action */}
      <View style={styles.bottomFooter}>
        <View style={styles.footerPriceInfo}>
          <Text style={styles.footerPriceLabel}>Total Pembayaran</Text>
          <Text style={styles.footerPriceValue}>{formatRupiah(grandTotal)}</Text>
        </View>

        <TouchableOpacity
          style={[
            styles.payNowButton,
            (!isDeliverable || submitting) && styles.payNowButtonDisabled,
          ]}
          onPress={handleOpenPinModal}
          disabled={!isDeliverable || submitting}
          activeOpacity={0.85}
        >
          <ShieldCheck
            size={18}
            color={!isDeliverable ? '#9AA0A6' : '#181F4B'}
            style={{ marginRight: 6 }}
          />
          <Text style={[styles.payNowText, !isDeliverable && styles.payNowTextDisabled]}>
            {fulfillmentType === 'delivery' && !hasValidDeliveryAddress
              ? 'Pilih Alamat Pengiriman'
              : !isDeliverable
              ? 'Di Luar Jangkauan'
              : 'Proses Pembayaran'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* PIN Verification Modal */}
      <Modal
        visible={showPinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPinModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.pinModalBox}>
            <View style={styles.pinHeaderRow}>
              <View style={styles.shieldCircle}>
                <ShieldCheck size={28} color="#C9A876" />
              </View>
              <TouchableOpacity
                onPress={() => setShowPinModal(false)}
                style={styles.closePinModalButton}
                disabled={submitting}
              >
                <X size={20} color="#181F4B" />
              </TouchableOpacity>
            </View>

            <Text style={styles.pinModalTitle}>Konfirmasi PIN Keamanan</Text>
            <Text style={styles.pinModalDesc}>
              Masukkan 6 digit PIN keamanan akun kamu untuk menyetujui transaksi pembelian ini.
            </Text>

            {/* 6 PIN Digit Input Boxes */}
            <View style={styles.pinBoxRow}>
              {pinDigits.map((digit, idx) => (
                <TextInput
                  key={idx}
                  ref={(el) => {
                    pinInputRefs.current[idx] = el;
                  }}
                  style={[styles.pinDigitInput, digit ? styles.pinDigitFilled : null]}
                  keyboardType="number-pad"
                  maxLength={6}
                  secureTextEntry
                  value={digit}
                  onChangeText={(val) => {
                    setPinError(null);
                    const clean = val.replace(/[^0-9]/g, '');
                    const updated = [...pinDigits];

                    if (clean.length > 1) {
                      const pasted = clean.slice(0, 6).split('');
                      for (let i = 0; i < 6; i++) {
                        updated[i] = pasted[i] || '';
                      }
                      setPinDigits(updated);
                      return;
                    }

                    updated[idx] = clean;
                    setPinDigits(updated);

                    if (clean && idx < 5) {
                      pinInputRefs.current[idx + 1]?.focus();
                    }
                  }}
                  onKeyPress={({ nativeEvent }) => {
                    if (nativeEvent.key === 'Backspace' && !pinDigits[idx] && idx > 0) {
                      pinInputRefs.current[idx - 1]?.focus();
                    }
                  }}
                  selectTextOnFocus
                />
              ))}
            </View>

            {pinError ? (
              <View style={styles.pinErrorBox}>
                <AlertCircle size={14} color="#C9576B" style={{ marginRight: 6 }} />
                <Text style={styles.pinErrorText}>{pinError}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[
                styles.confirmPayButton,
                pinDigits.join('').length === 6 && !submitting
                  ? styles.confirmPayActive
                  : styles.confirmPayDisabled,
              ]}
              onPress={handleConfirmPinAndPay}
              disabled={pinDigits.join('').length !== 6 || submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator color="#181F4B" size="small" />
              ) : (
                <Text
                  style={[
                    styles.confirmPayText,
                    pinDigits.join('').length === 6 ? styles.confirmPayTextActive : null,
                  ]}
                >
                  Konfirmasi & Bayar
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  scrollList: {
    padding: 20,
    paddingBottom: 110,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
  },
  sectionTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 15,
    color: '#181F4B',
    marginBottom: 12,
  },
  sectionTitleNoMargin: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 15,
    color: '#181F4B',
  },
  fulfillmentTabBg: {
    flexDirection: 'row',
    backgroundColor: '#F4F5F9',
    borderRadius: 14,
    padding: 4,
  },
  fulfillmentTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  fulfillmentTabActive: {
    backgroundColor: '#181F4B',
  },
  fulfillmentTabText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#6B7088',
  },
  fulfillmentTabTextActive: {
    color: '#C9A876',
  },
  deliveryFormBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F4F5F9',
  },
  deliveryAddressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  deliveryAddressTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 14,
    color: '#181F4B',
  },
  addressLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F5F9',
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  addressLoadingText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#6B7088',
  },
  selectedAddressCard: {
    backgroundColor: '#FAF7F0',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E7DEC8',
    padding: 14,
    marginBottom: 8,
  },
  selectedAddressHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  addressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181F4B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addressBadgeText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 11,
    color: '#C9A876',
  },
  changeAddressBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7DEC8',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  changeAddressBtnText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11,
    color: '#181F4B',
    marginRight: 2,
  },
  selectedAddressText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#181F4B',
    lineHeight: 18,
  },
  recipientInfoText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#6B7088',
    marginTop: 4,
  },
  courierNotesBox: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E7DEC8',
    paddingTop: 8,
  },
  courierNotesInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E7DEC8',
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#181F4B',
  },
  emptyAddressCard: {
    backgroundColor: '#FAF7F0',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E7DEC8',
    padding: 16,
    alignItems: 'center',
    marginBottom: 8,
  },
  emptyAddressIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7DEC8',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyAddressTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 14,
    color: '#181F4B',
    marginBottom: 4,
  },
  emptyAddressSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#6B7088',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 12,
    paddingHorizontal: 12,
  },
  addAddressPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C9A876',
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  addAddressPrimaryBtnText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 13,
    color: '#181F4B',
  },
  quoteLoadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FAF7F0',
    padding: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  quoteLoadingText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#6B7088',
  },
  quoteSuccessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3EFE6',
    borderWidth: 1,
    borderColor: '#E7DEC8',
    padding: 10,
    borderRadius: 12,
    marginTop: 10,
  },
  quoteIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#181F4B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  quoteSuccessDistance: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 12,
    color: '#181F4B',
  },
  quoteSuccessFee: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#9E7B4F',
    marginTop: 1,
  },
  quoteErrorCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FDF0F2',
    borderWidth: 1,
    borderColor: '#FAD4DB',
    padding: 12,
    borderRadius: 12,
    marginTop: 10,
  },
  quoteErrorTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 13,
    color: '#C9576B',
  },
  quoteErrorDesc: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#C9576B',
    marginTop: 2,
    lineHeight: 16,
  },
  deliveryTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  deliveryTimeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#181F4B',
  },
  outletLocationBox: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F4F5F9',
  },
  outletLocationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  outletLocationTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 14,
    color: '#181F4B',
  },
  outletLocationAddress: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#6B7088',
    marginTop: 2,
  },
  orderItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F5F9',
  },
  orderItemInfo: {
    flex: 1,
    marginRight: 10,
  },
  orderItemTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 14,
    color: '#181F4B',
  },
  orderItemSub: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#6B7088',
    marginTop: 2,
  },
  orderItemPrice: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 14,
    color: '#181F4B',
  },
  voucherHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  voucherInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voucherInput: {
    flex: 1,
    backgroundColor: '#F4F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 13,
    color: '#181F4B',
    borderWidth: 1,
    borderColor: '#E7E8F0',
    marginRight: 8,
  },
  applyVoucherButton: {
    backgroundColor: '#C9A876',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
  },
  applyVoucherText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 13,
    color: '#181F4B',
  },
  activeVouchersPillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  activeVouchersLabel: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11,
    color: '#6B7088',
    marginRight: 6,
  },
  voucherPillChip: {
    backgroundColor: '#FEF6E6',
    borderWidth: 1,
    borderColor: '#F7E5C4',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 6,
  },
  voucherPillText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 11,
    color: '#181F4B',
  },
  appliedVoucherBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF5EE',
    borderWidth: 1,
    borderColor: '#C6E5D0',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  appliedVoucherTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 13,
    color: '#181F4B',
  },
  appliedVoucherValue: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 12,
    color: '#3E8A5A',
    marginTop: 2,
  },
  removeVoucherButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
  },
  removeVoucherText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11,
    color: '#C9576B',
  },
  voucherErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  voucherErrorText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#C9576B',
  },
  paymentMethodsList: {
    marginTop: 4,
  },
  paymentMethodOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F5F9',
    borderWidth: 1,
    borderColor: '#E7E8F0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  paymentMethodOptionCardSelected: {
    borderColor: '#181F4B',
    backgroundColor: '#FEF6E6',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    borderColor: '#181F4B',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#181F4B',
  },
  paymentMethodName: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#181F4B',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#6B7088',
  },
  summarySubLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#9E7B4F',
    marginTop: 2,
  },
  summaryValue: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#181F4B',
  },
  summaryDiscountValue: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 13,
    color: '#3E8A5A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F4F5F9',
    marginVertical: 12,
  },
  grandTotalLabel: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 15,
    color: '#181F4B',
  },
  grandTotalValue: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 17,
    color: '#181F4B',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF0F2',
    borderWidth: 1,
    borderColor: '#FAD4DB',
    padding: 12,
    borderRadius: 14,
    marginBottom: 16,
  },
  errorBannerText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#C9576B',
    flex: 1,
  },
  bottomFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F4F5F9',
  },
  footerPriceInfo: {},
  footerPriceLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#6B7088',
  },
  footerPriceValue: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 18,
    color: '#181F4B',
  },
  payNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C9A876',
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 24,
  },
  payNowButtonDisabled: {
    backgroundColor: '#E7E8F0',
  },
  payNowText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 14,
    color: '#181F4B',
  },
  payNowTextDisabled: {
    color: '#9AA0A6',
  },

  // Modal PIN Verification Styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(24, 31, 75, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  pinModalBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 8,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 10px 25px rgba(24, 31, 75, 0.25)' }
      : {
          shadowColor: '#181F4B',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.25,
          shadowRadius: 20,
        }),
  },
  pinHeaderRow: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    marginBottom: 16,
  },
  shieldCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#181F4B',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginHorizontal: 'auto',
  },
  closePinModalButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinModalTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 18,
    color: '#181F4B',
    marginBottom: 6,
    textAlign: 'center',
  },
  pinModalDesc: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#6B7088',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  pinBoxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 16,
  },
  pinDigitInput: {
    width: 44,
    height: 52,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2.5,
    borderBottomColor: '#9AA0A6',
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: '#181F4B',
    fontFamily: 'AlbertSans_700Bold',
  },
  pinDigitFilled: {
    borderBottomColor: '#181F4B',
  },
  pinErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF0F2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 16,
    width: '100%',
  },
  pinErrorText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#C9576B',
    flex: 1,
  },
  confirmPayButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  confirmPayActive: {
    backgroundColor: '#C9A876',
  },
  confirmPayDisabled: {
    backgroundColor: '#E1E3EE',
  },
  confirmPayText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 15,
    color: '#9AA0A6',
  },
  confirmPayTextActive: {
    color: '#181F4B',
  },
});
