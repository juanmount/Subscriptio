import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Modal,
  Pressable,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Constants from 'expo-constants';
import { AppHeader } from '@/ui/components/AppHeader';
import { ScreenBackground } from '@/ui/components/ScreenBackground';
import { Colors, Spacing, Typography, Radius } from '@/ui/theme';
import { t, getLocale, type AppLocale } from '@/i18n';
import { usePriceWatchStore } from '@/services/priceWatchStore';
import { useAuthStore } from '@/services/authStore';
import { usePaywallStore } from '@/services/paywallStore';
import { listSubscriptions } from '@/data/repositories/subscriptions';
import { supabase, getSupabaseAuthUid } from '@/services/supabaseClient';

const CARD_SHADOW = {
  shadowColor: '#6B52E0',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 3,
};

// Placeholder URLs — replace with real hosted pages before store submission
const TERMS_URL = 'https://stack-app.com/terms';
const PRIVACY_URL = 'https://stack-app.com/privacy';
const APP_STORE_URL = 'https://apps.apple.com/app/stack/id0000000000';

type SettingItem = {
  icon: string;
  iconBg: string;
  iconColor: string;
  label: string;
  value?: string;
  hint?: string;
  onPress?: () => void;
  destructive?: boolean;
};

export default function MasScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { unreadCount, loadAlerts } = usePriceWatchStore();
  const { user, signOut } = useAuthStore();
  const { isPaid, checkPaidStatus } = usePaywallStore();
  const [subCount, setSubCount] = useState(0);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showDataDisclaimer, setShowDataDisclaimer] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const [showMoreAccount, setShowMoreAccount] = useState(false);
  const currentLocale = getLocale();

  useEffect(() => {
    loadAlerts();
    listSubscriptions().then((subs) => setSubCount(subs.length));
  }, [loadAlerts]);

  const appVersion = Constants.expoConfig?.version ?? '1.0.0';

  const displayName = user?.displayName ?? user?.email?.split('@')[0] ?? '';
  const initials = useMemo(() => {
    if (!displayName) return '?';
    const parts = displayName.split(/[\s@]+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return displayName.slice(0, 2).toUpperCase();
  }, [displayName]);

  const localeLabels: Record<AppLocale, string> = {
    'es-AR': 'Español',
    'en-US': 'English',
    'pt-BR': 'Português',
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      t('more.deleteAccount'),
      t('more.deleteAccountConfirm'),
      [
        { text: t('more.cancel'), style: 'cancel' },
        {
          text: t('more.deleteAccountCta'),
          style: 'destructive',
          onPress: async () => {
            const uid = getSupabaseAuthUid();
            if (uid) {
              await supabase.from('subscriptions').delete().eq('user_id', uid);
              await supabase.from('cards').delete().eq('user_id', uid);
              await supabase.from('extra_purchases').delete().eq('user_id', uid);
              await supabase.from('settings').delete().eq('user_id', uid);
            }
            await signOut();
          },
        },
      ],
    );
  };

  const handleDeleteData = () => {
    Alert.alert(
      t('more.deleteAllData'),
      t('more.deleteDataConfirm'),
      [
        { text: t('more.cancel'), style: 'cancel' },
        {
          text: t('more.deleteDataCta'),
          style: 'destructive',
          onPress: async () => {
            const uid = getSupabaseAuthUid();
            if (uid) {
              await supabase.from('subscriptions').delete().eq('user_id', uid);
              await supabase.from('cards').delete().eq('user_id', uid);
              await supabase.from('extra_purchases').delete().eq('user_id', uid);
            }
          },
        },
      ],
    );
  };

  const handleExport = async () => {
    const uid = getSupabaseAuthUid();
    if (!uid) return;
    const { data: subs } = await supabase.from('subscriptions').select('*').eq('user_id', uid);
    const { data: cards } = await supabase.from('cards').select('*').eq('user_id', uid);
    const exportData = JSON.stringify({ subscriptions: subs, cards, exportedAt: new Date().toISOString() }, null, 2);
    try {
      await Share.share({ message: exportData });
    } catch {
      Alert.alert('Error', t('more.exportConfirm'));
    }
  };

  const handleRestorePurchase = async () => {
    await checkPaidStatus();
    Alert.alert(t('more.restorePurchase'), isPaid ? '✓' : t('more.comingSoon'));
  };

  const handleManageSubs = () => {
    Linking.openURL('https://apps.apple.com/account/subscriptions');
  };

  const handleRateApp = () => {
    Linking.openURL(APP_STORE_URL);
  };

  const handleLanguageChange = (locale: AppLocale) => {
    setShowLangModal(false);
    Alert.alert(t('more.language'), t('more.comingSoon'));
  };

  const settingsGroups: { title: string; items: SettingItem[] }[] = [
    {
      title: t('more.preferences'),
      items: [
        { icon: 'notifications-outline', iconBg: '#EDE9FF', iconColor: '#6B52E0', label: t('more.notifications'), value: t('more.notificationsOn'), onPress: () => Alert.alert(t('more.notifications'), t('more.comingSoon')) },
        { icon: 'globe-outline', iconBg: '#E3F9E5', iconColor: '#2D9E40', label: t('more.language'), value: localeLabels[currentLocale], onPress: () => setShowLangModal(true) },
      ],
    },
    {
      title: t('more.data'),
      items: [
        { icon: 'cloud-download-outline', iconBg: '#FFF8E5', iconColor: '#B07800', label: t('more.exportData'), onPress: handleExport },
        { icon: 'trash-outline', iconBg: '#FFE5EC', iconColor: '#E03060', label: t('more.deleteAllData'), onPress: handleDeleteData, destructive: true },
      ],
    },
    {
      title: t('more.account'),
      items: [
        { icon: 'log-out-outline', iconBg: '#FFE5EC', iconColor: '#E03060', label: t('more.signOut'), onPress: () => signOut() },
      ],
    },
    {
      title: t('more.legal'),
      items: [
        { icon: 'document-text-outline', iconBg: '#F0F0FF', iconColor: '#5050CC', label: t('more.terms'), onPress: () => Linking.openURL(TERMS_URL) },
        { icon: 'shield-checkmark-outline', iconBg: '#E5FFF5', iconColor: '#00875A', label: t('more.privacyPolicy'), onPress: () => Linking.openURL(PRIVACY_URL) },
        { icon: 'lock-closed-outline', iconBg: '#FFF8E5', iconColor: '#B07800', label: t('more.dataDisclaimer'), onPress: () => setShowDataDisclaimer(true) },
      ],
    },
    {
      title: t('more.about'),
      items: [
        { icon: 'information-circle-outline', iconBg: '#F0F0FF', iconColor: '#5050CC', label: t('more.aboutApp'), value: `v${appVersion}`, onPress: () => setShowAbout(true) },
        { icon: 'star-outline', iconBg: '#FFE5F5', iconColor: '#CC0066', label: t('more.rateApp'), onPress: handleRateApp },
      ],
    },
  ];

  return (
    <ScreenBackground paddingBottom={insets.bottom}>
      <AppHeader transparent />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <View style={styles.titleArea}>
          <Text style={styles.screenTitle}>{t('more.title')}</Text>
          <Text style={styles.screenSubtitle}>{t('more.subtitle')}</Text>
        </View>

        {/* Profile card */}
        <LinearGradient
          colors={['#9B7BFF', '#6B52E0', '#5040C0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.profileCard}
        >
          <View style={styles.profileAvatar}>
            <Text style={styles.profileInitials}>{initials}</Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{displayName || 'STACK'}</Text>
            <Text style={styles.profileEmail}>{t('more.activeSubs', { count: subCount })}</Text>
          </View>
          {isPaid ? (
            <View style={styles.paidBadge}>
              <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
              <Text style={styles.paidBadgeText}>PRO</Text>
            </View>
          ) : null}
        </LinearGradient>

        {/* Price Watch card */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => router.push('/(tabs)/price-watch')}
          style={styles.priceWatchCard}
        >
          <View style={[styles.settingIcon, { backgroundColor: '#EDE9FF' }]}>
            <Ionicons name="pulse-outline" size={18} color={Colors.primary} />
          </View>
          <View style={styles.priceWatchInfo}>
            <Text style={styles.priceWatchTitle}>Price Watch</Text>
            <Text style={styles.priceWatchSubtitle}>
              {unreadCount > 0
                ? `${unreadCount} ${unreadCount === 1 ? t('priceWatch.newAlert') : t('priceWatch.newAlerts')}`
                : t('priceWatch.monitoringStatus')}
            </Text>
          </View>
          {unreadCount > 0 && (
            <View style={styles.priceWatchBadge}>
              <Text style={styles.priceWatchBadgeText}>{unreadCount}</Text>
            </View>
          )}
          <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
        </TouchableOpacity>

        {/* Settings groups (except account which is rendered separately) */}
        {settingsGroups.filter((g) => g.title !== t('more.account')).map((group, gi) => (
          <View key={gi} style={styles.group}>
            <Text style={styles.groupTitle}>{group.title}</Text>
            <View style={styles.groupCard}>
              {group.items.map((item, idx, arr) => {
                const isLast = idx === arr.length - 1;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.settingRow, !isLast && styles.settingBorder]}
                    activeOpacity={0.7}
                    onPress={item.onPress}
                  >
                    <View style={[styles.settingIcon, { backgroundColor: item.iconBg }]}>
                      <Ionicons name={item.icon as any} size={16} color={item.iconColor} />
                    </View>
                    <View style={styles.settingLabelWrap}>
                      <Text style={[styles.settingLabel, item.destructive && { color: Colors.error }]}>
                        {item.label}
                      </Text>
                      {item.hint ? <Text style={styles.settingHint}>{item.hint}</Text> : null}
                    </View>
                    {item.value && <Text style={styles.settingValue}>{item.value}</Text>}
                    <Ionicons name="chevron-forward" size={14} color={Colors.textTertiary} />
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Account group — sign out visible, more options collapsible */}
        <View style={styles.group}>
          <Text style={styles.groupTitle}>{t('more.account')}</Text>
          <View style={styles.groupCard}>
            <TouchableOpacity
              style={[styles.settingRow, styles.settingBorder]}
              activeOpacity={0.7}
              onPress={() => signOut()}
            >
              <View style={[styles.settingIcon, { backgroundColor: '#FFE5EC' }]}>
                <Ionicons name="log-out-outline" size={16} color="#E03060" />
              </View>
              <Text style={[styles.settingLabel, { color: Colors.error }]}>
                {t('more.signOut')}
              </Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.settingRow}
              activeOpacity={0.7}
              onPress={() => setShowMoreAccount(!showMoreAccount)}
            >
              <View style={[styles.settingIcon, { backgroundColor: Colors.backgroundSecondary }]}>
                <Ionicons name={showMoreAccount ? 'chevron-up-outline' : 'chevron-down-outline'} size={16} color={Colors.textSecondary} />
              </View>
              <Text style={[styles.settingLabel, { color: Colors.textSecondary }]}>
                {t('more.moreOptions')}
              </Text>
            </TouchableOpacity>
          </View>

          {showMoreAccount ? (
            <View style={[styles.groupCard, { marginTop: Spacing.sm }]}>
              <TouchableOpacity
                style={[styles.settingRow, styles.settingBorder]}
                activeOpacity={0.7}
                onPress={handleRestorePurchase}
              >
                <View style={[styles.settingIcon, { backgroundColor: '#EDE9FF' }]}>
                  <Ionicons name="refresh-circle-outline" size={16} color={Colors.primary} />
                </View>
                <Text style={styles.settingLabel}>
                  {t('more.restorePurchase')}
                </Text>
                <Ionicons name="chevron-forward" size={14} color={Colors.textTertiary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.settingRow}
                activeOpacity={0.7}
                onPress={handleDeleteAccount}
              >
                <View style={[styles.settingIcon, { backgroundColor: '#FFE5EC' }]}>
                  <Ionicons name="person-remove-outline" size={16} color="#E03060" />
                </View>
                <View style={styles.settingLabelWrap}>
                  <Text style={[styles.settingLabel, { color: Colors.error }]}>
                    {t('more.deleteAccount')}
                  </Text>
                  <Text style={styles.settingHint}>{t('more.deleteAccountHint')}</Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={Colors.textTertiary} />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <Text style={styles.footer}>STACK v{appVersion}</Text>
      </ScrollView>

      {/* Language modal */}
      <Modal visible={showLangModal} transparent animationType="fade" onRequestClose={() => setShowLangModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowLangModal(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <Text style={styles.modalTitle}>{t('more.language')}</Text>
            {(Object.keys(localeLabels) as AppLocale[]).map((loc) => (
              <TouchableOpacity
                key={loc}
                style={[styles.langRow, loc === currentLocale && styles.langRowActive]}
                onPress={() => handleLanguageChange(loc)}
              >
                <Text style={[styles.langText, loc === currentLocale && styles.langTextActive]}>
                  {localeLabels[loc]}
                </Text>
                {loc === currentLocale ? (
                  <Ionicons name="checkmark" size={18} color={Colors.primary} />
                ) : null}
              </TouchableOpacity>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Data disclaimer modal */}
      <Modal visible={showDataDisclaimer} transparent animationType="fade" onRequestClose={() => setShowDataDisclaimer(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowDataDisclaimer(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.disclaimerIcon}>
              <Ionicons name="lock-closed" size={28} color={Colors.primary} />
            </View>
            <Text style={styles.modalTitle}>{t('more.dataDisclaimerTitle')}</Text>
            <Text style={styles.disclaimerBody}>{t('more.dataDisclaimerBody')}</Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowDataDisclaimer(false)}>
              <Text style={styles.modalCloseText}>{t('common.confirm')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* About modal */}
      <Modal visible={showAbout} transparent animationType="fade" onRequestClose={() => setShowAbout(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowAbout(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.disclaimerIcon}>
              <LinearGradient
                colors={['#9B7BFF', '#6B52E0']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.aboutIconBg}
              >
                <Text style={styles.aboutIconText}>S</Text>
              </LinearGradient>
            </View>
            <Text style={styles.modalTitle}>STACK</Text>
            <Text style={styles.disclaimerBody}>{t('more.aboutBody')}</Text>
            <Text style={styles.aboutVersion}>v{appVersion}</Text>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setShowAbout(false)}>
              <Text style={styles.modalCloseText}>{t('common.confirm')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: Spacing.xxxl },

  titleArea: { paddingTop: Spacing.sm, paddingBottom: Spacing.lg },
  screenTitle: { fontSize: 32, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -1 },
  screenSubtitle: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },

  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: Spacing.xl,
    marginBottom: Spacing.xxl,
    gap: Spacing.md,
    ...CARD_SHADOW,
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitials: { fontSize: 20, fontWeight: '800', color: '#FFFFFF' },
  profileInfo: { flex: 1 },
  profileName: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  profileEmail: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  paidBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.full,
  },
  paidBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },

  group: { marginBottom: Spacing.xxl },
  groupTitle: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: Spacing.sm, marginLeft: 4, textTransform: 'uppercase', letterSpacing: 0.5 },
  groupCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    overflow: 'hidden',
    ...CARD_SHADOW,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  settingBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingLabelWrap: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: '500', color: Colors.textPrimary },
  settingHint: { fontSize: 12, color: Colors.textTertiary, marginTop: 2 },
  settingValue: { fontSize: 14, color: Colors.textTertiary },
  priceWatchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
    gap: Spacing.md,
    ...CARD_SHADOW,
  },
  priceWatchInfo: { flex: 1 },
  priceWatchTitle: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },
  priceWatchSubtitle: { fontSize: 13, color: Colors.textSecondary, marginTop: 2 },
  priceWatchBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  priceWatchBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFFFFF' },
  footer: { fontSize: 12, color: Colors.textTertiary, textAlign: 'center', marginTop: Spacing.lg },

  // Modals
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  modalSheet: {
    backgroundColor: Colors.background,
    borderRadius: 24,
    padding: Spacing.xxl,
    width: '100%',
    maxWidth: 360,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  langRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
  },
  langRowActive: {
    backgroundColor: Colors.primaryLight,
  },
  langText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  langTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  disclaimerIcon: {
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  disclaimerBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  aboutIconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aboutIconText: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  aboutVersion: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textTertiary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  modalCloseBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
