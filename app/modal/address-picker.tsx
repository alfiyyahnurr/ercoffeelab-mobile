import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  MapPin,
  Navigation,
  Check,
  Plus,
  Home,
  Briefcase,
} from 'lucide-react-native';

import { useOutlet, DeliveryAddress } from '@/lib/outlet-store';
import { mobileApiFetch } from '@/lib/api-client';
import {
  getCurrentUserLocation,
  reverseGeocodeAddress,
  calculateHaversineDistance,
  forwardGeocodeAddress,
} from '@/lib/location-service';

export default function AddressPickerModal() {
  const router = useRouter();
  const { selectedAddress, setSelectedAddress, selectedOutlet } = useOutlet();

  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsAddress, setGpsAddress] = useState<string>('Mendeteksi lokasi GPS...');
  const [gpsCoords, setGpsCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  const outletLat = selectedOutlet?.latitude ?? -6.9175;
  const outletLng = selectedOutlet?.longitude ?? 107.6191;

  // Auto-detect real-time GPS location on modal mount
  useEffect(() => {
    async function detectGps() {
      setDetectingGps(true);
      try {
        const coords = await getCurrentUserLocation();
        setGpsCoords(coords);
        const geo = await reverseGeocodeAddress(coords.latitude, coords.longitude);
        setGpsAddress(geo.fullAddress);
      } catch {
        setGpsAddress('Jl. Buahbatu No. 45, Sekejati, Bandung');
      } finally {
        setDetectingGps(false);
      }
    }
    detectGps();
  }, []);

  // Fetch customer saved addresses
  const { data: savedAddresses, isLoading } = useQuery({
    queryKey: ['saved-addresses'],
    queryFn: async () => {
      try {
        const res = await mobileApiFetch<{ data: any[] }>('/api/customers/me/addresses');
        return Array.isArray(res?.data) ? res.data : [];
      } catch {
        return [];
      }
    },
  });

  const handleSelectAddress = async (addr: DeliveryAddress) => {
    let finalAddr = { ...addr };
    if ((!finalAddr.latitude || !finalAddr.longitude) && finalAddr.addressText) {
      try {
        const resolved = await forwardGeocodeAddress(finalAddr.addressText);
        if (resolved) {
          finalAddr.latitude = resolved.latitude;
          finalAddr.longitude = resolved.longitude;
        }
      } catch {}
    }

    await setSelectedAddress(finalAddr);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(main)' as any);
    }
  };

  const handleAddNewAddress = () => {
    if (router.canGoBack()) {
      router.back();
    }
    router.push('/profile/add-address' as any);
  };

  const isGpsSelected = selectedAddress.isGps;
  const gpsDistanceKm = gpsCoords
    ? calculateHaversineDistance(gpsCoords.latitude, gpsCoords.longitude, outletLat, outletLng)
    : null;

  return (
    <View style={styles.container}>
      {/* Top Modal Header */}
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Pilih Alamat Delivery</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(main)' as any))}
        >
          <X size={20} color="#181F4B" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
        {/* Option 1: Current Real-Time GPS Location */}
        <TouchableOpacity
          style={[styles.addressCard, isGpsSelected && styles.addressCardSelected]}
          onPress={() =>
            handleSelectAddress({
              label: 'Lokasi GPS Terkini',
              addressText: gpsAddress,
              isGps: true,
              latitude: gpsCoords?.latitude,
              longitude: gpsCoords?.longitude,
            })
          }
          activeOpacity={0.85}
        >
          <View style={styles.cardLeftIcon}>
            <Navigation size={20} color={isGpsSelected ? '#C9A876' : '#181F4B'} />
          </View>
          <View style={styles.cardTextWrapper}>
            <View style={styles.badgeRow}>
              <Text style={styles.gpsLabelText}>Lokasi Saat Ini (GPS)</Text>
              {detectingGps ? (
                <ActivityIndicator size="small" color="#181F4B" style={{ marginLeft: 6 }} />
              ) : gpsDistanceKm !== null ? (
                <View style={styles.distanceBadgeChip}>
                  <Text style={styles.distanceBadgeText}>{gpsDistanceKm} km ke outlet</Text>
                </View>
              ) : null}
            </View>
            <Text style={styles.addressSubText} numberOfLines={2}>
              {gpsAddress}
            </Text>
          </View>
          {isGpsSelected && <Check size={20} color="#C9A876" />}
        </TouchableOpacity>

        <Text style={styles.sectionHeaderTitle}>Alamat Tersimpan</Text>

        {isLoading ? (
          <ActivityIndicator size="large" color="#181F4B" style={{ marginVertical: 20 }} />
        ) : savedAddresses && savedAddresses.length > 0 ? (
          savedAddresses.map((item: any) => {
            const isSelected = !isGpsSelected && selectedAddress.id === item.id;
            const itemLat = item.latitude ? Number(item.latitude) : null;
            const itemLng = item.longitude ? Number(item.longitude) : null;
            const itemDistance =
              itemLat !== null && itemLng !== null
                ? calculateHaversineDistance(itemLat, itemLng, outletLat, outletLng)
                : null;

            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.addressCard, isSelected && styles.addressCardSelected]}
                onPress={() =>
                  handleSelectAddress({
                    id: item.id,
                    label: item.label || 'Alamat',
                    addressText: item.addressText,
                    recipientName: item.recipientName,
                    recipientPhone: item.recipientPhone,
                    latitude: itemLat ?? undefined,
                    longitude: itemLng ?? undefined,
                    isGps: false,
                  })
                }
                activeOpacity={0.85}
              >
                <View style={styles.cardLeftIcon}>
                  {item.label?.toLowerCase() === 'kantor' ? (
                    <Briefcase size={18} color={isSelected ? '#C9A876' : '#181F4B'} />
                  ) : (
                    <Home size={18} color={isSelected ? '#C9A876' : '#181F4B'} />
                  )}
                </View>
                <View style={styles.cardTextWrapper}>
                  <View style={styles.badgeRow}>
                    <Text style={styles.addressLabelTitle}>{item.label || 'Alamat'}</Text>
                    {itemDistance !== null ? (
                      <View style={styles.distanceBadgeChip}>
                        <Text style={styles.distanceBadgeText}>{itemDistance} km</Text>
                      </View>
                    ) : null}
                  </View>
                  <Text style={styles.addressSubText} numberOfLines={2}>
                    {item.addressText}
                  </Text>
                  {item.recipientName ? (
                    <Text style={styles.recipientSubText}>
                      Penerima: {item.recipientName} ({item.recipientPhone || '-'})
                    </Text>
                  ) : null}
                </View>
                {isSelected && <Check size={20} color="#C9A876" />}
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptySavedBox}>
            <Text style={styles.emptySavedText}>Belum ada alamat tersimpan.</Text>
          </View>
        )}

        {/* Add New Address Button */}
        <TouchableOpacity
          style={styles.addAddressButton}
          onPress={handleAddNewAddress}
          activeOpacity={0.85}
        >
          <Plus size={18} color="#181F4B" style={{ marginRight: 8 }} />
          <Text style={styles.addAddressText}>Tambah Alamat Baru</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    paddingTop: 24,
    paddingHorizontal: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#F4F5F9',
  },
  modalTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 18,
    color: '#181F4B',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollList: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionHeaderTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 15,
    color: '#181F4B',
    marginTop: 18,
    marginBottom: 12,
  },
  addressCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F3EC',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
  },
  addressCardSelected: {
    borderColor: '#C9A876',
    backgroundColor: '#FAF7F0',
  },
  cardLeftIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTextWrapper: {
    flex: 1,
    marginRight: 8,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  distanceBadgeChip: {
    backgroundColor: '#F3EFE6',
    borderWidth: 1,
    borderColor: '#E7DEC8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  distanceBadgeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 10,
    color: '#9E7B4F',
  },
  gpsLabelText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 14,
    color: '#181F4B',
  },
  addressLabelTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 14,
    color: '#181F4B',
  },
  addressSubText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#6B7088',
    marginTop: 3,
  },
  recipientSubText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11,
    color: '#181F4B',
    marginTop: 4,
  },
  emptySavedBox: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F4F5F9',
    borderRadius: 14,
    marginBottom: 12,
  },
  emptySavedText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#6B7088',
  },
  addAddressButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#181F4B',
    borderRadius: 20,
    height: 50,
    marginTop: 12,
  },
  addAddressText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 14,
    color: '#181F4B',
  },
});
