import React, { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Colors } from '@/ui/theme';
import { useAuthStore } from '@/services/authStore';
import { usePathname } from 'expo-router';
import { runSeedIfNeeded } from '@/data/seed/supabase-seed';
import { loadCurrencies } from '@/data/repositories/currencies';
import { loadPreferredLocale, setLocale } from '@/i18n';
import { initRevenueCat } from '@/services/revenueCatService';

function AuthGate({ children }: { children: React.ReactNode }) {
  const { user, isInitialized, init } = useAuthStore();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = init();
    return unsubscribe;
  }, [init]);

  useEffect(() => {
    if (!isInitialized) return;
    const publicRoutes = ['/login', '/crear-cuenta'];
    if (!user && !publicRoutes.includes(pathname)) {
      router.replace('/login');
    }
    if (user && pathname === '/login') {
      router.replace('/(tabs)');
    }
    if (user) {
      loadCurrencies().catch((err) => console.error('[Currencies]', err));
      runSeedIfNeeded().catch((err) => console.error('[Seed]', err));
      loadPreferredLocale().then((saved) => { if (saved) setLocale(saved); }).catch(() => {});
    }
  }, [user, isInitialized, pathname]);

  if (!isInitialized) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  useEffect(() => { initRevenueCat(); }, []);
  return (
    <SafeAreaProvider>
      <AuthGate>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="crear-cuenta" options={{ headerShown: false }} />
        </Stack>
      </AuthGate>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
