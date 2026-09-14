import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react-native';
import { mobileApiFetch } from '@/lib/api-client';
import { setToken } from '@/lib/auth-store';

export default function OtpScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    phone?: string;
    fullName?: string;
    isNewCustomer?: string;
  }>();

  const phone = params.phone || '';
  const fullName = params.fullName || '';

  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState<number>(60);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [resending, setResending] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const inputRefs = useRef<(TextInput | null)[]>([]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/login' as any);
    }
  };

  // Format phone display (+62...)
  const formattedDisplayPhone = phone.startsWith('0')
    ? '+62' + phone.slice(1)
    : phone.startsWith('+62')
    ? phone
    : '+62' + phone;

  // Timer countdown formatted as 01:00 / 00:59
  useEffect(() => {
    let interval: any = null;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else {
      setCanResend(true);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timer]);

  const formatTimerString = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const padMins = mins < 10 ? `0${mins}` : `${mins}`;
    const padSecs = secs < 10 ? `0${secs}` : `${secs}`;
    return `${padMins}:${padSecs}`;
  };

  const handleDigitChange = (text: string, index: number) => {
    const cleanText = text.replace(/[^0-9]/g, '');
    const updated = [...otpDigits];

    if (cleanText.length > 1) {
      const pasted = cleanText.slice(0, 6).split('');
      for (let i = 0; i < 6; i++) {
        updated[i] = pasted[i] || '';
      }
      setOtpDigits(updated);
      if (pasted.length === 6) {
        inputRefs.current[5]?.blur();
      }
      return;
    }

    updated[index] = cleanText;
    setOtpDigits(updated);

    if (cleanText && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (key: string, index: number) => {
    if (key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const codeString = otpDigits.join('');

  const handleVerifyOtp = async () => {
    setErrorMessage(null);
    if (codeString.length < 6) {
      setErrorMessage('Masukkan 6 digit kode OTP verifikasi.');
      return;
    }

    setLoading(true);
    try {
      const response = await mobileApiFetch<{
        token: string;
        hasPin?: boolean;
        customer: {
          id: string;
          email?: string;
          phone?: string;
          fullName?: string;
          hasPin?: boolean;
        };
      }>('/api/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({
          target: phone,
          code: codeString,
          fullName: fullName || undefined,
        }),
      });

      if (response.token) {
        await setToken(response.token);
        const userHasPin = Boolean(response.hasPin || response.customer?.hasPin);
        if (userHasPin) {
          // Existing customer with set PIN -> Go straight to PIN confirmation
          router.replace('/(auth)/confirm-pin' as any);
        } else {
          // New customer without PIN -> Go to PIN creation screen
          router.replace('/(auth)/set-pin' as any);
        }
      } else {
        throw new Error('Response tidak memiliki token.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Kode OTP salah atau sudah kadaluwarsa.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || resending) return;

    setResending(true);
    setErrorMessage(null);
    try {
      await mobileApiFetch<{
        message: string;
      }>('/api/auth/otp/request', {
        method: 'POST',
        body: JSON.stringify({
          target: phone,
          channel: 'whatsapp',
        }),
      });

      setTimer(60);
      setCanResend(false);
      setOtpDigits(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengirim ulang OTP.');
    } finally {
      setResending(false);
    }
  };

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
          <Text style={styles.headerTitle}>Verifikasi Kode</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          <View style={styles.shieldBadge}>
            <ShieldCheck size={36} color="#C9A876" strokeWidth={1.8} />
          </View>

          <Text style={styles.title}>Verifikasi Kode OTP</Text>
          <Text style={styles.subtitle}>
            Kami telah mengirimkan kode verifikasi melalui Whatsapp ke{' '}
            <Text style={styles.phoneHighlight}>{formattedDisplayPhone}</Text>
          </Text>

          {/* 6 Underline Input Boxes (Manual Entry Only) */}
          <View style={styles.otpInputContainer}>
            {otpDigits.map((digit, idx) => (
              <TextInput
                key={idx}
                ref={(el) => {
                  inputRefs.current[idx] = el;
                }}
                style={[
                  styles.otpBoxUnderline,
                  digit ? styles.otpBoxFilled : null,
                  errorMessage ? styles.otpBoxError : null,
                ]}
                keyboardType="number-pad"
                maxLength={6}
                value={digit}
                onChangeText={(val) => handleDigitChange(val, idx)}
                onKeyPress={({ nativeEvent }) => handleKeyPress(nativeEvent.key, idx)}
                editable={!loading}
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

          {/* Big Pill Button "Verifikasi & Lanjutkan" */}
          <TouchableOpacity
            style={[
              styles.actionPillButton,
              codeString.length === 6 && !loading ? styles.actionPillActive : styles.actionPillDisabled,
            ]}
            onPress={handleVerifyOtp}
            disabled={loading || codeString.length < 6}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#C9A876" />
            ) : (
              <Text
                style={[
                  styles.actionPillText,
                  codeString.length === 6 ? styles.actionPillTextActive : styles.actionPillTextDisabled,
                ]}
              >
                Verifikasi & Lanjutkan
              </Text>
            )}
          </TouchableOpacity>

          {/* Resend Timer Area */}
          <View style={styles.resendContainer}>
            {canResend ? (
              <TouchableOpacity onPress={handleResendOtp} disabled={resending}>
                {resending ? (
                  <ActivityIndicator size="small" color="#181F4B" />
                ) : (
                  <Text style={styles.resendActiveText}>Kirim Ulang Kode OTP</Text>
                )}
              </TouchableOpacity>
            ) : (
              <Text style={styles.resendDisabledText}>
                Mohon tunggu untuk kirim ulang kode <Text style={styles.timerText}>{formatTimerString(timer)}</Text>
              </Text>
            )}
          </View>
        </View>

        {/* Footer Help Link */}
        <View style={styles.bottomArea}>
          <TouchableOpacity activeOpacity={0.7}>
            <Text style={styles.helpText}>
              Butuh bantuan? <Text style={styles.helpHighlight}>Hubungi ERCoffeeLab Customer Service</Text>
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
  phoneHighlight: {
    fontWeight: '700',
    color: '#181F4B',
    fontFamily: 'SourceSans3_700Bold',
  },
  otpInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 32,
  },
  otpBoxUnderline: {
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
  otpBoxFilled: {
    borderBottomColor: '#181F4B',
  },
  otpBoxError: {
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
    marginTop: 16,
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
  resendContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  resendActiveText: {
    color: '#181F4B',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'SourceSans3_700Bold',
    textDecorationLine: 'underline',
  },
  resendDisabledText: {
    color: '#9AA0A6',
    fontSize: 13,
    fontFamily: 'SourceSans3_400Regular',
  },
  timerText: {
    color: '#181F4B',
    fontWeight: '700',
    fontFamily: 'SourceSans3_700Bold',
  },
  bottomArea: {
    paddingHorizontal: 20,
    paddingBottom: 32,
    alignItems: 'center',
    marginTop: 24,
  },
  helpText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#9AA0A6',
    textAlign: 'center',
  },
  helpHighlight: {
    color: '#181F4B',
    fontFamily: 'SourceSans3_600SemiBold',
    textDecorationLine: 'underline',
  },
});
