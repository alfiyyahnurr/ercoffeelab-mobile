import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CreditCard, ShieldCheck, Check } from 'lucide-react-native';
import { mobileApiFetch } from '@/lib/api-client';

interface PaymentMethodItem {
  id: number;
  code: string;
  displayName: string;
  provider: string;
  isActive: boolean;
}

export default function PaymentMethodsScreen() {
  const router = useRouter();

  // Fetch payment methods from DB API
  const { data: methodsData, isLoading } = useQuery({
    queryKey: ['payment-methods'],
    queryFn: async () => {
      try {
        const res = await mobileApiFetch<{ data: PaymentMethodItem[] }>('/api/payment-methods');
        return res.data;
      } catch {
        return [];
      }
    },
  });

  const methods = methodsData || [];

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(main)/profile' as any);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={handleBack} style={styles.backIconButton} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#181F4B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Metode Pembayaran</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Credit Card Info Card */}
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>Kartu Kredit / Debit (Midtrans Snap)</Text>
          <View style={styles.creditCardBox}>
            <View style={styles.cardRowTop}>
              <CreditCard size={24} color="#C9A876" />
              <Text style={styles.cardBrandText}>Midtrans Secured</Text>
            </View>
            <Text style={styles.cardNumberText}>•••• •••• •••• 4242</Text>
            <View style={styles.cardRowBottom}>
              <Text style={styles.cardHolderText}>ER COFFEE LAB CUSTOMER</Text>
              <Text style={styles.cardExpText}>EXP 12/28</Text>
            </View>
          </View>
        </View>

        {/* E-Wallet & Dynamic Payment Methods Section */}
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionTitle}>Metode Pembayaran Aktif Toko</Text>

          {isLoading ? (
            <ActivityIndicator size="small" color="#181F4B" style={{ marginVertical: 20 }} />
          ) : methods.length > 0 ? (
            methods.map((pm) => (
              <View key={pm.id} style={styles.eWalletRow}>
                <View style={styles.eWalletIconBadge}>
                  <ShieldCheck size={20} color="#181F4B" />
                </View>
                <View style={styles.eWalletInfo}>
                  <Text style={styles.eWalletName}>{pm.displayName}</Text>
                  <Text style={styles.eWalletSub}>Provider: {pm.provider.toUpperCase()} ({pm.code})</Text>
                </View>
                <View style={styles.activeBadge}>
                  <Check size={12} color="#3E8A5A" style={{ marginRight: 2 }} />
                  <Text style={styles.activeBadgeText}>Aktif</Text>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.eWalletRow}>
              <View style={styles.eWalletIconBadge}>
                <ShieldCheck size={20} color="#181F4B" />
              </View>
              <View style={styles.eWalletInfo}>
                <Text style={styles.eWalletName}>GoPay / QRIS / Transfer Bank</Text>
                <Text style={styles.eWalletSub}>Terhubung otomatis via Midtrans Snap Gateway</Text>
              </View>
              <View style={styles.activeBadge}>
                <Check size={12} color="#3E8A5A" style={{ marginRight: 2 }} />
                <Text style={styles.activeBadgeText}>Aktif</Text>
              </View>
            </View>
          )}
        </View>
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
  cardSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 16,
    color: '#181F4B',
    marginBottom: 12,
  },
  creditCardBox: {
    backgroundColor: '#181F4B',
    borderRadius: 20,
    padding: 20,
  },
  cardRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardBrandText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 12,
    color: '#C9A876',
    letterSpacing: 1,
  },
  cardNumberText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
    marginVertical: 18,
    letterSpacing: 2,
  },
  cardRowBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHolderText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#FFFFFF',
  },
  cardExpText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  sectionGroup: {
    marginBottom: 20,
  },
  eWalletRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
  },
  eWalletIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F4F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  eWalletInfo: {
    flex: 1,
  },
  eWalletName: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 14,
    color: '#181F4B',
  },
  eWalletSub: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#6B7088',
    marginTop: 2,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF5EE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  activeBadgeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11,
    color: '#3E8A5A',
  },
  activateButton: {
    backgroundColor: '#181F4B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  activateText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 11,
    color: '#C9A876',
  },
});
