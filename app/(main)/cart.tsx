import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  Coffee,
  Flame,
  Snowflake,
} from 'lucide-react-native';

import { useCart } from '@/lib/cart-store';

export default function CartScreen() {
  const router = useRouter();
  const { items, updateQuantity, removeItem, totalCount, totalAmount } = useCart();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(main)/menu' as any);
    }
  };

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  return (
    <View style={styles.container}>
      {/* Top Header Bar */}
      <View style={styles.topHeader}>
        <TouchableOpacity onPress={handleBack} style={styles.backIconButton} activeOpacity={0.7}>
          <ArrowLeft size={20} color="#181F4B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Keranjang Belanja</Text>
        <View style={{ width: 36 }} />
      </View>

      {items.length === 0 ? (
        /* Empty Cart State */
        <View style={styles.emptyContainer}>
          <View style={styles.emptyBadge}>
            <ShoppingBag size={48} color="#C9A876" strokeWidth={1.6} />
          </View>
          <Text style={styles.emptyTitle}>Keranjang Belanja Kosong</Text>
          <Text style={styles.emptySubtitle}>
            Kamu belum menambahkan menu kopi atau minuman pilihanmu ke keranjang.
          </Text>

          <TouchableOpacity
            style={styles.exploreButton}
            onPress={() => router.push('/(main)/menu' as any)}
            activeOpacity={0.85}
          >
            <Coffee size={18} color="#181F4B" style={{ marginRight: 8 }} />
            <Text style={styles.exploreText}>Lihat Menu Coffee</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Active Cart List */
        <View style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
            {/* Header Item Counter */}
            <View style={styles.itemCountHeader}>
              <Text style={styles.itemCountTitle}>Pesanan Kamu ({totalCount} item)</Text>
              <TouchableOpacity
                onPress={() => router.push('/(main)/menu' as any)}
                activeOpacity={0.7}
              >
                <Text style={styles.addMoreText}>+ Tambah Menu Lain</Text>
              </TouchableOpacity>
            </View>

            {/* Cart Item Cards */}
            {items.map((item) => (
              <View key={item.cartId} style={styles.cartCard}>
                <View style={styles.cardTopRow}>
                  {/* Left Icon Badge */}
                  <View style={styles.productIconCircle}>
                    {item.temperature === 'Hot' ? (
                      <Flame size={20} color="#C9576B" />
                    ) : (
                      <Snowflake size={20} color="#3B82F6" />
                    )}
                  </View>

                  {/* Title & Price */}
                  <View style={styles.cardTitleArea}>
                    <Text style={styles.itemTitle}>{item.name}</Text>
                    <Text style={styles.itemPrice}>{formatRupiah(item.subtotal)}</Text>
                  </View>

                  {/* Delete Button */}
                  <TouchableOpacity
                    onPress={() => removeItem(item.cartId)}
                    style={styles.deleteButton}
                    activeOpacity={0.7}
                  >
                    <Trash2 size={18} color="#C9576B" />
                  </TouchableOpacity>
                </View>

                {/* Customization Details Badges */}
                <View style={styles.badgesWrapper}>
                  {/* Temperature */}
                  <View style={styles.optionBadge}>
                    <Text style={styles.optionBadgeText}>{item.temperature}</Text>
                  </View>

                  {/* Ice Level (if Ice) */}
                  {item.temperature === 'Ice' && (
                    <View style={styles.optionBadge}>
                      <Text style={styles.optionBadgeText}>{item.iceLevel}</Text>
                    </View>
                  )}

                  {/* Sugar Level */}
                  <View style={styles.optionBadge}>
                    <Text style={styles.optionBadgeText}>{item.sugarLevel}</Text>
                  </View>

                  {/* Addons */}
                  {item.addons.map((a) => (
                    <View key={a.id} style={styles.addonBadge}>
                      <Text style={styles.addonBadgeText}>+{a.name}</Text>
                    </View>
                  ))}
                </View>

                {/* Notes if any */}
                {item.notes ? (
                  <View style={styles.notesBox}>
                    <Text style={styles.notesLabel}>Catatan: </Text>
                    <Text style={styles.notesContent}>{item.notes}</Text>
                  </View>
                ) : null}

                {/* Bottom Quantity Controls */}
                <View style={styles.cardBottomRow}>
                  <Text style={styles.unitPriceText}>
                    Harga Satuan: {formatRupiah(item.price + item.addons.reduce((s, a) => s + a.price, 0))}
                  </Text>

                  <View style={styles.counterRow}>
                    <TouchableOpacity
                      style={styles.qtyButton}
                      onPress={() => updateQuantity(item.cartId, item.quantity - 1)}
                      activeOpacity={0.8}
                    >
                      <Minus size={14} color="#181F4B" />
                    </TouchableOpacity>

                    <Text style={styles.qtyText}>{item.quantity}</Text>

                    <TouchableOpacity
                      style={styles.qtyButton}
                      onPress={() => updateQuantity(item.cartId, item.quantity + 1)}
                      activeOpacity={0.8}
                    >
                      <Plus size={14} color="#181F4B" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}

            {/* Rincian Ringkasan Biaya Card */}
            <View style={styles.summaryCard}>
              <Text style={styles.summaryCardTitle}>Ringkasan Biaya Pesanan</Text>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal Produk ({totalCount} item)</Text>
                <Text style={styles.summaryValue}>{formatRupiah(totalAmount)}</Text>
              </View>
              <View style={[styles.summaryRow, { marginTop: 8 }]}>
                <Text style={styles.summaryLabel}>Biaya Layanan Aplikasi</Text>
                <Text style={styles.summaryValueFree}>GRATIS</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.summaryRow}>
                <Text style={styles.totalLabel}>Estimasi Total</Text>
                <Text style={styles.totalValue}>{formatRupiah(totalAmount)}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Sticky Bottom Footer */}
          <View style={styles.bottomFooter}>
            <View style={styles.footerPriceInfo}>
              <Text style={styles.footerLabel}>Total Pembayaran</Text>
              <Text style={styles.footerPriceText}>{formatRupiah(totalAmount)}</Text>
            </View>

            <TouchableOpacity
              style={styles.checkoutButton}
              onPress={() => router.push('/(main)/checkout' as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.checkoutText}>Lanjut ke Checkout</Text>
              <ArrowRight size={18} color="#C9A876" style={{ marginLeft: 6 }} />
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
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyBadge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#181F4B',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    elevation: 4,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 4px 12px rgba(24, 31, 75, 0.2)' }
      : {
          shadowColor: '#181F4B',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
        }),
  },
  emptyTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 20,
    color: '#181F4B',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#6B7088',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  exploreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#C9A876',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    marginTop: 28,
  },
  exploreText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 15,
    color: '#181F4B',
  },
  scrollList: {
    padding: 20,
    paddingBottom: 110,
  },
  itemCountHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  itemCountTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 16,
    color: '#181F4B',
  },
  addMoreText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#181F4B',
    textDecorationLine: 'underline',
  },
  cartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F6F3EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardTitleArea: {
    flex: 1,
  },
  itemTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 15,
    color: '#181F4B',
  },
  itemPrice: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 14,
    color: '#181F4B',
    marginTop: 2,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FDF0F2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgesWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
  },
  optionBadge: {
    backgroundColor: '#F4F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  optionBadgeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11,
    color: '#181F4B',
  },
  addonBadge: {
    backgroundColor: '#E8F1FD',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginRight: 6,
    marginBottom: 6,
  },
  addonBadgeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11,
    color: '#181F4B',
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F3EC',
    borderRadius: 10,
    padding: 8,
    marginTop: 6,
  },
  notesLabel: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 11,
    color: '#181F4B',
  },
  notesContent: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#6B7088',
    flex: 1,
  },
  cardBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F4F5F9',
  },
  unitPriceText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#6B7088',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  qtyButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F4F5F9',
    borderWidth: 1,
    borderColor: '#E7E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 14,
    color: '#181F4B',
    marginHorizontal: 10,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
  },
  summaryCardTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 15,
    color: '#181F4B',
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#6B7088',
  },
  summaryValue: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#181F4B',
  },
  summaryValueFree: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 13,
    color: '#3E8A5A',
  },
  divider: {
    height: 1,
    backgroundColor: '#F4F5F9',
    marginVertical: 12,
  },
  totalLabel: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 15,
    color: '#181F4B',
  },
  totalValue: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 16,
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F4F5F9',
  },
  footerPriceInfo: {},
  footerLabel: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 11,
    color: '#6B7088',
  },
  footerPriceText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 18,
    color: '#181F4B',
  },
  checkoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181F4B',
    paddingHorizontal: 20,
    height: 48,
    borderRadius: 24,
  },
  checkoutText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 14,
    color: '#C9A876',
  },
});
