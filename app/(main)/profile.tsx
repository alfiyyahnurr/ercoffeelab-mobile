import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  User,
  MapPin,
  CreditCard,
  HelpCircle,
  Settings,
  Share2,
  LogOut,
  ChevronRight,
  FileText,
  ShieldCheck,
  MessageCircle,
  AlertCircle,
  Check,
} from 'lucide-react-native';

import { getToken, removeToken } from '@/lib/auth-store';
import { mobileApiFetch } from '@/lib/api-client';
import { CustomerProfile } from '@/types/api';

export default function ProfileScreen() {
  const router = useRouter();
  const [authed, setAuthed] = useState<boolean>(false);

  useEffect(() => {
    async function checkAuth() {
      const token = await getToken();
      setAuthed(!!token && token.trim().length > 0);
    }
    checkAuth();
  }, []);

  // Fetch real customer profile from Neon DB API /api/customers/me
  const { data: customerData, refetch } = useQuery({
    queryKey: ['customer-me-profile'],
    queryFn: async () => {
      try {
        const res = await mobileApiFetch<{
          customer?: CustomerProfile;
        }>('/api/customers/me');
        return res.customer || null;
      } catch {
        return null;
      }
    },
    enabled: authed,
  });

  const customer = customerData;
  const fullName = customer?.fullName?.trim() || '';
  const email = customer?.email?.trim() || '';
  const phone = customer?.phone?.trim() || '';
  const gender = customer?.gender?.trim() || '';
  const birthDate = customer?.birthDate?.trim() || '';

  // 5 kriteria data diri utama
  const totalFields = 5;
  let filledCount = 0;
  if (fullName) filledCount++;
  if (email) filledCount++;
  if (phone) filledCount++;
  if (gender) filledCount++;
  if (birthDate) filledCount++;

  const isProfileIncomplete = authed && Boolean(customer) && filledCount < totalFields;
  const completionPercentage = Math.round((filledCount / totalFields) * 100);

  const handleOpenEditProfile = () => {
    if (!authed) {
      router.push('/onboarding' as any);
      return;
    }
    router.push('/profile/edit' as any);
  };

  const handleWhatsAppCS = () => {
    const csPhone = '6285155433847';
    const message = 'Halo ER Coffee Lab Customer Service, saya ingin bertanya...';
    const url = `https://wa.me/${csPhone}?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {});
  };

  const handleLogout = async () => {
    await removeToken();
    setAuthed(false);
    router.replace('/onboarding' as any);
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <Text style={styles.headerTitle}>Akun</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header Profile Card (Logged In vs Guest) */}
        {authed ? (
          /* User Logged In Card */
          <TouchableOpacity
            style={styles.profileHeaderCard}
            onPress={handleOpenEditProfile}
            activeOpacity={0.85}
          >
            <View style={styles.avatarCircle}>
              {customer?.avatarUrl ? (
                <Image
                  source={{ uri: customer.avatarUrl }}
                  style={styles.avatarPhoto}
                  resizeMode="cover"
                />
              ) : (
                <User size={28} color="#181F4B" strokeWidth={2} />
              )}
            </View>

            <View style={styles.profileTextWrapper}>
              <Text style={styles.profileName} numberOfLines={1}>
                {customer?.fullName || 'Pelanggan ER Coffee Lab'}
              </Text>
              <Text style={styles.profilePhone} numberOfLines={1}>
                {customer?.phone || customer?.email || 'Nomor telepon belum diatur'}
              </Text>

              {/* Status Badge Kelengkapan Data */}
              {isProfileIncomplete ? (
                <View style={styles.incompleteBadge}>
                  <View style={styles.incompleteDot} />
                  <Text style={styles.incompleteBadgeText}>Data Belum Lengkap</Text>
                </View>
              ) : customer ? (
                <View style={styles.completeBadge}>
                  <Check size={11} color="#2E7D32" style={{ marginRight: 4 }} />
                  <Text style={styles.completeBadgeText}>Profil Lengkap</Text>
                </View>
              ) : null}
            </View>

            <ChevronRight size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          /* Guest Mode Card */
          <TouchableOpacity
            style={styles.guestHeaderCard}
            onPress={() => router.push('/onboarding' as any)}
            activeOpacity={0.85}
          >
            <Text style={styles.guestTitle}>Login ke akunmu sekarang</Text>
            <ChevronRight size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* Actionable Notice Banner Card jika data belum lengkap */}
        {isProfileIncomplete ? (
          <TouchableOpacity
            style={styles.noticeBannerCard}
            onPress={handleOpenEditProfile}
            activeOpacity={0.88}
          >
            <View style={styles.noticeTopRow}>
              <View style={styles.noticeIconCircle}>
                <AlertCircle size={22} color="#C9A876" />
              </View>
              <View style={styles.noticeTextWrapper}>
                <View style={styles.noticeTitleRow}>
                  <Text style={styles.noticeTitle}>Lengkapi Profil Kamu</Text>
                  <Text style={styles.noticeProgressRatio}>
                    {filledCount} dari {totalFields} terisi
                  </Text>
                </View>
                <Text style={styles.noticeDesc}>
                  Lengkapi nomor telepon dan tanggal lahir untuk kemudahan pengiriman pesanan serta voucher hadiah ulang tahun.
                </Text>
              </View>
            </View>

            {/* Progress Bar Track */}
            <View style={styles.progressBarTrack}>
              <View style={[styles.progressBarFill, { width: `${completionPercentage}%` }]} />
            </View>

            {/* Action Row */}
            <View style={styles.noticeActionRow}>
              <Text style={styles.noticeActionBtnText}>Lengkapi Sekarang</Text>
              <ChevronRight size={15} color="#181F4B" />
            </View>
          </TouchableOpacity>
        ) : null}

        {/* Card Promo Referral */}
        <TouchableOpacity style={styles.referralCard} activeOpacity={0.85}>
          <View style={styles.referralIconBox}>
            <Share2 size={24} color="#181F4B" strokeWidth={2} />
          </View>
          <View style={styles.referralTextWrapper}>
            <Text style={styles.referralTitle}>ERReferral</Text>
            <Text style={styles.referralSubtitle}>Bagikan kode referral, dapatkan hadiah</Text>
          </View>
        </TouchableOpacity>

        {/* Group 1: Navigasi Profil Utama */}
        <View style={styles.menuGroup}>
          <TouchableOpacity
            style={styles.menuRowItem}
            onPress={handleOpenEditProfile}
            activeOpacity={0.8}
          >
            <View style={styles.menuRowLeft}>
              <Text style={styles.menuItemText}>Akun Saya</Text>
              {isProfileIncomplete ? (
                <View style={styles.rowNoticeTag}>
                  <Text style={styles.rowNoticeTagText}>Belum Lengkap</Text>
                </View>
              ) : null}
            </View>
            <ChevronRight size={18} color="#181F4B" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRowItem}
            onPress={() => router.push('/profile/saved-addresses' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.menuItemText}>Alamat Tersimpan</Text>
            <ChevronRight size={18} color="#181F4B" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRowItem}
            onPress={() => router.push('/profile/payment-methods' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.menuItemText}>Pembayaran</Text>
            <ChevronRight size={18} color="#181F4B" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.menuRowItem}
            onPress={() => router.push('/profile/help-center' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.menuItemText}>Pusat Bantuan</Text>
            <ChevronRight size={18} color="#181F4B" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.menuRowItem, { borderBottomWidth: 0 }]}
            onPress={() => router.push('/profile/settings' as any)}
            activeOpacity={0.8}
          >
            <Text style={styles.menuItemText}>Pengaturan</Text>
            <ChevronRight size={18} color="#181F4B" />
          </TouchableOpacity>
        </View>

        {/* Group 2: Syarat & Kebijakan */}
        <View style={styles.menuGroup}>
          <TouchableOpacity style={styles.menuRowItem} activeOpacity={0.8}>
            <Text style={styles.menuItemText}>Syarat dan Ketentuan</Text>
            <ChevronRight size={18} color="#181F4B" />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.menuRowItem, { borderBottomWidth: 0 }]} activeOpacity={0.8}>
            <Text style={styles.menuItemText}>Kebijakan Privasi</Text>
            <ChevronRight size={18} color="#181F4B" />
          </TouchableOpacity>
        </View>

        {/* Media Sosial Section */}
        <View style={styles.socialSection}>
          <Text style={styles.socialSectionTitle}>Media Sosial</Text>

          <View style={styles.socialRow}>
            <Text style={styles.socialName}>ER Coffee Lab</Text>
            <View style={styles.socialBadgesGroup}>
              <View style={[styles.socialDot, { backgroundColor: '#E1306C' }]} />
              <View style={[styles.socialDot, { backgroundColor: '#1877F2' }]} />
              <View style={[styles.socialDot, { backgroundColor: '#FF0000' }]} />
              <View style={[styles.socialDot, { backgroundColor: '#000000' }]} />
            </View>
          </View>
        </View>

        {/* Butuh Bantuan Section */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>Butuh Bantuan?</Text>
          <Text style={styles.helpSubtitle}>Customer Service kami siap untuk membantu</Text>

          <TouchableOpacity
            style={styles.csWhatsAppCard}
            onPress={handleWhatsAppCS}
            activeOpacity={0.85}
          >
            <View style={styles.waIconCircle}>
              <MessageCircle size={22} color="#25D366" />
            </View>
            <Text style={styles.csText}>ER Customer Service Khusus Chat</Text>
            <ChevronRight size={18} color="#181F4B" />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        {authed ? (
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            activeOpacity={0.85}
          >
            <LogOut size={18} color="#C9576B" style={{ marginRight: 8 }} />
            <Text style={styles.logoutText}>Keluar dari Akun</Text>
          </TouchableOpacity>
        ) : null}

        <Text style={styles.versionText}>Version 1.0.0</Text>
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
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 90,
  },
  profileHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181F4B',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    elevation: 3,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 4px 12px rgba(24, 31, 75, 0.15)' }
      : {
          shadowColor: '#181F4B',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
        }),
  },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
    overflow: 'hidden',
  },
  avatarPhoto: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  profileTextWrapper: {
    flex: 1,
  },
  profileName: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 17,
    color: '#FFFFFF',
  },
  profilePhone: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  incompleteBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(245, 158, 11, 0.22)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
  },
  incompleteDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#F59E0B',
    marginRight: 5,
  },
  incompleteBadgeText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 11,
    color: '#FCD34D',
  },
  completeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(52, 211, 153, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginTop: 6,
  },
  completeBadgeText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 11,
    color: '#6EE7B7',
  },
  noticeBannerCard: {
    backgroundColor: '#FDF9F2',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E8D9BF',
    elevation: 2,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 3px 8px rgba(201, 168, 118, 0.12)' }
      : {
          shadowColor: '#C9A876',
          shadowOffset: { width: 0, height: 3 },
          shadowOpacity: 0.12,
          shadowRadius: 6,
        }),
  },
  noticeTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  noticeIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F7EDDC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  noticeTextWrapper: {
    flex: 1,
  },
  noticeTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  noticeTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 14,
    color: '#181F4B',
  },
  noticeProgressRatio: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 11,
    color: '#B48842',
  },
  noticeDesc: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#6B7088',
    lineHeight: 17,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#EBE3D5',
    borderRadius: 3,
    marginVertical: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#C9A876',
    borderRadius: 3,
  },
  noticeActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  noticeActionBtnText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 13,
    color: '#181F4B',
    marginRight: 4,
  },
  guestHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#181F4B',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  guestTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  referralCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
  },
  referralIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F6F3EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  referralTextWrapper: {
    flex: 1,
  },
  referralTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 15,
    color: '#181F4B',
  },
  referralSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#6B7088',
    marginTop: 2,
  },
  menuGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
  },
  menuRowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F5F9',
  },
  menuRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#181F4B',
  },
  rowNoticeTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 10,
  },
  rowNoticeTagText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 10,
    color: '#D97706',
  },
  socialSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
  },
  socialSectionTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 15,
    color: '#181F4B',
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  socialName: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#181F4B',
  },
  socialBadgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  socialDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginLeft: 6,
  },
  helpSection: {
    marginBottom: 20,
  },
  helpTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 16,
    color: '#181F4B',
  },
  helpSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#6B7088',
    marginTop: 2,
    marginBottom: 12,
  },
  csWhatsAppCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
  },
  waIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#EAF5EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  csText: {
    flex: 1,
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 14,
    color: '#181F4B',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDF0F2',
    borderRadius: 20,
    height: 50,
    borderWidth: 1,
    borderColor: '#F8D7DA',
    marginBottom: 16,
  },
  logoutText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 14,
    color: '#C9576B',
  },
  versionText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#9AA0A6',
    textAlign: 'center',
    marginBottom: 10,
  },
});
