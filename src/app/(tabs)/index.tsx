import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '@/ui/components/AppHeader';
import { ScreenBackground } from '@/ui/components/ScreenBackground';
import { ProviderAvatar } from '@/ui/components/ProviderAvatar';
import { DonutChart, type DonutSegment } from '@/ui/components/DonutChart';
import { SparkChart, type SparkPoint } from '@/ui/components/SparkChart';
import { Colors, Spacing, Typography, Radius } from '@/ui/theme';
import { listSubscriptions, type SubscriptionWithRelations } from '@/data/repositories/subscriptions';
import { usePriceWatchStore } from '@/services/priceWatchStore';
import { getExtrasMonthTotal, getMonthExtras, type ExtraPurchase } from '@/data/repositories/extraPurchases';
import { formatCurrency } from '@/utils/money';
import { formatShortDate, frequencyLabel } from '@/utils/date';
import { t, tArray } from '@/i18n';
import { OnboardingModal } from '@/ui/components/OnboardingModal';
import { PaywallModal } from '@/ui/components/PaywallModal';
import { hasCompletedOnboarding, getPreferredCategories, saveOnboardingPreferences } from '@/services/onboardingPrefs';
import { usePaywallStore } from '@/services/paywallStore';
import { useAuthStore } from '@/services/authStore';
import { listCategories, type CategoryRow } from '@/data/repositories/categories';
import { totalMonthly, totalAnnual, totalMonthlyByCurrency, totalAnnualByCurrency, groupByCategory, upcomingRenewals } from '@/domain/finance';
import type { Subscription } from '@/domain/types';

const CAT_GRADIENT: Record<string, [string, string]> = {
  'IA':                  ['#B4A0FF', '#7B5EE0'],
  'Entretenimiento':     ['#7FE8A0', '#34C759'],
  'Productividad':       ['#80C0FF', '#2B6ED4'],
  'Desarrollo':          ['#FFB87A', '#F97316'],
  'Almacenamiento':      ['#FFE080', '#B07800'],
  'Salud y Fitness':     ['#80E8C8', '#00875A'],
  'Educación':           ['#80BCFF', '#0066CC'],
  'Seguridad':           ['#FFB070', '#CC6600'],
  'Diseño y Creatividad':['#FFA0E0', '#CC0066'],
  'Otras':               ['#B0B0C0', '#666666'],
  'Finanzas':            ['#80D4A0', '#2E7D32'],
  'Marketing':           ['#FF9EC0', '#E91E63'],
};

const CAT_COLOR: Record<string, string> = {
  'IA':                  '#7B5EE0',
  'Entretenimiento':     '#34C759',
  'Productividad':       '#2B6ED4',
  'Desarrollo':          '#F97316',
  'Almacenamiento':      '#B07800',
  'Salud y Fitness':     '#00875A',
  'Educación':           '#0066CC',
  'Seguridad':           '#CC6600',
  'Diseño y Creatividad':'#CC0066',
  'Otras':               '#666666',
  'Finanzas':            '#2E7D32',
  'Marketing':           '#E91E63',
};

const CAT_BG: Record<string, string> = {
  'IA':                  '#EDE9FF',
  'Entretenimiento':     '#E3F9E5',
  'Productividad':       '#E5F0FF',
  'Desarrollo':          '#FFF0E5',
  'Almacenamiento':      '#FFF8E5',
  'Salud y Fitness':     '#E5FFF5',
  'Educación':           '#E5F0FF',
  'Seguridad':           '#FFF4E5',
  'Diseño y Creatividad':'#FFE5F5',
  'Otras':               '#F0F0F2',
  'Finanzas':            '#E5F5EA',
  'Marketing':           '#FFE5EF',
};

const DOW_SHORT = tArray('calendar.dowShort');
const MONTH_SHORT = tArray('calendar.monthsShort');

