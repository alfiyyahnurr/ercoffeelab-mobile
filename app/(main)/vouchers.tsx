import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { Ticket, Tag, Clock, ArrowRight, CheckCircle2 } from 'lucide-react-native';
import { mobileApiFetch } from '@/lib/api-client';
import { getToken } from '@/lib/auth-store';

interface VoucherItem {
  id: number;
  code: string;
  name: string;
  description: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minPurchase: number;
  validUntil: string;
  isClaimed?: boolean;
}

export default function VouchersScreen() {
  const router = useRouter();
  const [promoInput, setPromoInput] = useState('');
  const [claimedIds, setClaimedIds] = useState<Set<number>>(new Set());
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  // Fetch vouchers from DB API GET /api/vouchers
  const { data: apiVouchers, isLoading } = useQuery({
    queryKey: ['vouchers'],
    queryFn: async () => {
      try {
        const res = await mobileApiFetch<{ data: any[] }>('/api/vouchers');
        return Array.isArray(res?.data)
          ? res.data.map((v) => ({
              id: v.id,
              code: v.code,
              name: v.name || `Voucher ${v.code}`,
              description: v.description || 'Voucher promo spesial ERCoffeeLab',
              discountType: v.discountType || 'percent',
              discountValue: v.discountValue || 10,
              minPurchase: v.minPurchase || 0,
              validUntil: v.validUntil ? new Date(v.validUntil).toLocaleDateString('id-ID') : '31 Des 2026',
            }))
          : [];
      } catch {
        return [];
      }
    },
  });

  const vouchers = apiVouchers || [];

  const handleClaim = (id: number) => {
    setClaimedIds((prev) => new Set(prev).add(id));
    setSuccessMessage('Voucher berhasil diklaim!');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleRedeemCode = () => {
    if (!promoInput.trim()) return;
    setSuccessMessage(`Kode promo "${promoInput.toUpperCase()}" berhasil diterapkan!`);
    setPromoInput('');
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  return (
    <View style={styles.container}>
      {/* Top App Header */}
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>Voucher & Promo</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
        {/* Promo Code Input Card */}
        <View style={styles.redeemCard}>
          <Text style={styles.redeemTitle}>Punya Kode Promo?</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.codeInput}
              placeholder="Masukkan kode promo"
              placeholderTextColor="#9AA0A6"
              value={promoInput}
              onChangeText={setPromoInput}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={[
                styles.redeemPillButton,
                promoInput.trim() ? styles.redeemActive : styles.redeemDisabled,
              ]}
              onPress={handleRedeemCode}
              disabled={!promoInput.trim()}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.redeemPillText,
                  promoInput.trim() ? styles.textActive : styles.textDisabled,
                ]}
              >
                Klaim
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {successMessage ? (
          <View style={styles.toastSuccess}>
            <CheckCircle2 size={18} color="#3E8A5A" style={{ marginRight: 8 }} />
            <Text style={styles.toastText}>{successMessage}</Text>
          </View>
        ) : null}

        {/* Active Vouchers Section Title */}
        <View style={styles.sectionHeader}>
          <Ticket size={18} color="#181F4B" style={{ marginRight: 8 }} />
          <Text style={styles.sectionTitle}>Voucher Spesial Untukmu</Text>
        </View>

        {/* Voucher Cards List */}
        {vouchers.map((voucher) => {
          const isClaimed = claimedIds.has(voucher.id);
          const discountLabel =
            voucher.discountType === 'percent'
              ? `Diskon ${voucher.discountValue}%`
              : `Potongan Rp ${voucher.discountValue.toLocaleString('id-ID')}`;

          return (
            <View key={voucher.id} style={styles.voucherCard}>
              {/* Left Color Strip Badge */}
              <View style={styles.voucherStrip}>
                <Tag size={20} color="#C9A876" />
                <Text style={styles.stripText}>{discountLabel}</Text>
              </View>

              {/* Card Main Info */}
              <View style={styles.voucherMain}>
                <View style={styles.codeBadge}>
                  <Text style={styles.codeText}>{voucher.code}</Text>
                </View>

                <Text style={styles.voucherName}>{voucher.name}</Text>
                <Text style={styles.voucherDesc}>{voucher.description}</Text>

                <View style={styles.voucherFooter}>
                  <View style={styles.expiryRow}>
                    <Clock size={12} color="#6B7088" style={{ marginRight: 4 }} />
                    <Text style={styles.expiryText}>Berlaku s/d {voucher.validUntil}</Text>
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.claimButton,
                      isClaimed ? styles.claimButtonDone : styles.claimButtonActive,
                    ]}
                    onPress={() => handleClaim(voucher.id)}
                    disabled={isClaimed}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.claimButtonText,
                        isClaimed ? styles.claimTextDone : styles.claimTextActive,
                      ]}
                    >
                      {isClaimed ? 'Telah Diklaim' : 'Klaim Voucher'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
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
    backgroundColor: '#181F4B',
  },
  headerTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
  },
  scrollList: {
    padding: 20,
    paddingBottom: 40,
  },
  redeemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
    marginBottom: 16,
  },
  redeemTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 14,
    color: '#181F4B',
    marginBottom: 10,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  codeInput: {
    flex: 1,
    height: 48,
    backgroundColor: '#F4F5F9',
    borderRadius: 14,
    paddingHorizontal: 14,
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#181F4B',
    marginRight: 10,
  },
  redeemPillButton: {
    height: 48,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  redeemActive: {
    backgroundColor: '#181F4B',
  },
  redeemDisabled: {
    backgroundColor: '#E1E3EE',
  },
  redeemPillText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 14,
  },
  textActive: {
    color: '#C9A876',
  },
  textDisabled: {
    color: '#9AA0A6',
  },
  toastSuccess: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF5EE',
    borderWidth: 1,
    borderColor: '#3E8A5A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  toastText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#3E8A5A',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 16,
    color: '#181F4B',
  },
  voucherCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
    flexDirection: 'row',
    elevation: 3,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 3px 8px rgba(24, 31, 75, 0.08)' }
      : {
          shadowColor: '#181F4B',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
        }),
  },
  voucherStrip: {
    width: 84,
    backgroundColor: '#181F4B',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
  },
  stripText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 11,
    color: '#C9A876',
    textAlign: 'center',
    marginTop: 6,
  },
  voucherMain: {
    flex: 1,
    padding: 14,
  },
  codeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#F6F3EC',
    borderWidth: 1,
    borderColor: '#C9A876',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    marginBottom: 6,
  },
  codeText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 10,
    color: '#181F4B',
    letterSpacing: 0.5,
  },
  voucherName: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 15,
    color: '#181F4B',
  },
  voucherDesc: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#6B7088',
    marginTop: 2,
    lineHeight: 17,
  },
  voucherFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F4F5F9',
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expiryText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#6B7088',
  },
  claimButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  claimButtonActive: {
    backgroundColor: '#181F4B',
  },
  claimButtonDone: {
    backgroundColor: '#EAF5EE',
  },
  claimButtonText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 12,
  },
  claimTextActive: {
    color: '#C9A876',
  },
  claimTextDone: {
    color: '#3E8A5A',
  },
});
