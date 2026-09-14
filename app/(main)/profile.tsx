import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Linking,
  Platform,
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

  // Fetch customer profile session from DB API /api/auth/session
  const { data: sessionData } = useQuery({
    queryKey: ['auth-session'],
    queryFn: async () => {
      try {
        const res = await mobileApiFetch<{
          type: string;
          customer?: { id: string; email?: string; phone?: string; fullName?: string };
        }>('/api/auth/session');
        return res.customer;
      } catch {
        return null;
      }
    },
    enabled: authed,
  });

  const customer: CustomerProfile = sessionData || {
    id: '1',
    fullName: 'ALFIYYAH NUR',
    phone: '+6285155433847',
    email: 'alfiyyah@ercoffeelab.com',
  };

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
              <User size={28} color="#181F4B" strokeWidth={2} />
            </View>

            <View style={styles.profileTextWrapper}>
              <Text style={styles.profileName}>{customer.fullName || 'ALFIYYAH NUR'}</Text>
              <Text style={styles.profilePhone}>{customer.phone || '+6285155433847'}</Text>
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
            <Text style={styles.csText}>ER Customer Service (chat only)</Text>
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
    marginBottom: 16,
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
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
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
    marginBottom: 20,
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
  menuItemText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#181F4B',
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
    marginBottom: 12,
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
