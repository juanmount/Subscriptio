import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Linking,
  Platform,
} from 'react-native';

import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '@/ui/components/AppHeader';
import { SearchBar } from '@/ui/components/SearchBar';
import { ProviderAvatar } from '@/ui/components/ProviderAvatar';
import { PrimaryButton } from '@/ui/components/PrimaryButton';
import { Colors, Spacing, Typography, Radius } from '@/ui/theme';
import {
  listProviders,
  searchProviders,
  listPriceEngineServices,
  insertCustomProvider,
  type ProviderWithCategory,
  type PeServiceWithPrice,
} from '@/data/repositories/providers';
import { formatCurrency } from '@/utils/money';
import { supabase } from '@/services/supabaseClient';
import { useAddSubscriptionStore } from '@/services/addSubscriptionStore';
import { hasCompletedOnboarding, getPreferredCategories, saveOnboardingPreferences, resetOnboarding } from '@/services/onboardingPrefs';
import { listSubscriptions } from '@/data/repositories/subscriptions';
import { listCategories, type CategoryRow } from '@/data/repositories/categories';
import { OnboardingModal } from '@/ui/components/OnboardingModal';
import { t } from '@/i18n';

const POPULAR_NAMES = [
  'ChatGPT', 'Claude', 'Netflix', 'Spotify Premium',
  'Disney+', 'YouTube Premium', 'Apple Music', 'Amazon Music Unlimited',
  'Xbox Game Pass', 'PlayStation Plus', 'NordVPN', 'Google One',
  'iCloud+', 'Notion', 'Microsoft 365', 'GitHub',
  'Canva', 'Figma', 'Adobe Creative Cloud', 'Dropbox',
];

// Curated suggestions per category ID — only well-known services with real plans
const CURATED_BY_CATEGORY: Record<number, string[]> = {
  1: ['ChatGPT', 'Claude', 'Midjourney', 'ElevenLabs', 'GitHub Copilot', 'Perplexity', 'Adobe Firefly', 'Runway', 'Cursor', 'Windsurf', 'Bolt.new', 'Lovable'],
  2: ['Netflix', 'Disney+', 'YouTube Premium', 'Spotify Premium', 'Apple Music', 'Amazon Music Unlimited', 'Crunchyroll', 'HBO Max', 'Paramount+', 'Peacock', 'Deezer', 'Tidal'],
  3: ['Notion', 'Microsoft 365', 'Slack', 'Todoist', 'Evernote', 'Make', 'IFTTT Pro', 'Zoom'],
  4: ['GitHub', 'Supabase', 'Vercel', 'Netlify', 'Render', 'Railway', 'Replit', 'Expo EAS', 'Firebase', 'AWS', 'Google Cloud', 'Linear'],
  5: ['Google One', 'iCloud+', 'Dropbox', 'pCloud'],
  6: ['Strava', 'Calm', 'Headspace', 'MyFitnessPal', 'Duolingo', 'Brilliant'],
  7: ['Coursera Plus', 'MasterClass', 'Skillshare', 'Udemy', 'Scribd', 'Medium', 'New York Times', 'Wall Street Journal', 'Washington Post', 'Audible', 'Kindle Unlimited'],
  9: ['Adobe Creative Cloud', 'Figma', 'Canva'],
  10: ['ExpressVPN', 'NordVPN', 'Surfshark', 'Proton VPN', 'Fastmail', 'Proton Unlimited', 'Bitwarden Premium'],
  11: ['Xbox Game Pass', 'PlayStation Plus', 'Nintendo Switch Online', 'GeForce Now', 'Discord Nitro', 'Twitch Turbo'],
  12: ['LinkedIn Premium'],
};

