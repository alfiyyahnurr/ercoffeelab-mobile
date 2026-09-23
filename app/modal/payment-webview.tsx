import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  ScrollView,
  Image,
  Alert,
  AppState,
  AppStateStatus,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import * as Clipboard from 'expo-clipboard';
import { WebView } from 'react-native-webview';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  Copy,
  ExternalLink,
  QrCode,
  Building2,
  Smartphone,
  Check,
  AlertCircle,
} from 'lucide-react-native';
import { mobileApiFetch } from '@/lib/api-client';
import { useCart } from '@/lib/cart-store';

export default function PaymentWebViewModal() {
  const router = useRouter();
  const { clearCart } = useCart();
  const params = useLocalSearchParams<{
    draftId?: string;
    orderId?: string;
    orderNumber?: string;
    attemptId?: string;
    paymentType?: string;
    snapToken?: string;
    redirectUrl?: string;
    deeplinkUrl?: string;
    qrUrl?: string;
    qrString?: string;
    vaNumber?: string;
    bankName?: string;
    billerCode?: string;
    billKey?: string;
    expiryTime?: string;
  }>();

  const draftId = params.draftId || '';
  const orderId = params.orderId || '';
  const orderNumber = params.orderNumber || '';
  const attemptId = params.attemptId || '';
  const paymentType = (params.paymentType || '').toLowerCase();
  const redirectUrl =
    params.redirectUrl ||
    (params.snapToken
      ? 'https://app.sandbox.midtrans.com/snap/v2/vtweb/' + params.snapToken
      : '');
  const deeplinkUrl = params.deeplinkUrl || '';
  const vaNumber = params.vaNumber || params.billKey || '';
  const bankName = params.bankName || 'BCA';
  const qrUrl = params.qrUrl || '';

  const [loading, setLoading] = useState<boolean>(true);
  const [simulating, setSimulating] = useState<boolean>(false);
  const [checking, setChecking] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const isEWallet = paymentType === 'gopay' || paymentType === 'shopeepay';
  const isVa = paymentType === 'bank_transfer' || paymentType === 'echannel' || Boolean(vaNumber);
  const isQr = paymentType === 'qris' || Boolean(qrUrl);

  const targetSimulatorUrl =
    deeplinkUrl ||
    redirectUrl ||
    (params.snapToken
      ? 'https://app.sandbox.midtrans.com/snap/v2/vtweb/' + params.snapToken
      : '');

  const [activeTab, setActiveTab] = useState<'details' | 'webview'>('details');

  // Auto-polling & AppState listener to automatically detect payment settlement
  useEffect(() => {
    let isMounted = true;
    let pollTimer: any = null;

    const performSilentCheck = async () => {
      if (!orderNumber && !orderId) return;
      try {
        const res = await mobileApiFetch<{
          status: string;
          paid: boolean;
          orderId?: number | string;
          orderNumber?: string;
        }>('/api/payments/midtrans/check-status', {
          method: 'POST',
          body: JSON.stringify({
            orderId: orderId || undefined,
            orderNumber: orderNumber || undefined,
            attemptId: attemptId || undefined,
          }),
        });

        if (isMounted && res.paid && res.orderId) {
          clearCart();
          if (pollTimer) clearInterval(pollTimer);
          router.replace(`/(main)/orders/${res.orderId}` as any);
        } else if (isMounted && res.paid) {
          clearCart();
          if (pollTimer) clearInterval(pollTimer);
          router.replace('/(main)/orders' as any);
        }
      } catch (e) {
        // Silent
      }
    };

    // 1. Check whenever user returns from background to foreground (e.g. from GoPay app or browser simulator)
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        performSilentCheck();
      }
    });

    // 2. Poll every 3.5 seconds while modal is open
    pollTimer = setInterval(performSilentCheck, 3500);

    return () => {
      isMounted = false;
      subscription.remove();
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [orderNumber, orderId, attemptId]);

  const handleCopyVa = async () => {
    if (!vaNumber) return;
    try {
      await Clipboard.setStringAsync(vaNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
    }
  };

  const handleOpenSimulator = async () => {
    if (!targetSimulatorUrl) return;
    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        window.open(targetSimulatorUrl, '_blank');
      } else {
        const canOpen = await Linking.canOpenURL(targetSimulatorUrl);
        if (canOpen) {
          await Linking.openURL(targetSimulatorUrl);
        } else {
          await Linking.openURL(targetSimulatorUrl);
        }
      }
    } catch {
      if (redirectUrl && Platform.OS !== 'web') {
        setActiveTab('webview');
      }
    }
  };

  const handleFinishPayment = async () => {
    if (checking) return;
    setChecking(true);
    try {
      const res = await mobileApiFetch<{
        status: string;
        paid: boolean;
        orderId?: number | string;
        orderNumber?: string;
        message?: string;
      }>('/api/payments/midtrans/check-status', {
        method: 'POST',
        body: JSON.stringify({
          orderId: orderId || undefined,
          orderNumber: orderNumber || undefined,
          attemptId: attemptId || undefined,
        }),
      });

      if (res.paid && res.orderId) {
        clearCart();
        router.replace(`/(main)/orders/${res.orderId}` as any);
        return;
      }

      if (res.paid) {
        clearCart();
        router.replace('/(main)/orders' as any);
        return;
      }

      // If still pending/unpaid
      if (res.orderId) {
        router.replace(`/(main)/orders/${res.orderId}` as any);
      } else {
        Alert.alert(
          'Status Pembayaran',
          'Pembayaran belum terkonfirmasi lunas dari Midtrans. Silakan selesaikan transaksi di simulator terlebih dahulu.'
        );
      }
    } catch (err: any) {
      console.warn('[payment-webview] Check status error:', err);
      if (orderId) {
        router.replace(`/(main)/orders/${orderId}` as any);
      }
    } finally {
      setChecking(false);
    }
  };

  // Simulasi instan khusus untuk QRIS (testing tanpa scan HP lain)
  const handleSimulatePayment = async () => {
    if (simulating) return;

    setSimulating(true);
    try {
      const simRes = await mobileApiFetch<{
        status: string;
        paid: boolean;
        orderId?: number | string;
        orderNumber?: string;
      }>('/api/payments/midtrans/simulate', {
        method: 'POST',
        body: JSON.stringify({
          orderId: orderId || undefined,
          orderNumber: orderNumber || undefined,
          result: 'success',
        }),
      });

      if (simRes.paid && simRes.orderId) {
        clearCart();
        router.replace(`/(main)/orders/${simRes.orderId}` as any);
      } else {
        await handleFinishPayment();
      }
    } catch (err: any) {
      console.warn('[payment-webview] Simulation error:', err);
      await handleFinishPayment();
    } finally {
      setSimulating(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Modal Header */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.closeIconButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(main)/orders' as any))}
        >
          <X size={20} color="#181F4B" />
        </TouchableOpacity>
        <View style={styles.headerTitleGroup}>
          <ShieldCheck size={18} color="#C9A876" style={{ marginRight: 6 }} />
          <Text style={styles.headerTitle}>Pembayaran Midtrans</Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {/* Info Status Bar (Tanpa Tombol Bypass Simulasi Umum) */}
      <View style={styles.simBar}>
        <View style={styles.simTextWrapper}>
          <Text style={styles.simOrderText}>Order #{orderNumber || orderId}</Text>
          <Text style={styles.simSubText}>Midtrans Sandbox Test Mode</Text>
        </View>
        <View style={styles.sandboxBadge}>
          <Text style={styles.sandboxBadgeText}>Sandbox Active</Text>
        </View>
      </View>

      {/* Mode View: Dedicated Card vs Webview */}
      {activeTab === 'details' ? (
        <ScrollView contentContainerStyle={styles.detailsScroll} showsVerticalScrollIndicator={false}>
          {/* E-Wallet Deeplink Section */}
          {isEWallet && (
            <View style={styles.cardBox}>
              <View style={styles.badgeTop}>
                <Smartphone size={14} color="#C9A876" style={{ marginRight: 6 }} />
                <Text style={styles.badgeTopText}>
                  {paymentType === 'shopeepay' ? 'ShopeePay Direct App' : 'GoPay Direct App'}
                </Text>
              </View>

              <Text style={styles.cardMainTitle}>
                {paymentType === 'shopeepay' ? 'Buka Aplikasi Shopee' : 'Buka Aplikasi GoPay'}
              </Text>
              <Text style={styles.cardSubText}>
                Tagihan otomatis terhubung ke simulator Midtrans dengan nominal yang terkunci. Silakan selesaikan pembayaran di simulator.
              </Text>

              <TouchableOpacity
                style={styles.deeplinkPrimaryBtn}
                onPress={handleOpenSimulator}
                activeOpacity={0.85}
              >
                <ExternalLink size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                <Text style={styles.deeplinkPrimaryBtnText}>
                  {paymentType === 'shopeepay'
                    ? 'Buka Simulator ShopeePay'
                    : 'Buka Simulator GoPay Midtrans'}
                </Text>
              </TouchableOpacity>

              {qrUrl ? (
                <View style={styles.qrInsideWrapper}>
                  <Text style={styles.qrInsideTitle}>Atau Scan QRIS GoPay</Text>
                  <Image source={{ uri: qrUrl }} style={styles.qrImageInside} resizeMode="contain" />
                </View>
              ) : null}

              <View style={styles.tipBox}>
                <AlertCircle size={14} color="#6B7088" style={{ marginRight: 6 }} />
                <Text style={styles.tipBoxText}>
                  Setelah membayar di simulator, sistem akan otomatis mengonfirmasi dan mengalihkan kembali ke pesanan kamu.
                </Text>
              </View>
            </View>
          )}

          {/* Virtual Account Section */}
          {isVa && (
            <View style={styles.cardBox}>
              <View style={styles.badgeTop}>
                <Building2 size={14} color="#C9A876" style={{ marginRight: 6 }} />
                <Text style={styles.badgeTopText}>Virtual Account {bankName}</Text>
              </View>

              <Text style={styles.cardMainTitle}>Nomor Rekening Virtual Account</Text>
              <Text style={styles.cardSubText}>
                Salin nomor virtual account di bawah ini dan lakukan transfer melalui m-Banking atau ATM {bankName}.
              </Text>

              {vaNumber ? (
                <View style={styles.vaNumberCard}>
                  <Text style={styles.vaNumberText}>{vaNumber}</Text>
                  <TouchableOpacity
                    style={styles.copyBtn}
                    onPress={handleCopyVa}
                    activeOpacity={0.7}
                  >
                    {copied ? (
                      <>
                        <Check size={14} color="#2E7D32" style={{ marginRight: 4 }} />
                        <Text style={styles.copyBtnTextSuccess}>Tersalin</Text>
                      </>
                    ) : (
                      <>
                        <Copy size={14} color="#181F4B" style={{ marginRight: 4 }} />
                        <Text style={styles.copyBtnText}>Salin No. VA</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.deeplinkPrimaryBtn}
                  onPress={() => setActiveTab('webview')}
                  activeOpacity={0.85}
                >
                  <Building2 size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.deeplinkPrimaryBtnText}>
                    Buka Halaman Midtrans Snap No. VA
                  </Text>
                </TouchableOpacity>
              )}

              {/* Guide Accordion / Steps */}
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsTitle}>Petunjuk Pembayaran m-Banking {bankName}</Text>
                <Text style={styles.stepItem}>1. Buka aplikasi m-Banking {bankName} di ponsel kamu</Text>
                <Text style={styles.stepItem}>2. Pilih menu Transfer lalu pilih Virtual Account</Text>
                <Text style={styles.stepItem}>3. Masukkan nomor Virtual Account {vaNumber || 'dari Midtrans'}</Text>
                <Text style={styles.stepItem}>4. Periksa kesesuaian nama ER Coffee Lab dan nominal pembayaran</Text>
                <Text style={styles.stepItem}>5. Masukkan PIN transaksi kamu hingga pembayaran berhasil</Text>
              </View>
            </View>
          )}

          {/* QRIS Section (Dengan Simulasi Khusus QRIS) */}
          {isQr && (
            <View style={styles.cardBox}>
              <View style={styles.badgeTop}>
                <QrCode size={14} color="#C9A876" style={{ marginRight: 6 }} />
                <Text style={styles.badgeTopText}>Midtrans QRIS Terpadu</Text>
              </View>

              <Text style={styles.cardMainTitle}>Scan QRIS untuk Membayar</Text>
              <Text style={styles.cardSubText}>
                Gunakan aplikasi GoPay, OVO, ShopeePay, Dana, BCA Mobile, atau aplikasi perbankan lainnya untuk memindai kode QRIS.
              </Text>

              {qrUrl ? (
                <View style={styles.qrImageWrapper}>
                  <Image source={{ uri: qrUrl }} style={styles.qrImage} resizeMode="contain" />
                </View>
              ) : null}

              {/* Tombol Simulasi Khusus QRIS */}
              <TouchableOpacity
                style={styles.simQrisBtn}
                onPress={handleSimulatePayment}
                disabled={simulating}
                activeOpacity={0.85}
              >
                {simulating ? (
                  <ActivityIndicator size="small" color="#181F4B" />
                ) : (
                  <>
                    <CheckCircle2 size={16} color="#181F4B" style={{ marginRight: 6 }} />
                    <Text style={styles.simQrisBtnText}>Simulasi Scan QRIS Lunas</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Action Buttons */}
          <View style={styles.bottomActions}>
            <TouchableOpacity
              style={styles.checkStatusBtn}
              onPress={handleFinishPayment}
              activeOpacity={0.85}
            >
              <ShieldCheck size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.checkStatusBtnText}>Cek Status Pembayaran</Text>
            </TouchableOpacity>

            {redirectUrl ? (
              <TouchableOpacity
                style={styles.openWebviewLinkBtn}
                onPress={() => setActiveTab('webview')}
                activeOpacity={0.8}
              >
                <Text style={styles.openWebviewLinkBtnText}>Buka Halaman Midtrans Snap</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        </ScrollView>
      ) : (
        /* Fullscreen Snap WebView Mode */
        <View style={styles.webViewContainer}>
          <View style={styles.webViewTopBar}>
            <TouchableOpacity
              style={styles.webViewBackBtn}
              onPress={handleOpenSimulator}
              activeOpacity={0.8}
            >
              <Text style={styles.webViewBackBtnText}>Buka di Tab Baru</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.webViewCheckBtn}
              onPress={handleFinishPayment}
              activeOpacity={0.8}
            >
              <Text style={styles.webViewCheckBtnText}>Cek Status</Text>
            </TouchableOpacity>
          </View>

          {Platform.OS === 'web' ? (
            <iframe
              src={targetSimulatorUrl}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Midtrans Simulator & Payment"
            />
          ) : (
            <>
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#181F4B" />
                  <Text style={styles.loadingText}>Memuat Simulator Pembayaran Midtrans...</Text>
                </View>
              )}
              <WebView
                source={{ uri: targetSimulatorUrl }}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onNavigationStateChange={(navState) => {
                  const url = navState.url.toLowerCase();
                  if (
                    url.includes('finish') ||
                    url.includes('success') ||
                    url.includes('settlement') ||
                    url.includes('payment-callback') ||
                    url.includes('status_code=200')
                  ) {
                    handleFinishPayment();
                  }
                }}
                style={{ flex: 1 }}
              />
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F4F5F9',
  },
  closeIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 16,
    color: '#181F4B',
  },
  simBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#181F4B',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  simTextWrapper: {},
  simOrderText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  simSubText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#C9A876',
  },
  simButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C9A876',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 14,
  },
  simButtonText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 12,
    color: '#181F4B',
  },
  detailsScroll: {
    padding: 20,
    paddingBottom: 40,
  },
  cardBox: {
    backgroundColor: '#FAF7F0',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E7DEC8',
    marginBottom: 20,
  },
  badgeTop: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#181F4B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 12,
  },
  badgeTopText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 11,
    color: '#C9A876',
  },
  cardMainTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 18,
    color: '#181F4B',
    marginBottom: 6,
  },
  cardSubText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#6B7088',
    lineHeight: 18,
    marginBottom: 16,
  },
  deeplinkPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C9A876',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  deeplinkPrimaryBtnText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 15,
    color: '#181F4B',
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E7DEC8',
  },
  tipBoxText: {
    flex: 1,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#6B7088',
  },
  vaNumberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#C9A876',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  vaNumberText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 18,
    color: '#181F4B',
    letterSpacing: 1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  copyBtnText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#181F4B',
  },
  copyBtnTextSuccess: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#2E7D32',
  },
  billerCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  billerCodeLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#6B7088',
    marginRight: 6,
  },
  billerCodeValue: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 13,
    color: '#181F4B',
  },
  instructionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E7DEC8',
  },
  instructionsTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 13,
    color: '#181F4B',
    marginBottom: 8,
  },
  stepItem: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#6B7088',
    lineHeight: 18,
    marginBottom: 4,
  },
  qrImageWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E7DEC8',
    marginBottom: 10,
  },
  qrImage: {
    width: 220,
    height: 220,
  },
  sandboxBadge: {
    backgroundColor: '#C9A876',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  sandboxBadgeText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 11,
    color: '#181F4B',
  },
  qrInsideWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E7DEC8',
    marginBottom: 12,
  },
  qrInsideTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 13,
    color: '#181F4B',
    marginBottom: 8,
  },
  qrImageInside: {
    width: 180,
    height: 180,
  },
  simQrisBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#C9A876',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 6,
  },
  simQrisBtnText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 14,
    color: '#181F4B',
  },
  webViewTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#181F4B',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  webViewBackBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  webViewBackBtnText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#FFFFFF',
  },
  webViewCheckBtn: {
    backgroundColor: '#C9A876',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  webViewCheckBtnText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 12,
    color: '#181F4B',
  },
  bottomActions: {
    marginTop: 10,
  },
  checkStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#181F4B',
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 12,
  },
  checkStatusBtnText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  openWebviewLinkBtn: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  openWebviewLinkBtnText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#6B7088',
    textDecorationLine: 'underline',
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: '#F6F3EC',
    position: 'relative',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#181F4B',
    marginTop: 12,
  },
});

