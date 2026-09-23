import { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ShieldCheck, CheckCircle2, AlertCircle, ArrowRight, RefreshCw } from 'lucide-react-native';
import { mobileApiFetch } from '@/lib/api-client';
import { useCart } from '@/lib/cart-store';

export default function PaymentCallbackScreen() {
  const router = useRouter();
  const { clearCart } = useCart();
  const params = useLocalSearchParams<{
    order_number?: string;
    order_id?: string;
    orderNumber?: string;
    orderId?: string;
    attemptId?: string;
  }>();

  const orderNumber =
    params.order_number ||
    params.orderNumber ||
    params.order_id ||
    params.orderId ||
    '';
  const attemptId = params.attemptId || '';

  const [loading, setLoading] = useState<boolean>(true);
  const [isPaid, setIsPaid] = useState<boolean>(false);
  const [orderIdResult, setOrderIdResult] = useState<number | string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const checkCountRef = useRef<number>(0);

  const handleVerify = async () => {
    if (!orderNumber) {
      setErrorMessage('Nomor transaksi tidak ditemukan.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

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
          orderNumber: orderNumber,
          orderId: orderNumber,
          attemptId: attemptId || undefined,
        }),
      });

      if (res.paid && res.orderId) {
        setIsPaid(true);
        setOrderIdResult(res.orderId);
        clearCart();

        // Redirect automatically after brief success animation
        setTimeout(() => {
          router.replace(`/(main)/orders/${res.orderId}` as any);
        }, 1200);
      } else if (res.paid) {
        setIsPaid(true);
        clearCart();
        setTimeout(() => {
          router.replace('/(main)/orders' as any);
        }, 1200);
      } else {
        // Retry polling if still within initial checks
        if (checkCountRef.current < 3) {
          checkCountRef.current += 1;
          setTimeout(handleVerify, 2000);
        } else {
          setLoading(false);
          setErrorMessage('Pembayaran belum terkonfirmasi lunas dari sistem.');
        }
      }
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || 'Gagal memverifikasi status pembayaran.');
    }
  };

  useEffect(() => {
    handleVerify();
  }, [orderNumber]);

  return (
    <View style={styles.container}>
      <View style={styles.contentCard}>
        {isPaid ? (
          <>
            <View style={[styles.iconCircle, styles.successCircle]}>
              <CheckCircle2 size={48} color="#2E7D32" />
            </View>
            <Text style={styles.titleText}>Pembayaran Berhasil</Text>
            <Text style={styles.subtitleText}>
              Pesanan kamu telah sah dicatat dan segera diteruskan ke barista untuk diproses.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => {
                if (orderIdResult) {
                  router.replace(`/(main)/orders/${orderIdResult}` as any);
                } else {
                  router.replace('/(main)/orders' as any);
                }
              }}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Lihat Tracking Pesanan</Text>
              <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </>
        ) : loading ? (
          <>
            <View style={styles.iconCircle}>
              <ActivityIndicator size="large" color="#181F4B" />
            </View>
            <Text style={styles.titleText}>Memverifikasi Pembayaran</Text>
            <Text style={styles.subtitleText}>
              Sistem sedang memeriksa status transaksi dengan penyedia pembayaran. Mohon tunggu sebentar.
            </Text>
          </>
        ) : (
          <>
            <View style={[styles.iconCircle, styles.pendingCircle]}>
              <AlertCircle size={44} color="#D97706" />
            </View>
            <Text style={styles.titleText}>Status Pembayaran</Text>
            <Text style={styles.subtitleText}>
              {errorMessage || 'Pembayaran belum diselesaikan atau masih dalam proses verifikasi bank.'}
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleVerify}
              activeOpacity={0.85}
            >
              <RefreshCw size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.primaryButtonText}>Cek Ulang Status</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => router.replace('/(main)/menu' as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryButtonText}>Kembali ke Menu</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F3EC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  contentCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#181F4B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F4F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successCircle: {
    backgroundColor: '#EAF5EE',
  },
  pendingCircle: {
    backgroundColor: '#FFF8E7',
  },
  titleText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 20,
    color: '#181F4B',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitleText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#6B7088',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#181F4B',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    width: '100%',
    marginBottom: 10,
  },
  primaryButtonText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F5F9',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    width: '100%',
  },
  secondaryButtonText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 15,
    color: '#181F4B',
  },
});
