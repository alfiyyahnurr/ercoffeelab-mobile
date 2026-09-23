import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  ScrollView,
  Image,
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

export default function PaymentWebViewModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    orderId?: string;
    orderNumber?: string;
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

  const orderId = params.orderId || '';
  const orderNumber = params.orderNumber || '';
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
  const [copied, setCopied] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'details' | 'webview'>('details');

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

  const handleOpenDeeplink = async () => {
    if (!deeplinkUrl) return;
    try {
      const canOpen = await Linking.canOpenURL(deeplinkUrl);
      if (canOpen) {
        await Linking.openURL(deeplinkUrl);
      } else {
        await Linking.openURL(deeplinkUrl);
      }
    } catch {
      // Fallback
      if (redirectUrl) {
        setActiveTab('webview');
      }
    }
  };

  const handleFinishPayment = async () => {
    if (orderId) {
      try {
        await mobileApiFetch('/api/payments/midtrans/check-status', {
          method: 'POST',
          body: JSON.stringify({ orderId }),
        });
      } catch {
        // Ignored
      }
      router.replace(`/(main)/orders/${orderId}` as any);
    } else {
      router.replace('/(main)/orders' as any);
    }
  };

  const handleSimulatePayment = async () => {
    if (!orderId || simulating) return;

    setSimulating(true);
    try {
      // Call dev simulation endpoint POST /api/payments/midtrans/simulate
      await mobileApiFetch<{ status: string; paid: boolean }>('/api/payments/midtrans/simulate', {
        method: 'POST',
        body: JSON.stringify({
          orderId: orderId,
          result: 'success',
        }),
      });

      await handleFinishPayment();
    } catch (err: any) {
      console.warn('[payment-webview] Simulation error:', err);
      await handleFinishPayment();
    } finally {
      setSimulating(false);
    }
  };

  const isEWallet = paymentType === 'gopay' || paymentType === 'shopeepay';
  const isVa = paymentType === 'bank_transfer' || paymentType === 'echannel' || Boolean(vaNumber);
  const isQr = paymentType === 'qris' || Boolean(qrUrl);

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

      {/* Dev Simulation Bar */}
      <View style={styles.simBar}>
        <View style={styles.simTextWrapper}>
          <Text style={styles.simOrderText}>Order #{orderNumber || orderId}</Text>
          <Text style={styles.simSubText}>Midtrans Sandbox Test Mode</Text>
        </View>
        <TouchableOpacity
          style={styles.simButton}
          onPress={handleSimulatePayment}
          disabled={simulating}
          activeOpacity={0.85}
        >
          {simulating ? (
            <ActivityIndicator size="small" color="#181F4B" />
          ) : (
            <>
              <CheckCircle2 size={16} color="#181F4B" style={{ marginRight: 4 }} />
              <Text style={styles.simButtonText}>Simulasi Lunas</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Mode View: Dedicated Card vs Webview */}
      {(isEWallet || isVa || isQr) && activeTab === 'details' ? (
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
                Tagihan otomatis terhubung ke aplikasi dengan nominal yang terkunci. Silakan selesaikan pembayaran di aplikasi.
              </Text>

              {deeplinkUrl ? (
                <TouchableOpacity
                  style={styles.deeplinkPrimaryBtn}
                  onPress={handleOpenDeeplink}
                  activeOpacity={0.85}
                >
                  <ExternalLink size={18} color="#181F4B" style={{ marginRight: 8 }} />
                  <Text style={styles.deeplinkPrimaryBtnText}>
                    {paymentType === 'shopeepay' ? 'Buka Aplikasi ShopeePay' : 'Buka Aplikasi GoPay'}
                  </Text>
                </TouchableOpacity>
              ) : null}

              <View style={styles.tipBox}>
                <AlertCircle size={14} color="#6B7088" style={{ marginRight: 6 }} />
                <Text style={styles.tipBoxText}>
                  Setelah membayar di aplikasi, kamu akan otomatis dialihkan kembali ke ER Coffee Lab.
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

              {params.billerCode && (
                <View style={styles.billerCodeRow}>
                  <Text style={styles.billerCodeLabel}>Kode Perusahaan Biller:</Text>
                  <Text style={styles.billerCodeValue}>{params.billerCode}</Text>
                </View>
              )}

              {/* Guide Accordion / Steps */}
              <View style={styles.instructionsContainer}>
                <Text style={styles.instructionsTitle}>Petunjuk Pembayaran m-Banking {bankName}</Text>
                <Text style={styles.stepItem}>1. Buka aplikasi m-Banking {bankName} di ponsel kamu</Text>
                <Text style={styles.stepItem}>2. Pilih menu Transfer lalu pilih Virtual Account</Text>
                <Text style={styles.stepItem}>3. Masukkan nomor Virtual Account {vaNumber}</Text>
                <Text style={styles.stepItem}>4. Periksa kesesuaian nama ER Coffee Lab dan nominal pembayaran</Text>
                <Text style={styles.stepItem}>5. Masukkan PIN transaksi kamu hingga pembayaran berhasil</Text>
              </View>
            </View>
          )}

          {/* QRIS Section */}
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
        /* Snap WebView fallback */
        <View style={styles.webViewContainer}>
          {Platform.OS === 'web' ? (
            <iframe
              src={redirectUrl}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title="Midtrans Snap Payment"
            />
          ) : (
            <>
              {loading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#181F4B" />
                  <Text style={styles.loadingText}>Memuat Halaman Pembayaran Midtrans...</Text>
                </View>
              )}
              <WebView
                source={{ uri: redirectUrl }}
                onLoadStart={() => setLoading(true)}
                onLoadEnd={() => setLoading(false)}
                onNavigationStateChange={(navState) => {
                  const url = navState.url.toLowerCase();
                  if (
                    url.includes('finish') ||
                    url.includes('success') ||
                    url.includes('settlement') ||
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

