import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { MapPin, Bell, ChevronDown, ShoppingBag } from 'lucide-react-native';
import { Outlet } from '@/types/api';
import { useCart } from '@/lib/cart-store';
import { useOutlet } from '@/lib/outlet-store';

interface HeaderProps {
  activeOutlet?: Outlet | null;
  unreadCount?: number;
}

export default function Header({ activeOutlet: propOutlet, unreadCount = 1 }: HeaderProps) {
  const router = useRouter();
  const { totalCount } = useCart();
  const { selectedOutlet } = useOutlet();

  const currentOutlet = propOutlet || selectedOutlet;
  const outletName = currentOutlet?.name || 'ER Coffee Lab Bandung';
  const isOpen = currentOutlet?.isOpen ?? true;

  const handleOpenOutletPicker = () => {
    router.push('/modal/outlet-picker' as any);
  };

  return (
    <View style={styles.headerContainer}>
      {/* Active Outlet Location Picker */}
      <TouchableOpacity
        style={styles.outletSelector}
        onPress={handleOpenOutletPicker}
        activeOpacity={0.8}
      >
        <View style={styles.locationPinBadge}>
          <MapPin size={18} color="#C9A876" strokeWidth={2} />
        </View>

        <View style={styles.outletTextWrapper}>
          <View style={styles.outletNameRow}>
            <Text style={styles.outletName} numberOfLines={1}>
              {outletName}
            </Text>
            <ChevronDown size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
          </View>

          {/* Operating Status Badge */}
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                isOpen ? styles.statusDotOpen : styles.statusDotClosed,
              ]}
            />
            <Text
              style={[
                styles.statusBadgeText,
                isOpen ? styles.statusTextOpen : styles.statusTextClosed,
              ]}
            >
              {isOpen ? 'OPEN NOW' : 'CLOSED'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Right Action Icons Group */}
      <View style={styles.rightHeaderActions}>
        {/* Shopping Cart Button */}
        <TouchableOpacity
          style={styles.cartHeaderButton}
          onPress={() => router.push('/(main)/cart' as any)}
          activeOpacity={0.8}
        >
          <ShoppingBag size={18} color="#C9A876" strokeWidth={2} />
          {totalCount > 0 && (
            <View style={styles.cartBadgeCircle}>
              <Text style={styles.cartBadgeText}>{totalCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Notification Bell Button */}
        <TouchableOpacity style={styles.notificationButton} activeOpacity={0.8}>
          <Bell size={18} color="#FFFFFF" strokeWidth={1.8} />
          {unreadCount > 0 && <View style={styles.unreadBadge} />}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#181F4B',
    paddingTop: 56,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  outletSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  locationPinBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(201, 168, 118, 0.15)',
    borderWidth: 1,
    borderColor: '#C9A876',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  outletTextWrapper: {
    flex: 1,
  },
  outletNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  outletName: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 15,
    color: '#FFFFFF',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  statusDotOpen: {
    backgroundColor: '#3E8A5A',
  },
  statusDotClosed: {
    backgroundColor: '#C9576B',
  },
  statusBadgeText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  statusTextOpen: {
    color: '#8CAE8A',
  },
  statusTextClosed: {
    color: '#E8A0A8',
  },
  rightHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cartHeaderButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    position: 'relative',
  },
  cartBadgeCircle: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#C9A876',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#181F4B',
  },
  cartBadgeText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 10,
    color: '#181F4B',
  },
  notificationButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#C9A876',
    borderWidth: 1.5,
    borderColor: '#181F4B',
  },
});
