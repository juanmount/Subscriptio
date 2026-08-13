import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '@/ui/components/AppHeader';
import { ProviderAvatar } from '@/ui/components/ProviderAvatar';
import { CategoryBadge } from '@/ui/components/CategoryBadge';
import { Colors, Spacing, Typography, Radius } from '@/ui/theme';
import {
  listSubscriptions,
  deleteSubscription,
  type SubscriptionWithRelations,
} from '@/data/repositories/subscriptions';
import {
  getExtraPurchasesForSubscription,
  addExtraPurchase,
  deleteExtraPurchase,
  type ExtraPurchase,
} from '@/data/repositories/extraPurchases';
import { formatCurrency } from '@/utils/money';
import { formatShortDate, frequencyLabel } from '@/utils/date';
import type { Frequency } from '@/domain/types';

const CARD_SHADOW = {
  shadowColor: '#6B52E0',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 10,
  elevation: 3,
};

export default function DetalleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const [item, setItem] = useState<SubscriptionWithRelations | null>(null);
  const [extras, setExtras] = useState<ExtraPurchase[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [inputAmount, setInputAmount] = useState('');
  const [inputDesc, setInputDesc] = useState('');
  const amountRef = useRef<TextInput>(null);

  const loadExtras = useCallback(async (subId: number) => {
    const rows = await getExtraPurchasesForSubscription(subId);
    setExtras(rows);
  }, []);

  useEffect(() => {
    if (!id) return;
    listSubscriptions().then((list) => {
      const found = list.find((s) => s.id === Number(id)) ?? null;
      setItem(found);
      if (found) loadExtras(found.id);
    });
  }, [id, loadExtras]);

  const handleOpenModal = () => {
    setInputAmount('');
    setInputDesc('');
    setShowModal(true);
    setTimeout(() => amountRef.current?.focus(), 150);
  };

  const handleAddExtra = async () => {
    if (!item) return;
    const parsed = parseFloat(inputAmount.replace(',', '.'));
    if (!parsed || parsed <= 0) return;
    await addExtraPurchase({
      subscriptionId: item.id,
      description: inputDesc.trim() || 'Consumo adicional',
      amountMinor: Math.round(parsed * 100),
      currencyCode: item.currencyCode,
      purchasedAt: Date.now(),
    });
    setShowModal(false);
    loadExtras(item.id);
  };

  const handleDeleteExtra = (extra: ExtraPurchase) => {
    Alert.alert('Eliminar', `¿Eliminar "${extra.description}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteExtraPurchase(extra.id);
          if (item) loadExtras(item.id);
        },
      },
    ]);
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar suscripción',
      '¿Seguro que querés eliminarla? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            if (!item) return;
            await deleteSubscription(item.id);
            router.back();
          },
        },
      ],
    );
  };

  if (!item) {
    return (
      <LinearGradient
        colors={['#EDE9FF', '#F5F3FF', '#FAFAFE']}
        style={styles.container}
      >
        <AppHeader onBack={() => router.back()} transparent />
        <View style={styles.center}>
          <Text style={styles.notFound}>Suscripción no encontrada</Text>
        </View>
      </LinearGradient>
    );
  }

  const name = item.customName ?? item.provider?.name ?? '—';
  const price = formatCurrency(
    item.confirmedPriceMinor,
    item.currencyCode,
    item.currency?.minorUnit ?? 2,
  );

  return (
    <LinearGradient
      colors={['#EDE9FF', '#F5F3FF', '#FAFAFE']}
      start={{ x: 0, y: 0 }}
      end={{ x: 0.2, y: 1 }}
      style={[styles.container, { paddingBottom: insets.bottom }]}
    >
      <AppHeader onBack={() => router.back()} transparent />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        {/* Hero provider card */}
        <LinearGradient
          colors={['#9B7BFF', '#6B52E0', '#5040C0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroTop}>
            <ProviderAvatar name={name} size={56} />
            <View style={styles.heroInfo}>
              <Text style={styles.heroName}>{name}</Text>
              {item.category && (
                <View style={styles.heroBadge}>
                  <Text style={styles.heroBadgeText}>{item.category.name}</Text>
                </View>
              )}
            </View>
          </View>
          <Text style={styles.heroPrice}>{price}</Text>
          <Text style={styles.heroFreq}>/ {frequencyLabel(item.frequency as Frequency)}</Text>
        </LinearGradient>

        {/* Info grid */}
        <View style={styles.infoGrid}>
          {item.customPlanName && (
            <View style={styles.infoCell}>
              <View style={[styles.infoIcon, { backgroundColor: '#EDE9FF' }]}>
                <Ionicons name="list-outline" size={14} color="#6B52E0" />
              </View>
              <Text style={styles.infoLabel}>Plan</Text>
              <Text style={styles.infoValue}>{item.customPlanName}</Text>
            </View>
          )}
          {item.nextRenewalDate && (
            <View style={styles.infoCell}>
              <View style={[styles.infoIcon, { backgroundColor: '#E3F9E5' }]}>
                <Ionicons name="calendar-outline" size={14} color="#2D9E40" />
              </View>
              <Text style={styles.infoLabel}>Renovación</Text>
              <Text style={styles.infoValue}>{formatShortDate(item.nextRenewalDate)}</Text>
            </View>
          )}
          {item.card && (
            <View style={styles.infoCell}>
              <View style={[styles.infoIcon, { backgroundColor: '#E5F0FF' }]}>
                <Ionicons name="card-outline" size={14} color="#2B6ED4" />
              </View>
              <Text style={styles.infoLabel}>Tarjeta</Text>
              <Text style={styles.infoValue}>
                {item.card.alias}{item.card.lastFour ? ` · ${item.card.lastFour}` : ''}
              </Text>
            </View>
          )}
          <View style={styles.infoCell}>
            <View style={[styles.infoIcon, { backgroundColor: '#FFF8E5' }]}>
              <Ionicons name="information-circle-outline" size={14} color="#B07800" />
            </View>
            <Text style={styles.infoLabel}>Origen</Text>
            <Text style={styles.infoValue}>
              {item.dataOrigin === 'manual' ? 'Manual' : 'Sugerido'}
            </Text>
          </View>
        </View>

        {/* Extra purchases */}
        <View style={styles.extrasCard}>
          <View style={styles.extrasHeader}>
            <View style={styles.extrasTitleRow}>
              <Ionicons name="flash" size={16} color="#FF6B35" />
              <Text style={styles.extrasTitle}>Consumos adicionales</Text>
            </View>
            <TouchableOpacity style={styles.extrasAddBtn} onPress={handleOpenModal} activeOpacity={0.75}>
              <Ionicons name="add" size={16} color={Colors.primary} />
              <Text style={styles.extrasAddText}>Agregar</Text>
            </TouchableOpacity>
          </View>

          {extras.length === 0 ? (
            <Text style={styles.extrasEmpty}>
              Sin consumos este período. Tocá Agregar para sumar créditos, tokens u otros cargos variables.
            </Text>
          ) : (
            <>
              {extras.map((e) => (
                <View key={e.id} style={styles.extraRow}>
                  <View style={styles.extraInfo}>
                    <Text style={styles.extraDesc} numberOfLines={1}>{e.description}</Text>
                    <Text style={styles.extraDate}>{formatShortDate(e.purchasedAt)}</Text>
                  </View>
                  <Text style={styles.extraAmount}>
                    {formatCurrency(e.amountMinor, e.currencyCode, 2)}
                  </Text>
                  <TouchableOpacity onPress={() => handleDeleteExtra(e)} hitSlop={8}>
                    <Ionicons name="close-circle" size={18} color={Colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              ))}
              <View style={styles.extrasTotalRow}>
                <Text style={styles.extrasTotalLabel}>Total adicional</Text>
                <Text style={styles.extrasTotalAmount}>
                  {formatCurrency(
                    extras.reduce((sum, e) => sum + e.amountMinor, 0),
                    item.currencyCode,
                    item.currency?.minorUnit ?? 2,
                  )}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity
            style={styles.actionRow}
            activeOpacity={0.7}
            onPress={() => router.push({ pathname: '/suscripciones/agregar-form', params: { editId: String(item.id) } })}
          >
            <Ionicons name="pencil-outline" size={18} color={Colors.primary} />
            <Text style={styles.actionText}>Editar</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.textTertiary} />
          </TouchableOpacity>
          <View style={styles.actionDivider} />
          <TouchableOpacity style={styles.actionRow} onPress={handleDelete} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={18} color={Colors.error} />
            <Text style={[styles.actionText, { color: Colors.error }]}>Eliminar</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.textTertiary} />
          </TouchableOpacity>
        </View>

        {/* Disclaimer */}
        <View style={styles.disclaimer}>
          <Ionicons name="shield-outline" size={14} color={Colors.textTertiary} />
          <Text style={styles.disclaimerText}>
            No conectamos medios de pago. Solo organizamos tu información.
          </Text>
        </View>
      </ScrollView>

      {/* Quick-add modal */}
      <Modal visible={showModal} transparent animationType="fade" onRequestClose={() => setShowModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowModal(false)}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalTopRow}>
                <View style={styles.modalHandle} />
                <TouchableOpacity onPress={() => setShowModal(false)} style={styles.modalCloseBtn} hitSlop={12}>
                  <Ionicons name="close" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>
              <Text style={styles.modalTitle}>Consumo adicional</Text>
              <Text style={styles.modalSubtitle}>
                Créditos, tokens, packs de imágenes u otros cargos extra de {item ? (item.customName ?? item.provider?.name ?? '—') : '—'}.
              </Text>

              <Text style={styles.modalLabel}>Importe</Text>
              <View style={styles.modalAmountRow}>
                <Text style={styles.modalCurrency}>{item?.currencyCode ?? 'USD'}</Text>
                <TextInput
                  ref={amountRef}
                  style={styles.modalAmountInput}
                  value={inputAmount}
                  onChangeText={setInputAmount}
                  placeholder="0.00"
                  placeholderTextColor={Colors.textTertiary}
                  keyboardType="decimal-pad"
                  returnKeyType="next"
                />
              </View>

              <Text style={styles.modalLabel}>Descripción (opcional)</Text>
              <TextInput
                style={styles.modalDescInput}
                value={inputDesc}
                onChangeText={setInputDesc}
                placeholder="Ej: Pack 100 créditos, 500k tokens…"
                placeholderTextColor={Colors.textTertiary}
                returnKeyType="done"
                onSubmitEditing={handleAddExtra}
              />

              <TouchableOpacity
                style={[styles.modalAddBtn, (!inputAmount || parseFloat(inputAmount.replace(',', '.')) <= 0) && styles.modalAddBtnDisabled]}
                onPress={handleAddExtra}
                activeOpacity={0.8}
              >
                <Text style={styles.modalAddBtnText}>Agregar</Text>
              </TouchableOpacity>
            </Pressable>
          </KeyboardAvoidingView>
        </Pressable>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  notFound: { ...Typography.body, color: Colors.textSecondary },
  scroll: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.sm, paddingBottom: Spacing.xxxl },

  heroCard: {
    borderRadius: 20,
    padding: Spacing.xl,
    marginBottom: Spacing.xxl,
    ...CARD_SHADOW,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, marginBottom: Spacing.lg },
  heroInfo: { flex: 1, gap: 6 },
  heroName: { fontSize: 22, fontWeight: '800', color: '#FFFFFF', letterSpacing: -0.5 },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
  },
  heroBadgeText: { fontSize: 12, fontWeight: '600', color: '#FFFFFF' },
  heroPrice: { fontSize: 36, fontWeight: '800', color: '#FFFFFF', letterSpacing: -1.5 },
  heroFreq: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xxl,
  },
  infoCell: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: Spacing.md,
    gap: 4,
    ...CARD_SHADOW,
  },
  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  infoLabel: { fontSize: 11, fontWeight: '600', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.3 },
  infoValue: { fontSize: 15, fontWeight: '600', color: Colors.textPrimary },

  actionsCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    ...CARD_SHADOW,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  actionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginLeft: Spacing.lg + 18 + Spacing.md,
  },
  actionText: { fontSize: 16, fontWeight: '500', color: Colors.textPrimary, flex: 1 },

  disclaimer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  disclaimerText: { ...Typography.bodySmall, color: Colors.textTertiary, flex: 1 },

  // ─── Extra purchases ────────────────────────────────────────────────────
  extrasCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: Spacing.lg,
    marginBottom: Spacing.xxl,
    ...CARD_SHADOW,
  },
  extrasHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  extrasTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  extrasTitle: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  extrasAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#EDE9FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  extrasAddText: { fontSize: 13, fontWeight: '600', color: Colors.primary },
  extrasEmpty: {
    fontSize: 13,
    color: Colors.textTertiary,
    lineHeight: 18,
  },
  extraRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  extraInfo: { flex: 1, gap: 2 },
  extraDesc: { fontSize: 14, fontWeight: '500', color: Colors.textPrimary },
  extraDate: { fontSize: 12, color: Colors.textTertiary },
  extraAmount: { fontSize: 15, fontWeight: '700', color: Colors.textPrimary },
  extrasTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    marginTop: Spacing.sm,
  },
  extrasTotalLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary },
  extrasTotalAmount: { fontSize: 17, fontWeight: '800', color: '#FF6B35' },

  // ─── Modal ──────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xl,
    paddingBottom: Spacing.xxxl,
    gap: Spacing.sm,
  },
  modalTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    flex: 1,
    alignSelf: 'center',
    marginLeft: 32,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: Colors.appBackground,
  },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.5 },
  modalSubtitle: { fontSize: 13, color: Colors.textSecondary, marginBottom: Spacing.sm, lineHeight: 18 },
  modalLabel: { fontSize: 12, fontWeight: '600', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.4, marginTop: Spacing.sm },
  modalAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.primary + '33',
  },
  modalCurrency: { fontSize: 16, fontWeight: '700', color: Colors.primary },
  modalAmountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    paddingVertical: 14,
    letterSpacing: -0.5,
  },
  modalDescInput: {
    backgroundColor: Colors.appBackground,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  modalAddBtn: {
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  modalAddBtnDisabled: { opacity: 0.4 },
  modalAddBtnText: { fontSize: 16, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.2 },
});
