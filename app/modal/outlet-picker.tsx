import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { X, MapPin, Clock, CheckCircle2, Navigation } from 'lucide-react-native';
import { mobileApiFetch } from '@/lib/api-client';
import { Outlet } from '@/types/api';
import { useOutlet } from '@/lib/outlet-store';
import {
  getCurrentUserLocation,
  calculateHaversineDistance,
  DEFAULT_COORDINATES,
} from '@/lib/location-service';

export default function OutletPickerModal() {
  const router = useRouter();
  const { selectedOutlet, setSelectedOutlet } = useOutlet();
  const [detectingGps, setDetectingGps] = useState(false);
  const [userCoords, setUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);

  // Fetch outlets from DB API GET /api/outlets
  const { data: outletsData, isLoading } = useQuery({
    queryKey: ['outlets'],
    queryFn: async () => {
      try {
        const res = await mobileApiFetch<{ data: Outlet[] }>('/api/outlets');
        return Array.isArray(res?.data) ? res.data : [];
      } catch {
        return [];
      }
    },
  });

  // Auto-detect GPS location and sort outlets by nearest on mount
  useEffect(() => {
    async function autoDetectNearestGPS() {
      setDetectingGps(true);
      try {
        const coords = await getCurrentUserLocation();
        setUserCoords(coords);

        if (outletsData && outletsData.length > 0) {
          let closest = outletsData[0];
          let minDist = Infinity;

          for (const outlet of outletsData) {
            const oLat = outlet.latitude ?? DEFAULT_COORDINATES.latitude;
            const oLng = outlet.longitude ?? DEFAULT_COORDINATES.longitude;
            const dist = calculateHaversineDistance(coords.latitude, coords.longitude, oLat, oLng);
            if (dist < minDist) {
              minDist = dist;
              closest = outlet;
            }
          }

          const outletWithDist = { ...closest, distanceKm: minDist };
          await setSelectedOutlet(outletWithDist);
        }
      } finally {
        setDetectingGps(false);
      }
    }

    autoDetectNearestGPS();
  }, [outletsData]);

  const rawOutlets = outletsData || [];

  // Calculate distance for each outlet & sort by nearest first if GPS available
  const outlets = rawOutlets.map((outlet) => {
    const uLat = userCoords?.latitude ?? DEFAULT_COORDINATES.latitude;
    const uLng = userCoords?.longitude ?? DEFAULT_COORDINATES.longitude;
    const oLat = outlet.latitude ?? DEFAULT_COORDINATES.latitude;
    const oLng = outlet.longitude ?? DEFAULT_COORDINATES.longitude;
    const dist = calculateHaversineDistance(uLat, uLng, oLat, oLng);
    return { ...outlet, distanceKm: dist };
  }).sort((a, b) => a.distanceKm - b.distanceKm);

  const selectedId = selectedOutlet.id;

  const handleSelect = async (outlet: Outlet & { distanceKm?: number }) => {
    await setSelectedOutlet(outlet);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(main)' as any);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Modal Header */}
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Pilih Cabang Outlet</Text>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(main)' as any))}
        >
          <X size={20} color="#181F4B" />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#181F4B" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollList}>
          <Text style={styles.sectionSubtitle}>
            Store terdekat otomatis dipilih berdasarkan lokasi kamu:
          </Text>

          {outlets.map((outlet) => {
            const isSelected = outlet.id === selectedId;
            const distanceText = outlet.distanceKm !== undefined ? `${outlet.distanceKm} km dari lokasimu` : '0.8 km dari lokasimu';
            const hoursText =
              outlet.openHour && outlet.closeHour
                ? `${outlet.openHour} - ${outlet.closeHour}`
                : '07.00 - 22.00';

            return (
              <TouchableOpacity
                key={outlet.id}
                style={[
                  styles.outletCard,
                  isSelected && styles.outletCardSelected,
                ]}
                onPress={() => handleSelect(outlet)}
                activeOpacity={0.8}
              >
                <View style={styles.cardHeader}>
                  <View style={styles.pinWrapper}>
                    <MapPin size={18} color={isSelected ? '#C9A876' : '#181F4B'} />
                  </View>

                  <View style={styles.cardTitleInfo}>
                    <Text style={styles.cardOutletName}>{outlet.name}</Text>
                    <Text style={styles.cardAddress}>{outlet.address}</Text>
                  </View>

                  {isSelected && (
                    <CheckCircle2 size={22} color="#181F4B" style={{ marginLeft: 8 }} />
                  )}
                </View>

                {/* Footer Info Row */}
                <View style={styles.cardFooter}>
                  <View style={styles.hoursBadge}>
                    <Clock size={12} color="#6B7088" style={{ marginRight: 4 }} />
                    <Text style={styles.hoursText}>{hoursText}</Text>
                  </View>

                  <View style={styles.distanceBadge}>
                    <Text style={styles.distanceText}>{distanceText}</Text>
                  </View>

                  <View
                    style={[
                      styles.statusPill,
                      outlet.isOpen ? styles.statusPillOpen : styles.statusPillClosed,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusPillText,
                        outlet.isOpen ? styles.statusTextOpen : styles.statusTextClosed,
                      ]}
                    >
                      {outlet.isOpen ? 'OPEN NOW' : 'CLOSED'}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    paddingTop: 56,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollList: {
    padding: 20,
  },
  gpsDetectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F3EC',
    borderWidth: 1.5,
    borderColor: '#C9A876',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  gpsDetectText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 14,
    color: '#181F4B',
  },
  sectionSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#6B7088',
    marginBottom: 16,
  },
  outletCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 2px 6px rgba(24, 31, 75, 0.05)' }
      : {
          shadowColor: '#181F4B',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
        }),
  },
  outletCardSelected: {
    borderColor: '#181F4B',
    backgroundColor: '#F6F3EC',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  pinWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitleInfo: {
    flex: 1,
  },
  cardOutletName: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 16,
    color: '#181F4B',
  },
  cardAddress: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#6B7088',
    marginTop: 2,
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(231, 232, 240, 0.7)',
  },
  hoursBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  hoursText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#6B7088',
  },
  distanceBadge: {
    backgroundColor: '#F4F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginRight: 'auto',
  },
  distanceText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11,
    color: '#181F4B',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPillOpen: {
    backgroundColor: '#EAF5EE',
  },
  statusPillClosed: {
    backgroundColor: '#FDF0F2',
  },
  statusPillText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  statusTextOpen: {
    color: '#3E8A5A',
  },
  statusTextClosed: {
    color: '#C9576B',
  },
});
