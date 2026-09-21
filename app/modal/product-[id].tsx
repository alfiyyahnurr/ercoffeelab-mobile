import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import {
  X,
  Flame,
  Snowflake,
  Plus,
  Minus,
  Check,
  Coffee,
  ShoppingBag,
} from 'lucide-react-native';
import { useCart, CartAddon } from '@/lib/cart-store';
import { mobileApiFetch } from '@/lib/api-client';

interface ApiProductDetail {
  id: number;
  name: string;
  type: 'beverage' | 'food';
  basePrice: number;
  description?: string;
  imageUrl?: string;
  addons?: Array<{ id: number; name: string; extraPrice: number }>;
}

export default function ProductCustomizationModal() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    id?: string;
    name?: string;
    price?: string;
    desc?: string;
    imageUrl?: string;
    type?: string;
  }>();
  const { addItem } = useCart();

  const productId = params.id ? parseInt(params.id, 10) : 1;

  // Fetch real product details & addons from DB API GET /api/products/:id
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
  });

  const productName = dbProduct?.name || params.name || 'Kopi Susu Gula Aren';
  const basePrice = dbProduct?.basePrice || (params.price ? parseInt(params.price, 10) : 25000);
  const description =
    dbProduct?.description ||
    params.desc ||
    'House signature: espresso blend khas ER Coffee Lab dipadukan dengan bahan segar berkualitas tinggi.';
  const rawImageUrl = dbProduct?.imageUrl || params.imageUrl || null;
  const productType = dbProduct?.type || (params.type as 'beverage' | 'food') || 'beverage';

  const defaultBeverageImage =
    'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80';
  const defaultFoodImage =
    'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=800&auto=format&fit=crop&q=80';

  const displayImageUrl =
    rawImageUrl && rawImageUrl.trim().length > 0
      ? rawImageUrl.trim()
      : productType === 'food'
      ? defaultFoodImage
      : defaultBeverageImage;

  const availableAddons: CartAddon[] =
    dbProduct?.addons && dbProduct.addons.length > 0
      ? dbProduct.addons.map((a) => ({
          id: String(a.id),
          name: a.name,
          price: a.extraPrice,
        }))
      : [];

  // Customization state
  const [temperature, setTemperature] = useState<'Hot' | 'Ice'>('Ice');
  const [iceLevel, setIceLevel] = useState<'Normal' | 'Less Ice' | 'Extra Ice'>('Normal');
  const [sugarLevel, setSugarLevel] = useState<'Normal' | 'Less Sugar' | 'Extra Sweet' | 'No Sugar'>('Normal');
  const [selectedAddons, setSelectedAddons] = useState<CartAddon[]>([]);
  const [notes, setNotes] = useState('');
  const [quantity, setQuantity] = useState(1);

  const toggleAddon = (addon: CartAddon) => {
    setSelectedAddons((prev) => {
      const exists = prev.some((a) => a.id === addon.id);
      if (exists) {
        return prev.filter((a) => a.id !== addon.id);
      }
      return [...prev, addon];
    });
  };

  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const unitPrice = basePrice + addonsTotal;
  const subtotal = unitPrice * quantity;

  const handleAddToCart = () => {
    addItem({
      productId,
      name: productName,
      price: basePrice,
      temperature: productType === 'beverage' ? temperature : undefined,
      iceLevel: productType === 'beverage' && temperature === 'Ice' ? iceLevel : undefined,
      sugarLevel: productType === 'beverage' ? sugarLevel : undefined,
      addons: selectedAddons,
      notes: notes.trim(),
      quantity,
    });

    router.push('/(main)/cart' as any);
  };

  const formatRupiah = (val: number) => {
    return 'Rp ' + val.toLocaleString('id-ID');
  };

  return (
    <View style={styles.container}>
      {/* Top Modal Close Button */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          style={styles.closeIconButton}
          onPress={() => (router.canGoBack() ? router.back() : router.replace('/(main)/menu' as any))}
        >
          <X size={20} color="#181F4B" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kustomisasi Menu</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
        {/* Large Product Hero Header Box */}
        <View style={styles.productHeroBox}>
          <Image source={{ uri: displayImageUrl }} style={styles.heroImage} resizeMode="cover" />
        </View>

        {/* Product Details Header */}
        <View style={styles.detailsGroup}>
          <Text style={styles.productTitle}>{productName}</Text>
          <Text style={styles.productDesc}>{description}</Text>
          <Text style={styles.basePriceText}>{formatRupiah(basePrice)}</Text>
        </View>

        {/* Option Group khusus Minuman (beverage): Suhu Penyajian, Ice Level, & Sugar Level */}
        {productType === 'beverage' && (
          <>
            {/* Option Group 1: Temperature (Panas vs Dingin) */}
            <View style={styles.sectionGroup}>
              <Text style={styles.sectionTitle}>Suhu Penyajian</Text>
              <View style={styles.rowOptions}>
                <TouchableOpacity
                  style={[
                    styles.optionCardFlex,
                    temperature === 'Hot' && styles.optionCardActive,
                  ]}
                  onPress={() => setTemperature('Hot')}
                  activeOpacity={0.8}
                >
                  <Flame
                    size={18}
                    color={temperature === 'Hot' ? '#C9576B' : '#181F4B'}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      temperature === 'Hot' && styles.optionTextActive,
                    ]}
                  >
                    Panas (Hot)
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.optionCardFlex,
                    temperature === 'Ice' && styles.optionCardActive,
                  ]}
                  onPress={() => setTemperature('Ice')}
                  activeOpacity={0.8}
                >
                  <Snowflake
                    size={18}
                    color={temperature === 'Ice' ? '#3B82F6' : '#181F4B'}
                    style={{ marginRight: 8 }}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      temperature === 'Ice' && styles.optionTextActive,
                    ]}
                  >
                    Dingin (Ice)
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Option Group 2: Ice Level (Hanya jika Dingin) */}
            {temperature === 'Ice' && (
              <View style={styles.sectionGroup}>
                <Text style={styles.sectionTitle}>Tingkat Es (Ice Level)</Text>
                <View style={styles.pillsRow}>
                  {(['Normal', 'Less Ice', 'Extra Ice'] as const).map((level) => {
                    const isSelected = iceLevel === level;
                    return (
                      <TouchableOpacity
                        key={level}
                        style={[styles.pillOption, isSelected && styles.pillOptionActive]}
                        onPress={() => setIceLevel(level)}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                          {level === 'Normal' ? 'Normal Ice' : level}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Option Group 3: Sugar Level */}
            <View style={styles.sectionGroup}>
              <Text style={styles.sectionTitle}>Tingkat Gula (Sugar Level)</Text>
              <View style={styles.pillsRowWrap}>
                {(['Normal', 'Less Sugar', 'Extra Sweet', 'No Sugar'] as const).map((level) => {
                  const isSelected = sugarLevel === level;
                  return (
                    <TouchableOpacity
                      key={level}
                      style={[styles.pillOption, isSelected && styles.pillOptionActive]}
                      onPress={() => setSugarLevel(level)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.pillText, isSelected && styles.pillTextActive]}>
                        {level === 'Normal' ? 'Normal Sugar' : level}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </>
        )}

        {/* Option Group 4: Addons / Topping Checkboxes */}
        {availableAddons.length > 0 ? (
          <View style={styles.sectionGroup}>
            <Text style={styles.sectionTitle}>Tambahan Topping (Opsional)</Text>
            {availableAddons.map((addon) => {
              const isChecked = selectedAddons.some((a) => a.id === addon.id);
              return (
                <TouchableOpacity
                  key={addon.id}
                  style={[styles.addonRow, isChecked && styles.addonRowChecked]}
                  onPress={() => toggleAddon(addon)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.checkboxBox, isChecked && styles.checkboxChecked]}>
                    {isChecked && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                  </View>
                  <Text style={styles.addonName}>{addon.name}</Text>
                  <Text style={styles.addonPrice}>+{formatRupiah(addon.price)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        {/* Option Group 5: Special Notes */}
        <View style={styles.sectionGroup}>
          <Text style={styles.sectionTitle}>Catatan Pesanan Khusus</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="Contoh: Tanpa sedotan plastik, gula dipisah..."
            placeholderTextColor="#9AA0A6"
            value={notes}
            onChangeText={setNotes}
            maxLength={100}
          />
        </View>

        {/* Quantity Counter Bar */}
        <View style={styles.quantityBar}>
          <Text style={styles.quantityLabel}>Jumlah Pesanan</Text>
          <View style={styles.counterRow}>
            <TouchableOpacity
              style={[styles.counterButton, quantity <= 1 && styles.counterDisabled]}
              onPress={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              activeOpacity={0.8}
            >
              <Minus size={16} color={quantity <= 1 ? '#9AA0A6' : '#181F4B'} />
            </TouchableOpacity>

            <Text style={styles.quantityText}>{quantity}</Text>

            <TouchableOpacity
              style={styles.counterButton}
              onPress={() => setQuantity((q) => q + 1)}
              activeOpacity={0.8}
            >
              <Plus size={16} color="#181F4B" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Action Button */}
      <View style={styles.bottomFooter}>
        <TouchableOpacity
          style={styles.addToCartButton}
          onPress={handleAddToCart}
          activeOpacity={0.85}
        >
          <ShoppingBag size={18} color="#C9A876" style={{ marginRight: 8 }} />
          <Text style={styles.addToCartText}>
            Tambah ke Keranjang - {formatRupiah(subtotal)}
          </Text>
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
  scrollList: {
    padding: 20,
    paddingBottom: 120,
  },
  productHeroBox: {
    height: 180,
    borderRadius: 24,
    backgroundColor: '#181F4B',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 4,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 4px 12px rgba(24, 31, 75, 0.15)' }
      : {
          shadowColor: '#181F4B',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.15,
          shadowRadius: 8,
        }),
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#0E1230',
    borderWidth: 2,
    borderColor: '#C9A876',
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailsGroup: {
    marginBottom: 24,
  },
  productTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 22,
    color: '#181F4B',
  },
  productDesc: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 13,
    color: '#6B7088',
    marginTop: 4,
    lineHeight: 19,
  },
  basePriceText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 18,
    color: '#181F4B',
    marginTop: 10,
  },
  sectionGroup: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 15,
    color: '#181F4B',
    marginBottom: 12,
  },
  rowOptions: {
    flexDirection: 'row',
  },
  optionCardFlex: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F6F3EC',
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
    borderRadius: 16,
    paddingVertical: 14,
    marginRight: 8,
  },
  optionCardActive: {
    borderColor: '#181F4B',
    backgroundColor: '#FFFFFF',
  },
  optionText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#6B7088',
  },
  optionTextActive: {
    color: '#181F4B',
    fontFamily: 'SourceSans3_700Bold',
  },
  pillsRow: {
    flexDirection: 'row',
  },
  pillsRowWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  pillOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: '#F6F3EC',
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
    marginRight: 8,
    marginBottom: 8,
  },
  pillOptionActive: {
    borderColor: '#181F4B',
    backgroundColor: '#181F4B',
  },
  pillText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 13,
    color: '#181F4B',
  },
  pillTextActive: {
    color: '#C9A876',
    fontFamily: 'SourceSans3_700Bold',
  },
  addonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F6F3EC',
    borderRadius: 16,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
  },
  addonRowChecked: {
    borderColor: '#181F4B',
    backgroundColor: '#FFFFFF',
  },
  checkboxBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#9AA0A6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#181F4B',
    borderColor: '#181F4B',
  },
  addonName: {
    flex: 1,
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#181F4B',
  },
  addonPrice: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 13,
    color: '#181F4B',
  },
  notesInput: {
    backgroundColor: '#F4F5F9',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#181F4B',
    borderWidth: 1,
    borderColor: '#E7E8F0',
  },
  quantityBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F6F3EC',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#E7E8F0',
    marginTop: 8,
  },
  quantityLabel: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 15,
    color: '#181F4B',
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  counterButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterDisabled: {
    backgroundColor: '#F4F5F9',
    borderColor: '#E1E3EE',
  },
  quantityText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 16,
    color: '#181F4B',
    marginHorizontal: 16,
  },
  bottomFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F4F5F9',
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#181F4B',
    height: 56,
    borderRadius: 28,
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
  addToCartText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 16,
    color: '#C9A876',
  },
});
