import { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, Easing, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Coffee } from 'lucide-react-native';
import { isAuthenticated } from '@/lib/auth-store';

export default function SplashScreen() {
  const router = useRouter();

  // Animation values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    // Entrance animations (useNativeDriver: false on Web to prevent missing native module warning)
    const isWeb = Platform.OS === 'web';
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: !isWeb,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.back(1.2)),
        useNativeDriver: !isWeb,
      }),
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 2200,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: false, // width animation uses JS driver
      }),
    ]).start();

    // Auto-navigate after ~2.2 seconds
    const timer = setTimeout(async () => {
      const authed = await isAuthenticated();
      if (authed) {
        router.replace('/(main)' as any);
      } else {
        router.replace('/onboarding' as any);
      }
    }, 2200);

    return () => clearTimeout(timer);
  }, [router, fadeAnim, scaleAnim, progressAnim]);

  const barWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Centered Brand Content */}
      <Animated.View
        style={[
          styles.brandContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Brand Logo Circle Badge */}
        <View style={styles.logoCircle}>
          <Coffee size={44} color="#C9A876" strokeWidth={1.8} />
        </View>

        {/* Title */}
        <Text style={styles.titleText}>ER COFFEE LAB</Text>

        {/* Subtitle */}
        <Text style={styles.subtitleText}>CRAFTED. BREWED. SHARED.</Text>
      </Animated.View>

      {/* Bottom Loading Bar */}
      <View style={styles.bottomContainer}>
        <View style={styles.loadingTrack}>
          <Animated.View style={[styles.loadingFill, { width: barWidth }]} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#181F4B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  logoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#0E1230',
    borderWidth: 2,
    borderColor: '#C9A876',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    ...(Platform.OS === 'web'
      ? { boxShadow: '0px 4px 12px rgba(201, 168, 118, 0.25)' }
      : {
          shadowColor: '#C9A876',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 12,
        }),
  },
  titleText: {
    fontFamily: 'AlbertSans_700Bold',
    fontSize: 26,
    color: '#FFFFFF',
    letterSpacing: 2,
    marginTop: 24,
  },
  subtitleText: {
    fontFamily: 'SourceSans3_600SemiBold',
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.55)',
    letterSpacing: 4,
    marginTop: 8,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 64,
    alignItems: 'center',
  },
  loadingTrack: {
    width: 140,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingFill: {
    height: '100%',
    backgroundColor: '#C9A876',
    borderRadius: 2,
  },
});
