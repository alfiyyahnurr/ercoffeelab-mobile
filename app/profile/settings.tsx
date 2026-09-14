import { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Switch, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Bell, Globe, Moon, ShieldCheck } from 'lucide-react-native';

export default function SettingsScreen() {
  const router = useRouter();
  const [waNotif, setWaNotif] = useState(true);
  const [promoNotif, setPromoNotif] = useState(true);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(main)/profile' as any);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={handleBack} style={styles.backIconButton} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#181F4B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pengaturan Aplikasi</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Notifikasi</Text>
        <View style={styles.cardGroup}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Notifikasi WhatsApp</Text>
              <Text style={styles.settingSub}>Kirim status pesanan via WhatsApp</Text>
            </View>
            <Switch
              value={waNotif}
              onValueChange={setWaNotif}
              trackColor={{ false: '#E1E3EE', true: '#181F4B' }}
              thumbColor={waNotif ? '#C9A876' : '#FFFFFF'}
            />
          </View>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Promo & Diskoni</Text>
              <Text style={styles.settingSub}>Dapatkan info promo spesial mingguan</Text>
            </View>
            <Switch
              value={promoNotif}
              onValueChange={setPromoNotif}
              trackColor={{ false: '#E1E3EE', true: '#181F4B' }}
              thumbColor={promoNotif ? '#C9A876' : '#FFFFFF'}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Umum</Text>
        <View style={styles.cardGroup}>
          <View style={styles.settingRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingTitle}>Bahasa Aplikasi</Text>
              <Text style={styles.settingSub}>Bahasa Indonesia (ID)</Text>
            </View>
            <Globe size={18} color="#181F4B" />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F6F3EC' },
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
  headerTitle: { fontFamily: 'AlbertSans_700Bold', fontSize: 18, color: '#181F4B' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontFamily: 'AlbertSans_700Bold', fontSize: 15, color: '#181F4B', marginBottom: 10 },
  cardGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F5F9',
  },
  settingTitle: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 14, color: '#181F4B' },
  settingSub: { fontFamily: 'SourceSans3_400Regular', fontSize: 12, color: '#6B7088', marginTop: 2 },
});
