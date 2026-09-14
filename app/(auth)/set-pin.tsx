import { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, ShieldCheck, Info } from 'lucide-react-native';

export default function SetPinScreen() {
  const router = useRouter();
  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', '']);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/login' as any);
    }
  };

  const handleDigitChange = (text: string, index: number) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    const updated = [...pinDigits];

    if (cleanText.length > 1) {
      const pasted = cleanText.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        updated[i] = pasted[i] || '';
      }
      setPinDigits(updated);
      return;
    }

    updated[index] = cleanText;
    setPinDigits(updated);

    if (cleanText && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !pinDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSkipPin = () => {
    router.replace('/(auth)/pin-success' as any);
  };

  const isComplete = pinDigits.join('').length === 6;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={true}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Bar */}
        <View style={styles.topHeaderBar}>
          <TouchableOpacity onPress={handleBack} style={styles.backIconButton} activeOpacity={0.7}>
            <ArrowLeft size={20} color="#181F4B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Buat PIN</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          <View style={styles.shieldBadge}>
            <ShieldCheck size={36} color="#C9A876" strokeWidth={1.8} />
          </View>

          <Text style={styles.title}>Buat PIN Keamanan</Text>
          <Text style={styles.subtitle}>
            Masukkan nomor PIN kamu untuk menjaga keamanan transaksimu
          </Text>

          {/* 6 Underline Input Boxes */}
          <View style={styles.pinInputContainer}>
            {pinDigits.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                style={[styles.pinBoxUnderline, digit ? styles.pinBoxFilled : null]}
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry
                value={digit}
                onChangeText={(val) => handleDigitChange(val, idx)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, idx)}
                selectTextOnFocus
              />
            ))}
          </View>

          {/* PIN Security Warning Subtext */}
          <View style={styles.warningBox}>
            <Info size={16} color="#181F4B" style={{ marginRight: 8 }} />
            <Text style={styles.warningText}>
              Hindari menggunakan tanggal lahir atau urutan angka yang mudah ditebak (contoh: 123456).
            </Text>
          </View>

          {/* Action Button */}
          <TouchableOpacity
            style={[
              styles.actionPillButton,
              isComplete ? styles.actionPillActive : styles.actionPillDisabled,
            ]}
            onPress={() => {
              if (isComplete) {
                router.push({
                  pathname: '/(auth)/confirm-pin' as any,
                  params: { initialPin: pinDigits.join('') },
                });
              }
            }}
            disabled={!isComplete}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.actionPillText,
                isComplete ? styles.actionPillTextActive : styles.actionPillTextDisabled,
              ]}
            >
              Lanjutkan
            </Text>
          </TouchableOpacity>

          {/* Link "Set PIN Lain Kali" */}
          <TouchableOpacity onPress={handleSkipPin} style={styles.skipButton} activeOpacity={0.7}>
            <Text style={styles.skipText}>Set PIN Lain Kali</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flexGrow: 1,
    backgroundColor: '#FFFFFF',
    justifyContent: 'space-between',
    paddingBottom: 160,
  },
  topHeaderBar: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
    alignItems: 'center',
  },
  shieldBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#181F4B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#181F4B',
    fontFamily: 'AlbertSans_700Bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7088',
    fontFamily: 'SourceSans3_400Regular',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
  },
  pinInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 32,
  },
  pinBoxUnderline: {
    width: 46,
    height: 54,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 2.5,
    borderBottomColor: '#9AA0A6',
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    color: '#181F4B',
    fontFamily: 'AlbertSans_700Bold',
  },
  pinBoxFilled: {
    borderBottomColor: '#181F4B',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#F6F3EC',
    borderRadius: 14,
    padding: 14,
    marginTop: 24,
    width: '100%',
    borderWidth: 1,
    borderColor: '#E7E8F0',
  },
  warningText: {
    flex: 1,
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#181F4B',
    lineHeight: 18,
  },
  actionPillButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 28,
  },
  actionPillActive: {
    backgroundColor: '#181F4B',
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
  actionPillDisabled: {
    backgroundColor: '#E1E3EE',
  },
  actionPillText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 16,
  },
  actionPillTextActive: {
    color: '#C9A876',
  },
  actionPillTextDisabled: {
    color: '#9AA0A6',
  },
  skipButton: {
    marginTop: 18,
    paddingVertical: 8,
  },
  skipText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#6B7088',
    textDecorationLine: 'underline',
  },
});
