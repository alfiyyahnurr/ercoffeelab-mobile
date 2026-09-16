import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  MapPin,
  Plus,
  Home,
  Briefcase,
  Check,
  Trash2,
  Pencil,
} from 'lucide-react-native';

import { mobileApiFetch } from '@/lib/api-client';

interface SavedAddressItem {
  id: number;
  label: string; // e.g. "Rumah", "Kantor"
  addressText: string;
  detailNotes?: string;
  recipientName: string;
  recipientPhone: string;
  isPrimary?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

export default function SavedAddressesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Fetch saved addresses from DB API GET /api/customers/me/addresses
  const { data: dbAddresses, isLoading } = useQuery({
    queryKey: ['saved-addresses'],
    queryFn: async () => {
      try {
        const res = await mobileApiFetch<{ data: SavedAddressItem[] }>(
          '/api/customers/me/addresses'
        );
        return Array.isArray(res?.data) ? res.data : [];
      } catch {
        return [];
      }
    },
  });

  const addresses = dbAddresses || [];

  const confirmDeleteAddress = (id: number) => {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Apakah kamu yakin ingin menghapus alamat ini secara permanen dari database?')) {
        handleDeleteAddress(id);
      }
    } else {
      Alert.alert(
        'Hapus Alamat',
        'Apakah kamu yakin ingin menghapus alamat ini secara permanen?',
        [
          { text: 'Batal', style: 'cancel' },
          {
            text: 'Hapus',
            style: 'destructive',
            onPress: () => handleDeleteAddress(id),
          },
        ]
      );
    }
  };

  const handleDeleteAddress = async (id: number) => {
    setDeletingId(id);
    try {
      await mobileApiFetch(`/api/customers/me/addresses/${id}`, {
        method: 'DELETE',
      }).catch(() => {});

      // Optimistically update query client state
      queryClient.setQueryData(['saved-addresses'], (old: SavedAddressItem[] | undefined) =>
        Array.isArray(old) ? old.filter((a) => a.id !== id) : []
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditAddress = (item: SavedAddressItem) => {
    router.push({
      pathname: '/profile/add-address',
      params: {
        id: String(item.id),
        label: item.label,
        addressText: item.addressText,
        detailNotes: item.detailNotes || '',
        recipientName: item.recipientName,
        recipientPhone: item.recipientPhone,
        latitude: item.latitude ? String(item.latitude) : undefined,
        longitude: item.longitude ? String(item.longitude) : undefined,
      },
    } as any);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(main)/profile' as any);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={handleBack} style={styles.backIconButton} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#181F4B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Alamat Tersimpan</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="large" color="#181F4B" />
        </View>
      ) : addresses.length === 0 ? (
        /* Empty State */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <MapPin size={44} color="#C9A876" strokeWidth={1.8} />
          </View>
          <Text style={styles.emptyTitle}>Belum Ada Alamat Tersimpan</Text>
          <Text style={styles.emptySubtitle}>
            Mau lebih praktis saat pesan kopi delivery? Simpan alamat favoritmu di sini.
          </Text>

          <TouchableOpacity
            style={styles.addBigPillButton}
            onPress={() => router.push('/profile/add-address' as any)}
            activeOpacity={0.85}
          >
            <Plus size={18} color="#181F4B" style={{ marginRight: 6 }} />
            <Text style={styles.addBigPillText}>Tambah Alamat</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Addresses List */
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
            {addresses.map((item) => (
              <View key={item.id} style={styles.addressCard}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.labelBadge}>
                    {item.label?.toLowerCase() === 'kantor' ? (
                      <Briefcase size={14} color="#181F4B" style={{ marginRight: 4 }} />
                    ) : (
                      <Home size={14} color="#181F4B" style={{ marginRight: 4 }} />
                    )}
                    <Text style={styles.labelText}>{item.label || 'Alamat'}</Text>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    {item.isPrimary && (
                      <View style={[styles.primaryBadge, { marginRight: 8 }]}>
                        <Check size={12} color="#3E8A5A" style={{ marginRight: 2 }} />
                        <Text style={styles.primaryText}>Utama</Text>
                      </View>
                    )}

                    {/* Edit Address Button */}
                    <TouchableOpacity
                      style={[styles.actionIconButton, { marginRight: 6 }]}
                      onPress={() => handleEditAddress(item)}
                      activeOpacity={0.7}
                    >
                      <Pencil size={15} color="#181F4B" />
                    </TouchableOpacity>

                    {/* Delete Address Button */}
                    <TouchableOpacity
                      style={styles.actionIconButtonDanger}
                      onPress={() => confirmDeleteAddress(item.id)}
                      disabled={deletingId === item.id}
                      activeOpacity={0.7}
                    >
                      {deletingId === item.id ? (
                        <ActivityIndicator size="small" color="#C9576B" />
                      ) : (
                        <Trash2 size={15} color="#C9576B" />
                      )}
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.addressTitle}>{item.addressText}</Text>
                {item.detailNotes ? (
                  <Text style={styles.detailNotesText}>Catatan: {item.detailNotes}</Text>
                ) : null}

                <View style={styles.recipientRow}>
                  <Text style={styles.recipientText}>
                    Penerima: <Text style={{ fontFamily: 'SourceSans3_700Bold' }}>{item.recipientName}</Text> ({item.recipientPhone})
                  </Text>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* Sticky Bottom Add Address Button */}
          <View style={styles.bottomFooter}>
            <TouchableOpacity
              style={styles.stickyAddButton}
              onPress={() => router.push('/profile/add-address' as any)}
              activeOpacity={0.85}
            >
              <Plus size={18} color="#C9A876" style={{ marginRight: 6 }} />
              <Text style={styles.stickyAddText}>Tambah Alamat Baru</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F3EC',
  },
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
  headerTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 18,
    color: '#181F4B',
  },
  loadingBox: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#181F4B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 18,
    color: '#181F4B',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#6B7088',
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  addBigPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C9A876',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    marginTop: 24,
  },
  addBigPillText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 15,
    color: '#181F4B',
  },
  scrollList: {
    padding: 20,
    paddingBottom: 100,
  },
  addressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  labelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F3EC',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  labelText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 12,
    color: '#181F4B',
  },
  primaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF5EE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  primaryText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11,
    color: '#3E8A5A',
  },
  actionIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F4F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconButtonDanger: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FDF0F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 15,
    color: '#181F4B',
  },
  detailNotesText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#6B7088',
    marginTop: 4,
  },
  recipientRow: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F4F5F9',
  },
  recipientText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#181F4B',
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
  stickyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#181F4B',
    height: 52,
    borderRadius: 26,
  },
  stickyAddText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 15,
    color: '#C9A876',
  },
});
