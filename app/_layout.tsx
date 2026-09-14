import { useEffect } from 'react';
import { View, StyleSheet, useColorScheme, LogBox, Platform } from 'react-native';
import { Stack, DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { CartProvider } from '@/lib/cart-store';
import { OutletProvider } from '@/lib/outlet-store';

import {
  AlbertSans_400Regular,
  AlbertSans_600SemiBold,
  AlbertSans_700Bold,
} from '@expo-google-fonts/albert-sans';
import {
  SourceSans3_400Regular,
  SourceSans3_600SemiBold,
  SourceSans3_700Bold,
} from '@expo-google-fonts/source-sans-3';

// Suppress internal web deprecation warnings from React Native Web / React Navigation
if (__DEV__ && Platform.OS === 'web') {
  LogBox.ignoreLogs([
    'props.pointerEvents is deprecated',
    '"shadow*" style props are deprecated',
    'Image: style.resizeMode is deprecated',
  ]);
  if (typeof window !== 'undefined') {
    const originalWarn = console.warn;
    console.warn = (...args: any[]) => {
      if (
        typeof args[0] === 'string' &&
        (args[0].includes('pointerEvents is deprecated') ||
          args[0].includes('shadow* style props') ||
          args[0].includes('style.resizeMode is deprecated'))
      ) {
        return;
      }
      originalWarn(...args);
    };
  }
}

// Prevent splash screen from auto hiding until fonts load
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});

export default function RootLayout() {
  const colorScheme = useColorScheme();

  const [fontsLoaded, fontError] = useFonts({
    AlbertSans_400Regular,
    AlbertSans_600SemiBold,
    AlbertSans_700Bold,
    SourceSans3_400Regular,
    SourceSans3_600SemiBold,
    SourceSans3_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <OutletProvider>
          <CartProvider>
            <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
              {Platform.OS === 'web' ? (
                <View style={styles.webOuterContainer}>
                  <View style={styles.webInnerContainer}>
                    <Stack screenOptions={{ headerShown: false }} />
                  </View>
                </View>
              ) : (
                <Stack screenOptions={{ headerShown: false }} />
              )}
            </ThemeProvider>
          </CartProvider>
        </OutletProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  webOuterContainer: {
    flex: 1,
    backgroundColor: '#0E1230',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh' as any,
    width: '100%',
  },
  webInnerContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    backgroundColor: '#FFFFFF',
    minHeight: '100vh' as any,
    ...(Platform.OS === 'web' ? ({ boxShadow: '0 0 40px rgba(0, 0, 0, 0.45)' } as any) : {}),
  },
});

