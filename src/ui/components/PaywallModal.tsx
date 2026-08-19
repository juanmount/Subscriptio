import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography, Radius } from '@/ui/theme';
import { t } from '@/i18n';
import { usePaywallStore } from '@/services/paywallStore';
import { purchasePremium } from '@/services/revenueCatService';
import { logPaywallPurchased } from '@/services/analytics';

interface PaywallModalProps {
  visible: boolean;
  subCount: number;
  usdMonthly: string;
  localMonthly: string | null;
  localCurrencyCode: string;
  categoryBreakdown: { name: string; percentage: number }[];
  onClose: () => void;
}

export function PaywallModal({ visible, subCount, usdMonthly, localMonthly, localCurrencyCode, categoryBreakdown, onClose }: PaywallModalProps) {
  const { markAsPaid } = usePaywallStore();
  const [processing, setProcessing] = useState(false);

  const handlePay = async () => {
    setProcessing(true);
    try {
      const success = await purchasePremium();
      if (success) {
        await markAsPaid();
        await logPaywallPurchased();
        onClose();
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        console.error('[Purchase]', e);
      }
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} hitSlop={12}>
            <Ionicons name="close" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* Radiografía — show the amount */}
            <Text style={styles.title}>{t('paywall.title')}</Text>
            <Text style={styles.subtitle}>
              {t('paywall.subtitle', { count: subCount })}
            </Text>

            <LinearGradient
              colors={['#9B7BFF', '#6B52E0', '#5040C0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.amountCard}
            >
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>USD · {t('paywall.monthlyLabel')}</Text>
                <Text style={styles.amountValue}>{usdMonthly}</Text>
              </View>
              {localMonthly ? (
                <>
                  <View style={styles.amountDivider} />
                  <View style={styles.amountRow}>
                    <Text style={styles.amountLabel}>{localCurrencyCode} · {t('paywall.monthlyLabel')}</Text>
                    <Text style={styles.amountValue}>{localMonthly}</Text>
                  </View>
                </>
              ) : null}
            </LinearGradient>

            {/* Category breakdown */}
            {categoryBreakdown.length > 0 ? (
              <View style={styles.categorySection}>
                {categoryBreakdown.map((cat, i) => (
                  <View key={i} style={styles.categoryRow}>
                    <Text style={styles.categoryName}>{cat.name}</Text>
                    <View style={styles.categoryBarBg}>
                      <View style={[styles.categoryBarFill, { width: `${cat.percentage}%` }]} />
                    </View>
                    <Text style={styles.categoryPct}>{cat.percentage}%</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Sell section */}
            <View style={styles.sellSection}>
              <Text style={styles.sellTitle}>{t('paywall.sellTitle')}</Text>
              <Text style={styles.sellBody}>{t('paywall.sellBody')}</Text>

              <View style={styles.featureList}>
                <View style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                  <Text style={styles.featureText}>{t('paywall.feature1')}</Text>
                </View>
                <View style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                  <Text style={styles.featureText}>{t('paywall.feature2')}</Text>
                </View>
                <View style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                  <Text style={styles.featureText}>{t('paywall.feature3')}</Text>
                </View>
                <View style={styles.featureRow}>
                  <Ionicons name="checkmark-circle" size={18} color={Colors.primary} />
                  <Text style={styles.featureText}>{t('paywall.feature4')}</Text>
                </View>
              </View>
            </View>

            <View style={styles.priceBox}>
              <Text style={styles.price}>{t('paywall.price')}</Text>
              <Text style={styles.priceNote}>{t('paywall.priceNote')}</Text>
            </View>
          </ScrollView>

          <TouchableOpacity
            style={styles.ctaBtn}
            onPress={handlePay}
            activeOpacity={0.8}
            disabled={processing}
          >
            <LinearGradient
              colors={['#8B72FF', '#6B52E0']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              {processing ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.ctaText}>{t('paywall.cta')}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose} hitSlop={8}>
            <Text style={styles.skipText}>{t('paywall.skip')}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.xxl,
    paddingBottom: Spacing.xxxl,
    maxHeight: '90%',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  closeBtn: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
    zIndex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.lg,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 20,
  },
  amountCard: {
    borderRadius: 20,
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.8,
  },
  amountDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginVertical: Spacing.md,
  },
  categorySection: {
    marginBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    width: 90,
  },
  categoryBarBg: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.backgroundSecondary,
    overflow: 'hidden',
  },
  categoryBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  categoryPct: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    width: 38,
    textAlign: 'right',
  },
  sellSection: {
    marginBottom: Spacing.lg,
  },
  sellTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  sellBody: {
    ...Typography.body,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },
  featureList: {
    gap: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  featureText: {
    ...Typography.body,
    color: Colors.textPrimary,
    flex: 1,
  },
  priceBox: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.8,
  },
  priceNote: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 4,
  },
  ctaBtn: {
    marginBottom: Spacing.md,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: 16,
    borderRadius: Radius.md,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textTertiary,
    textAlign: 'center',
    paddingVertical: Spacing.sm,
  },
});
