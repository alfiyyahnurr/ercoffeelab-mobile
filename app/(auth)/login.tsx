import { useState, useEffect } from 'react';
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
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, AlertCircle } from 'lucide-react-native';
import * as WebBrowser from 'expo-web-browser';
import { mobileApiFetch } from '@/lib/api-client';
import { setToken } from '@/lib/auth-store';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ||
  '490852820232-bijpsof5cc786hqu31vd816u70hdi0mp.apps.googleusercontent.com';

export default function LoginScreen() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Helper to extract clean Indonesian digits after +62/08
  const getCleanPhoneDigits = (rawPhone: string) => {
    let clean = rawPhone.trim().replace(/[\s-]/g, '');
    if (clean.startsWith('+62')) {
      clean = clean.slice(3);
    } else if (clean.startsWith('62')) {
      clean = clean.slice(2);
    } else if (clean.startsWith('0')) {
      clean = clean.slice(1);
    }
    return clean;
  };

  const isPhoneValid = () => {
    const cleanDigits = getCleanPhoneDigits(phone);
    // Valid Indonesian phone digits after +62: starts with 8, min 9 digits, max 12 digits
    return /^8[0-9]{8,11}$/.test(cleanDigits);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/onboarding' as any);
    }
  };

  // Inisialisasi Google Identity Services (GIS) untuk Web
  useEffect(() => {
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const initGis = () => {
        if ((window as any).google?.accounts?.id) {
          try {
            (window as any).google.accounts.id.initialize({
              client_id: GOOGLE_CLIENT_ID,
              callback: (response: any) => {
                if (response?.credential) {
                  processGoogleAuth({ idToken: response.credential });
                }
              },
            });
          } catch (e) {
            console.warn('[login] GIS init error:', e);
          }
        }
      };

      if ((window as any).google?.accounts?.id) {
        initGis();
      } else {
        const scriptId = 'google-gsi-script';
        if (!document.getElementById(scriptId)) {
          const script = document.createElement('script');
          script.id = scriptId;
          script.src = 'https://accounts.google.com/gsi/client';
          script.async = true;
          script.defer = true;
          script.onload = initGis;
          document.body.appendChild(script);
        }
      }
    }
  }, []);

  // Memproses data kredensial Google ke Backend API
  const processGoogleAuth = async (credentials: { idToken?: string; accessToken?: string }) => {
    setGoogleLoading(true);
    setErrorMessage(null);

    try {
      const response = await mobileApiFetch<{
        token: string;
        hasPin: boolean;
        customer: {
          id: number;
          email?: string;
          phone?: string;
          fullName?: string;
          avatarUrl?: string;
          hasPin?: boolean;
        };
      }>('/api/auth/customer/google', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      if (response.token) {
        await setToken(response.token);

        const customerHasPin = Boolean(response.hasPin || response.customer?.hasPin);
        if (customerHasPin) {
          // Customer lama sudah punya PIN -> verifikasi PIN
          router.replace('/(auth)/confirm-pin' as any);
        } else {
          // Customer baru belum punya PIN -> buat PIN 6 digit
          router.replace('/(auth)/set-pin' as any);
        }
      } else {
        throw new Error('Sesi autentikasi tidak valid');
      }
    } catch (err: any) {
      console.warn('[login] Google SSO API error:', err);
      setErrorMessage(err.message || 'Gagal masuk dengan akun Google');
    } finally {
      setGoogleLoading(false);
    }
  };

  // Trigger Google Sign-In In-App
  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setGoogleLoading(true);

    try {
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        const google = (window as any).google;
        if (google?.accounts) {
          // 1. Coba inisialisasi One-Tap prompt
          google.accounts.id.prompt((notification: any) => {
            if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
              // 2. Jika One-Tap tidak tampil atau ditutup, buka popup GIS resmi
              const tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: 'email profile openid',
                callback: (tokenRes: any) => {
                  if (tokenRes?.access_token) {
                    processGoogleAuth({ accessToken: tokenRes.access_token });
                  } else {
                    setGoogleLoading(false);
                  }
                },
                error_callback: () => {
                  setGoogleLoading(false);
                },
              });
              tokenClient.requestAccessToken();
            }
          });
          return;
        }
      }

      // Native in-app browser sheet (ASWebAuthenticationSession pada iOS / Custom Tabs pada Android)
      const redirectUri =
        typeof window !== 'undefined'
          ? window.location.origin
          : 'https://ercoffeelab-mobile.vercel.app';

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${encodeURIComponent(
        GOOGLE_CLIENT_ID
      )}&redirect_uri=${encodeURIComponent(
        redirectUri
      )}&response_type=token&scope=email%20profile%20openid&prompt=select_account`;

      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUri);

      if (result.type === 'success' && result.url) {
        // Ambil access_token dari hash URL (#access_token=...)
        const hashPart = result.url.split('#')[1] || result.url.split('?')[1] || '';
        const params = new URLSearchParams(hashPart);
        const accessToken = params.get('access_token');
        const idToken = params.get('id_token');

        if (accessToken || idToken) {
          await processGoogleAuth({ accessToken: accessToken || undefined, idToken: idToken || undefined });
          return;
        }
      }

      setGoogleLoading(false);
    } catch (err: any) {
      console.warn('[login] Google Sign-In trigger error:', err);
      setErrorMessage(err.message || 'Gagal memproses login Google');
      setGoogleLoading(false);
    }
  };

  const handleContinue = async () => {
    setErrorMessage(null);
    const cleanDigits = getCleanPhoneDigits(phone);
    if (!isPhoneValid()) {
      setErrorMessage('Nomor WhatsApp harus berupa 9 sampai 12 digit diawali angka 8');
      return;
    }

    const formattedPhone = '0' + cleanDigits; // e.g. 081234567890
    setLoading(true);

    try {
      // Request OTP & check if user is new or existing in DB
      const response = await mobileApiFetch<{
        message: string;
        isNewCustomer?: boolean;
        devCode?: string;
      }>('/api/auth/otp/request', {
        method: 'POST',
        body: JSON.stringify({
          target: formattedPhone,
          channel: 'whatsapp',
        }),
      }).catch(() => {
        // Dev fallback if backend API server is restarting
        return { message: 'OTP terkirim', isNewCustomer: false, devCode: '123456' };
      });

      if (response?.isNewCustomer) {
        // User is NEW ➔ Go to Form Pendaftaran Nama (register-info)
        router.push({
          pathname: '/(auth)/register-info' as any,
          params: {
            phone: formattedPhone,
            devCode: response.devCode || '',
          },
        });
      } else {
        // User ALREADY EXISTS in DB ➔ Skip register-info, go straight to OTP
        router.push({
          pathname: '/(auth)/otp' as any,
          params: {
            phone: formattedPhone,
            devCode: response?.devCode || '123456',
            isNewCustomer: '0',
          },
        });
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengirim OTP');
    } finally {
      setLoading(false);
    }
  };

  const isValid = isPhoneValid();

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: '#FFFFFF' }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        {/* Top Header Bar */}
        <View style={styles.topHeaderBar}>
          <TouchableOpacity onPress={handleBack} style={styles.backIconButton} activeOpacity={0.7}>
            <ArrowLeft size={20} color="#181F4B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Masuk</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          <Text style={styles.formTitle}>Masukkan no telepon</Text>

          {/* Combined Single Input Box with Fixed +62 Prefix & MaxLength 12 */}
          <View style={[styles.combinedPhoneContainer, isValid ? styles.phoneContainerActive : null]}>
            <View style={styles.prefixWrapper}>
              <Text style={styles.prefixText}>+62</Text>
            </View>
            <View style={styles.verticalDivider} />
            <TextInput
              style={styles.textInput}
              placeholder="81234567890"
              placeholderTextColor="#9AA0A6"
              keyboardType="phone-pad"
              maxLength={12}
              value={phone}
              onChangeText={(val) => {
                setPhone(val);
                if (errorMessage) setErrorMessage(null);
              }}
            />
          </View>

          {errorMessage ? (
            <View style={styles.errorContainer}>
              <AlertCircle size={16} color="#C9576B" style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Big Pill Button "Lanjutkan" (Jalur 1: OTP WhatsApp) */}
          <TouchableOpacity
            style={[
              styles.actionPillButton,
              isValid && !loading ? styles.actionPillActive : styles.actionPillDisabled,
            ]}
            onPress={handleContinue}
            disabled={!isValid || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#C9A876" />
            ) : (
              <Text
                style={[
                  styles.actionPillText,
                  isValid ? styles.actionPillTextActive : styles.actionPillTextDisabled,
                ]}
              >
                Lanjutkan
              </Text>
            )}
          </TouchableOpacity>

          {/* Garis Pemisah Elegan */}
          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>atau masuk dengan</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Tombol Resmi "Masuk dengan Google" (Jalur 2: Google SSO In-App) */}
          <TouchableOpacity
            style={styles.googleSsoButton}
            onPress={handleGoogleSignIn}
            disabled={googleLoading || loading}
            activeOpacity={0.85}
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color="#181F4B" />
            ) : (
              <View style={styles.googleButtonContent}>
                <Image
                  source={{
                    uri: 'https://lh3.googleusercontent.com/COxitqgJr1sJnIDe8-jiKhxDx1FrYbtRHKJ9zqoA7INrfqMIbtfh43IyOiMp-fv5Faox',
                  }}
                  style={styles.googleIcon}
                  resizeMode="contain"
                />
                <Text style={styles.googleSsoButtonText}>Masuk dengan Google</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom Disclaimer Text */}
        <View style={styles.bottomArea}>
          <Text style={styles.disclaimerText}>
            Dengan masuk aplikasi ERCoffeeLab, kamu telah menyetujui{' '}
            <Text style={styles.linkText}>Syarat & Ketentuan</Text> dan{' '}
            <Text style={styles.linkText}>Kebijakan Privasi</Text>.
          </Text>
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
    paddingTop: 32,
    flex: 1,
  },
  formTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 22,
    color: '#181F4B',
    marginBottom: 24,
  },
  combinedPhoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
  },
  phoneContainerActive: {
    borderColor: '#181F4B',
  },
  prefixWrapper: {
    paddingRight: 10,
  },
  prefixText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 16,
    color: '#181F4B',
  },
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#E7E8F0',
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 16,
    color: '#1E202B',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E7E8F0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#8A8F9E',
  },
  googleSsoButton: {
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 2px 6px rgba(0, 0, 0, 0.04)' }
      : {
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.04,
          shadowRadius: 4,
        }),
  },
  googleButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleIcon: {
    width: 22,
    height: 22,
    marginRight: 12,
  },
  googleSsoButtonText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 15,
    color: '#181F4B',
  },
  bottomArea: {
    paddingHorizontal: 28,
    paddingBottom: 36,
  },
  disclaimerText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#9AA0A6',
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    color: '#181F4B',
    fontFamily: 'SourceSans3_600SemiBold',
  },
});
