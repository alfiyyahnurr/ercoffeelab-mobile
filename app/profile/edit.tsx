import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  Pencil,
  User,
  Trash2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react-native';

import { mobileApiFetch } from '@/lib/api-client';
import { removeToken } from '@/lib/auth-store';
import { CustomerProfile } from '@/types/api';

export default function EditProfileScreen() {
  const router = useRouter();

  // Fetch real logged-in customer profile from Neon DB
  const { data: customer, refetch, isLoading } = useQuery({
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
  });

  // Zero dummy data defaults: empty strings if null/undefined in DB
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState('');
  const [phone, setPhone] = useState('');

  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync state when real customer data arrives from database
  useEffect(() => {
    if (customer) {
      setFullName(customer.fullName ?? '');
      setEmail(customer.email ?? '');
      setPhone(customer.phone ?? '');
      setGender(customer.gender ?? '');
      setBirthDate(customer.birthDate ?? '');
    }
  }, [customer]);

  const handleClose = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(main)/profile' as any);
    }
  };

function isValidBirthDate(dateStr: string): boolean {
  if (!dateStr || !dateStr.trim()) return true;

  const clean = dateStr.trim();

  // Pattern 1: DD/MM/YYYY or DD-MM-YYYY
  const numRegex = /^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/;
  const numMatch = clean.match(numRegex);
  if (numMatch) {
    const day = parseInt(numMatch[1], 10);
    const month = parseInt(numMatch[2], 10);
    const year = parseInt(numMatch[3], 10);

    if (year < 1900 || year > new Date().getFullYear()) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    const daysInMonth = new Date(year, month, 0).getDate();
    return day <= daysInMonth;
  }

  // Pattern 2: DD MonthName YYYY (Indonesian month names)
  const monthMap: Record<string, number> = {
    januari: 1, jan: 1,
    februari: 2, feb: 2,
    maret: 3, mar: 3,
    april: 4, apr: 4,
    mei: 5,
    juni: 6, jun: 6,
    juli: 7, jul: 7,
    agustus: 8, agu: 8, ags: 8,
    september: 9, sep: 9,
    oktober: 10, okt: 10,
    november: 11, nov: 11,
    desember: 12, des: 12,
  };

  const textRegex = /^(\d{1,2})\s+([a-zA-Z]+)\s+(\d{4})$/;
  const textMatch = clean.match(textRegex);
  if (textMatch) {
    const day = parseInt(textMatch[1], 10);
    const monthStr = textMatch[2].toLowerCase();
    const year = parseInt(textMatch[3], 10);

    const month = monthMap[monthStr];
    if (!month) return false;
    if (year < 1900 || year > new Date().getFullYear()) return false;
    if (day < 1 || day > 31) return false;

    const daysInMonth = new Date(year, month, 0).getDate();
    return day <= daysInMonth;
  }

  // Pattern 3: YYYY-MM-DD
  const isoRegex = /^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})$/;
  const isoMatch = clean.match(isoRegex);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);

    if (year < 1900 || year > new Date().getFullYear()) return false;
    if (month < 1 || month > 12) return false;
    if (day < 1 || day > 31) return false;

    const daysInMonth = new Date(year, month, 0).getDate();
    return day <= daysInMonth;
  }

  return false;
}

function isValidEmail(emailStr: string): boolean {
  if (!emailStr || !emailStr.trim()) return true;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(emailStr.trim());
}

