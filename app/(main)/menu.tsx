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
  Plus,
  Heart,
  X,
  Coffee,
  Utensils,
  Sparkles,
} from 'lucide-react-native';

import { mobileApiFetch } from '@/lib/api-client';
import { useCart } from '@/lib/cart-store';
import { useOutlet } from '@/lib/outlet-store';
import { Product } from '@/types/api';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CategoryOption {
  id: string;
  label: string;
}

const FALLBACK_CATEGORIES: CategoryOption[] = [
  { id: 'all', label: 'Semua' },
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

  // Fetch customer favorites from DB API GET /api/favorites
  const { data: dbFavData, refetch: refetchFavorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      try {
        const res = await mobileApiFetch<{ productIds: number[] }>('/api/favorites');
        return Array.isArray(res?.productIds) ? new Set(res.productIds.map(Number)) : new Set<number>();
      } catch {
        return new Set<number>();
      }
    },
    enabled: authed,
  });

  useEffect(() => {
    if (dbFavData) {
      setFavorites(dbFavData);
    }
  }, [dbFavData]);

  const toggleFav = async (id: number) => {
    if (!authed) {
      router.push('/onboarding' as any);
      return;
    }

    const isFav = favorites.has(id);
    setFavorites((prev) => {
      const next = new Set(prev);
      if (isFav) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

    try {
      if (isFav) {
        await mobileApiFetch('/api/favorites', {
          method: 'DELETE',
          body: JSON.stringify({ productId: id }),
        });
      } else {
        await mobileApiFetch('/api/favorites', {
          method: 'POST',
          body: JSON.stringify({ productId: id }),
        });
      }
      refetchFavorites();
    } catch {
      // Fallback
    }
  };

  // Build dynamic categories list (Without redundant 'Rasa Favorit' text pill)
  const categoryPills: CategoryOption[] = [
    { id: 'all', label: 'Semua' },
  ];

  if (dbCategoriesData && dbCategoriesData.length > 0) {
    dbCategoriesData.forEach((cat) => {
      if (cat && cat.name) {
        categoryPills.push({ id: cat.name, label: cat.name });
      }
    });
  } else {
    FALLBACK_CATEGORIES.slice(1).forEach((cat) => {
      categoryPills.push(cat);
    });
  }

  const products = menuData || [];
  const hasFavorites = favorites.size > 0;

  // Filtered datasets
  const favProducts = products.filter((p) => favorites.has(p.id));
  const bestsellerProducts = products.filter((p) => Boolean(p.bestseller || (p as any).isBestseller));
  const newProducts = products.filter((p) => Boolean(p.isNew && !(p.bestseller || (p as any).isBestseller)));

  const filteredSearchResults = products.filter((p) => {
    const pCategory = p.category ? String(p.category) : '';
    const pName = p.name ? String(p.name) : '';
    return (
      searchQuery.trim() === '' ||
      pName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pCategory.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  const handleOpenDetail = (product: Product) => {
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

  const handleOpenCustomizeModal = (product: Product) => {
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

  // Reusable Product Card Component with + button
  const renderProductCard = (product: Product) => {
    const isFav = favorites.has(product.id);
    const isBestseller = Boolean(product.bestseller || (product as any).isBestseller);
    const isNew = Boolean((product as any).isNew);
    const badgeLabel = product.badgeText || (isBestseller ? 'BEST SELLER' : isNew ? 'BARU' : null);

    return (
      <View key={product.id} style={styles.productCard}>
        {/* Image Container -> Opens Detail Screen */}
        <TouchableOpacity
          style={styles.productImageContainer}
          onPress={() => handleOpenDetail(product)}
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
            activeOpacity={0.8}
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
          onPress={() => handleOpenDetail(product)}
          activeOpacity={0.85}
        >
          <Text style={styles.productName} numberOfLines={1}>
            {product.name}
          </Text>
          <Text style={styles.productDesc} numberOfLines={2}>
            {product.description || 'Deskripsi belum tersedia.'}
          </Text>

          {/* Price & Add Button (+) */}
          <View style={styles.priceRow}>
            <Text style={styles.productPrice}>{formatRupiah(product.price)}</Text>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => handleOpenCustomizeModal(product)}
              activeOpacity={0.8}
            >
              <Plus size={14} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    );
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
            {/* Dynamic Star (Best Seller) / Heart (Favorites) Pill Button */}
            <TouchableOpacity
              style={[
                styles.favPillButton,
                selectedCat === 'special' && styles.categoryPillActive,
              ]}
              onPress={() => setSelectedCat(selectedCat === 'special' ? 'all' : 'special')}
              activeOpacity={0.8}
            >
              {hasFavorites ? (
                <Heart
                  size={15}
                  color={selectedCat === 'special' ? '#C9576B' : '#181F4B'}
                  fill={selectedCat === 'special' ? '#C9576B' : 'transparent'}
                />
              ) : (
                <Star
                  size={15}
                  color={selectedCat === 'special' ? '#C9A876' : '#181F4B'}
                  fill={selectedCat === 'special' ? '#C9A876' : 'transparent'}
                />
              )}
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
        {/* CASE 1: SEARCH ACTIVE */}
        {searchQuery.trim() !== '' ? (
          <View>
            <View style={styles.sectionGridHeader}>
              <View style={styles.sectionTitleRow}>
                <Search size={18} color="#181F4B" style={{ marginRight: 6 }} />
                <Text style={styles.sectionGridTitle}>Hasil Pencarian</Text>
              </View>
              <Text style={styles.totalCountText}>{filteredSearchResults.length} item</Text>
            </View>

            {filteredSearchResults.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>Menu tidak ditemukan</Text>
                <Text style={styles.emptySubtitle}>
                  Coba gunakan kata kunci lain untuk mencari menu yang Anda inginkan.
                </Text>
              </View>
            ) : (
              <View style={styles.gridContainer}>
                {filteredSearchResults.map(renderProductCard)}
              </View>
            )}
          </View>
        ) : selectedCat === 'special' ? (
          /* CASE 2: SPECIAL TAB (FAVORIT ATAU BEST SELLER KHUSUS) */
          <View>
            {hasFavorites ? (
              <View>
                <View style={styles.sectionGridHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Heart size={18} color="#C9576B" fill="#C9576B" style={{ marginRight: 6 }} />
                    <Text style={styles.sectionGridTitle}>Menu Favorit Kamu</Text>
                  </View>
                  <Text style={styles.totalCountText}>{favProducts.length} item</Text>
                </View>

                {favProducts.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>Belum ada menu favorit</Text>
                    <Text style={styles.emptySubtitle}>
                      Tekan icon hati pada menu yang Anda sukai untuk menyimpannya di sini.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.gridContainer}>
                    {favProducts.map(renderProductCard)}
                  </View>
                )}
              </View>
            ) : (
              <View>
                <View style={styles.sectionGridHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Star size={18} color="#C9A876" fill="#C9A876" style={{ marginRight: 6 }} />
                    <Text style={styles.sectionGridTitle}>Wajib Dicoba! (Best Seller)</Text>
                  </View>
                  <Text style={styles.totalCountText}>{bestsellerProducts.length} item</Text>
                </View>

                {bestsellerProducts.length === 0 ? (
                  <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>Belum ada menu best seller</Text>
                    <Text style={styles.emptySubtitle}>Silakan jelajahi menu lainnya di toko kami.</Text>
                  </View>
                ) : (
                  <View style={styles.gridContainer}>
                    {bestsellerProducts.map(renderProductCard)}
                  </View>
                )}
              </View>
            )}
          </View>
        ) : selectedCat !== 'all' ? (
          /* CASE 3: SINGLE CATEGORY FILTERED (e.g. 'Coffee') */
          <View>
            {(() => {
              const catItems = products.filter((p) => {
                const pCategory = p.category ? String(p.category).toLowerCase() : '';
                return pCategory === selectedCat.toLowerCase() || pCategory.includes(selectedCat.toLowerCase());
              });

              return (
                <View>
                  <View style={styles.sectionGridHeader}>
                    <View style={styles.sectionTitleRow}>
                      <Coffee size={18} color="#181F4B" style={{ marginRight: 6 }} />
                      <Text style={styles.sectionGridTitle}>{selectedCat}</Text>
                    </View>
                    <Text style={styles.totalCountText}>{catItems.length} item</Text>
                  </View>

                  {catItems.length === 0 ? (
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyTitle}>Belum ada menu untuk kategori ini</Text>
                    </View>
                  ) : (
                    <View style={styles.gridContainer}>
                      {catItems.map(renderProductCard)}
                    </View>
                  )}
                </View>
              );
            })()}
          </View>
        ) : (
          /* CASE 4: DEFAULT 'ALL' VIEW (MEMANJANG KE BAWAH / SECTIONED VERTICAL FLOW) */
          <View>
            {/* Section 1: Menu Favorit Kamu (Jika ada) */}
            {hasFavorites && favProducts.length > 0 && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionGridHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Heart size={18} color="#C9576B" fill="#C9576B" style={{ marginRight: 6 }} />
                    <Text style={styles.sectionGridTitle}>Menu Favorit Kamu</Text>
                  </View>
                  <Text style={styles.totalCountText}>{favProducts.length} item</Text>
                </View>

                <View style={styles.gridContainer}>
                  {favProducts.map(renderProductCard)}
                </View>
              </View>
            )}

            {/* Section 2: Wajib Dicoba! (Best Seller) */}
            {bestsellerProducts.length > 0 && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionGridHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Star size={18} color="#C9A876" fill="#C9A876" style={{ marginRight: 6 }} />
                    <Text style={styles.sectionGridTitle}>Wajib Dicoba!</Text>
                  </View>
                  <Text style={styles.totalCountText}>{bestsellerProducts.length} item</Text>
                </View>

                <View style={styles.gridContainer}>
                  {bestsellerProducts.map(renderProductCard)}
                </View>
              </View>
            )}

            {/* Section 3: Menu Terbaru (New Arrivals) */}
            {newProducts.length > 0 && (
              <View style={styles.sectionBlock}>
                <View style={styles.sectionGridHeader}>
                  <View style={styles.sectionTitleRow}>
                    <Sparkles size={18} color="#C9A876" style={{ marginRight: 6 }} />
                    <Text style={styles.sectionGridTitle}>Menu Terbaru</Text>
                  </View>
                  <Text style={styles.totalCountText}>{newProducts.length} item</Text>
                </View>

                <View style={styles.gridContainer}>
                  {newProducts.map(renderProductCard)}
                </View>
              </View>
            )}

            {/* Section 4, 5, ...: Kategori-Kategori Database */}
            {categoryPills
              .filter((c) => c.id !== 'all')
              .map((cat) => {
                const catItems = products.filter((p) => {
                  const pCategory = p.category ? String(p.category).toLowerCase() : '';
                  return pCategory === cat.id.toLowerCase() || pCategory.includes(cat.id.toLowerCase());
                });

                if (catItems.length === 0) return null;

                return (
                  <View key={cat.id} style={styles.sectionBlock}>
                    <View style={styles.sectionGridHeader}>
                      <View style={styles.sectionTitleRow}>
                        {cat.id.toLowerCase().includes('snack') || cat.id.toLowerCase().includes('food') ? (
                          <Utensils size={18} color="#181F4B" style={{ marginRight: 6 }} />
                        ) : (
                          <Coffee size={18} color="#181F4B" style={{ marginRight: 6 }} />
                        )}
                        <Text style={styles.sectionGridTitle}>{cat.label}</Text>
                      </View>
                      <Text style={styles.totalCountText}>{catItems.length} item</Text>
                    </View>

                    <View style={styles.gridContainer}>
                      {catItems.map(renderProductCard)}
                    </View>
                  </View>
                );
              })}
          </View>
        )}
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
  sectionBlock: {
    marginBottom: 24,
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
  addButton: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: '#181F4B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    paddingVertical: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E7E8F0',
    paddingHorizontal: 20,
    marginVertical: 8,
  },
  emptyTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 15,
    color: '#181F4B',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#6B7088',
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 16,
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
