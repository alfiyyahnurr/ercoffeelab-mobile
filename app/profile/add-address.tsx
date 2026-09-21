import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Search,
  MapPin,
  Users,
  AlertCircle,
  X,
  Navigation,
} from 'lucide-react-native';

import { mobileApiFetch } from '@/lib/api-client';
import { useOutlet } from '@/lib/outlet-store';
import {
  getCurrentUserLocation,
  reverseGeocodeAddress,
  searchLocationApi,
  DEFAULT_COORDINATES,
  SearchLocationResult,
  calculateHaversineDistance,
} from '@/lib/location-service';
import { InteractiveMapPicker } from '@/components/InteractiveMapPicker';
import { useQueryClient } from '@tanstack/react-query';

export default function AddAddressScreen() {
  const router = useRouter();
  const { selectedOutlet, setSelectedAddress } = useOutlet();
  const params = useLocalSearchParams<{
    id?: string;
    label?: string;
    addressText?: string;
    detailNotes?: string;
    recipientName?: string;
    recipientPhone?: string;
    latitude?: string;
    longitude?: string;
    fromCheckout?: string;
  }>();
  const queryClient = useQueryClient();

  const isEditMode = Boolean(params.id);
  const addressId = params.id ? parseInt(params.id, 10) : null;

  const [addressLabel, setAddressLabel] = useState('Rumah');
  const [fullAddressText, setFullAddressText] = useState(
    'Jl. Summarecon Raya No. 10, Gedebage, Bandung'
  );
  const [addressDetail, setAddressDetail] = useState('');
  const [recipientName, setRecipientName] = useState('ALFIYYAH NUR');
  const [recipientPhone, setRecipientPhone] = useState('+6285155433847');

  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number }>(
    DEFAULT_COORDINATES
  );

  const [searchLocation, setSearchLocation] = useState('');
  const [searchResults, setSearchResults] = useState<SearchLocationResult[]>([]);
  const [searching, setSearching] = useState(false);
  const searchAbortRef = useRef<AbortController | null>(null);
  const searchTimerRef = useRef<any>(null);

  const [submitting, setSubmitting] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [isGeocodingPin, setIsGeocodingPin] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Populate state when opening in Edit mode
  useEffect(() => {
    if (params.label) setAddressLabel(params.label);
    if (params.addressText) setFullAddressText(params.addressText);
    if (params.detailNotes !== undefined) setAddressDetail(params.detailNotes);
    if (params.recipientName) setRecipientName(params.recipientName);
    if (params.recipientPhone) setRecipientPhone(params.recipientPhone);
    if (params.latitude && params.longitude) {
      const lat = parseFloat(params.latitude);
      const lng = parseFloat(params.longitude);
      if (!isNaN(lat) && !isNaN(lng)) {
        setUserCoords({ latitude: lat, longitude: lng });
      }
    }
  }, [params]);

  // Auto-detect real-time GPS location on mount if creating new address
  useEffect(() => {
    if (!isEditMode) {
      async function autoDetectUserGps() {
        setDetectingGps(true);
        try {
          const coords = await getCurrentUserLocation();
          setUserCoords(coords);
          const geo = await reverseGeocodeAddress(coords.latitude, coords.longitude);
          setFullAddressText(geo.fullAddress);
        } catch {
          // Fallback
        } finally {
          setDetectingGps(false);
        }
      }
      autoDetectUserGps();
    }
  }, [isEditMode]);

  // Debounced search with AbortController to prevent rate limiting and race conditions
  const handleSearchQueryChange = (text: string) => {
    setSearchLocation(text);

    if (searchTimerRef.current) {
      clearTimeout(searchTimerRef.current);
    }
    if (searchAbortRef.current) {
      searchAbortRef.current.abort();
    }

    if (text.trim().length >= 2) {
      setSearching(true);
      searchTimerRef.current = setTimeout(async () => {
        const abortCtrl = new AbortController();
        searchAbortRef.current = abortCtrl;
        try {
          const data = await searchLocationApi(text, abortCtrl.signal);
          setSearchResults(data);
        } catch (err: any) {
          if (err?.name !== 'AbortError') {
            setSearchResults([]);
          }
        } finally {
          setSearching(false);
        }
      }, 400);
    } else {
      setSearchResults([]);
      setSearching(false);
    }
  };

  const handleSelectSearchResult = (item: SearchLocationResult) => {
    setUserCoords({ latitude: item.latitude, longitude: item.longitude });
    const fullText = item.subtitle ? `${item.title}, ${item.subtitle}` : item.title;
    setFullAddressText(fullText);
    setSearchLocation('');
    setSearchResults([]);
  };

  // Called when pin is dragged or map is tapped
  const handleLocationFromMap = async (lat: number, lng: number) => {
    setUserCoords({ latitude: lat, longitude: lng });
    setIsGeocodingPin(true);
    try {
      const geo = await reverseGeocodeAddress(lat, lng);
      setFullAddressText(geo.fullAddress);
    } catch {
      // Keep existing
    } finally {
      setIsGeocodingPin(false);
    }
  };

  const handleUseCurrentGps = async () => {
    setDetectingGps(true);
    try {
      const coords = await getCurrentUserLocation();
      setUserCoords(coords);
      const geo = await reverseGeocodeAddress(coords.latitude, coords.longitude);
      setFullAddressText(geo.fullAddress);
    } catch {
      // Fallback
    } finally {
      setDetectingGps(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/profile/saved-addresses' as any);
    }
  };

  const isFormValid =
    addressLabel.trim().length > 0 &&
    fullAddressText.trim().length > 0 &&
    recipientName.trim().length > 0 &&
    recipientPhone.trim().length > 0;

  const handleSaveAddress = async () => {
    if (!isFormValid || submitting) return;

    setErrorMessage(null);
    setSubmitting(true);

    const addressPayload = {
      label: addressLabel.trim(),
      addressText: fullAddressText.trim(),
      detailNotes: addressDetail.trim() || undefined,
      recipientName: recipientName.trim(),
      recipientPhone: recipientPhone.trim(),
      latitude: userCoords.latitude,
      longitude: userCoords.longitude,
    };

    try {
      let savedAddressId = addressId || Date.now();
      if (isEditMode && addressId) {
        // API call PUT /api/customers/me/addresses/:id
        await mobileApiFetch(`/api/customers/me/addresses/${addressId}`, {
          method: 'PUT',
          body: JSON.stringify(addressPayload),
        }).catch(() => {});

        queryClient.setQueryData(['saved-addresses'], (old: any[] | undefined) => {
          if (!Array.isArray(old)) return [{ id: addressId, ...addressPayload }];
          return old.map((item) => (item.id === addressId ? { ...item, ...addressPayload } : item));
        });
      } else {
        // API call POST /api/customers/me/addresses
        const res = await mobileApiFetch<{ data?: { id?: number }; message?: string }>(
          '/api/customers/me/addresses',
          {
            method: 'POST',
            body: JSON.stringify(addressPayload),
          }
        ).catch(() => null);

        if (res?.data?.id) {
          savedAddressId = res.data.id;
        }

        queryClient.setQueryData(['saved-addresses'], (old: any[] | undefined) => {
          const list = Array.isArray(old) ? old : [];
          return [{ id: savedAddressId, ...addressPayload }, ...list];
        });
      }

      queryClient.invalidateQueries({ queryKey: ['saved-addresses'] });

      // Auto-set as active selected address for checkout & map calculations
      await setSelectedAddress({
        id: savedAddressId,
        label: addressPayload.label,
        addressText: addressPayload.addressText,
        recipientName: addressPayload.recipientName,
        recipientPhone: addressPayload.recipientPhone,
        isGps: false,
        latitude: addressPayload.latitude,
        longitude: addressPayload.longitude,
      });

      if (params.fromCheckout === 'true') {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(main)/checkout' as any);
        }
      } else if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/profile/saved-addresses' as any);
      }
    } catch {
      if (params.fromCheckout === 'true') {
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/(main)/checkout' as any);
        }
      } else if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/profile/saved-addresses' as any);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={handleBack} style={styles.backIconButton} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#181F4B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? 'Edit Alamat' : 'Tambah Alamat Baru'}</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Search Bar Location */}
        <View style={styles.searchBarWrapper}>
          <View style={styles.searchBar}>
            <Search size={18} color="#181F4B" style={{ marginRight: 10 }} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari jalan, tempat, atau lokasi..."
              placeholderTextColor="#9AA0A6"
              value={searchLocation}
              onChangeText={handleSearchQueryChange}
            />
            {searching ? (
              <ActivityIndicator size="small" color="#181F4B" style={{ marginLeft: 8 }} />
            ) : searchLocation ? (
              <TouchableOpacity onPress={() => setSearchLocation('')}>
                <X size={16} color="#6B7088" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Search Dropdown Results */}
          {searchResults.length > 0 && (
            <View style={styles.searchResultsDropdown}>
              {searchResults.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.searchResultItem}
                  onPress={() => handleSelectSearchResult(item)}
                  activeOpacity={0.8}
                >
                  <MapPin size={16} color="#181F4B" style={{ marginRight: 10, marginTop: 2 }} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.resultItemTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.resultItemSub} numberOfLines={2}>
                      {item.subtitle}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* GPS Quick Action Row */}
        <TouchableOpacity
          style={styles.gpsRowButton}
          onPress={handleUseCurrentGps}
          disabled={detectingGps}
          activeOpacity={0.85}
        >
          {detectingGps ? (
            <ActivityIndicator size="small" color="#181F4B" style={{ marginRight: 8 }} />
          ) : (
            <Navigation size={16} color="#181F4B" style={{ marginRight: 8 }} />
          )}
          <Text style={styles.gpsRowText}>
            {detectingGps ? 'Mendeteksi GPS...' : 'Gunakan Lokasi GPS Terkini'}
          </Text>
        </TouchableOpacity>

        {/* Interactive OpenStreetMap Map Location Picker */}
        <InteractiveMapPicker
          latitude={userCoords.latitude}
          longitude={userCoords.longitude}
          onLocationSelect={handleLocationFromMap}
          isLoading={detectingGps || isGeocodingPin}
          height={220}
        />

        {/* Section 1: Detail Alamat */}
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionTitle}>Detail Alamat</Text>

          {/* Quick Label Pills */}
          <View style={styles.pillsRow}>
            {['Rumah', 'Kantor', 'Apartemen'].map((lbl) => {
              const isSelected = addressLabel === lbl;
              return (
                <TouchableOpacity
                  key={lbl}
                  style={[styles.labelPill, isSelected && styles.labelPillActive]}
                  onPress={() => setAddressLabel(lbl)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.labelPillText, isSelected && styles.labelPillTextActive]}>
                    {lbl}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Label Alamat* (Contoh: Rumah, Kantor)</Text>
            <TextInput
              style={styles.textInput}
              value={addressLabel}
              onChangeText={setAddressLabel}
              placeholder="Rumah / Kantor / Kosan"
              placeholderTextColor="#9AA0A6"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Alamat Lengkap*</Text>
            <TextInput
              style={[styles.textInput, styles.textAreaInput]}
              value={fullAddressText}
              onChangeText={setFullAddressText}
              multiline
              numberOfLines={3}
              placeholder="Nama Jalan, Nomor Rumah, RT/RW, Kecamatan, Kota"
              placeholderTextColor="#9AA0A6"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Detail / Catatan Alamat (opsional)</Text>
            <TextInput
              style={styles.textInput}
              value={addressDetail}
              onChangeText={setAddressDetail}
              placeholder="Contoh: Tower A, Kamar Nomor 22, Pagar Hitam"
              placeholderTextColor="#9AA0A6"
            />
          </View>
        </View>

        {/* Section 2: Detail Penerima */}
        <View style={styles.sectionGroup}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Detail Penerima</Text>
            <TouchableOpacity style={styles.contactsButton} activeOpacity={0.8}>
              <Users size={14} color="#181F4B" style={{ marginRight: 4 }} />
              <Text style={styles.contactsButtonText}>Cari di Kontak</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nama Penerima*</Text>
            <TextInput
              style={styles.textInput}
              value={recipientName}
              onChangeText={setRecipientName}
              placeholder="Nama Lengkap Penerima"
              placeholderTextColor="#9AA0A6"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Nomor Telepon Penerima*</Text>
            <TextInput
              style={styles.textInput}
              value={recipientPhone}
              onChangeText={setRecipientPhone}
              keyboardType="phone-pad"
              placeholder="+62851..."
              placeholderTextColor="#9AA0A6"
            />
          </View>
        </View>

        {errorMessage ? (
          <View style={styles.errorBox}>
            <AlertCircle size={16} color="#C9576B" style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Sticky Bottom Save Button */}
      <View style={styles.bottomFooter}>
        <TouchableOpacity
          style={[
            styles.saveButton,
            isFormValid && !submitting ? styles.saveButtonActive : styles.saveButtonDisabled,
          ]}
          onPress={handleSaveAddress}
          disabled={!isFormValid || submitting}
          activeOpacity={0.85}
        >
          {submitting ? (
            <ActivityIndicator color="#C9A876" />
          ) : (
            <Text
              style={[
                styles.saveText,
                isFormValid ? styles.saveTextActive : styles.saveTextDisabled,
              ]}
            >
              {isEditMode ? 'Simpan Perubahan' : 'Simpan Alamat'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 110,
  },
  searchBarWrapper: {
    marginBottom: 12,
    position: 'relative',
    zIndex: 99,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F5F9',
    borderRadius: 16,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#E7E8F0',
  },
  searchInput: {
    flex: 1,
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#181F4B',
  },
  searchResultsDropdown: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
    borderRadius: 16,
    marginTop: 6,
    paddingVertical: 4,
    elevation: 5,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 4px 12px rgba(24, 31, 75, 0.15)' }
      : {
          shadowColor: '#181F4B',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 10,
        }),
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F4F5F9',
  },
  resultItemTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 14,
    color: '#181F4B',
  },
  resultItemSub: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#6B7088',
    marginTop: 1,
  },
  gpsRowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F3EC',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#C9A876',
  },
  gpsRowText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 13,
    color: '#181F4B',
  },
  mapContainer: {
    height: 200,
    backgroundColor: '#181F4B',
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 20,
    position: 'relative',
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
  },
  mapLoadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(24, 31, 75, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  mapLoadingText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#C9A876',
    marginLeft: 8,
  },
  sectionGroup: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 16,
    color: '#181F4B',
    marginBottom: 12,
  },
  contactsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E7E8F0',
  },
  contactsButtonText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#181F4B',
  },
  pillsRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  labelPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F4F5F9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E7E8F0',
  },
  labelPillActive: {
    backgroundColor: '#181F4B',
    borderColor: '#181F4B',
  },
  labelPillText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#181F4B',
  },
  labelPillTextActive: {
    color: '#C9A876',
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#181F4B',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#F4F5F9',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 48,
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#181F4B',
    borderWidth: 1,
    borderColor: '#E7E8F0',
  },
  textAreaInput: {
    height: 80,
    paddingTop: 12,
    textAlignVertical: 'top',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDF0F2',
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
  },
  errorText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#C9576B',
  },
  distanceCalcCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F3EA',
    borderWidth: 1.5,
    borderColor: '#E7DEC8',
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  distanceCalcCardOutOfRange: {
    backgroundColor: '#FDF0F2',
    borderColor: '#FAD4DB',
  },
  distanceIconBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  distanceIconBadgeOutOfRange: {
    backgroundColor: '#FFFFFF',
  },
  distanceOutletLabel: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 13,
    color: '#181F4B',
  },
  distanceResultText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#9E7B4F',
    marginTop: 2,
  },
  distanceResultTextOutOfRange: {
    color: '#C9576B',
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
    height: 54,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonActive: {
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
  saveButtonDisabled: {
    backgroundColor: '#E1E3EE',
  },
  saveText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 16,
  },
  saveTextActive: {
    color: '#C9A876',
  },
  saveTextDisabled: {
    color: '#9AA0A6',
  },
});