function isValidPhone(phoneStr: string): boolean {
  if (!phoneStr || !phoneStr.trim()) return true;
  const clean = phoneStr.trim();
  const phoneRegex = /^(\+?62|0)8[1-9][0-9]{7,11}$/;
  return phoneRegex.test(clean);
}

  const isBirthDateInvalid = Boolean(birthDate.trim() && !isValidBirthDate(birthDate));
  const isEmailInvalid = Boolean(email.trim() && !isValidEmail(email));
  const isPhoneInvalid = Boolean(phone.trim() && !isValidPhone(phone));

  const handleSaveProfile = async () => {
    setSuccessMsg(null);
    setErrorMsg(null);

    if (isEmailInvalid) {
      setErrorMsg('Format Email tidak sesuai (contoh: nama@email.com)');
      return;
    }

    if (isBirthDateInvalid) {
      setErrorMsg('Format Tanggal Lahir tidak sesuai (contoh: 12/06/1998 atau 12 Juni 1998)');
      return;
    }

    if (isPhoneInvalid) {
      setErrorMsg('Format Nomor Ponsel tidak sesuai (contoh: 081234567890)');
      return;
    }

    setSaving(true);

    try {
      await mobileApiFetch<{ message: string; customer: CustomerProfile }>('/api/customers/me', {
        method: 'PATCH',
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim(),
          gender: gender.trim(),
          birthDate: birthDate.trim(),
        }),
      });

      setSuccessMsg('Profil berhasil disimpan ke database!');
      refetch();
      setTimeout(() => handleClose(), 1200);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menyimpan profil ke database.');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    setDeletingAccount(true);
    setErrorMsg(null);

    try {
      await mobileApiFetch('/api/customers/me', {
        method: 'DELETE',
      });
      await removeToken();
      setShowDeleteModal(false);
      router.replace('/onboarding' as any);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Gagal menghapus akun.');
      setShowDeleteModal(false);
    } finally {
      setDeletingAccount(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={handleClose} style={styles.closeIconButton} activeOpacity={0.7}>
          <X size={22} color="#181F4B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Akun Saya</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Large Avatar Photo Circle with Pencil Button */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarLargeCircle}>
            <User size={56} color="#9AA0A6" />
            <TouchableOpacity style={styles.pencilBadgeButton} activeOpacity={0.8}>
              <Pencil size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile Completion Card */}
        <View style={styles.completionCard}>
          <Text style={styles.completionTitle}>
            Lengkapi data dirimu sekarang dan dapatkan voucher menarik di hari spesialmu*.
          </Text>

          <View style={styles.progressBarBg}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${
                    ((fullName ? 1 : 0) +
                      (email ? 1 : 0) +
                      (phone ? 1 : 0) +
                      (gender ? 1 : 0) +
                      (birthDate ? 1 : 0)) * 20
                  }%`,
                },
              ]}
            />
          </View>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#181F4B" />
            <Text style={styles.loadingText}>Memuat profil Anda...</Text>
          </View>
        ) : null}

        {/* Form Input Section */}
        <View style={styles.formGroup}>
          {/* Nama Lengkap (ganti dari Username) */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nama Lengkap</Text>
            <View style={styles.inputWithIcon}>
              <TextInput
                style={styles.textInputFlex}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Masukkan Nama Lengkap"
                placeholderTextColor="#9AA0A6"
              />
              <Pencil size={16} color="#181F4B" />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.textInput, isEmailInvalid ? styles.textInputError : null]}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="nama@email.com"
              placeholderTextColor="#9AA0A6"
            />
            {isEmailInvalid ? (
              <View style={styles.fieldErrorRow}>
                <AlertCircle size={13} color="#C9576B" style={{ marginRight: 4 }} />
                <Text style={styles.fieldErrorText}>Format email tidak valid (contoh: nama@email.com)</Text>
              </View>
            ) : null}
          </View>

          {/* Tanggal Lahir */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Tanggal Lahir</Text>
            <TextInput
              style={[styles.textInput, isBirthDateInvalid ? styles.textInputError : null]}
              value={birthDate}
              onChangeText={setBirthDate}
              placeholder="DD/MM/YYYY (contoh: 12 Juni 1998)"
              placeholderTextColor="#9AA0A6"
            />
            {isBirthDateInvalid ? (
              <View style={styles.fieldErrorRow}>
                <AlertCircle size={13} color="#C9576B" style={{ marginRight: 4 }} />
                <Text style={styles.fieldErrorText}>Format tanggal lahir tidak sesuai (contoh: 12/06/1998 atau 12 Juni 1998)</Text>
              </View>
            ) : (
              <Text style={styles.fieldHintText}>Contoh: 12/06/1998 atau 12 Juni 1998</Text>
            )}
          </View>

          {/* Jenis Kelamin */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Jenis Kelamin</Text>
            <View style={styles.genderRow}>
              {['Perempuan', 'Laki-Laki'].map((g) => {
                const isSelected = gender === g;
                return (
                  <TouchableOpacity
                    key={g}
                    style={[styles.genderChip, isSelected && styles.genderChipActive]}
                    onPress={() => setGender(isSelected ? '' : g)}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.genderChipText, isSelected && styles.genderChipTextActive]}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Masukkan Nomor Ponsel */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Masukkan Nomor Ponsel</Text>
            <TextInput
              style={[styles.textInput, isPhoneInvalid ? styles.textInputError : null]}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholder="+6281234567890"
              placeholderTextColor="#9AA0A6"
            />
            {isPhoneInvalid ? (
              <View style={styles.fieldErrorRow}>
                <AlertCircle size={13} color="#C9576B" style={{ marginRight: 4 }} />
                <Text style={styles.fieldErrorText}>Format nomor ponsel tidak valid (contoh: 081234567890)</Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Feedback Alert Messages */}
        {errorMsg ? (
          <View style={styles.errorMsgBox}>
            <AlertCircle size={16} color="#C9576B" style={{ marginRight: 6 }} />
            <Text style={styles.errorMsgText}>{errorMsg}</Text>
          </View>
        ) : null}

        {successMsg ? (
          <View style={styles.successMsgBox}>
            <CheckCircle2 size={16} color="#3E8A5A" style={{ marginRight: 6 }} />
            <Text style={styles.successMsgText}>{successMsg}</Text>
          </View>
        ) : null}

        {/* Section LAINNYA */}
        <View style={styles.otherSection}>
          <Text style={styles.otherSectionTitle}>LAINNYA</Text>

          <TouchableOpacity
            style={styles.deleteAccountRow}
            onPress={() => setShowDeleteModal(true)}
            activeOpacity={0.8}
          >
            <Trash2 size={20} color="#C9576B" style={{ marginRight: 10 }} />
            <Text style={styles.deleteAccountText}>HAPUS AKUN</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Sticky Bottom Save Button */}
      <View style={styles.bottomFooter}>
        <TouchableOpacity
          style={styles.saveButton}
          onPress={handleSaveProfile}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#C9A876" />
          ) : (
            <Text style={styles.saveButtonText}>Simpan Perubahan</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Confirmation Modal Hapus Akun */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.confirmModalBox}>
            <View style={styles.warningCircle}>
              <AlertCircle size={32} color="#C9576B" />
            </View>

            <Text style={styles.confirmModalTitle}>Hapus Akun Anda?</Text>

            <Text style={styles.confirmModalDesc}>
              Apakah Anda yakin ingin menghapus akun ERCoffeeLab Anda? Seluruh data akun, poin loyalty, dan riwayat pesanan Anda akan dihapus secara permanen dari database dan tidak dapat dikembalikan.
            </Text>

            <View style={styles.confirmModalActionRow}>
              <TouchableOpacity
                style={styles.cancelModalButton}
                onPress={() => setShowDeleteModal(false)}
                disabled={deletingAccount}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelModalText}>Batal</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.deleteModalButton}
                onPress={handleConfirmDeleteAccount}
                disabled={deletingAccount}
                activeOpacity={0.8}
              >
                {deletingAccount ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.deleteModalText}>Ya, Hapus Akun</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topHeader: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F4F5F9',
  },
  closeIconButton: {
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
  scrollContent: {
    padding: 20,
    paddingBottom: 110,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarLargeCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F4F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  pencilBadgeButton: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#181F4B',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionCard: {
    backgroundColor: '#F6F3EC',
    borderRadius: 18,
    padding: 16,
    marginBottom: 24,
  },
  completionTitle: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#181F4B',
    lineHeight: 18,
    marginBottom: 10,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E7E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#181F4B',
    borderRadius: 3,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  loadingText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#6B7088',
  },
  formGroup: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#6B7088',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1.5,
    borderBottomColor: '#181F4B',
    paddingVertical: 8,
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 15,
    color: '#181F4B',
  },
  textInputError: {
    borderBottomColor: '#C9576B',
  },
  fieldErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  fieldErrorText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#C9576B',
  },
  fieldHintText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#9AA0A6',
    marginTop: 4,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: '#181F4B',
  },
  textInputFlex: {
    flex: 1,
    paddingVertical: 8,
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 15,
    color: '#181F4B',
  },
  genderRow: {
    flexDirection: 'row',
    marginTop: 4,
  },
  genderChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F4F5F9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E7E8F0',
  },
  genderChipActive: {
    backgroundColor: '#181F4B',
    borderColor: '#181F4B',
  },
  genderChipText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#181F4B',
  },
  genderChipTextActive: {
    color: '#C9A876',
  },
  otherSection: {
    marginTop: 10,
    marginBottom: 20,
  },
  otherSectionTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 12,
    color: '#9AA0A6',
    letterSpacing: 1,
    marginBottom: 12,
  },
  deleteAccountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  deleteAccountText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 14,
    color: '#C9576B',
    letterSpacing: 0.5,
  },
  errorMsgBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF0F2',
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
  },
  errorMsgText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#C9576B',
  },
  successMsgBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF5EE',
    padding: 12,
    borderRadius: 14,
    marginBottom: 14,
  },
  successMsgText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#3E8A5A',
  },
  bottomFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#F4F5F9',
  },
  saveButton: {
    backgroundColor: '#181F4B',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 4px 8px rgba(24, 31, 75, 0.2)' }
      : {
          shadowColor: '#181F4B',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        }),
  },
  saveButtonText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 15,
    color: '#C9A876',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(24, 31, 75, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  confirmModalBox: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    elevation: 8,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 10px 25px rgba(24, 31, 75, 0.25)' }
      : {
          shadowColor: '#181F4B',
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.25,
          shadowRadius: 20,
        }),
  },
  warningCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FDF0F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  confirmModalTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 18,
    color: '#181F4B',
    marginBottom: 8,
    textAlign: 'center',
  },
  confirmModalDesc: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#6B7088',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
  },
  confirmModalActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  cancelModalButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F4F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelModalText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 14,
    color: '#181F4B',
  },
  deleteModalButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#C9576B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteModalText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 14,
    color: '#FFFFFF',
  },
});
