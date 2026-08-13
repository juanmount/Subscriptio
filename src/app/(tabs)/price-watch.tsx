import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppHeader } from '@/ui/components/AppHeader';
import { ScreenBackground } from '@/ui/components/ScreenBackground';
import { formatCurrency } from '@/utils/money';
import { Colors, Spacing, Typography } from '@/ui/theme';
import { t } from '@/i18n';
import { usePriceWatchStore } from '@/services/priceWatchStore';
import type { PriceAlert, PriceChangeDirection } from '@/domain/price-watch';

const CARD_SHADOW = {
  shadowColor: '#6B52E0',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 3,
};

function directionColor(dir: PriceChangeDirection): string {
  if (dir === 'increase') return Colors.error;
  if (dir === 'decrease') return Colors.success;
  return Colors.primary;
}

function directionIcon(dir: PriceChangeDirection): string {
  if (dir === 'increase') return 'arrow-up';
  if (dir === 'decrease') return 'arrow-down';
  return 'pricetag';
}

function directionLabel(dir: PriceChangeDirection): string {
  if (dir === 'increase') return 'Subió';
  if (dir === 'decrease') return 'Bajó';
  return 'Nuevo precio';
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor(diff / 60000);
  if (days > 0) return `hace ${days}d`;
  if (hours > 0) return `hace ${hours}h`;
  if (mins > 0) return `hace ${mins}min`;
  return 'ahora';
}

function AlertCard({ alert, onRead, onDismiss }: {
  alert: PriceAlert;
  onRead: (id: number) => void;
  onDismiss: (id: number) => void;
}) {
  const color = directionColor(alert.direction);
  const icon = directionIcon(alert.direction);
  const label = directionLabel(alert.direction);

  return (
    <Pressable onPress={() => !alert.isRead && onRead(alert.id)} style={styles.alertCard}>
      <View style={[styles.alertIcon, { backgroundColor: `${color}15` }]}>
        <Ionicons name={icon as any} size={18} color={color} />
      </View>
      <View style={styles.alertBody}>
        <View style={styles.alertHeader}>
          <Text style={styles.alertProvider}>{alert.providerName}</Text>
          {!alert.isRead && <View style={styles.unreadDot} />}
        </View>
        <Text style={styles.alertPlan}>
          {alert.planName ?? 'Plan'} · {label}
        </Text>
        <View style={styles.priceRow}>
          {alert.oldPriceMinor !== null && (
            <Text style={styles.oldPrice}>{formatCurrency(alert.oldPriceMinor, alert.currencyCode)}</Text>
          )}
          <Ionicons name="arrow-forward" size={12} color={Colors.textTertiary} />
          <Text style={[styles.newPrice, { color }]}>{formatCurrency(alert.newPriceMinor, alert.currencyCode)}</Text>
        </View>
        <Text style={styles.alertTime}>{timeAgo(alert.detectedAt)}</Text>
      </View>
      <TouchableOpacity onPress={() => onDismiss(alert.id)} style={styles.dismissBtn}>
        <Ionicons name="close" size={16} color={Colors.textTertiary} />
      </TouchableOpacity>
    </Pressable>
  );
}

export default function PriceWatchScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { alerts, unreadCount, isLoading, loadAlerts, markAsRead, markAllAsRead, dismiss } = usePriceWatchStore();

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleRefresh = useCallback(() => {
    loadAlerts();
  }, [loadAlerts]);

  return (
    <ScreenBackground paddingBottom={insets.bottom}>
      <AppHeader transparent />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={handleRefresh} tintColor={Colors.primary} />}
      >
        <View style={styles.titleArea}>
          <Text style={styles.screenTitle}>Price Watch</Text>
          <Text style={styles.screenSubtitle}>
            {alerts.length > 0
              ? t('priceWatch.unread', { unread: unreadCount, total: alerts.length })
              : t('priceWatch.monitoring')}
          </Text>
        </View>

        {alerts.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="pulse-outline" size={40} color={Colors.primary} />
            </View>
            <Text style={styles.emptyTitle}>{t('priceWatch.empty.title')}</Text>
            <Text style={styles.emptyText}>
              {t('priceWatch.empty.desc')}
            </Text>
          </View>
        ) : (
          <>
            {unreadCount > 0 && (
              <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
                <Ionicons name="checkmark-done-outline" size={16} color={Colors.primary} />
                <Text style={styles.markAllText}>{t('priceWatch.markAllRead')}</Text>
              </TouchableOpacity>
            )}

            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onRead={markAsRead}
                onDismiss={dismiss}
              />
            ))}
          </>
        )}
      </ScrollView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl },

  titleArea: { paddingTop: Spacing.sm, paddingBottom: Spacing.lg },
  screenTitle: { fontSize: 32, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -1 },
  screenSubtitle: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },

  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl * 2,
    gap: Spacing.md,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.sm,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  emptyText: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 20,
  },

  markAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    alignSelf: 'flex-end',
    marginBottom: Spacing.md,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.sm,
  },
  markAllText: { fontSize: 13, fontWeight: '600', color: Colors.primary },

  alertCard: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
    ...CARD_SHADOW,
  },
  alertIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertBody: { flex: 1 },
  alertHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.xs },
  alertProvider: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  alertPlan: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: Spacing.xs },
  oldPrice: { fontSize: 14, color: Colors.textTertiary, textDecorationLine: 'line-through' },
  newPrice: { fontSize: 16, fontWeight: '700' },
  alertTime: { fontSize: 11, color: Colors.textTertiary, marginTop: Spacing.xs },
  dismissBtn: { padding: Spacing.xs, alignSelf: 'flex-start' },
});