function toFinanceDomain(s: SubscriptionWithRelations): Subscription {
  return {
    id: s.id,
    providerId: s.providerId ?? null,
    customName: s.customName ?? null,
    planId: s.planId ?? null,
    customPlanName: null,
    confirmedPriceMinor: s.confirmedPriceMinor,
    currencyCode: s.currencyCode,
    convertedPriceMinor: null,
    convertedCurrencyCode: null,
    exchangeRate: null,
    exchangeRateDate: null,
    exchangeRateSource: null,
    frequency: s.frequency as Subscription['frequency'],
    nextRenewalDate: s.nextRenewalDate ?? null,
    startDate: null,
    categoryId: s.categoryId ?? null,
    cardId: s.cardId ?? null,
    creditsIncluded: null,
    isActive: s.isActive ?? true,
    dataOrigin: (s.dataOrigin ?? 'manual') as Subscription['dataOrigin'],
    notes: null,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

const CARD_SHADOW = {
  shadowColor: '#6B52E0',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 3,
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<SubscriptionWithRelations[]>([]);
  const [extrasMonthTotal, setExtrasMonthTotal] = useState(0);
  const [monthExtras, setMonthExtras] = useState<ExtraPurchase[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingCategories, setOnboardingCategories] = useState<CategoryRow[]>([]);
  const { isPaid, showPaywall, setShowPaywall, checkPaidStatus, setSubCount } = usePaywallStore();
  const { user } = useAuthStore();
  const userDisplayName = user?.displayName ?? (user?.email ? user.email.split('@')[0].charAt(0).toUpperCase() + user.email.split('@')[0].slice(1) : '');
  const { alerts, unreadCount, loadAlerts, markAsRead, dismiss } = usePriceWatchStore();

  useFocusEffect(
    useCallback(() => {
      listSubscriptions().then(setItems);
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).getTime();
      getExtrasMonthTotal(start, end).then(setExtrasMonthTotal);
      getMonthExtras(start, end).then(setMonthExtras);
      loadAlerts();

      // Check paywall status
      checkPaidStatus();

      // Check onboarding
      (async () => {
        const completed = await hasCompletedOnboarding();
        if (!completed) {
          const cats = await listCategories();
          setOnboardingCategories(cats);
          setShowOnboarding(true);
        }
      })();

      // Update sub count for paywall
      listSubscriptions().then((subs) => setSubCount(subs.length));
    }, [loadAlerts, checkPaidStatus, setSubCount]),
  );

  const domainItems = items.map(toFinanceDomain);
  const activeItems = domainItems.filter((s) => s.isActive);

  const monthlyTotal = totalMonthly(activeItems) + extrasMonthTotal;
  const annualTotal = totalAnnual(activeItems);
  const monthlyByCurrency = totalMonthlyByCurrency(activeItems);
  const annualByCurrency = totalAnnualByCurrency(activeItems);

  // Identify USD vs local currency totals
  const usdMonthly = monthlyByCurrency.get('USD');
  const localCurrencies = Array.from(monthlyByCurrency.entries()).filter(([code]) => code !== 'USD');
  const primaryLocal = localCurrencies[0]; // first non-USD currency (e.g., ARS)

  // For spark chart: use USD total if available, otherwise local currency total
  const sparkCurrency = usdMonthly ? 'USD' : primaryLocal ? primaryLocal[0] : 'USD';
  const sparkMonthlyTotal = usdMonthly
    ? usdMonthly.totalMinor
    : primaryLocal
      ? primaryLocal[1].totalMinor
      : 0;
  const upcoming = upcomingRenewals(activeItems, 30, Date.now()).slice(0, 5);
  const upcoming7 = upcomingRenewals(activeItems, 7, Date.now());
  const upcoming7Total = upcoming7.reduce((sum, s) => sum + s.confirmedPriceMinor, 0);
  const categoryNamesMap = new Map(items.map((s) => [s.categoryId ?? 0, s.category?.name ?? 'Otras']));
  const usdItems = activeItems.filter((s) => s.currencyCode === 'USD');
  const byCategory = groupByCategory(usdItems, categoryNamesMap);
  const localItems = activeItems.filter((s) => s.currencyCode !== 'USD');
  const localCurrencyCode = primaryLocal?.[0] ?? 'ARS';
  const byCategoryLocal = groupByCategory(localItems, categoryNamesMap);

  const isEmpty = activeItems.length === 0;

  // Category breakdown for paywall (combine USD + local by count-based percentage)
  const categoryBreakdown = useMemo(() => {
    const catTotals = new Map<string, number>();
    let grandTotal = 0;
    for (const s of activeItems) {
      const catName = s.categoryId ? (categoryNamesMap.get(s.categoryId) ?? 'Otras') : 'Otras';
      const amount = s.confirmedPriceMinor;
      catTotals.set(catName, (catTotals.get(catName) ?? 0) + amount);
      grandTotal += amount;
    }
    if (grandTotal === 0) return [];
    return Array.from(catTotals.entries())
      .map(([name, total]) => ({ name, percentage: Math.round((total / grandTotal) * 100) }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);
  }, [activeItems, categoryNamesMap]);

  // Monthly spending history (mock past 7 months + real current month incl. extras)
  const monthlyHistory = useMemo((): SparkPoint[] => {
    const now = new Date();
    const mockValues = [0, 0, 0, 0, 0, 0, 0];
    const months: SparkPoint[] = [];
    for (let i = 7; i >= 1; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: MONTH_SHORT[d.getMonth()],
        value: mockValues[7 - i],
      });
    }
    months.push({ label: MONTH_SHORT[now.getMonth()], value: sparkMonthlyTotal });
    return months;
  }, [sparkMonthlyTotal]);

  const currentMonthSpend = monthlyHistory[monthlyHistory.length - 1]?.value ?? monthlyTotal;
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(monthlyHistory.length - 1);
  const selectedMonth = monthlyHistory[selectedMonthIndex];
  const prevMonth = monthlyHistory[selectedMonthIndex - 1];
  const monthDelta = prevMonth && prevMonth.value > 0
    ? Math.round(((selectedMonth.value - prevMonth.value) / prevMonth.value) * 100)
    : 0;
  const [selectedSegment, setSelectedSegment] = useState<number | null>(null);
  const [tooltipCat, setTooltipCat] = useState<{ catId: number; currencyCode: string; x: number; y: number } | null>(null);
  const donutRef = useRef<View>(null);

  // Map: categoryId → list of { name, price, currency, renewalDate }
  const subsByCategory = useMemo(() => {
    const map = new Map<number, { name: string; priceMinor: number; currencyCode: string; renewalDate: number | null }[]>();
    for (const s of items) {
      if (!s.isActive) continue;
      const catId = s.categoryId ?? 0;
      const name = s.customName ?? s.provider?.name ?? '—';
      const entry = { name, priceMinor: s.confirmedPriceMinor, currencyCode: s.currencyCode, renewalDate: s.nextRenewalDate };
      const existing = map.get(catId);
      if (existing) existing.push(entry);
      else map.set(catId, [entry]);
    }
    return map;
  }, [items]);

  // All categories sorted by amount
  const allCategories = useMemo(() => {
    const entries = Array.from(byCategory.entries())
      .sort((a, b) => b[1].totalMinor - a[1].totalMinor);
    const catTotal = entries.reduce((s, [, d]) => s + d.totalMinor, 0);
    return entries.map(([catId, catData]) => ({
      id: catId,
      name: catData.name,
      total: catData.totalMinor,
      count: catData.count,
      currencyCode: catData.currencyCode,
      pct: catTotal > 0 ? Math.round((catData.totalMinor / catTotal) * 100) : 0,
      color: CAT_COLOR[catData.name] ?? '#8080A0',
      gradient: CAT_GRADIENT[catData.name] ?? ['#B0B0C0', '#8080A0'],
    }));
  }, [byCategory]);

  const donutSegments: DonutSegment[] = useMemo(() => {
    return allCategories.map((cat) => ({
      label: cat.name,
      value: cat.total,
      colors: cat.gradient,
    }));
  }, [allCategories]);

  // Strip: start 3 days before first renewal, show 30 days from there
  const [selectedDay, setSelectedDay] = useState<{ date: Date; subs: { id: number; name: string; price: string; catName: string; catColor: string; frequency: string; cardAlias: string | null; cardLastFour: string | null; cardBrand: string | null }[] } | null>(null);
  const stripRef = useRef<ScrollView>(null);

  const stripDays = useMemo(() => {
    const today = new Date();
    // Find first renewal date
    const renewalDates = items
      .filter((s) => s.nextRenewalDate)
      .map((s) => new Date(s.nextRenewalDate!))
      .filter((d) => d >= today)
      .sort((a, b) => a.getTime() - b.getTime());

    // Start 3 days before first renewal (or today if no renewals)
    let startDate = today;
    if (renewalDates.length > 0) {
      startDate = new Date(renewalDates[0]);
      startDate.setDate(startDate.getDate() - 3);
      if (startDate < today) startDate = today;
    }

    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(startDate);
      d.setDate(startDate.getDate() + i);
      const dow = d.getDay();
      const daySubs = items
        .filter((s) => {
          if (!s.nextRenewalDate) return false;
          const rd = new Date(s.nextRenewalDate);
          return rd.getDate() === d.getDate() && rd.getMonth() === d.getMonth() && rd.getFullYear() === d.getFullYear();
        })
        .map((s) => ({
          id: s.id,
          name: s.customName ?? s.provider?.name ?? '—',
          price: formatCurrency(s.confirmedPriceMinor, s.currencyCode),
          catName: s.category?.name ?? 'Otras',
          catColor: CAT_COLOR[s.category?.name ?? 'Otras'] ?? '#8080A0',
          frequency: frequencyLabel(s.frequency as import('@/domain/types').Frequency),
          cardAlias: s.card?.alias ?? null,
          cardLastFour: s.card?.lastFour ?? null,
          cardBrand: s.card?.brand ?? null,
        }));
      return {
        date: d,
        dow: DOW_SHORT[dow],
        day: d.getDate(),
        month: MONTH_SHORT[d.getMonth()],
        isToday: d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear(),
        hasRenewal: daySubs.length > 0,
        subs: daySubs,
      };
    });
  }, [items]);

  // No auto-scroll needed — strip starts at the right position

  const now = new Date();
  const monthLabel = `${MONTH_SHORT[now.getMonth()]} ${now.getFullYear()}`;

  return (
    <ScreenBackground paddingBottom={insets.bottom}>
      <AppHeader showNotificationBadge transparent />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Welcome block */}
        <View style={styles.welcomeArea}>
          <Text style={styles.welcomeGreeting}>{t('home.greeting', { name: userDisplayName })}</Text>
          <Text style={styles.welcomeTitle}>{t('home.todaySummary')}</Text>
          <Text style={styles.welcomeSubtitle}>{t('home.subtitle')}</Text>
        </View>

            {/* Hero spending card */}
            <LinearGradient
              colors={['#9B7BFF', '#6B52E0', '#5040C0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.heroCard}
            >
              {/* Header: label + month selector */}
              <View style={styles.heroHeader}>
                <Text style={styles.heroLabel}>{t('home.monthlyTotal')}</Text>
                <TouchableOpacity style={styles.heroMonthPill} onPress={() => router.push('/calendario')} activeOpacity={0.7}>
                  <Text style={styles.heroMonthText}>{monthLabel}</Text>
                  <Ionicons name="chevron-down" size={11} color="rgba(255,255,255,0.7)" />
                </TouchableOpacity>
              </View>

              {/* Currency amounts with per-currency sub count as title */}
              {isPaid ? (
                <View style={styles.heroCurrencyBlocks}>
                  {usdMonthly && usdMonthly.totalMinor > 0 ? (
                    <View style={styles.heroCurrencyBlock}>
                      <Text style={styles.heroCurrencyTag}>
                        {usdMonthly.count} {usdMonthly.count === 1 ? t('home.sub') : t('home.subs')}
                      </Text>
                      <Text style={styles.heroAmount}>{formatCurrency(usdMonthly.totalMinor, 'USD')}</Text>
                    </View>
                  ) : null}
                  {primaryLocal && primaryLocal[1].totalMinor > 0 && usdMonthly ? (
                    <View style={styles.heroCurrencySeparator} />
                  ) : null}
                  {primaryLocal && primaryLocal[1].totalMinor > 0 ? (
                    <View style={styles.heroCurrencyBlock}>
                      <Text style={styles.heroCurrencyTag}>
                        {primaryLocal[1].count} {primaryLocal[1].count === 1 ? t('home.sub') : t('home.subs')}
                      </Text>
                      <Text style={usdMonthly ? styles.heroAmountSecondary : styles.heroAmount}>
                        {formatCurrency(primaryLocal[1].totalMinor, primaryLocal[0])}
                      </Text>
                      <Text style={styles.heroCurrencySubtitle}>{t('home.localPriceNote')}</Text>
                    </View>
                  ) : null}
                  {!usdMonthly && !primaryLocal ? (
                    <>
                      <View style={styles.heroCurrencyBlock}>
                        <Text style={styles.heroCurrencyTag}>0 {t('home.subs')}</Text>
                        <Text style={styles.heroAmount}>{formatCurrency(0, 'USD')}</Text>
                      </View>
                      <View style={styles.heroCurrencySeparator} />
                      <View style={styles.heroCurrencyBlock}>
                        <Text style={styles.heroCurrencyTag}>0 {t('home.subs')}</Text>
                        <Text style={styles.heroAmountSecondary}>{formatCurrency(0, localCurrencyCode)}</Text>
                      </View>
                    </>
                  ) : null}
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.heroLockedBlock}
                  onPress={() => setShowPaywall(true)}
                  activeOpacity={0.8}
                >
                  <View style={styles.heroLockIcon}>
                    <Ionicons name="lock-closed" size={24} color="rgba(255,255,255,0.8)" />
                  </View>
                  <Text style={styles.heroLockedText}>{t('paywall.title')}</Text>
                  <Text style={styles.heroLockedSub}>
                    {items.length} {items.length === 1 ? t('home.sub') : t('home.subs')} · {t('paywall.price')}
                  </Text>
                </TouchableOpacity>
              )}

              <View style={styles.heroDivider} />

              {/* Footer: annual projection left + total subs right */}
              <View style={styles.heroFooter}>
                <View style={styles.heroFooterLeft}>
                  <View style={styles.heroFooterIcon}>
                    <Ionicons name="calendar-outline" size={14} color="rgba(255,255,255,0.6)" />
                  </View>
                  <View>
                    <Text style={styles.heroAnnualLabel}>{t('home.annualSpending')}</Text>
                    <Text style={styles.heroAnnualText}>
                      {(() => {
                        const usdAnnual = annualByCurrency.get('USD');
                        const localAnnual = Array.from(annualByCurrency.entries()).filter(([c]) => c !== 'USD')[0];
                        if (usdAnnual && usdAnnual.totalMinor > 0) {
                          return formatCurrency(usdAnnual.totalMinor, 'USD');
                        }
                        if (localAnnual) {
                          return formatCurrency(localAnnual[1].totalMinor, localAnnual[0]);
                        }
                        return formatCurrency(0, 'USD');
                      })()}
                    </Text>
                  </View>
                </View>
                <View style={styles.heroTotalStat}>
                  <Text style={styles.heroTotalStatNumber}>{activeItems.length}</Text>
                  <Text style={styles.heroTotalStatLabel}>{t('home.activeSubs')}</Text>
                </View>
              </View>
            </LinearGradient>

            {/* Horizontal scrollable renewal strip */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>{t('home.upcomingRenewals')}</Text>
                <TouchableOpacity onPress={() => router.push('/calendario')} activeOpacity={0.7}>
                  <Text style={styles.sectionLink}>{t('home.viewCalendar')}</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.weekCard}>
                <ScrollView
                  ref={stripRef}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.weekStrip}
                >
                  {stripDays.map((d, i) => {
                    return (
                      <TouchableOpacity
                        key={i}
                        style={styles.weekDayCol}
                        onPress={() => d.hasRenewal && setSelectedDay({ date: d.date, subs: d.subs })}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.weekDow, d.isToday && styles.weekDowActive]}>
                          {d.dow}
                        </Text>
                        <View style={[styles.weekDayCircle, d.isToday && styles.weekDayCircleActive]}>
                          <Text style={[styles.weekDayNum, d.isToday && styles.weekDayNumActive]}>
                            {d.day}
                          </Text>
                        </View>
                        <Text style={styles.weekMonth}>
                          {d.month}
                        </Text>
                        {d.hasRenewal ? (
                          <View style={[styles.weekDot, d.isToday && styles.weekDotActive]} />
                        ) : (
                          <View style={styles.weekDotPlaceholder} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            </View>

            {/* Desglose del mes */}
            {(byCategory.size > 0 || extrasMonthTotal > 0) && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{t('home.monthBreakdown')} · USD</Text>
                </View>

                {/* Split bar: suscripciones vs variables */}
                {extrasMonthTotal > 0 && monthlyTotal > 0 && (() => {
                  const subTotal = monthlyTotal - extrasMonthTotal;
                  const subPct = Math.round((subTotal / monthlyTotal) * 100);
                  const varPct = 100 - subPct;
                  return (
                    <View style={styles.splitBarCard}>
                      <View style={styles.splitBarRow}>
                        <View style={[styles.splitBarSeg, { flex: subPct, backgroundColor: '#6B52E0' }]} />
                        <View style={[styles.splitBarSeg, { flex: varPct, backgroundColor: '#FF6B35' }]} />
                      </View>
                      <View style={styles.splitBarLegend}>
                        <View style={styles.splitBarLegendItem}>
                          <View style={[styles.splitBarDot, { backgroundColor: '#6B52E0' }]} />
                          <Text style={styles.splitBarLabel}>{t('home.fixed')} {subPct}%</Text>
                          <Text style={styles.splitBarAmount}>{formatCurrency(subTotal, 'USD')}</Text>
                        </View>
                        <View style={styles.splitBarLegendItem}>
                          <View style={[styles.splitBarDot, { backgroundColor: '#FF6B35' }]} />
                          <Text style={styles.splitBarLabel}>{t('home.variable')} {varPct}%</Text>
                          <Text style={styles.splitBarAmount}>{formatCurrency(extrasMonthTotal, 'USD')}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })()}

                {/* Donut + legend */}
                {allCategories.length > 0 && (
                  <Pressable
                    style={styles.donutCard}
                    onPress={() => setTooltipCat(null)}
                  >
                    <Text style={styles.donutTitle}>{t('home.byCategory')}</Text>
                    <View style={styles.donutSection}>
                      <View ref={donutRef}>
                      <DonutChart
                        segments={donutSegments}
                        size={160}
                        strokeWidth={20}
                        selectedIndex={selectedSegment}
                        onSegmentPress={(i) => {
                          const cat = allCategories[i];
                          if (!cat) return;
                          donutRef.current?.measureInWindow((x, y, w, h) => {
                            setTooltipCat({ catId: cat.id, currencyCode: 'USD', x: x + w / 2, y: y + h / 2 });
                          });
                        }}
                        centerLabel={t('home.totalFixed')}
                        centerValue={formatCurrency(usdMonthly?.totalMinor ?? 0, 'USD')}
                        centerValueSize={15}
                        centerSubLabel={t('home.perMonth')}
                        trackColor="#F2F0FA"
                      />
                      </View>
                      <ScrollView
                        style={styles.donutLegendScroll}
                        contentContainerStyle={styles.donutLegendList}
                        showsVerticalScrollIndicator
                      >
                        {allCategories.map((cat, i) => {
                          return (
                            <TouchableOpacity
                              key={cat.id}
                              style={styles.donutLegendRow}
                              onPress={(e) => setTooltipCat({ catId: cat.id, currencyCode: 'USD', x: e.nativeEvent.pageX, y: e.nativeEvent.pageY })}
                              activeOpacity={0.6}
                            >
                              <View style={[styles.donutLegendDot, { backgroundColor: cat.color }]} />
                              <Text
                                style={[
                                  styles.donutLegendName,
                                ]}
                                numberOfLines={1}
                              >
                                {cat.name}
                              </Text>
                              <Text
                                style={[
                                  styles.donutLegendPct,
                                  { color: Colors.textTertiary },
                                ]}
                              >
                                {cat.pct}%
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </Pressable>
                )}

                {/* Extras detail list */}
                {monthExtras.length > 0 && (
                  <View style={styles.extrasListCard}>
                    <View style={styles.extrasListHeader}>
                      <Ionicons name="flash" size={14} color="#FF6B35" />
                      <Text style={styles.extrasListTitle}>Consumos adicionales del mes</Text>
                    </View>
                    {monthExtras.map((e, idx, arr) => {
                      const sub = items.find((s) => s.id === e.subscriptionId);
                      const subName = sub?.customName ?? sub?.provider?.name ?? '—';
                      return (
                        <TouchableOpacity
                          key={e.id}
                          style={[styles.extrasListRow, idx < arr.length - 1 && styles.extrasListRowBorder]}
                          onPress={() => router.push({ pathname: '/suscripciones/[id]', params: { id: e.subscriptionId } })}
                          activeOpacity={0.7}
                        >
                          <ProviderAvatar name={subName} size={34} />
                          <View style={styles.extrasListInfo}>
                            <Text style={styles.extrasListName} numberOfLines={1}>{subName}</Text>
                            <Text style={styles.extrasListDesc} numberOfLines={1}>{e.description}</Text>
                          </View>
                          <View style={styles.extrasListRight}>
                            <Text style={styles.extrasListAmount}>{formatCurrency(e.amountMinor, e.currencyCode)}</Text>
                            <Text style={styles.extrasListDate}>{formatShortDate(e.purchasedAt)}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                    <View style={styles.extrasListTotal}>
                      <Text style={styles.extrasListTotalLabel}>Total adicional del mes</Text>
                      <Text style={styles.extrasListTotalAmount}>{formatCurrency(extrasMonthTotal, 'USD')}</Text>
                    </View>
                  </View>
                )}
              </View>
            )}

            {/* Desglose en moneda local */}
            {byCategoryLocal.size > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{t('home.monthBreakdown')} · {localCurrencyCode}</Text>
                </View>
                <View style={styles.localBreakdownCard}>
                  {(() => {
                    const entries = Array.from(byCategoryLocal.entries())
                      .sort((a, b) => b[1].totalMinor - a[1].totalMinor);
                    const total = entries.reduce((s, [, d]) => s + d.totalMinor, 0);
                    return entries.map(([catId, catData]) => {
                      const pct = total > 0 ? Math.round((catData.totalMinor / total) * 100) : 0;
                      const color = CAT_COLOR[catData.name] ?? '#8080A0';
                      return (
                        <TouchableOpacity
                          key={catId}
                          style={styles.localBreakdownRow}
                          activeOpacity={0.7}
                          onPress={(e) => setTooltipCat({ catId, currencyCode: localCurrencyCode, x: e.nativeEvent.pageX, y: e.nativeEvent.pageY })}
                        >
                          <View style={styles.localBreakdownRowHeader}>
                            <View style={[styles.localBreakdownDot, { backgroundColor: color }]} />
                            <Text style={styles.localBreakdownName}>{catData.name}</Text>
                            <Text style={styles.localBreakdownPct}>{pct}%</Text>
                          </View>
                          <View style={styles.localBreakdownBar}>
                            <View style={[styles.localBreakdownBarFill, { width: `${pct}%`, backgroundColor: color }]} />
                          </View>
                          <Text style={styles.localBreakdownAmount}>
                            {formatCurrency(catData.totalMinor, localCurrencyCode)}
                          </Text>
                        </TouchableOpacity>
                      );
                    });
                  })()}
                </View>
              </View>
            )}

            {/* Monthly trend chart */}
            {byCategory.size > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>{t('home.monthlyTrend')}</Text>
                </View>
                <View style={styles.trendCard}>
                  <View style={styles.trendHeader}>
                    <View>
                      <Text style={styles.trendLabel}>{selectedMonth?.label ?? t('home.thisMonth')}</Text>
                      <Text style={styles.trendAmount}>{formatCurrency(selectedMonth?.value ?? currentMonthSpend, 'USD')}</Text>
                    </View>
                    {prevMonth && (
                      <View style={styles.trendDelta}>
                        <Ionicons
                          name={monthDelta >= 0 ? 'trending-up' : 'trending-down'}
                          size={14}
                          color={monthDelta >= 0 ? '#34C759' : '#FF5C8A'}
                        />
                        <Text style={[styles.trendDeltaText, { color: monthDelta >= 0 ? '#34C759' : '#FF5C8A' }]}>
                          {monthDelta >= 0 ? '+' : ''}{monthDelta}%
                        </Text>
                        <Text style={styles.trendDeltaLabel}>{t('home.vsPrevMonth')}</Text>
                      </View>
                    )}
                  </View>
                  <SparkChart
                    data={monthlyHistory}
                    width={280}
                    height={130}
                    highlightIndex={monthlyHistory.length - 1}
                    formatValue={(v) => formatCurrency(v, 'USD')}
                    onIndexChange={setSelectedMonthIndex}
                  />
                </View>
              </View>
            )}

            {/* Price Watch */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.pwTitleRow}>
                  <Ionicons name="pulse-outline" size={16} color={Colors.primary} />
                  <Text style={styles.sectionTitle}>Price Watch</Text>
                  {unreadCount > 0 && (
                    <View style={styles.pwBadge}>
                      <Text style={styles.pwBadgeText}>{unreadCount}</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity onPress={() => router.push('/(tabs)/price-watch')} activeOpacity={0.7}>
                  <Text style={styles.sectionLink}>Ver todas</Text>
                </TouchableOpacity>
              </View>

              {alerts.length === 0 ? (
                <View style={styles.pwEmptyCard}>
                  <View style={styles.pwEmptyIconWrap}>
                    <Ionicons name="shield-checkmark-outline" size={26} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.pwEmptyTitle}>Todo en orden</Text>
                    <Text style={styles.pwEmptySubtext}>Te avisamos si algún precio cambia</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
                </View>
              ) : (
                <View style={styles.pwCard}>
                  {/* Stats row */}
                  <View style={styles.pwStatsRow}>
                    <View style={styles.pwStat}>
                      <Text style={styles.pwStatValue}>{alerts.length}</Text>
                      <Text style={styles.pwStatLabel}>alertas</Text>
                    </View>
                    <View style={styles.pwStatDivider} />
                    <View style={styles.pwStat}>
                      <Text style={[styles.pwStatValue, unreadCount > 0 && { color: '#FF5C8A' }]}>{unreadCount}</Text>
                      <Text style={styles.pwStatLabel}>sin leer</Text>
                    </View>
                    <View style={styles.pwStatDivider} />
                    <View style={styles.pwStat}>
                      <Text style={[styles.pwStatValue, { color: '#34C759' }]}>
                        {alerts.filter((a) => a.direction === 'decrease').length}
                      </Text>
                      <Text style={styles.pwStatLabel}>bajaron</Text>
                    </View>
                    <View style={styles.pwStatDivider} />
                    <View style={styles.pwStat}>
                      <Text style={[styles.pwStatValue, { color: '#FF5C8A' }]}>
                        {alerts.filter((a) => a.direction === 'increase').length}
                      </Text>
                      <Text style={styles.pwStatLabel}>subieron</Text>
                    </View>
                  </View>

                  {/* Alert rows */}
                  {alerts.slice(0, 3).map((alert, idx, arr) => {
                    const color = pwColor(alert.direction);
                    const isLast = idx === arr.length - 1 && alerts.length <= 3;
                    return (
                      <TouchableOpacity
                        key={alert.id}
                        style={[styles.pwAlertRow, !isLast && styles.pwAlertBorder]}
                        onPress={() => !alert.isRead && markAsRead(alert.id)}
                        activeOpacity={0.75}
                      >
                        <View style={[styles.pwAlertIcon, { backgroundColor: `${color}18` }]}>
                          <Ionicons name={pwIcon(alert.direction) as any} size={16} color={color} />
                        </View>
                        <View style={styles.pwAlertInfo}>
                          <View style={styles.pwAlertTitleRow}>
                            <Text style={styles.pwAlertProvider} numberOfLines={1}>{alert.providerName}</Text>
                            {!alert.isRead && <View style={styles.pwUnreadDot} />}
                          </View>
                          <View style={styles.pwAlertPriceRow}>
                            {alert.oldPriceMinor !== null && (
                              <Text style={styles.pwOldPrice}>{formatCurrency(alert.oldPriceMinor, alert.currencyCode)}</Text>
                            )}
                            <Ionicons name="arrow-forward" size={10} color={Colors.textTertiary} />
                            <Text style={[styles.pwNewPrice, { color }]}>{formatCurrency(alert.newPriceMinor, alert.currencyCode)}</Text>
                            <Text style={[styles.pwDir, { color }]}>{pwLabel(alert.direction)}</Text>
                          </View>
                          <Text style={styles.pwTime}>{pwTimeAgo(alert.detectedAt)}</Text>
                        </View>
                        <TouchableOpacity onPress={() => dismiss(alert.id)} style={styles.pwDismissBtn} activeOpacity={0.7}>
                          <Ionicons name="close" size={14} color={Colors.textTertiary} />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}

                  {alerts.length > 3 && (
                    <TouchableOpacity
                      style={styles.pwFooter}
                      onPress={() => router.push('/(tabs)/price-watch')}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.pwFooterText}>Ver {alerts.length - 3} alerta{alerts.length - 3 !== 1 ? 's' : ''} más</Text>
                      <Ionicons name="chevron-forward" size={14} color={Colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* First-time CTA */}
            {isEmpty && (
              <View style={styles.firstTimeCta}>
                <Ionicons name="add-circle-outline" size={28} color={Colors.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.firstTimeCtaTitle}>{t('home.empty.title')}</Text>
                  <Text style={styles.firstTimeCtaDesc}>{t('home.empty.desc')}</Text>
                </View>
                <TouchableOpacity
                  style={styles.firstTimeCtaBtn}
                  onPress={() => router.push('/suscripciones/agregar')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.firstTimeCtaBtnText}>{t('home.empty.button')}</Text>
                </TouchableOpacity>
              </View>
            )}
      </ScrollView>

      {/* Day detail popup */}
      <Modal
        visible={selectedDay !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedDay(null)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setSelectedDay(null)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalDateLabel}>
                  {selectedDay && DOW_SHORT[selectedDay.date.getDay()]} {selectedDay?.date.getDate() ?? ''} {selectedDay && MONTH_SHORT[selectedDay.date.getMonth()]}
                </Text>
                <Text style={styles.modalTitle}>
                  {selectedDay?.subs.length === 1 ? '1 renovación' : `${selectedDay?.subs.length ?? 0} renovaciones`}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setSelectedDay(null)} style={styles.modalClose} activeOpacity={0.7}>
                <Ionicons name="close" size={18} color={Colors.textTertiary} />
              </TouchableOpacity>
            </View>
            {selectedDay?.subs.map((sub) => (
              <TouchableOpacity
                key={sub.id}
                style={styles.modalRow}
                onPress={() => {
                  setSelectedDay(null);
                  router.push({ pathname: '/suscripciones/[id]', params: { id: sub.id } });
                }}
                activeOpacity={0.7}
              >
                <ProviderAvatar name={sub.name} size={40} />
                <View style={styles.modalRowInfo}>
                  <Text style={styles.modalRowName}>{sub.name}</Text>
                  <View style={styles.modalRowTags}>
                    <View style={styles.modalRowTag}>
                      <View style={[styles.modalRowDot, { backgroundColor: sub.catColor }]} />
                      <Text style={styles.modalRowCatText}>{sub.catName}</Text>
                    </View>
                    {sub.cardAlias && (
                      <View style={styles.modalRowTag}>
                        <Ionicons name="card-outline" size={11} color={Colors.textTertiary} />
                        <Text style={styles.modalRowCardText}>
                          {sub.cardAlias}{sub.cardLastFour ? ` · ${sub.cardLastFour}` : ''}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
                <View style={styles.modalRowRight}>
                  <Text style={styles.modalRowPrice}>{sub.price}</Text>
                  <Text style={styles.modalRowFreq}>/ {sub.frequency}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Category breakdown tooltip */}
      <Modal
        visible={tooltipCat !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setTooltipCat(null)}
      >
        <Pressable style={styles.tooltipOverlay} onPress={() => setTooltipCat(null)}>
          <Pressable
            style={[styles.tooltipCard, { position: 'absolute', left: tooltipCat ? tooltipCat.x + 12 : 0, top: tooltipCat ? Math.max(tooltipCat.y - 50, 20) : 0 }]}
            onPress={(e) => e.stopPropagation()}
          >
            {tooltipCat && (() => {
              const subs = (subsByCategory.get(tooltipCat.catId) ?? [])
                .filter((s) => s.currencyCode === tooltipCat.currencyCode);
              const catName = tooltipCat.currencyCode === 'USD'
                ? allCategories.find((c) => c.id === tooltipCat.catId)?.name
                : Array.from(byCategoryLocal.entries()).find(([id]) => id === tooltipCat.catId)?.[1].name;
              const total = subs.reduce((s, sub) => s + sub.priceMinor, 0);
              return (
                <>
                  <View style={styles.tooltipHeader}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tooltipTitle}>{catName ?? '—'}</Text>
                      <Text style={styles.tooltipTotal}>{formatCurrency(total, tooltipCat.currencyCode)}</Text>
                    </View>
                    <TouchableOpacity onPress={() => setTooltipCat(null)} style={styles.tooltipClose} activeOpacity={0.7}>
                      <Ionicons name="close" size={14} color={Colors.textTertiary} />
                    </TouchableOpacity>
                  </View>
                  {subs.map((sub, i) => (
                    <View key={i} style={[styles.tooltipRow, i < subs.length - 1 && styles.tooltipRowBorder]}>
                      <Text style={styles.tooltipRowName} numberOfLines={1}>{sub.name}</Text>
                      <Text style={styles.tooltipRowPrice}>
                        {formatCurrency(sub.priceMinor, sub.currencyCode)}
                      </Text>
                      {sub.renewalDate && (
                        <Text style={styles.tooltipRowDate}>
                          {formatShortDate(sub.renewalDate)}
                        </Text>
                      )}
                    </View>
                  ))}
                </>
              );
            })()}
          </Pressable>
        </Pressable>
      </Modal>

      <OnboardingModal
        visible={showOnboarding}
        categories={onboardingCategories}
        onComplete={async (selectedIds) => {
          await saveOnboardingPreferences(selectedIds);
          setShowOnboarding(false);
        }}
        onSkip={() => setShowOnboarding(false)}
      />

      <PaywallModal
        visible={showPaywall}
        subCount={items.length}
        usdMonthly={formatCurrency(usdMonthly?.totalMinor ?? 0, 'USD')}
        localMonthly={primaryLocal && primaryLocal[1].totalMinor > 0 ? formatCurrency(primaryLocal[1].totalMinor, primaryLocal[0]) : null}
        localCurrencyCode={localCurrencyCode}
        categoryBreakdown={categoryBreakdown}
        onClose={() => setShowPaywall(false)}
      />
    </ScreenBackground>
  );
}

function pwColor(dir: 'increase' | 'decrease' | 'new') {
  if (dir === 'increase') return '#FF5C8A';
  if (dir === 'decrease') return '#34C759';
  return '#6B52E0';
}
function pwIcon(dir: 'increase' | 'decrease' | 'new') {
  if (dir === 'increase') return 'trending-up';
  if (dir === 'decrease') return 'trending-down';
  return 'sparkles';
}
function pwLabel(dir: 'increase' | 'decrease' | 'new') {
  if (dir === 'increase') return 'Sube';
  if (dir === 'decrease') return 'Baja';
  return 'Nuevo';
}
function pwTimeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  return `hace ${Math.floor(hrs / 24)}d`;
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl },

  /* Welcome */
  welcomeArea: { paddingTop: Spacing.sm, paddingBottom: Spacing.lg, zIndex: 1 },
  welcomeGreeting: { fontSize: 14, fontWeight: '600', color: '#7B6BA0' },
  welcomeTitle: { fontSize: 34, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -1.2, marginTop: 2 },
  welcomeSubtitle: { fontSize: 14, color: '#9088B0', marginTop: 4 },

  /* First-time CTA */
  firstTimeCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    ...CARD_SHADOW,
  },
  firstTimeCtaTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  firstTimeCtaDesc: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },
  firstTimeCtaBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: Radius.lg,
  },
  firstTimeCtaBtnText: { fontSize: 13, fontWeight: '600', color: Colors.textInverse },

  /* Hero card */
  heroCard: {
    borderRadius: 28,
    padding: 24,
    marginBottom: Spacing.xxl,
    ...CARD_SHADOW,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLabel: { fontSize: 18, fontWeight: '700', color: 'rgba(255,255,255,0.9)', letterSpacing: -0.3 },
  heroCurrencyBlocks: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 20 },
  heroLockedBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 8,
    paddingVertical: Spacing.lg,
  },
  heroLockIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  heroLockedText: {
    fontSize: 18,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 4,
  },
  heroLockedSub: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
  },
  heroCurrencyBlock: { flex: 0 },
  heroCurrencySeparator: {
    width: 1,
    height: 56,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: 20,
    marginTop: 2,
  },
  heroCurrencyTag: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.45)',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroAmount: { fontSize: 34, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1.2 },
  heroAmountSecondary: { fontSize: 20, fontWeight: '700', color: 'rgba(255,255,255,0.6)', letterSpacing: -0.5 },
  heroCurrencySubtitle: { fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 4, fontStyle: 'italic' },
  heroMonthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  heroMonthText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.85)' },
  heroDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: 16 },
  heroFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroFooterLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  heroFooterIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroAnnualLabel: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.5)', marginBottom: 2 },
  heroAnnualText: { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.9)' },
  heroTotalStat: { alignItems: 'flex-end' },
  heroTotalStatNumber: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1 },
  heroTotalStatLabel: { fontSize: 11, fontWeight: '500', color: 'rgba(255,255,255,0.45)', marginTop: 1 },

  /* Local currency breakdown */
  localBreakdownCard: {
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    padding: 16,
    ...CARD_SHADOW,
  },
  localBreakdownRow: { marginBottom: 14 },
  localBreakdownRowHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  localBreakdownDot: { width: 8, height: 8, borderRadius: 4 },
  localBreakdownName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary, flex: 1 },
  localBreakdownPct: { fontSize: 13, fontWeight: '600', color: Colors.textTertiary },
  localBreakdownBar: {
    height: 6,
    backgroundColor: '#F0F0F5',
    borderRadius: 3,
    overflow: 'hidden',
  },
  localBreakdownBarFill: { height: '100%', borderRadius: 3 },
  localBreakdownAmount: { fontSize: 13, fontWeight: '500', color: Colors.textSecondary, marginTop: 4 },

  /* Sections */
  section: { marginBottom: Spacing.xxl },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: Colors.textPrimary },
  sectionLink: { fontSize: 14, color: Colors.primary, fontWeight: '500' },

  /* Week strip */
  weekCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: Spacing.md,
    ...CARD_SHADOW,
  },
  weekStrip: { flexDirection: 'row', gap: 6, paddingHorizontal: 2 },
  weekDayCol: { alignItems: 'center', gap: 4, width: 44 },
  weekDow: { fontSize: 10, fontWeight: '600', color: Colors.textTertiary, textTransform: 'uppercase' },
  weekDowActive: { color: Colors.primary },
  weekDayCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  weekDayCircleActive: { backgroundColor: Colors.primary },
  weekDayNum: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  weekDayNumActive: { color: '#FFFFFF' },
  weekMonth: { fontSize: 9, fontWeight: '600', color: Colors.textTertiary },
  weekDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.primary },
  weekDotActive: { backgroundColor: Colors.primary },
  weekDotPlaceholder: { width: 5, height: 5 },

  /* Trend card */
  trendCard: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: Spacing.xl,
    ...CARD_SHADOW,
  },
  trendHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.md },
  trendLabel: { fontSize: 11, fontWeight: '700', color: '#A0A0B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  trendAmount: { fontSize: 24, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.8, marginTop: 2 },
  trendDelta: { alignItems: 'flex-end', gap: 1 },
  trendDeltaText: { fontSize: 14, fontWeight: '700', color: '#34C759' },
  trendDeltaLabel: { fontSize: 10, color: Colors.textTertiary },

  /* Category donut card */
  categoryCard: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: Spacing.xl,
    ...CARD_SHADOW,
  },
  categoryRow: { flexDirection: 'row', alignItems: 'center' },
  categoryDonutCol: { marginRight: Spacing.xl },
  categoryList: { flex: 1, gap: 8 },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  catDot: { width: 8, height: 8, borderRadius: 4 },
  catName: { fontSize: 13, fontWeight: '500', color: Colors.textPrimary, flex: 1 },
  catPct: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, width: 40, textAlign: 'right' },

  /* Category detail card */
  catDetailCard: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    overflow: 'hidden',
    ...CARD_SHADOW,
  },
  catDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  catDetailRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  catDetailAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catDetailInitial: { fontSize: 18, fontWeight: '800' },
  catDetailInfo: { flex: 1, gap: 2 },
  catDetailName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  catDetailCount: { fontSize: 12, color: Colors.textTertiary },
  catDetailBar: {
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F0EEF8',
    marginTop: 4,
    overflow: 'hidden',
  },
  catDetailBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  catDetailAmount: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },

  catLegendDivider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginVertical: Spacing.md },
  catLegendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, gap: Spacing.sm },
  catLegendDot: { width: 8, height: 8, borderRadius: 4 },
  catLegendName: { fontSize: 13, fontWeight: '500', color: Colors.textPrimary, flex: 1 },
  catLegendPct: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, width: 40, textAlign: 'right' },
  catLegendAmount: { fontSize: 13, fontWeight: '600', color: Colors.textPrimary, width: 80, textAlign: 'right' },

  /* Charges card */
  chargesCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    overflow: 'hidden',
    ...CARD_SHADOW,
  },
  chargeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  chargeRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  chargeInfo: { flex: 1 },
  chargeName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  chargeCatRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  chargeCatDot: { width: 6, height: 6, borderRadius: 3 },
  chargeCat: { fontSize: 12, color: Colors.textSecondary },
  chargeDatePill: {
    backgroundColor: '#F0EEF8',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  chargeDateText: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  chargeAmount: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary, width: 70, textAlign: 'right' },
  chargesFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: Spacing.md },
  chargesFooterText: { fontSize: 13, fontWeight: '500', color: Colors.primary },

  /* Modal popup */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
  },
  modalCard: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: Spacing.xl,
    width: '100%',
    ...CARD_SHADOW,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: Spacing.lg },
  modalDateLabel: { fontSize: 12, fontWeight: '600', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.5 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5, marginTop: 2 },
  modalClose: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  modalRowInfo: { flex: 1 },
  modalRowName: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  modalRowTags: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4, flexWrap: 'wrap' },
  modalRowTag: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  modalRowDot: { width: 6, height: 6, borderRadius: 3 },
  modalRowCatText: { fontSize: 12, color: Colors.textSecondary },
  modalRowCardText: { fontSize: 12, color: Colors.textTertiary },
  modalRowRight: { alignItems: 'flex-end' },
  modalRowPrice: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  modalRowFreq: { fontSize: 11, color: Colors.textTertiary, marginTop: 1 },

  /* Category tooltip */
  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  tooltipCard: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    padding: 10,
    width: 200,
    ...CARD_SHADOW,
  },
  tooltipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  tooltipTitle: { fontSize: 12, fontWeight: '700', color: Colors.textPrimary },
  tooltipTotal: { fontSize: 14, fontWeight: '800', color: Colors.primary, marginTop: 1 },
  tooltipClose: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tooltipRow: { paddingVertical: 4 },
  tooltipRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },
  tooltipRowName: { fontSize: 11, fontWeight: '600', color: Colors.textPrimary },
  tooltipRowPrice: { fontSize: 11, fontWeight: '600', color: Colors.primary, marginTop: 1 },
  tooltipRowDate: { fontSize: 10, color: Colors.textTertiary, marginTop: 1 },

  // ─── Split bar ──────────────────────────────────────────────────────────
  splitBarCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...CARD_SHADOW,
  },
  splitBarRow: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    gap: 2,
    marginBottom: Spacing.md,
  },
  splitBarSeg: { borderRadius: 5 },
  splitBarLegend: { flexDirection: 'row', justifyContent: 'space-between' },
  splitBarLegendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  splitBarDot: { width: 8, height: 8, borderRadius: 4 },
  splitBarLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  splitBarAmount: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginLeft: 4 },

  // ─── Donut + legend ─────────────────────────────────────────────────────
  donutCard: {
    backgroundColor: Colors.background,
    borderRadius: 20,
    padding: Spacing.xl,
    marginBottom: Spacing.md,
    ...CARD_SHADOW,
  },
  donutTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#B0B0C0',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  donutSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  donutLegendScroll: {
    flex: 1,
    maxHeight: 180,
  },
  donutLegendList: {
    gap: 2,
    paddingVertical: 2,
    paddingRight: 8,
  },
  donutLegendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  donutLegendDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    flexShrink: 0,
  },
  donutLegendName: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  donutLegendPct: {
    fontSize: 11,
    fontWeight: '700',
    minWidth: 30,
    textAlign: 'right',
  },

  // ─── Category grid ──────────────────────────────────────────────────────
  catGridScroll: { marginHorizontal: -Spacing.lg },
  catGridScrollContent: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 2,
  },
  catGridCard: {
    width: 156,
    backgroundColor: Colors.background,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderLeftWidth: 4,
    gap: 1,
    overflow: 'hidden',
    ...CARD_SHADOW,
  },
  catGridCardBg: StyleSheet.absoluteFill as object,
  catGridCardGloss: {
    ...StyleSheet.absoluteFill,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  } as object,
  catGridTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  catGridIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catGridName: { fontSize: 12, fontWeight: '700', marginBottom: 2, color: Colors.textPrimary },
  catGridAmount: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  catGridCount: { fontSize: 11, color: Colors.textTertiary, marginBottom: 4 },
  catGridBarRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  catGridBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.appBackground,
    borderRadius: 2,
    overflow: 'hidden',
  },
  catGridBarFill: { height: 4, borderRadius: 2 },
  catGridPct: { fontSize: 11, fontWeight: '700', minWidth: 28, textAlign: 'right', color: Colors.textSecondary },

  // ─── Extras detail list ─────────────────────────────────────────────────
  extrasListCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    ...CARD_SHADOW,
  },
  extrasListHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  extrasListTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  extrasListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 10,
  },
  extrasListRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  extrasListInfo: { flex: 1, gap: 2 },
  extrasListName: { fontSize: 14, fontWeight: '600', color: Colors.textPrimary },
  extrasListDesc: { fontSize: 12, color: Colors.textTertiary },
  extrasListRight: { alignItems: 'flex-end', gap: 2 },
  extrasListAmount: { fontSize: 14, fontWeight: '700', color: '#FF6B35' },
  extrasListDate: { fontSize: 11, color: Colors.textTertiary },
  extrasListTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  extrasListTotalLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  extrasListTotalAmount: { fontSize: 16, fontWeight: '800', color: '#FF6B35' },

  // ─── Price Watch ────────────────────────────────────────────────────────
  pwTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pwBadge: {
    backgroundColor: '#FF5C8A',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  pwBadgeText: { fontSize: 10, fontWeight: '800', color: '#FFF' },

  pwEmptyCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...CARD_SHADOW,
  },
  pwEmptyIconWrap: {
    width: 44, height: 44, borderRadius: 12,
    backgroundColor: `${Colors.primary}15`,
    alignItems: 'center', justifyContent: 'center',
  },
  pwEmptyTitle: { fontSize: 14, fontWeight: '700', color: Colors.textPrimary },
  pwEmptySubtext: { fontSize: 12, color: Colors.textSecondary, marginTop: 2 },

  pwCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    overflow: 'hidden',
    ...CARD_SHADOW,
  },

  pwStatsRow: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
    paddingVertical: 12,
  },
  pwStat: { flex: 1, alignItems: 'center', gap: 2 },
  pwStatValue: { fontSize: 16, fontWeight: '800', color: Colors.textPrimary },
  pwStatLabel: { fontSize: 10, fontWeight: '500', color: Colors.textTertiary, textTransform: 'uppercase' },
  pwStatDivider: { width: StyleSheet.hairlineWidth, backgroundColor: Colors.border },

  pwAlertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: Spacing.lg,
  },
  pwAlertBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  pwAlertIcon: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  pwAlertInfo: { flex: 1, gap: 2 },
  pwAlertTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  pwAlertProvider: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, flex: 1 },
  pwUnreadDot: {
    width: 7, height: 7, borderRadius: 4,
    backgroundColor: '#FF5C8A',
  },
  pwAlertPriceRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pwOldPrice: { fontSize: 12, color: Colors.textTertiary, textDecorationLine: 'line-through' },
  pwNewPrice: { fontSize: 13, fontWeight: '700' },
  pwDir: { fontSize: 11, fontWeight: '600' },
  pwTime: { fontSize: 11, color: Colors.textTertiary },
  pwDismissBtn: { padding: 6 },

  pwFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  pwFooterText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
});
