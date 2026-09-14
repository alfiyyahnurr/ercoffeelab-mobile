import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, HelpCircle, MessageCircle, Mail, Phone, ChevronRight } from 'lucide-react-native';

export default function HelpCenterScreen() {
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(main)/profile' as any);
    }
  };

  const faqs = [
    { q: 'Bagaimana cara membatalkan pesanan?', a: 'Hubungi Customer Service atau outlet terkait via WhatsApp dalam kurun waktu 3 menit setelah pesanan dibuat.' },
    { q: 'Metode pembayaran apa saja yang didukung?', a: 'ERCoffeeLab mendukung pembayaran via Midtrans Snap (QRIS, GoPay, DANA, Virtual Account Bank Transfer, & Kartu Kredit).' },
    { q: 'Berapa lama estimasi pengiriman delivery?', a: 'Estimasi pengiriman delivery adalah 15 - 30 menit tergantung jarak outlet dan kondisi lalu lintas.' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={handleBack} style={styles.backIconButton} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#181F4B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pusat Bantuan</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Contact Banner */}
        <View style={styles.contactCard}>
          <View style={styles.contactIconCircle}>
            <MessageCircle size={28} color="#C9A876" />
          </View>
          <Text style={styles.contactTitle}>Butuh Bantuan Langsung?</Text>
          <Text style={styles.contactSub}>Tim Customer Service ERCoffeeLab siap membantu 24/7</Text>
        </View>

        {/* FAQ Section */}
        <Text style={styles.sectionTitle}>Pertanyaan Sering Diajukan (FAQ)</Text>
        {faqs.map((item, idx) => (
          <View key={idx} style={styles.faqCard}>
            <Text style={styles.faqQuestion}>{item.q}</Text>
            <Text style={styles.faqAnswer}>{item.a}</Text>
          </View>
        ))}
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
  contactCard: {
    backgroundColor: '#181F4B',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  contactIconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#0E1230',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  contactTitle: { fontFamily: 'AlbertSans_700Bold', fontSize: 18, color: '#FFFFFF' },
  contactSub: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 4,
    textAlign: 'center',
  },
  sectionTitle: { fontFamily: 'AlbertSans_700Bold', fontSize: 16, color: '#181F4B', marginBottom: 12 },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
  },
  faqQuestion: { fontFamily: 'AlbertSans_700Bold', fontSize: 14, color: '#181F4B' },
  faqAnswer: { fontFamily: 'SourceSans3_400Regular', fontSize: 12, color: '#6B7088', marginTop: 4, lineHeight: 18 },
});
