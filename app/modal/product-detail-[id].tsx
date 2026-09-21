import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Coffee, Utensils, SlidersHorizontal } from 'lucide-react-native';
import { mobileApiFetch } from '@/lib/api-client';
import { getToken } from '@/lib/auth-store';

interface ApiProductDetail {
  id: number;
  name: string;
  type?: 'beverage' | 'food';
  basePrice: number;
  description?: string | null;
  imageUrl?: string | null;
  categoryName?: string;
  categoryGroupName?: string;
}

export default function ProductDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    price?: string;
    desc?: string;
    imageUrl?: string;
    type?: string;
  }>();

  const productId = params.id ? parseInt(params.id, 10) : 1;
  const [authed, setAuthed] = useState<boolean>(false);

  useEffect(() => {
    async function checkAuth() {
      const token = await getToken();
      setAuthed(!!token && token.trim().length > 0);
    }
    checkAuth();
  }, []);

  // Fetch real product details from DB API GET /api/products/:id
  const { data: dbProduct, isLoading } = useQuery({
    queryKey: ['product-detail', productId],
    queryFn: async () => {
      try {
        const res = await mobileApiFetch<ApiProductDetail>(`/api/products/${productId}`);
        return res;
      } catch {
        return null;
      }
    },
    retry: false,
  });

  const productName = dbProduct?.name || params.name || 'Produk';
  const basePrice = dbProduct?.basePrice || (params.price ? parseInt(params.price, 10) : 0);
  const description = dbProduct?.description ?? (params.desc !== undefined ? params.desc : null);
  const rawImageUrl = dbProduct?.imageUrl ?? (params.imageUrl !== undefined ? params.imageUrl : null);
  const productType = dbProduct?.type || (params.type as 'beverage' | 'food') || 'beverage';

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  const handleOpenCustomize = () => {
    if (!authed) {
      router.push('/onboarding' as any);
      return;
    }

    router.push({
      pathname: '/modal/product',
      params: {
        id: String(productId),
        name: productName,
        price: String(basePrice),
        desc: description || '',
        imageUrl: rawImageUrl || '',
        type: productType,
      },
    } as any);
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.backIconButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(main)/menu' as any))}
          activeOpacity={0.7}
        >
          <ArrowLeft size={20} color="#181F4B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detail Produk</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#181F4B" />
          <Text style={styles.loadingText}>Memuat detail produk...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
          {/* Product Image Header Box */}
          <View style={styles.heroBox}>
            {rawImageUrl && rawImageUrl.trim().length > 0 ? (
              <Image source={{ uri: rawImageUrl.trim() }} style={styles.heroImage} resizeMode="cover" />
            ) : (
              <View style={styles.brandedHeroPlaceholder}>
                <View style={styles.placeholderIconCircle}>
                  {productType === 'food' ? (
                    <Utensils size={48} color="#C9A876" />
                  ) : (
                    <Coffee size={48} color="#C9A876" />
                  )}
                </View>
                <Text style={styles.placeholderBrandText}>ER COFFEE LAB</Text>
                <Text style={styles.placeholderCategoryText}>
                  {productType === 'food' ? 'Koleksi Makanan & Pastry' : 'Koleksi Minuman & Kopi'}
                </Text>
              </View>
            )}
          </View>

          {/* Product Title & Price Card */}
          <View style={styles.infoCard}>
            <View style={styles.titleRow}>
              <Text style={styles.productTitle}>{productName}</Text>
              <View style={styles.typeBadge}>
                <Text style={styles.typeBadgeText}>
                  {productType === 'food' ? 'Makanan' : 'Minuman'}
                </Text>
              </View>
            </View>
            <Text style={styles.productPrice}>{formatRupiah(basePrice)}</Text>
          </View>

          {/* Product Description Section */}
          <View style={styles.descSection}>
            <Text style={styles.descTitle}>Deskripsi Produk</Text>
            {description && description.trim().length > 0 ? (
              <Text style={styles.descText}>{description.trim()}</Text>
            ) : (
              <Text style={styles.emptyDescText}>Deskripsi belum tersedia untuk produk ini.</Text>
            )}
          </View>
        </ScrollView>
      )}

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.customizeButton}
          onPress={handleOpenCustomize}
          activeOpacity={0.85}
        >
          <SlidersHorizontal size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.customizeButtonText}>Kustomisasi & Pesan</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F3EC',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EBE6DC',
  },
  backIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F6F3EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 17,
    color: '#181F4B',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#6B7088',
    marginTop: 12,
  },
  scrollList: {
    paddingBottom: 100,
  },
  heroBox: {
    width: '100%',
    height: 260,
    backgroundColor: '#181F4B',
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  brandedHeroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#181F4B',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  placeholderIconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: 'rgba(201, 168, 118, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(201, 168, 118, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  placeholderBrandText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 14,
    color: '#C9A876',
    letterSpacing: 2,
    marginBottom: 4,
  },
  placeholderCategoryText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#EBE6DC',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  productTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 22,
    color: '#181F4B',
    flex: 1,
    marginRight: 10,
  },
  typeBadge: {
    backgroundColor: '#F0EAD9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeBadgeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 12,
    color: '#181F4B',
  },
  productPrice: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 20,
    color: '#C9A876',
  },
  descSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 12,
    padding: 20,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#EBE6DC',
  },
  descTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 16,
    color: '#181F4B',
    marginBottom: 8,
  },
  descText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 15,
    color: '#4B506D',
    lineHeight: 22,
  },
  emptyDescText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#9E9E9E',
    fontStyle: 'italic',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: '#EBE6DC',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px -4px 10px rgba(0, 0, 0, 0.05)' }
      : {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.05,
          shadowRadius: 6,
        }),
  },
  customizeButton: {
    backgroundColor: '#181F4B',
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  customizeButtonText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
});
