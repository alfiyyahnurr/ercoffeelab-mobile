import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { isAuthenticated } from '@/lib/auth-store';

export default function AuthLayout() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      const authed = await isAuthenticated();
      if (authed) {
        router.replace('/(main)' as any);
      } else {
        setChecking(false);
      }
    }
    checkAuth();
  }, [router]);

  if (checking) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F6F3EC' }}>
        <ActivityIndicator size="large" color="#181F4B" />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
