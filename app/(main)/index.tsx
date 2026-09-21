import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  ShoppingBag,
  Truck,
  Plus,
  Heart,
  Sparkles,
  MapPin,
  ChevronRight,
  Coffee,
  Utensils,
} from 'lucide-react-native';

import Header from '@/components/Header';
import { getToken } from '@/lib/auth-store';
import { mobileApiFetch } from '@/lib/api-client';
import { Outlet, Product } from '@/types/api';
import { useCart } from '@/lib/cart-store';
import { useOutlet } from '@/lib/outlet-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const { totalCount, totalAmount } = useCart();
  const { selectedOutlet } = useOutlet();
  const [authed, setAuthed] = useState<boolean>(false);
  const [favorites, setFavorites] = useState<Set<number>>(new Set());
  const activeOutlet = selectedOutlet;

  useEffect(() => {
    async function checkToken() {
      const token = await getToken();
      setAuthed(!!token && token.trim().length > 0);
    }
    checkToken();
  }, []);

  // Fetch bestsellers from DB API GET /api/outlets/:id/menu
  const { data: bestsellersData } = useQuery({
    queryKey: ['bestsellers', activeOutlet.id],
    queryFn: async () => {
      try {
        const res = await mobileApiFetch<{ data: Product[] }>(
          `/api/outlets/${activeOutlet.id}/menu`
        );
        const list = res.data ? res.data.filter((p) => p.bestseller || p.isAvailable) : [];
        return Array.isArray(list) ? list : [];
      } catch {
        return [];
      }
    },
  });

  // Fetch nearby outlets from DB API GET /api/outlets
  const { data: nearbyOutletsData } = useQuery({
    queryKey: ['nearby-outlets'],
    queryFn: async () => {
      try {
        const res = await mobileApiFetch<{ data: Outlet[] }>('/api/outlets');
        return Array.isArray(res?.data) ? res.data : [];
      } catch {
        return [];
      }
    },
  });

  const bestsellers = bestsellersData || [];
  const nearbyOutlets = nearbyOutletsData || [];

  // Fetch customer favorites from DB API GET /api/favorites
  const { data: dbFavData } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      try {
        const res = await mobileApiFetch<{ productIds: number[] }>('/api/favorites');
        return Array.isArray(res?.productIds) ? new Set(res.productIds) : new Set<number>();
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
    } catch {
      // Fallback
    }
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

  const handleOpenModal = (product: Product) => {
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

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  return (
    <View style={styles.screenContainer}>
      {/* Header Bar */}
      <Header activeOutlet={activeOutlet} unreadCount={1} />

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Banner Header Promo Top Carousel */}
        <TouchableOpacity
          style={styles.promoBannerCard}
          onPress={() => router.push('/(main)/menu' as any)}
          activeOpacity={0.9}
        >
          <View style={styles.promoBadge}>
            <Sparkles size={12} color="#181F4B" style={{ marginRight: 4 }} />
            <Text style={styles.promoBadgeText}>SPECIAL PROMO</Text>
          </View>
          <Text style={styles.promoTitle}>Soft Launching Disc 25%</Text>
          <Text style={styles.promoSubtitle}>
            Berlaku untuk semua menu di ER Coffee Lab · Khusus Pemesanan App
          </Text>
        </TouchableOpacity>

        {/* Card Welcome State */}
        {authed ? (
          <View style={styles.welcomeCardLogged}>
            <Text style={styles.greetingSub}>Halo, Pelanggan Setia!</Text>
            <Text style={styles.greetingTitle}>Selamat Datang di ERCoffeeLab</Text>
          </View>
        ) : (
          <View style={styles.welcomeCardGuest}>
            <View style={styles.guestTextWrapper}>
              <Text style={styles.guestTitle}>Welcome to ERCoffeeLab!</Text>
              <Text style={styles.guestSubtitle}>Berbagai rasa siap menemani harimu</Text>
            </View>
            <TouchableOpacity
              style={styles.loginPillButton}
              onPress={() => router.push('/(auth)/login' as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.loginPillText}>Login Sekarang</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Dual Big Quick Action Cards (Fore Style: Pick Up vs Delivery) */}
        <View style={styles.quickActionRow}>
          {/* Card 1: Pick Up -> Opens Menu Screen with Pick Up mode */}
          <TouchableOpacity
            style={[styles.quickCard, styles.quickCardNavy]}
            onPress={() => router.push({ pathname: '/(main)/menu', params: { mode: 'pickup' } } as any)}
            activeOpacity={0.85}
          >
            <View style={styles.quickIconCircle}>
              <ShoppingBag size={28} color="#C9A876" strokeWidth={1.8} />
            </View>
            <Text style={styles.quickCardTitleNavy}>Pick Up</Text>
            <Text style={styles.quickCardSubNavy}>Ambil di store tanpa antri</Text>
          </TouchableOpacity>

          {/* Card 2: Delivery -> Opens Menu Screen with Delivery mode */}
          <TouchableOpacity
            style={[styles.quickCard, styles.quickCardCream]}
            onPress={() => router.push({ pathname: '/(main)/menu', params: { mode: 'delivery' } } as any)}
            activeOpacity={0.85}
          >
            <View style={styles.quickIconCircleGold}>
              <Truck size={28} color="#181F4B" strokeWidth={1.8} />
            </View>
            <Text style={styles.quickCardTitleDark}>Delivery</Text>
            <Text style={styles.quickCardSubDark}>Garansi tepat waktu, dijamin!</Text>
          </TouchableOpacity>
        </View>

        {/* Section Bestseller */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Menu Terfavorit</Text>
          <TouchableOpacity onPress={() => router.push('/(main)/menu' as any)}>
            <Text style={styles.seeAllText}>Lihat Semua</Text>
          </TouchableOpacity>
        </View>

        {/* Bestsellers Grid */}
        <View style={styles.gridContainer}>
          {bestsellers.slice(0, 4).map((product) => {
            const isFav = favorites.has(product.id);
            const isBestseller = product.bestseller || (product as any).isBestseller;
            const isNew = (product as any).isNew;
            const badgeLabel = (product as any).badgeText || (isBestseller ? 'BEST SELLER' : isNew ? 'BARU' : null);

            return (
              <View key={product.id} style={styles.productCard}>
                {/* Product Image -> Opens Detail Screen */}
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
                        <Utensils size={32} color="#C9A876" opacity={0.9} />
                      ) : (
                        <Coffee size={32} color="#C9A876" opacity={0.9} />
                      )}
                    </View>
                  )}

                  {/* Badge Label */}
                  {badgeLabel ? (
                    <View
                      style={[
                        styles.bestsellerBadge,
                        isNew && !isBestseller ? { backgroundColor: '#C9576B' } : null,
                      ]}
                    >
                      <Text style={styles.bestsellerBadgeText}>{badgeLabel}</Text>
                    </View>
                  ) : null}

                  {/* Favorite Heart Button */}
                  <TouchableOpacity
                    style={styles.heartButton}
                    onPress={() => toggleFav(product.id)}
                  >
                    <Heart
                      size={14}
                      color={isFav ? '#C9576B' : '#181F4B'}
                      fill={isFav ? '#C9576B' : 'transparent'}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>

                {/* Product Info -> Opens Detail Screen */}
                <TouchableOpacity
                  style={styles.productInfo}
                  onPress={() => handleOpenDetail(product)}
                  activeOpacity={0.85}
                >
                  <Text style={styles.productName} numberOfLines={1}>
                    {product.name}
                  </Text>
                  <Text style={styles.productDesc} numberOfLines={2}>
                    {product.description || 'Deskripsi belum tersedia.'}
                  </Text>

                  <View style={styles.priceRow}>
                    <Text style={styles.productPrice}>{formatRupiah(product.price)}</Text>
                    <TouchableOpacity
                      style={styles.addButton}
                      onPress={() => handleOpenModal(product)}
                      activeOpacity={0.8}
                    >
                      <Plus size={14} color="#FFFFFF" />
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>

        {/* Section Nearby Store */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Outlet Terdekat</Text>
        </View>

        <View style={styles.nearbyList}>
          {nearbyOutlets.map((outlet) => (
            <TouchableOpacity
              key={outlet.id}
              style={styles.nearbyCard}
              onPress={() => router.push('/modal/outlet-picker' as any)}
              activeOpacity={0.85}
            >
              <View style={styles.nearbyIconBadge}>
                <MapPin size={18} color="#181F4B" />
              </View>
              <View style={styles.nearbyInfo}>
                <Text style={styles.nearbyName}>{outlet.name}</Text>
                <Text style={styles.nearbyDetails}>
                  {outlet.distanceKm} km · {outlet.address}
                </Text>
              </View>
              <View
                style={[
                  styles.statusBadge,
                  outlet.isOpen ? styles.statusBadgeOpen : styles.statusBadgeClosed,
                ]}
              >
                <Text
                  style={[
                    styles.statusBadgeText,
                    outlet.isOpen ? styles.statusTextOpen : styles.statusTextClosed,
                  ]}
                >
                  {outlet.isOpen ? 'OPEN NOW' : 'CLOSED'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
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
  screenContainer: {
    flex: 1,
    backgroundColor: '#F6F3EC',
  },
  scrollContainer: {
    paddingBottom: 80,
  },
  promoBannerCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#C9A876',
    borderRadius: 24,
    padding: 20,
    elevation: 4,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 4px 10px rgba(24, 31, 75, 0.15)' }
      : {
          shadowColor: '#181F4B',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 10,
        }),
  },
  promoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#181F4B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  promoBadgeText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 10,
    color: '#C9A876',
    letterSpacing: 1,
  },
  promoTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 20,
    color: '#181F4B',
  },
  promoSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#181F4B',
    marginTop: 4,
    opacity: 0.85,
  },
  welcomeCardLogged: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#181F4B',
    borderRadius: 24,
    padding: 20,
  },
  greetingSub: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  greetingTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 20,
    color: '#FFFFFF',
    marginTop: 4,
  },
  welcomeCardGuest: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  guestTextWrapper: {
    flex: 1,
    marginRight: 12,
  },
  guestTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 16,
    color: '#181F4B',
  },
  guestSubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#6B7088',
    marginTop: 2,
  },
  loginPillButton: {
    backgroundColor: '#181F4B',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  loginPillText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 13,
    color: '#C9A876',
  },
  quickActionRow: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 16,
  },
  quickCard: {
    flex: 1,
    borderRadius: 24,
    padding: 18,
    minHeight: 140,
    justifyContent: 'space-between',
  },
  quickCardNavy: {
    backgroundColor: '#181F4B',
    marginRight: 8,
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
  quickCardCream: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
    marginLeft: 8,
  },
  quickIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(201, 168, 118, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickIconCircleGold: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F6F3EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickCardTitleNavy: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 18,
    color: '#FFFFFF',
  },
  quickCardSubNavy: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  quickCardTitleDark: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 18,
    color: '#181F4B',
  },
  quickCardSubDark: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#6B7088',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginTop: 24,
    marginBottom: 12,
  },
  sectionTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 18,
    color: '#181F4B',
  },
  seeAllText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#181F4B',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 14,
  },
  productCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginHorizontal: 6,
    marginBottom: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E7E8F0',
  },
  productImageContainer: {
    width: '100%',
    height: 120,
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
  bestsellerBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  bestsellerBadgeText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 9,
    color: '#181F4B',
    letterSpacing: 0.5,
  },
  heartButton: {
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
  productInfo: {
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
  nearbyList: {
    paddingHorizontal: 20,
  },
  nearbyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E7E8F0',
  },
  nearbyIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F4F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  nearbyInfo: {
    flex: 1,
  },
  nearbyName: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 14,
    color: '#181F4B',
  },
  nearbyDetails: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 12,
    color: '#6B7088',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusBadgeOpen: {
    backgroundColor: '#EAF5EE',
  },
  statusBadgeClosed: {
    backgroundColor: '#FDF0F2',
  },
  statusBadgeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 10,
  },
  statusTextOpen: {
    color: '#3E8A5A',
  },
  statusTextClosed: {
    color: '#C9576B',
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
