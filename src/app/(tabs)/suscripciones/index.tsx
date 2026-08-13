import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatCurrency } from '@/utils/money';
import { t } from '@/i18n';
import { AppHeader } from '@/ui/components/AppHeader';
import { ScreenBackground } from '@/ui/components/ScreenBackground';
import { SubscriptionRow } from '@/ui/components/SubscriptionRow';
import { Colors, Spacing, Typography } from '@/ui/theme';
import {
  listSubscriptions,
  type SubscriptionWithRelations,
} from '@/data/repositories/subscriptions';

type CategoryFilter = { id: number; name: string } | null;

export default function SuscripcionesScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ categoryId?: string; categoryName?: string }>();
  const [items, setItems] = useState<SubscriptionWithRelations[]>([]);
  const [activeCategory, setActiveCategory] = useState<CategoryFilter>(
    params.categoryId ? { id: Number(params.categoryId), name: params.categoryName ?? '' } : null,
  );

  const load = useCallback(async () => {
    try {
      const data = await listSubscriptions();
      console.log('[suscripciones] loaded', data.length, 'subs');
      setItems(data);
    } catch (err) {
      console.error('[suscripciones] load error:', err);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    if (params.categoryId) {
      setActiveCategory({ id: Number(params.categoryId), name: params.categoryName ?? '' });
    }
  }, [load, params.categoryId, params.categoryName]));

  const categories = useMemo(() => {
    const seen = new Map<number, { name: string; color: string }>();
    for (const item of items) {
      if (item.category) seen.set(item.category.id, { name: item.category.name, color: item.category.color ?? '#6B52E0' });
    }
    return Array.from(seen.entries()).map(([id, data]) => ({ id, name: data.name, color: data.color }));
  }, [items]);

  const filtered = useMemo(() => items.filter((item) => {
    const matchFilter = activeCategory === null || item.categoryId === activeCategory.id;
    return matchFilter;
  }), [items, activeCategory]);

  const monthlyTotal = useMemo(() => {
    const total = items.reduce((sum, item) => {
      const minor = item.confirmedPriceMinor ?? 0;
      const freq = item.frequency;
      let monthly = minor;
      if (freq === 'yearly') monthly = Math.round(minor / 12);
      else if (freq === 'quarterly') monthly = Math.round(minor / 3);
      else if (freq === 'semiannual') monthly = Math.round(minor / 6);
      else if (freq === 'weekly') monthly = Math.round(minor * 52 / 12);
      return sum + monthly;
    }, 0);
    return total;
  }, [items]);

  // unused — kept for potential future use
  void monthlyTotal;

  return (
    <ScreenBackground paddingBottom={insets.bottom}>
      <AppHeader showNotificationBadge transparent />

      {/* Title + Add */}
      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>{t('subs.title')}</Text>
          {items.length > 0 && (
            <Text style={styles.subtitle}>{t('subs.activeCount', { count: items.length })}</Text>
          )}
        </View>
        <TouchableOpacity
          onPress={() => router.push('/suscripciones/agregar')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#8B72FF', '#6B52E0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addButton}
          >
            <Ionicons name="add" size={20} color={Colors.textInverse} />
            <Text style={styles.addButtonText}>{t('subs.add')}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* Filter chips */}
      <View style={styles.filtersWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filtersContent}>
            <TouchableOpacity
              style={[styles.filterChip, activeCategory === null && styles.filterChipActive]}
              onPress={() => setActiveCategory(null)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterText, activeCategory === null && styles.filterTextActive]}>
                Todas
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => {
              const active = activeCategory?.id === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.filterChip,
                    active
                      ? { borderColor: cat.color, backgroundColor: cat.color }
                      : { borderColor: cat.color + '40', backgroundColor: cat.color + '12' },
                  ]}
                  onPress={() => setActiveCategory(active ? null : cat)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.filterDot, { backgroundColor: active ? '#ffffff99' : cat.color }]} />
                  <Text style={[styles.filterText, active && styles.filterTextActive, !active && { color: cat.color }]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id)}
        style={{ flex: 1 }}
        renderItem={({ item }) => (
          <SubscriptionRow
            item={item}
            onPress={() => router.push({ pathname: '/suscripciones/[id]', params: { id: item.id } })}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="receipt-outline" size={32} color={Colors.textTertiary} />
            </View>
            <Text style={styles.emptyTitle}>Sin suscripciones aún</Text>
            <Text style={styles.emptySubtitle}>Tocá + para agregar tu primera suscripción</Text>
          </View>
        }
        contentContainerStyle={filtered.length === 0 ? styles.emptyContainer : undefined}
      />
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  title: { ...Typography.screenTitle, color: Colors.textPrimary },
  subtitle: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 4 },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    marginTop: 2,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textInverse,
  },

  filtersWrapper: {
    flexShrink: 0,
    marginBottom: Spacing.sm,
  },
  filtersContent: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    alignItems: 'center',
    minHeight: 44,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  filterDot: { width: 7, height: 7, borderRadius: 4 },
  filterChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  filterText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  filterTextActive: { color: '#FFFFFF', fontWeight: '700' },

  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginLeft: 74,
  },

  empty: { alignItems: 'center', paddingTop: Spacing.xxxl, gap: Spacing.sm },
  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle: { ...Typography.sectionTitle, color: Colors.textPrimary },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  emptyContainer: { flexGrow: 1 },
});
