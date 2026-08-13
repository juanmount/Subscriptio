import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '@/ui/components/AppHeader';
import { ScreenBackground } from '@/ui/components/ScreenBackground';
import { ProviderAvatar } from '@/ui/components/ProviderAvatar';
import { Colors, Spacing, Typography } from '@/ui/theme';
import { listSubscriptions, type SubscriptionWithRelations } from '@/data/repositories/subscriptions';
import { formatCurrency } from '@/utils/money';
import { t, tArray } from '@/i18n';

const MONTHS = tArray('calendar.months');
const DAY_HEADERS = tArray('calendar.days');

export default function CalendarioScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<SubscriptionWithRelations[]>([]);
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  useFocusEffect(useCallback(() => {
    listSubscriptions().then(setItems);
  }, []));

  const byDay = useMemo(() => {
    const map = new Map<number, SubscriptionWithRelations[]>();
    for (const item of items) {
      if (!item.nextRenewalDate) continue;
      const d = new Date(item.nextRenewalDate);
      if (d.getFullYear() === viewYear && d.getMonth() === viewMonth) {
        const day = d.getDate();
        map.set(day, [...(map.get(day) ?? []), item]);
      }
    }
    return map;
  }, [items, viewYear, viewMonth]);

  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const rawFirst = new Date(viewYear, viewMonth, 1).getDay();
  const firstOffset = (rawFirst + 6) % 7;
  const cells: (number | null)[] = [
    ...Array(firstOffset).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

  const upcoming = useMemo(() =>
    items
      .filter((item) => {
        if (!item.nextRenewalDate) return false;
        const d = new Date(item.nextRenewalDate);
        return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
      })
      .sort((a, b) => (a.nextRenewalDate ?? 0) - (b.nextRenewalDate ?? 0)),
    [items, viewYear, viewMonth]);

  const monthlyTotal = upcoming.reduce((sum, item) => sum + (item.confirmedPriceMinor ?? 0), 0);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  return (
    <ScreenBackground paddingBottom={insets.bottom}>
      <AppHeader transparent />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Month navigation */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={18} color={Colors.textPrimary} />
          </TouchableOpacity>
          <View style={styles.monthCenter}>
            <Text style={styles.monthTitle}>{MONTHS[viewMonth]} {viewYear}</Text>
            {upcoming.length > 0 && (
              <Text style={styles.monthSummary}>
                {upcoming.length} {t('calendar.charges')} · {formatCurrency(monthlyTotal, 'USD', 2)}
              </Text>
            )}
          </View>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-forward" size={18} color={Colors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Calendar grid */}
        <View style={styles.calCard}>
          <View style={styles.dayHeaders}>
            {DAY_HEADERS.map((d, i) => (
              <Text key={i} style={styles.dayHeader}>{d}</Text>
            ))}
          </View>
          <View style={styles.daysGrid}>
            {cells.map((day, idx) => {
              if (!day) return <View key={`e${idx}`} style={styles.dayCell} />;
              const isToday = isCurrentMonth && day === today.getDate();
              const subs = byDay.get(day) ?? [];
              return (
                <TouchableOpacity
                  key={day}
                  style={styles.dayCell}
                  onPress={() => subs.length > 0 && setSelectedDay(day)}
                  activeOpacity={subs.length > 0 ? 0.7 : 1}
                >
                  <View style={[styles.dayInner, isToday && styles.dayToday]}>
                    <Text style={[styles.dayNum, isToday && styles.dayNumToday]}>{day}</Text>
                  </View>
                  {subs.length > 0 && (
                    <View style={styles.dotRow}>
                      {subs.slice(0, 3).map((_, di) => (
                        <View key={di} style={[styles.dot, di > 0 && { marginLeft: 2 }]} />
                      ))}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Renewal list */}
        {upcoming.length > 0 ? (
          <View style={styles.listSection}>
            <Text style={styles.listTitle}>{t('calendar.chargesIn', { month: MONTHS[viewMonth] })}</Text>
            {upcoming.map((item) => {
              const name = item.customName ?? item.provider?.name ?? '—';
              const d = new Date(item.nextRenewalDate!);
              const price = formatCurrency(item.confirmedPriceMinor, item.currencyCode, item.currency?.minorUnit ?? 2);
              return (
                <View key={item.id} style={styles.renewalRow}>
                  <View style={styles.renewalDateBox}>
                    <Text style={styles.renewalDay}>{d.getDate()}</Text>
                    <Text style={styles.renewalMon}>{MONTHS[d.getMonth()].slice(0, 3)}</Text>
                  </View>
                  <ProviderAvatar name={name} size={36} />
                  <View style={styles.renewalInfo}>
                    <Text style={styles.renewalName} numberOfLines={1}>{name}</Text>
                    {item.card && (
                      <Text style={styles.renewalCard}>{item.card.alias} ···{item.card.lastFour}</Text>
                    )}
                  </View>
                  <Text style={styles.renewalPrice}>{price}</Text>
                </View>
              );
            })}
          </View>
        ) : (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={40} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>{t('calendar.noCharges', { month: MONTHS[viewMonth] })}</Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={selectedDay !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDay(null)}
      >
        <Pressable style={styles.dayModalOverlay} onPress={() => setSelectedDay(null)}>
          <Pressable style={styles.dayModalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.dayModalHeader}>
              <Text style={styles.dayModalTitle}>
                {selectedDay} {MONTHS[viewMonth].slice(0, 3)}
              </Text>
              <TouchableOpacity onPress={() => setSelectedDay(null)} hitSlop={12}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
            {(selectedDay !== null ? byDay.get(selectedDay) ?? [] : []).map((item) => {
              const name = item.customName ?? item.provider?.name ?? '—';
              const price = formatCurrency(item.confirmedPriceMinor, item.currencyCode, item.currency?.minorUnit ?? 2);
              return (
                <View key={item.id} style={styles.dayModalRow}>
                  <ProviderAvatar name={name} size={36} />
                  <View style={styles.dayModalInfo}>
                    <Text style={styles.dayModalName} numberOfLines={1}>{name}</Text>
                    {item.card && (
                      <Text style={styles.dayModalCard}>{item.card.alias} ···{item.card.lastFour}</Text>
                    )}
                  </View>
                  <Text style={styles.dayModalPrice}>{price}</Text>
                </View>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </ScreenBackground>
  );
}

const CARD_SHADOW = {
  shadowColor: '#6B52E0',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.07,
  shadowRadius: 8,
  elevation: 2,
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, paddingBottom: 40 },

  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    ...CARD_SHADOW,
  },
  monthCenter: { alignItems: 'center' },
  monthTitle: { fontSize: 18, fontWeight: '700', color: Colors.textPrimary },
  monthSummary: { ...Typography.caption, color: Colors.textSecondary, marginTop: 2 },

  calCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    ...CARD_SHADOW,
  },
  dayHeaders: {
    flexDirection: 'row',
    marginBottom: Spacing.sm,
  },
  dayHeader: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textTertiary,
  },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, alignItems: 'center', marginBottom: 6 },
  dayInner: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayToday: { backgroundColor: Colors.primary },
  dayNum: { fontSize: 13, color: Colors.textPrimary, fontWeight: '500' },
  dayNumToday: { color: '#FFF', fontWeight: '700' },
  dotRow: { flexDirection: 'row', marginTop: 2 },
  dot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.primary },

  listSection: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: Spacing.md,
    ...CARD_SHADOW,
  },
  listTitle: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary, marginBottom: Spacing.md },
  renewalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  renewalDateBox: { width: 36, alignItems: 'center' },
  renewalDay: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  renewalMon: { fontSize: 10, fontWeight: '500', color: Colors.textTertiary, textTransform: 'uppercase' },
  renewalInfo: { flex: 1 },
  renewalName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  renewalCard: { fontSize: 11, color: Colors.textTertiary, marginTop: 1 },
  renewalPrice: { fontSize: 14, fontWeight: '700', color: Colors.primary },

  empty: { alignItems: 'center', paddingVertical: Spacing.xxxl, gap: Spacing.sm },
  emptyText: { ...Typography.body, color: Colors.textTertiary },

  dayModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  dayModalSheet: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 360,
  },
  dayModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  dayModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dayModalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  dayModalInfo: { flex: 1 },
  dayModalName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  dayModalCard: { fontSize: 11, color: Colors.textTertiary, marginTop: 1 },
  dayModalPrice: { fontSize: 14, fontWeight: '700', color: Colors.primary },
});
