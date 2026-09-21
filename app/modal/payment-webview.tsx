import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { WebView } from 'react-native-webview';
import { X, ShieldCheck, CheckCircle2 } from 'lucide-react-native';
import { mobileApiFetch } from '@/lib/api-client';

export default function PaymentWebViewModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    orderId?: string;
    orderNumber?: string;
    snapToken?: string;
    redirectUrl?: string;
  }>();

  const orderId = params.orderId || '';
  const orderNumber = params.orderNumber || '';
  const redirectUrl = params.redirectUrl || 'https://app.sandbox.midtrans.com/snap/v2/vtweb/' + params.snapToken;

  const [loading, setLoading] = useState<boolean>(true);
  const [simulating, setSimulating] = useState<boolean>(false);

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

      {/* WebView Container */}
      <View style={styles.webViewContainer}>
        {Platform.OS === 'web' ? (
          /* Web iframe fallback */
          <iframe
            src={redirectUrl}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Midtrans Snap Payment"
          />
        ) : (
          /* Native WebView */
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
