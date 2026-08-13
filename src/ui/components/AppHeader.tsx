import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Typography } from '@/ui/theme';
import { usePriceWatchStore } from '@/services/priceWatchStore';

interface AppHeaderProps {
  showNotificationBadge?: boolean;
  onBack?: () => void;
  transparent?: boolean;
}

export function AppHeader({ showNotificationBadge = false, onBack, transparent = false }: AppHeaderProps) {
  const insets = useSafeAreaInsets();
  const unreadCount = usePriceWatchStore((s) => s.unreadCount);
  const hasBadge = showNotificationBadge && unreadCount > 0;

  if (onBack) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + Spacing.sm }, transparent && styles.transparent]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.75}>
          <Ionicons name="arrow-back" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
        <View style={styles.logoRow}>
          <Image source={require('../../../assets/icon.png')} style={styles.logoImage} />
          <Text style={styles.appName}>STACK</Text>
        </View>
        <View style={styles.placeholder} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.sm }, transparent && styles.transparent]}>
      <View style={styles.logoRow}>
        <Image source={require('../../../assets/icon.png')} style={styles.logoImage} />
        <Text style={styles.appName}>STACK</Text>
      </View>
      <TouchableOpacity
        style={styles.bellButton}
        activeOpacity={0.7}
        onPress={() => router.push('/(tabs)/price-watch')}
      >
        <Ionicons name="notifications-outline" size={24} color={Colors.textPrimary} />
        {hasBadge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  transparent: {
    backgroundColor: 'transparent',
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6B52E0',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  placeholder: { width: 36 },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoImage: {
    width: 32,
    height: 32,
    borderRadius: 8,
  },
  appName: {
    ...Typography.sectionTitle,
    color: Colors.textPrimary,
  },
  bellButton: {
    position: 'relative',
    padding: Spacing.xs,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF5C8A',
    borderWidth: 1.5,
    borderColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFF',
    lineHeight: 11,
  },
});
