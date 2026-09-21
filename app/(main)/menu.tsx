import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getToken } from '@/lib/auth-store';

import {
  Store,
  MapPin,
  ChevronRight,
  Star,
  Search,
  Gift,
  Plus,
  ShoppingBag,
  Heart,
  X,
  Coffee,
  Utensils,
} from 'lucide-react-native';

import { mobileApiFetch } from '@/lib/api-client';
import { useCart } from '@/lib/cart-store';
import { useOutlet } from '@/lib/outlet-store';
import { Product, Outlet } from '@/types/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CategoryOption {
  id: string;
  label: string;
}

const FALLBACK_CATEGORIES: CategoryOption[] = [
  { id: 'all', label: 'Semua' },
  { id: 'favorite', label: 'Rasa Favorit' },
  { id: 'Coffee', label: 'Kopi' },
  { id: 'Milk Based', label: 'Berbasis Susu' },
  { id: 'Fruit', label: 'Buah' },
  { id: 'Tea', label: 'Teh' },
  { id: 'Snack', label: 'Makanan / Snack' },
];

export default function MenuScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode?: 'pickup' | 'delivery' }>();
  const { totalCount, totalAmount } = useCart();
  const { selectedOutlet, selectedAddress } = useOutlet();

  const [orderMode, setOrderMode] = useState<'pickup' | 'delivery'>('pickup');
  const [selectedCat, setSelectedCat] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchInput, setShowSearchInput] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const [authed, setAuthed] = useState<boolean>(false);

  useEffect(() => {
    if (params?.mode === 'pickup' || params?.mode === 'delivery') {
      setOrderMode(params.mode);
    }
  }, [params?.mode]);

  useEffect(() => {
    async function checkAuth() {
      const token = await getToken();
      setAuthed(!!token && token.trim().length > 0);
    }
    checkAuth();
  }, []);

  const activeOutlet = selectedOutlet;

  // Fetch menu products from DB API GET /api/outlets/:id/menu
  const { data: menuData } = useQuery({
    queryKey: ['menu', activeOutlet.id],
    queryFn: async () => {
      try {
        const res = await mobileApiFetch<{ data: Product[] }>(
          `/api/outlets/${activeOutlet.id}/menu`
        );
        return Array.isArray(res?.data) ? res.data : [];
      } catch {
        return [];
      }
    },
  });

  // Fetch categories dynamically from backend API /api/categories
  const { data: dbCategoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      try {
        const res = await mobileApiFetch<{ data: { id: number; name: string; groupName?: string }[] }>(
          '/api/categories'
        );
        return Array.isArray(res?.data) ? res.data : [];
      } catch {
        return [];
      }
    },
  });

  // Build dynamic categories list
  const categoryPills: CategoryOption[] = [
    { id: 'all', label: 'Semua' },
    { id: 'favorite', label: 'Rasa Favorit' },
  ];

  if (dbCategoriesData && dbCategoriesData.length > 0) {
    dbCategoriesData.forEach((cat) => {
      if (cat && cat.name) {
        categoryPills.push({ id: cat.name, label: cat.name });
      }
    });
  } else {
    FALLBACK_CATEGORIES.slice(2).forEach((cat) => {
      categoryPills.push(cat);
    });
  }

  const products = menuData || [];

  // Filter products safely with null guards
  const filteredProducts = products.filter((p) => {
    const pCategory = p.category ? String(p.category) : '';
    const pName = p.name ? String(p.name) : '';
    const targetCat = selectedCat ? String(selectedCat).toLowerCase() : '';

    const matchesSearch =
      searchQuery.trim() === '' ||
      pName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pCategory.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedCat === 'all') return true;
    if (selectedCat === 'favorite') return favorites.has(p.id);

    return (
      pCategory.toLowerCase() === targetCat ||
      pCategory.toLowerCase().includes(targetCat)
    );
  });

  const toggleFav = (id: number) => {
    setFavorites((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  return (
    <View style={styles.container}>
      {/* Top Header Mode Section */}
      <View style={styles.topHeaderGroup}>
        {/* Top Segmented Switcher [ Pick Up | Delivery ] */}
        <View style={styles.segmentedContainer}>
          <TouchableOpacity
            style={[styles.segmentedPill, orderMode === 'pickup' && styles.segmentedActive]}
            onPress={() => setOrderMode('pickup')}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.segmentedText,
                orderMode === 'pickup' ? styles.segmentedTextActive : styles.segmentedTextInactive,
              ]}
            >
              Pick Up
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.segmentedPill, orderMode === 'delivery' && styles.segmentedActive]}
            onPress={() => setOrderMode('delivery')}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.segmentedText,
                orderMode === 'delivery' ? styles.segmentedTextActive : styles.segmentedTextInactive,
              ]}
            >
              Delivery
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Header Card Based on Mode */}
        {orderMode === 'pickup' ? (
          /* Header Mode Pick-Up */
          <TouchableOpacity
            style={styles.pickupHeaderCard}
            onPress={() => router.push('/modal/outlet-picker' as any)}
            activeOpacity={0.85}
          >
            <View style={styles.storeIconWrapper}>
              <Store size={22} color="#181F4B" />
            </View>

            <View style={styles.headerCardContent}>
              <Text style={styles.headerOutletTitle}>{activeOutlet.name}</Text>
              <Text style={styles.headerOutletSubtitle}>
                {activeOutlet.distanceKm} km · Outlet Terdekat
              </Text>
            </View>

            <ChevronRight size={20} color="#181F4B" />
          </TouchableOpacity>
        ) : (
          /* Header Mode Delivery (Double Stack with Dashed Line) */
          <View style={styles.deliveryHeaderCard}>
            {/* Row 1: Store Origin */}
            <TouchableOpacity
              style={styles.deliveryRow}
              onPress={() => router.push('/modal/outlet-picker' as any)}
              activeOpacity={0.85}
            >
              <View style={styles.storeIconWrapperSmall}>
                <Store size={16} color="#181F4B" />
              </View>
              <View style={styles.deliveryRowInfo}>
                <Text style={styles.deliveryLabel}>Store Asal:</Text>
                <Text style={styles.deliveryTitle}>{activeOutlet.name}</Text>
              </View>
              <ChevronRight size={16} color="#181F4B" />
            </TouchableOpacity>

            {/* Dashed Vertical Connection Line */}
            <View style={styles.dashedLineContainer}>
              <View style={styles.dashedDot} />
              <View style={styles.dashedDot} />
            </View>

            {/* Row 2: Customer Address */}
            <TouchableOpacity
              style={styles.deliveryRow}
              onPress={() => router.push('/modal/address-picker' as any)}
              activeOpacity={0.85}
            >
              <View style={styles.pinIconWrapperSmall}>
                <MapPin size={16} color="#C9A876" />
              </View>
              <View style={styles.deliveryRowInfo}>
                <Text style={styles.deliveryLabel}>{selectedAddress?.label || 'Alamat Kirim'}:</Text>
                <Text style={styles.deliveryTitle} numberOfLines={1}>
                  {selectedAddress?.addressText || 'Jl. Buahbatu No. 45, Sekejati, Bandung'}
                </Text>
              </View>
              <ChevronRight size={16} color="#181F4B" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Bar Kategori Horizontal Below Header */}
      <View style={styles.categoryBarContainer}>
        {showSearchInput ? (
          <View style={styles.searchBarActive}>
            <Search size={18} color="#181F4B" style={{ marginRight: 8 }} />
            <TextInput
              style={styles.searchInputText}
              placeholder="Cari menu kopi, rasa, makanan..."
              placeholderTextColor="#9AA0A6"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity
              onPress={() => {
                setShowSearchInput(false);
                setSearchQuery('');
              }}
            >
              <X size={18} color="#181F4B" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.categoryRow}>
            {/* Favorite Pill Button */}
            <TouchableOpacity
              style={[
                styles.favPillButton,
                selectedCat === 'favorite' && styles.categoryPillActive,
              ]}
              onPress={() => setSelectedCat(selectedCat === 'favorite' ? 'all' : 'favorite')}
              activeOpacity={0.8}
            >
              <Star
                size={14}
                color={selectedCat === 'favorite' ? '#C9A876' : '#181F4B'}
                fill={selectedCat === 'favorite' ? '#C9A876' : 'transparent'}
              />
            </TouchableOpacity>

            {/* Horizontal Scroll Category Pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {categoryPills.map((cat) => {
                const isActive = selectedCat === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryPill, isActive && styles.categoryPillActive]}
                    onPress={() => setSelectedCat(cat.id)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.categoryPillText,
                        isActive ? styles.categoryTextActive : styles.categoryTextInactive,
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Search Icon Button at Right End */}
            <TouchableOpacity
              style={styles.searchIconButton}
              onPress={() => setShowSearchInput(true)}
              activeOpacity={0.8}
            >
              <Search size={18} color="#181F4B" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Main Content Scroll List */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* Section Header Grid */}
        <View style={styles.sectionGridHeader}>
          <View style={styles.sectionTitleRow}>
            <Star size={18} color="#C9A876" fill="#C9A876" style={{ marginRight: 6 }} />
            <Text style={styles.sectionGridTitle}>Wajib Dicoba!</Text>
          </View>
          <Text style={styles.totalCountText}>{filteredProducts.length} item</Text>
        </View>

        {/* 2-Column Product Grid */}
        <View style={styles.gridContainer}>
          {filteredProducts.map((product) => {
            const isFav = favorites.has(product.id);
            const isBestseller = product.bestseller || (product as any).isBestseller;
            const isNew = (product as any).isNew;
            const badgeLabel = product.badgeText || (isBestseller ? 'BEST SELLER' : isNew ? 'BARU' : null);

            const handleOpenDetail = () => {
              router.push({
                pathname: '/modal/product-detail',
                params: {
                  id: String(product.id),
                  name: product.name,
                  price: String(product.price),
                  desc: product.description ?? '',
                  imageUrl: product.imageUrl ?? '',
                  type: product.type || 'beverage',
                },
              } as any);
            };

            const handleOpenCustomizeModal = () => {
              if (!authed) {
                router.push('/onboarding' as any);
                return;
              }

              router.push({
                pathname: '/modal/product',
                params: {
                  id: String(product.id),
                  name: product.name,
                  price: String(product.price),
                  desc: product.description ?? '',
                  imageUrl: product.imageUrl ?? '',
                  type: product.type || 'beverage',
                },
              } as any);
            };

            return (
              <View key={product.id} style={styles.productCard}>
                {/* Image Container -> Opens Detail Screen */}
                <TouchableOpacity
                  style={styles.productImageContainer}
                  onPress={handleOpenDetail}
                  activeOpacity={0.85}
                >
                  {product.imageUrl ? (
                    <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
                  ) : (
                    <View style={styles.productPlaceholder}>
                      {product.type === 'food' ? (
                        <Utensils size={36} color="#C9A876" opacity={0.9} />
                      ) : (
                        <Coffee size={36} color="#C9A876" opacity={0.9} />
                      )}
                    </View>
                  )}

                  {/* Badge Label */}
                  {badgeLabel ? (
                    <View
                      style={[
                        styles.badgePill,
                        isNew && !isBestseller ? { backgroundColor: '#C9576B' } : null,
                      ]}
                    >
                      <Text style={styles.badgePillText}>{badgeLabel}</Text>
                    </View>
                  ) : null}

                  {/* Favorite Button */}
                  <TouchableOpacity
                    style={styles.favHeartButton}
                    onPress={() => toggleFav(product.id)}
                  >
                    <Heart
                      size={14}
                      color={isFav ? '#C9576B' : '#181F4B'}
                      fill={isFav ? '#C9576B' : 'transparent'}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>

                {/* Info Container -> Opens Detail Screen */}
                <TouchableOpacity
                  style={styles.productInfoContainer}
                  onPress={handleOpenDetail}
                  activeOpacity={0.85}
                >
                  <Text style={styles.productName} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={styles.productDesc} numberOfLines={2}>
                    {product.description || 'Deskripsi belum tersedia.'}
                  </Text>

                  {/* Price & Add Button */}
                  <View style={styles.priceRow}>
                    <Text style={styles.productPrice}>{formatRupiah(product.price)}</Text>
                    <TouchableOpacity
                      style={styles.addPillButton}
                      onPress={handleOpenCustomizeModal}
                      activeOpacity={0.85}
                    >
                      <Plus size={12} color="#FFFFFF" style={{ marginRight: 2 }} />
                      <Text style={styles.addPillText}>Tambah</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Sticky Bottom Floating Cart Bar */}
      {totalCount > 0 ? (
        <View style={styles.floatingCartContainer}>
          <TouchableOpacity
            style={styles.floatingCartBar}
            onPress={() => router.push('/(main)/cart' as any)}
            activeOpacity={0.9}
          >
            <View style={styles.cartBarLeft}>
              <View style={styles.cartBadgeCircle}>
                <Text style={styles.cartBadgeText}>{totalCount}</Text>
              </View>
              <View style={styles.cartPriceInfo}>
                <Text style={styles.cartLabelText}>Pesanan Keranjang</Text>
                <Text style={styles.cartTotalText}>{formatRupiah(totalAmount)}</Text>
              </View>
            </View>

            <View style={styles.viewCartButton}>
              <Text style={styles.viewCartText}>Lihat Keranjang</Text>
              <ChevronRight size={16} color="#C9A876" style={{ marginLeft: 4 }} />
            </View>
          </TouchableOpacity>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F3EC',
  },
  topHeaderGroup: {
    backgroundColor: '#181F4B',
    paddingTop: 52,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  segmentedContainer: {
    flexDirection: 'row',
    backgroundColor: '#0E1230',
    borderRadius: 24,
    padding: 4,
    marginBottom: 14,
  },
  segmentedPill: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 20,
  },
  segmentedActive: {
    backgroundColor: '#FFFFFF',
  },
  segmentedText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 14,
  },
  segmentedTextActive: {
    color: '#181F4B',
  },
  segmentedTextInactive: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  pickupHeaderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
  },
  storeIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F6F3EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerCardContent: {
    flex: 1,
  },
  headerOutletTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 15,
    color: '#181F4B',
  },
  headerOutletSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#6B7088',
    marginTop: 2,
  },
  deliveryHeaderCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
  },
  deliveryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeIconWrapperSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F6F3EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pinIconWrapperSmall: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#F6F3EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  deliveryRowInfo: {
    flex: 1,
  },
  deliveryLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#6B7088',
  },
  deliveryTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 13,
    color: '#181F4B',
    marginTop: 1,
  },
  dashedLineContainer: {
    marginLeft: 14,
    marginVertical: 4,
  },
  dashedDot: {
    width: 2,
    height: 3,
    backgroundColor: '#E7E8F0',
    marginVertical: 1,
  },
  categoryBarContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E7E8F0',
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  favPillButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  categoryScroll: {
    alignItems: 'center',
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#F4F5F9',
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: '#181F4B',
  },
  categoryPillText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
  },
  categoryTextActive: {
    color: '#C9A876',
  },
  categoryTextInactive: {
    color: '#181F4B',
  },
  searchIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F4F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  searchBarActive: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F4F5F9',
    borderRadius: 18,
    paddingHorizontal: 14,
    height: 40,
  },
  searchInputText: {
    flex: 1,
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#181F4B',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  merchandiseBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F1FD',
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#C5DCFA',
  },
  merchIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  merchTextContent: {
    flex: 1,
  },
  merchTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 15,
    color: '#181F4B',
  },
  merchSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#181F4B',
    marginTop: 2,
    opacity: 0.8,
  },
  sectionGridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionGridTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 18,
    color: '#181F4B',
  },
  totalCountText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#6B7088',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  productCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 6,
    marginBottom: 14,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
  },
  productImageContainer: {
    width: '100%',
    height: 124,
    backgroundColor: '#181F4B',
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#181F4B',
  },
  badgePill: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgePillText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 9,
    color: '#181F4B',
    letterSpacing: 0.5,
  },
  favHeartButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productInfoContainer: {
    padding: 12,
  },
  productName: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 14,
    color: '#181F4B',
  },
  productDesc: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#6B7088',
    marginTop: 2,
    lineHeight: 15,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  productPrice: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 13,
    color: '#181F4B',
  },
  addPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181F4B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  addPillText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 11,
    color: '#FFFFFF',
  },
  floatingCartContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  floatingCartBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#181F4B',
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 14,
    elevation: 8,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 6px 16px rgba(24, 31, 75, 0.3)' }
      : {
          shadowColor: '#181F4B',
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
        }),
  },
  cartBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartBadgeCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#C9A876',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cartBadgeText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 14,
    color: '#181F4B',
  },
  cartPriceInfo: {},
  cartLabelText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  cartTotalText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 16,
    color: '#FFFFFF',
  },
  viewCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewCartText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 13,
    color: '#C9A876',
  },
});