export default function AgregarSuscripcionScreen() {
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [allProviders, setAllProviders] = useState<ProviderWithCategory[]>([]);
  const [peServices, setPeServices] = useState<PeServiceWithPrice[]>([]);
  const [results, setResults] = useState<(ProviderWithCategory & { minPriceMinor?: number; priceCurrency?: string })[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingCompleted, setOnboardingCompleted] = useState(false);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [preferredCategoryIds, setPreferredCategoryIds] = useState<number[]>([]);
  const { setProvider } = useAddSubscriptionStore();

  useEffect(() => {
    listProviders().then((data) => setAllProviders(data));
    listPriceEngineServices().then((data) => setPeServices(data));
    listCategories().then(setCategories);

    // Check if onboarding should be shown
    (async () => {
      const completed = await hasCompletedOnboarding();
      if (completed) {
        const prefs = await getPreferredCategories();
        setPreferredCategoryIds(prefs);
        setOnboardingCompleted(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (search.trim().length === 0) {
      setResults([]);
      return;
    }
    const lower = search.toLowerCase();

    // Search price engine services
    const peMatches = peServices
      .filter((s) => s.name.toLowerCase().includes(lower))
      .map((s) => ({
        id: s.id,
        name: s.name,
        logoUrl: s.logoUrl,
        websiteUrl: s.websiteUrl,
        pricingUrl: null,
        categoryId: null,
        isCustom: false,
        createdAt: 0,
        category: s.category ? { id: 0, name: s.category, icon: null, color: null } : null,
        minPriceMinor: s.minPriceMinor,
        priceCurrency: s.currency,
      }));

    // Also search app providers as fallback
    searchProviders(search).then((data) => {
      const seen = new Set<string>();
      const peNames = new Set(peMatches.map((p) => p.name));
      const appMatches = data
        .filter((p) => !peNames.has(p.name))
        .filter((p) => {
          if (seen.has(p.name)) return false;
          seen.add(p.name);
          return true;
        });
      setResults([...peMatches, ...appMatches]);
    });
  }, [search, peServices]);

  // Map category IDs to display names for dynamic title
  const catIdToDisplay = new Map<number, string>();
  for (const cat of categories) {
    catIdToDisplay.set(cat.id, cat.name);
  }

  const peNameMap = new Map(peServices.map((s) => [s.name, s]));
  const seenNames = new Set<string>();

  function toProvider(svc: PeServiceWithPrice): ProviderWithCategory & { minPriceMinor?: number; priceCurrency?: string } {
    return {
      id: svc.id,
      name: svc.name,
      logoUrl: svc.logoUrl,
      websiteUrl: svc.websiteUrl,
      pricingUrl: null,
      categoryId: null,
      isCustom: false,
      createdAt: 0,
      category: svc.category ? { id: 0, name: svc.category, icon: null, color: null } : null,
      minPriceMinor: svc.minPriceMinor,
      priceCurrency: svc.currency,
    };
  }

  const suggested: (ProviderWithCategory & { minPriceMinor?: number; priceCurrency?: string })[] = [];
  if (preferredCategoryIds.length > 0) {
    for (const catId of preferredCategoryIds) {
      const curated = CURATED_BY_CATEGORY[catId] ?? [];
      for (const name of curated) {
        if (seenNames.has(name)) continue;
        const appProv = allProviders.find((p) => p.name === name);
        if (appProv) {
          seenNames.add(name);
          suggested.push(appProv);
        }
      }
    }
  }

  // Fill remaining with popular names as fallback
  const popular: (ProviderWithCategory & { minPriceMinor?: number; priceCurrency?: string })[] = [];
  for (const name of POPULAR_NAMES) {
    if (seenNames.has(name)) continue;
    const peSvc = peNameMap.get(name);
    if (peSvc) {
      seenNames.add(name);
      popular.push(toProvider(peSvc));
      continue;
    }
    const appProv = allProviders.find((p) => p.name === name);
    if (appProv) {
      seenNames.add(name);
      popular.push(appProv);
    }
  }

  // Suggested first, then popular as fill
  const mergedPopular = [...suggested, ...popular];

  // Build dynamic section title based on preferences
  const popularSectionTitle = (() => {
    if (preferredCategoryIds.length === 0) return t('subs.popular');
    const names = preferredCategoryIds
      .map((id) => catIdToDisplay.get(id))
      .filter(Boolean) as string[];
    if (names.length === 0) return t('subs.popular');
    if (names.length === 1) return t('onboarding.popularProfileSingle', { category: names[0] });
    if (names.length === 2) return t('onboarding.popularProfileDouble', { cat1: names[0], cat2: names[1] });
    return t('onboarding.popularProfileMulti', { cat1: names[0], cat2: names[1], count: names.length - 2 });
  })();

  const handleSelect = async (provider: ProviderWithCategory) => {
    let resolvedProvider = provider;

    // If this came from the price engine, the ID belongs to pe_services.
    // We need the corresponding providers table ID.
    const { data: appProvider } = await supabase
      .from('providers')
      .select('*, category:categories(*)')
      .eq('name', provider.name)
      .maybeSingle();

    if (appProvider) {
      resolvedProvider = {
        id: appProvider.id,
        name: appProvider.name,
        logoUrl: appProvider.logo_url,
        websiteUrl: appProvider.website_url,
        pricingUrl: appProvider.pricing_url,
        categoryId: appProvider.category_id,
        isCustom: appProvider.is_custom,
        createdAt: appProvider.created_at,
        category: appProvider.category,
      };
    } else {
      // Provider doesn't exist in app table yet — create it
      const newId = await insertCustomProvider(provider.name, provider.categoryId ?? undefined);
      resolvedProvider = { ...provider, id: newId };
    }

    // Check if user already has a subscription for this provider
    if (resolvedProvider.id) {
      const subs = await listSubscriptions();
      const existing = subs.find((s) => s.providerId === resolvedProvider.id);
      if (existing) {
        Alert.alert(
          t('subs.alreadyHaveTitle'),
          t('subs.alreadyHaveMsg', { name: provider.name }),
          [
            { text: t('subs.goToSub'), onPress: () => router.push({ pathname: '/suscripciones/[id]', params: { id: String(existing.id) } }) },
            { text: t('common.cancel'), style: 'cancel' },
          ],
        );
        return;
      }
    }

    setProvider(resolvedProvider);
    router.push('/suscripciones/agregar-form');
  };

  const handleOtro = () => {
    setProvider(null);
    router.push('/suscripciones/agregar-form');
  };

  const handleOnboardingComplete = async (selectedIds: number[]) => {
    await saveOnboardingPreferences(selectedIds);
    setPreferredCategoryIds(selectedIds);
    setOnboardingCompleted(true);
    setShowOnboarding(false);
  };

  const handleOnboardingSkip = async () => {
    await saveOnboardingPreferences([]);
    setOnboardingCompleted(true);
    setShowOnboarding(false);
  };

  const handleEditPreferences = async () => {
    await resetOnboarding();
    setPreferredCategoryIds([]);
    setOnboardingCompleted(false);
    setShowOnboarding(true);
  };

  const isSearching = search.trim().length > 0;

  return (
    <LinearGradient
      colors={['#EDE9FF', '#F5F3FF', '#FAFAFE']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.2, y: 1 }}
      style={[styles.container, { paddingBottom: insets.bottom }]}
    >
      <AppHeader onBack={() => router.back()} transparent />

      <View style={styles.heroSection}>
        <Text style={styles.title}>{t('subs.addTitle')}</Text>
        <Text style={styles.subtitle}>{t('subs.addSubtitle')}</Text>
      </View>

      <View style={styles.searchContainer}>
        <SearchBar
          value={search}
          onChangeText={setSearch}
          placeholder={t('subs.searchPlaceholder')}
        />
      </View>

      {isSearching ? (
        <FlatList
          data={results}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.resultRow}
              onPress={() => handleSelect(item)}
              activeOpacity={0.7}
            >
              <ProviderAvatar name={item.name} size={40} />
              <View style={styles.resultContent}>
                <Text style={styles.resultName}>{item.name}</Text>
                {item.category && (
                  <Text style={styles.resultCategory}>{item.category.name}</Text>
                )}
                {item.minPriceMinor != null && item.minPriceMinor > 0 && item.priceCurrency && (
                  <Text style={styles.resultPrice}>
                    {t('subs.from')} {formatCurrency(item.minPriceMinor, item.priceCurrency)}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>{t('subs.noResults', { query: search })}</Text>
              <TouchableOpacity onPress={handleOtro} style={styles.createCustom}>
                <Text style={styles.createCustomText}>{t('subs.createCustom', { query: search })}</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={styles.resultsList}
        />
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{popularSectionTitle}</Text>
            {onboardingCompleted && (
              <TouchableOpacity onPress={handleEditPreferences} hitSlop={8} style={styles.editPrefsBtn}>
                <Ionicons name="options-outline" size={16} color={Colors.primary} />
                <Text style={styles.editPrefsText}>{t('onboarding.editPreferences')}</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.grid}>
            {mergedPopular.slice(0, 18).map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.gridCell}
                onPress={() => handleSelect(p)}
                activeOpacity={0.75}
              >
                <ProviderAvatar name={p.name} size={52} />
                <Text style={styles.gridLabel} numberOfLines={1}>{p.name.split(' ')[0]}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.gridCell}
              onPress={handleOtro}
              activeOpacity={0.75}
            >
              <View style={styles.otroAvatar}>
                <Ionicons name="ellipsis-horizontal" size={22} color={Colors.textSecondary} />
              </View>
              <Text style={styles.gridLabel}>{t('common.other')}</Text>
            </TouchableOpacity>
          </View>

        </ScrollView>
      )}

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.findMySubsBtn}
          onPress={() => {
            const url = Platform.OS === 'ios'
              ? 'https://apps.apple.com/account/subscriptions'
              : 'https://play.google.com/store/account/subscriptions';
            Alert.alert(
              t('subs.findMySubs'),
              t('subs.findMySubsDesc'),
              [
                { text: t('common.cancel'), style: 'cancel' },
                { text: t('subs.findMySubsGo'), onPress: () => Linking.openURL(url) },
              ],
            );
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.findMySubsText}>{t('subs.findMySubs')}</Text>
          <Ionicons name="help-circle-outline" size={14} color={Colors.textTertiary} />
        </TouchableOpacity>
        <PrimaryButton label={t('common.addManual')} onPress={handleOtro} />
      </View>

      <OnboardingModal
        visible={showOnboarding}
        categories={categories}
        onComplete={handleOnboardingComplete}
        onSkip={handleOnboardingSkip}
      />
    </LinearGradient>
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
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  title: { fontSize: 26, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.6, textAlign: 'center' },
  subtitle: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 4, textAlign: 'center' },
  searchContainer: {
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.lg,
  },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: 100 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.textSecondary, marginBottom: Spacing.md, flexShrink: 1, flex: 1 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  editPrefsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexShrink: 0,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.primaryLight,
  },
  editPrefsText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  sectionTitleSpaced: { marginTop: Spacing.xl },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  gridCell: {
    width: '30%',
    backgroundColor: Colors.background,
    borderRadius: Radius.lg,
    alignItems: 'center',
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
    ...CARD_SHADOW,
  },
  gridLabel: {
    ...Typography.caption,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  otroAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  findMySubsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  findMySubsText: {
    ...Typography.bodySmall,
    color: Colors.primary,
    fontWeight: '600',
  },
  resultsList: { paddingHorizontal: Spacing.xl },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  resultContent: { flex: 1 },
  resultName: { ...Typography.subscriptionName, color: Colors.textPrimary },
  resultCategory: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 1 },
  resultPrice: { ...Typography.bodySmall, color: Colors.primary, marginTop: 2, fontWeight: '600' },
  noResults: { paddingTop: Spacing.xxl, alignItems: 'center', gap: Spacing.md },
  noResultsText: { ...Typography.body, color: Colors.textSecondary },
  createCustom: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  createCustomText: { ...Typography.body, color: Colors.primary, fontWeight: '500' },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
  },
});
