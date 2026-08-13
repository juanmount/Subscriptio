import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, Typography, Radius } from '@/ui/theme';
import { t } from '@/i18n';
import type { CategoryRow } from '@/data/repositories/categories';

interface OnboardingModalProps {
  visible: boolean;
  categories: CategoryRow[];
  onComplete: (selectedIds: number[]) => void;
  onSkip: () => void;
}

export function OnboardingModal({ visible, categories, onComplete, onSkip }: OnboardingModalProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [step, setStep] = useState(0);

  const toggleCategory = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleFinish = () => {
    onComplete(Array.from(selected));
    setStep(0);
    setSelected(new Set());
  };

  const handleSkip = () => {
    onSkip();
    setStep(0);
    setSelected(new Set());
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleSkip}>
      <Pressable style={styles.overlay} onPress={handleSkip}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {step === 0 ? (
            <>
              <View style={styles.handle} />
              <TouchableOpacity style={styles.closeBtn} onPress={handleSkip} hitSlop={12}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>

              <View style={styles.welcomeIcon}>
                <Image source={require('../../../assets/icon.png')} style={styles.welcomeLogo} />
              </View>

              <Text style={styles.welcomeTitle}>{t('onboarding.welcomeTitle')}</Text>
              <Text style={styles.welcomeSubtitle}>{t('onboarding.welcomeBody')}</Text>

              <View style={styles.featureList}>
                <View style={styles.featureRow}>
                  <View style={[styles.featureIcon, { backgroundColor: '#EDE9FF' }]}>
                    <Ionicons name="analytics-outline" size={20} color="#6B52E0" />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>{t('onboarding.feature1Title')}</Text>
                    <Text style={styles.featureDesc}>{t('onboarding.feature1Desc')}</Text>
                  </View>
                </View>

                <View style={styles.featureRow}>
                  <View style={[styles.featureIcon, { backgroundColor: '#E5F0FF' }]}>
                    <Ionicons name="flash-outline" size={20} color="#2B6ED4" />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>{t('onboarding.feature2Title')}</Text>
                    <Text style={styles.featureDesc}>{t('onboarding.feature2Desc')}</Text>
                  </View>
                </View>

                <View style={styles.featureRow}>
                  <View style={[styles.featureIcon, { backgroundColor: '#E5F9E5' }]}>
                    <Ionicons name="shield-checkmark-outline" size={20} color="#2D9E40" />
                  </View>
                  <View style={styles.featureContent}>
                    <Text style={styles.featureTitle}>{t('onboarding.feature3Title')}</Text>
                    <Text style={styles.featureDesc}>{t('onboarding.feature3Desc')}</Text>
                  </View>
                </View>
              </View>

              <TouchableOpacity
                style={styles.startBtn}
                onPress={() => setStep(1)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#8B72FF', '#6B52E0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.startBtnGradient}
                >
                  <Text style={styles.startBtnText}>{t('onboarding.startBtn')}</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleSkip} hitSlop={8}>
                <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.handle} />
              <TouchableOpacity style={styles.closeBtn} onPress={handleSkip} hitSlop={12}>
                <Ionicons name="close" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>

              <Text style={styles.stepTitle}>{t('onboarding.categoriesTitle')}</Text>
              <Text style={styles.stepSubtitle}>{t('onboarding.categoriesBody')}</Text>

              <ScrollView showsVerticalScrollIndicator={false} style={styles.catScroll}>
                <View style={styles.catGrid}>
                  {categories.map((cat) => {
                    const active = selected.has(cat.id);
                    return (
                      <TouchableOpacity
                        key={cat.id}
                        style={[styles.catChip, active && styles.catChipActive]}
                        onPress={() => toggleCategory(cat.id)}
                        activeOpacity={0.75}
                      >
                        {active ? (
                          <LinearGradient
                            colors={['#8B72FF', '#6B52E0']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                            style={styles.catChipGradient}
                          >
                            <Text style={styles.catEmoji}>{cat.icon}</Text>
                            <Text style={styles.catLabelActive}>{cat.name}</Text>
                            <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" />
                          </LinearGradient>
                        ) : (
                          <>
                            <Text style={styles.catEmoji}>{cat.icon}</Text>
                            <Text style={styles.catLabel}>{cat.name}</Text>
                            <Ionicons name="add-circle-outline" size={16} color={Colors.textTertiary} />
                          </>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>

              <View style={styles.footerRow}>
                <Text style={styles.selectedCount}>
                  {selected.size > 0
                    ? t('onboarding.selected', { count: selected.size })
                    : t('onboarding.selectAtLeast')}
                </Text>
                <TouchableOpacity
                  style={[styles.finishBtn, selected.size === 0 && styles.finishBtnDisabled]}
                  onPress={handleFinish}
                  disabled={selected.size === 0}
                  activeOpacity={0.8}
                >
                  <Text style={styles.finishBtnText}>{t('onboarding.finishBtn')}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    maxHeight: '85%',
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  closeBtn: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.lg,
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: Colors.appBackground,
  },

  welcomeIcon: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  welcomeLogo: {
    width: 72,
    height: 72,
    borderRadius: 18,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
    marginBottom: Spacing.sm,
  },
  welcomeSubtitle: {
    ...Typography.body,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xxl,
  },
  startBtn: {
    marginBottom: Spacing.lg,
  },
  startBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: Radius.lg,
  },
  startBtnText: {
    fontSize: 17,
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

  featureList: {
    gap: Spacing.lg,
    marginBottom: Spacing.xxl,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  featureDesc: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    lineHeight: 19,
  },

  stepTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  catScroll: {
    maxHeight: 320,
  },
  catGrid: {
    gap: Spacing.sm,
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.appBackground,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  catChipActive: {
    borderColor: 'transparent',
    backgroundColor: 'transparent',
    padding: 0,
    overflow: 'hidden',
  },
  catChipGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    flex: 1,
  },
  catEmoji: {
    fontSize: 22,
  },
  catLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  catLabelActive: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.lg,
    marginTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
  },
  selectedCount: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    flex: 1,
  },
  finishBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  finishBtnDisabled: {
    opacity: 0.4,
  },
  finishBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
