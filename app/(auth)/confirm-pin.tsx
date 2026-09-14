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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react-native';
import { mobileApiFetch } from '@/lib/api-client';

export default function ConfirmPinScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ initialPin?: string }>();
  const initialPin = params.initialPin || '';

  const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/set-pin' as any);
    }
  };

  const handleDigitChange = (text: string, index: number) => {
    setErrorMessage(null);
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

  const [loading, setLoading] = useState(false);

  const verifyPinMatch = async (confirmedPin: string) => {
    setErrorMessage(null);
    setLoading(true);

    try {
      if (initialPin) {
        // Mode 1: New User PIN Creation
        if (confirmedPin !== initialPin) {
          setErrorMessage('PIN tidak cocok. Silakan ulangi lagi.');
          setPinDigits(['', '', '', '', '', '']);
          inputRefs.current[0]?.focus();
          setLoading(false);
          return;
        }

        // Save new 6-digit PIN to Neon Postgres DB
        await mobileApiFetch('/api/customers/pin', {
          method: 'POST',
          body: JSON.stringify({ pin: confirmedPin }),
        });

        router.replace('/(auth)/pin-success' as any);
      } else {
        // Mode 2: Existing User PIN Login Verification
        const res = await mobileApiFetch<{ valid?: boolean; message?: string }>('/api/customers/pin', {
          method: 'PUT',
          body: JSON.stringify({ pin: confirmedPin }),
        });

        if (res?.valid) {
          router.replace('/(auth)/pin-success' as any);
        } else {
          setErrorMessage('PIN yang Anda masukkan salah. Silakan coba lagi.');
          setPinDigits(['', '', '', '', '', '']);
          inputRefs.current[0]?.focus();
        }
      }
    } catch (err: any) {
      setErrorMessage(err?.message || 'PIN yang Anda masukkan salah.');
      setPinDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !pinDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
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
          <Text style={styles.headerTitle}>Konfirmasi PIN</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          <View style={styles.shieldBadge}>
            <ShieldCheck size={36} color="#C9A876" strokeWidth={1.8} />
          </View>

          <Text style={styles.title}>Konfirmasi PIN Kamu</Text>
          <Text style={styles.subtitle}>Masukkan kembali PIN ERCoffeeLab Kamu</Text>

          {/* 6 Underline Input Boxes */}
          <View style={styles.pinInputContainer}>
            {pinDigits.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                style={[
                  styles.pinBoxUnderline,
                  digit ? styles.pinBoxFilled : null,
                  errorMessage ? styles.pinBoxError : null,
                ]}
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

          {errorMessage ? (
            <View style={styles.errorContainer}>
              <AlertCircle size={16} color="#C9576B" style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Action Button */}
          <TouchableOpacity
            style={[
              styles.actionPillButton,
              isComplete ? styles.actionPillActive : styles.actionPillDisabled,
            ]}
            onPress={() => verifyPinMatch(pinDigits.join(''))}
            disabled={!isComplete}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.actionPillText,
                isComplete ? styles.actionPillTextActive : styles.actionPillTextDisabled,
              ]}
            >
              Konfirmasi & Simpan
            </Text>
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
  pinBoxError: {
    borderBottomColor: '#C9576B',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    backgroundColor: '#FDF0F2',
    borderWidth: 1,
    borderColor: '#F8D7DA',
    padding: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  errorText: {
    flex: 1,
    color: '#C9576B',
    fontSize: 13,
    fontFamily: 'SourceSans3_400Regular',
  },
  actionPillButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 32,
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
});
