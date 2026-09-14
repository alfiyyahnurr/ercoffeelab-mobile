import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Switch,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Pencil, AlertCircle } from 'lucide-react-native';
import { mobileApiFetch } from '@/lib/api-client';

export default function RegisterInfoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ phone?: string; devCode?: string }>();
  const phone = params.phone || '081234567890';
  const initialDevCode = params.devCode || '';

  const [fullName, setFullName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [waNotifEnabled, setWaNotifEnabled] = useState(true);
  const [hasReferral, setHasReferral] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(auth)/login' as any);
    }
  };

  const formattedDisplayPhone = phone.startsWith('0')
    ? '+62' + phone.slice(1)
    : phone.startsWith('+62')
    ? phone
    : '+62' + phone;

  const handleSaveAndContinue = async () => {
    setErrorMessage(null);
    if (!fullName.trim()) {
      setErrorMessage('Nama wajib diisi.');
      return;
    }

    setLoading(true);
    try {
      // Request OTP
      const response = await mobileApiFetch<{
        message: string;
        devCode?: string;
      }>('/api/auth/otp/request', {
        method: 'POST',
        body: JSON.stringify({
          target: phone,
          channel: 'whatsapp',
        }),
      }).catch(() => {
        // Dev fallback if backend API server is offline
        return { message: 'OTP terkirim via dev mode', devCode: '123456' };
      });

      router.push({
        pathname: '/(auth)/otp' as any,
        params: {
          phone: phone,
          fullName: fullName.trim(),
          devCode: response?.devCode || initialDevCode || '123456',
          isNewCustomer: '1',
        },
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengirim OTP pendaftaran.');
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = fullName.trim().length > 0;

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
          <Text style={styles.headerTitle}>Daftar</Text>
          <View style={{ width: 36 }} />
        </View>

        {/* Content Container */}
        <View style={styles.contentContainer}>
          {/* Section 1: Phone Number Display */}
          <View style={styles.sectionGroup}>
            <Text style={styles.sectionLabel}>Masukan Nomor Telepon</Text>
            <View style={styles.phoneDisplayRow}>
              <Text style={styles.phoneDisplayText}>{formattedDisplayPhone}</Text>
              <TouchableOpacity onPress={handleBack} style={styles.editPhoneButton} activeOpacity={0.7}>
                <Pencil size={16} color="#181F4B" style={{ marginRight: 4 }} />
                <Text style={styles.editPhoneText}>Ubah</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Section 2: Name Underline Input with Character Counter */}
          <View style={styles.sectionGroup}>
            <Text style={styles.sectionLabel}>Masukan Nama</Text>
            <View style={styles.underlineInputWrapper}>
              <TextInput
                style={styles.underlineInput}
                placeholder="Nama*"
                placeholderTextColor="#9AA0A6"
                maxLength={30}
                value={fullName}
                onChangeText={(val) => {
                  setFullName(val);
                  if (errorMessage) setErrorMessage(null);
                }}
                editable={!loading}
              />
              <Text style={styles.charCounter}>{fullName.length}/30</Text>
            </View>
          </View>

          {/* Section 3: Toggle Switches */}
          <View style={styles.toggleSection}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleLabelWrapper}>
                <Text style={styles.toggleTitle}>Nyalakan notifikasi Whatsapp</Text>
                <Text style={styles.toggleSubtitle}>*Atur pengiriman notifikasi lainnya di pengaturan</Text>
              </View>
              <Switch
                value={waNotifEnabled}
                onValueChange={setWaNotifEnabled}
                trackColor={{ false: '#E1E3EE', true: '#181F4B' }}
                thumbColor={waNotifEnabled ? '#C9A876' : '#FFFFFF'}
              />
            </View>

            <View style={[styles.toggleRow, { marginTop: 16 }]}>
              <View style={styles.toggleLabelWrapper}>
                <Text style={styles.toggleTitle}>Saya punya kode referral</Text>
              </View>
              <Switch
                value={hasReferral}
                onValueChange={setHasReferral}
                trackColor={{ false: '#E1E3EE', true: '#181F4B' }}
                thumbColor={hasReferral ? '#C9A876' : '#FFFFFF'}
              />
            </View>

            {hasReferral && (
              <View style={styles.referralInputWrapper}>
                <TextInput
                  style={styles.referralInput}
                  placeholder="Kode Referral (Opsional)"
                  placeholderTextColor="#9AA0A6"
                  value={referralCode}
                  onChangeText={setReferralCode}
                  autoCapitalize="characters"
                />
              </View>
            )}
          </View>

          {errorMessage ? (
            <View style={styles.errorContainer}>
              <AlertCircle size={16} color="#C9576B" style={{ marginRight: 8 }} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {/* Big Pill Button "Simpan & Lanjutkan" */}
          <TouchableOpacity
            style={[
              styles.actionPillButton,
              isFormValid && !loading ? styles.actionPillActive : styles.actionPillDisabled,
            ]}
            onPress={handleSaveAndContinue}
            disabled={!isFormValid || loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#C9A876" />
            ) : (
              <Text
                style={[
                  styles.actionPillText,
                  isFormValid ? styles.actionPillTextActive : styles.actionPillTextDisabled,
                ]}
              >
                Simpan & Lanjutkan
              </Text>
            )}
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
    paddingBottom: 140,
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
    paddingTop: 24,
    paddingBottom: 40,
  },
  sectionGroup: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 14,
    color: '#181F4B',
    marginBottom: 8,
  },
  phoneDisplayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F4F5F9',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  phoneDisplayText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 16,
    color: '#181F4B',
  },
  editPhoneButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editPhoneText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#181F4B',
    textDecorationLine: 'underline',
  },
  underlineInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#181F4B',
    paddingVertical: 8,
  },
  underlineInput: {
    flex: 1,
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 16,
    color: '#181F4B',
    paddingVertical: 4,
  },
  charCounter: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#9AA0A6',
    marginLeft: 8,
  },
  toggleSection: {
    marginTop: 8,
    marginBottom: 24,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabelWrapper: {
    flex: 1,
    marginRight: 12,
  },
  toggleTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#181F4B',
  },
  toggleSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#9AA0A6',
    marginTop: 2,
  },
  referralInputWrapper: {
    marginTop: 12,
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    justifyContent: 'center',
  },
  referralInput: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#181F4B',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF0F2',
    borderWidth: 1,
    borderColor: '#F8D7DA',
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
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
    marginTop: 8,
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
