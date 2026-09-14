import { useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { CheckCircle2, ShieldCheck } from 'lucide-react-native';

export default function PinSuccessScreen() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/(main)' as any);
    }, 2500);

    return () => clearTimeout(timer);
  }, [router]);

  const handleContinue = () => {
    router.replace('/(main)' as any);
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardContainer}>
        {/* Success Icon Circle Badge */}
        <View style={styles.iconCircle}>
          <CheckCircle2 size={56} color="#3E8A5A" strokeWidth={2} />
        </View>

        {/* Title */}
        <Text style={styles.title}>PIN TERSIMPAN</Text>

        {/* Subtext Warning */}
        <Text style={styles.subtext}>
          Ingat! Jangan bagikan PIN ERCoffeeLab Kamu kepada pihak mana pun untuk menjaga keamanan akunmu.
        </Text>

        {/* Illustration Badge */}
        <View style={styles.securityBadge}>
          <ShieldCheck size={18} color="#C9A876" style={{ marginRight: 6 }} />
          <Text style={styles.securityBadgeText}>Keamanan Akun Terjaga</Text>
        </View>

        {/* Big Pill Action Button */}
        <TouchableOpacity
          style={styles.actionPillButton}
          onPress={handleContinue}
          activeOpacity={0.85}
        >
          <Text style={styles.actionPillText}>Mulai Pesan Kopi</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  cardContainer: {
    width: '100%',
    backgroundColor: '#F6F3EC',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
    elevation: 4,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 6px 12px rgba(24, 31, 75, 0.1)' }
      : {
          shadowColor: '#181F4B',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        }),
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#EAF5EE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 22,
    color: '#181F4B',
    letterSpacing: 1,
    textAlign: 'center',
  },
  subtext: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#6B7088',
    textAlign: 'center',
    marginTop: 10,
    lineHeight: 20,
  },
  securityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181F4B',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 20,
  },
  securityBadgeText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 11,
    color: '#C9A876',
  },
  actionPillButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: '#181F4B',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
    elevation: 4,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 4px 8px rgba(24, 31, 75, 0.2)' }
      : {
          shadowColor: '#181F4B',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        }),
  },
  actionPillText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 16,
    color: '#C9A876',
  },
});
