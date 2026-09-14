import { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  useWindowDimensions,
  FlatList,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Coffee, Sparkles, BadgeCheck } from 'lucide-react-native';

const SLIDES = [
  {
    id: '1',
    title: 'Semua Favoritmu dalam Satu Aplikasi',
    description: 'Praktis pesan kopi dan makanan di ERCoffeeLab App!',
    icon: Coffee,
    badgeText: 'CRAFTED & BREWED',
  },
  {
    id: '2',
    title: 'Kopi Segar Dibuat Khusus Untukmu',
    description: 'Atur ukuran, tingkat kemanisan, dan suhu sesuai selera.',
    icon: Sparkles,
    badgeText: 'CUSTOMIZABLE BREW',
  },
  {
    id: '3',
    title: 'Pesan. Ambil. Nikmati.',
    description: 'Bebas antre. Pesan lebih awal dan pantau pesananmu secara real-time.',
    icon: BadgeCheck,
    badgeText: 'EXPRESS PICKUP',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const screenWidth = width > 0 ? width : 390;
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);
    if (index >= 0 && index < SLIDES.length && index !== activeIndex) {
      setActiveIndex(index);
    }
  };

  const goToSlide = (index: number) => {
    if (index >= 0 && index < SLIDES.length) {
      setActiveIndex(index);
      flatListRef.current?.scrollToOffset({
        offset: index * screenWidth,
        animated: true,
      });
    }
  };

  const handleLogin = () => {
    router.replace('/(auth)/login' as any);
  };

  const handleGuestMode = () => {
    router.replace('/(main)' as any);
  };

  return (
    <View style={styles.container}>
      {/* Hero Visual & Content Carousel */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: screenWidth,
          offset: screenWidth * index,
          index,
        })}
        renderItem={({ item }) => {
          const IconComponent = item.icon;
          return (
            <View style={[styles.slideContainer, { width: screenWidth }]}>
              {/* Fore Style Hero Card Visual */}
              <View style={[styles.heroCard, { width: Math.max(screenWidth - 64, 260) }]}>
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>{item.badgeText}</Text>
                </View>
                <View style={styles.heroCircle}>
                  <IconComponent size={64} color="#C9A876" strokeWidth={1.6} />
                </View>
              </View>

              {/* Title & Subtitle Centered */}
              <Text style={styles.titleText}>{item.title}</Text>
              <Text style={styles.descriptionText}>{item.description}</Text>
            </View>
          );
        }}
      />

      {/* Pagination Dots (3 Dots in Center) */}
      <View style={styles.paginationContainer}>
        {SLIDES.map((_, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => goToSlide(index)}
            activeOpacity={0.7}
            style={styles.dotTouchable}
          >
            <View
              style={[
                styles.dot,
                index === activeIndex ? styles.dotActive : styles.dotInactive,
              ]}
            />
          </TouchableOpacity>
        ))}
      </View>

      {/* Bottom Action Area */}
      <View style={styles.bottomArea}>
        {/* Big Pill Button "Masuk" */}
        <TouchableOpacity
          style={styles.loginPillButton}
          onPress={handleLogin}
          activeOpacity={0.85}
        >
          <Text style={styles.loginPillText}>Masuk</Text>
        </TouchableOpacity>

        {/* Guest Mode Link "Lewati tahap ini" */}
        <TouchableOpacity
          style={styles.skipGuestButton}
          onPress={handleGuestMode}
          activeOpacity={0.7}
        >
          <Text style={styles.skipGuestText}>Lewati tahap ini</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 48,
  },
  slideContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  heroCard: {
    height: 220,
    backgroundColor: '#181F4B',
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    elevation: 8,
    overflow: 'hidden',
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 8px 16px rgba(24, 31, 75, 0.25)' }
      : {
          shadowColor: '#181F4B',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.25,
          shadowRadius: 16,
        }),
  },
  heroBadge: {
    position: 'absolute',
    top: 16,
    backgroundColor: 'rgba(201, 168, 118, 0.15)',
    borderWidth: 1,
    borderColor: '#C9A876',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  heroBadgeText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 10,
    color: '#C9A876',
    letterSpacing: 1,
  },
  heroCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#0E1230',
    borderWidth: 2,
    borderColor: '#C9A876',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
  },
  titleText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 22,
    color: '#181F4B',
    textAlign: 'center',
    lineHeight: 28,
  },
  descriptionText: {
    fontFamily: 'SourceSans3_400Regular',
    fontSize: 14,
    color: '#6B7088',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dotTouchable: {
    padding: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 24,
    backgroundColor: '#181F4B',
  },
  dotInactive: {
    width: 6,
    backgroundColor: '#E1E3EE',
  },
  bottomArea: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: 'center',
  },
  loginPillButton: {
    width: '100%',
    backgroundColor: '#181F4B',
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
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
  loginPillText: {
    fontFamily: 'SourceSans3_700Bold',
    fontSize: 16,
    color: '#C9A876',
    letterSpacing: 0.5,
  },
  skipGuestButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  skipGuestText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 14,
    color: '#6B7088',
    textDecorationLine: 'underline',
  },
});
