import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  Linking,
  Pressable,
} from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { AppHeader } from '@/ui/components/AppHeader';
import { PrimaryButton } from '@/ui/components/PrimaryButton';
import { ProviderAvatar } from '@/ui/components/ProviderAvatar';
import { Colors, Spacing, Typography, Radius } from '@/ui/theme';
import { SubscriptionFormSchema, type SubscriptionFormValues, FREQUENCIES } from '@/domain/schemas';
import { useAddSubscriptionStore } from '@/services/addSubscriptionStore';
import { insertSubscription, updateSubscription, listSubscriptions, type SubscriptionWithRelations } from '@/data/repositories/subscriptions';
import { usePaywallStore } from '@/services/paywallStore';
import { listCategories, type CategoryRow } from '@/data/repositories/categories';
import { getPlansForProvider, type PlanRow } from '@/data/repositories/providers';
import { listCards, insertCard, type CardRow } from '@/data/repositories/cards';
import { toMinorUnits, parsePriceInput, formatCurrency } from '@/utils/money';
import { getCurrencyMinorUnit } from '@/data/repositories/currencies';
import { nextRenewalDate, frequencyLabel } from '@/utils/date';
import type { Frequency } from '@/domain/types';
import { t } from '@/i18n';

const CURRENCIES = ['USD', 'ARS', 'EUR', 'BRL', 'MXN', 'CLP', 'COP', 'GBP'];

const FREQ_LABELS: Record<string, string> = {
  monthly: '',
  yearly: '',
  quarterly: '',
  semiannual: '',
  weekly: '',
};

function getFreqLabel(freq: string): string {
  switch (freq) {
    case 'monthly': return t('form.monthly');
    case 'yearly': return t('form.yearly');
    case 'quarterly': return t('form.quarterly');
    case 'semiannual': return t('form.semiannual');
    case 'weekly': return t('form.weekly');
    default: return freq;
  }
}

export default function AgregarFormScreen() {
  const insets = useSafeAreaInsets();
  const { selectedProvider, selectedPlan, setPlan } = useAddSubscriptionStore();
  const params = useLocalSearchParams<{ editId?: string }>();
  const editId = params.editId ? Number(params.editId) : undefined;
  const [editingSub, setEditingSub] = useState<SubscriptionWithRelations | null>(null);
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [providerPlans, setProviderPlans] = useState<PlanRow[]>([]);
  const [saving, setSaving] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [renewalDate, setRenewalDate] = useState<Date>(
    nextRenewalDate(new Date(), 'monthly'),
  );
  const [cards, setCards] = useState<CardRow[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | undefined>(undefined);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [cardAlias, setCardAlias] = useState('');
  const [cardLastFour, setCardLastFour] = useState('');
  const [savingCard, setSavingCard] = useState(false);
  const [showPostSave, setShowPostSave] = useState(false);
  const [savedName, setSavedName] = useState('');
  const [savedCount, setSavedCount] = useState(0);
  const { isPaid, setShowPaywall } = usePaywallStore();

  const { control, handleSubmit, setValue, watch, formState: { errors } } = useForm<SubscriptionFormValues>({
    resolver: zodResolver(SubscriptionFormSchema),
    defaultValues: {
      providerId: selectedProvider?.id ?? undefined,
      customName: selectedProvider ? undefined : '',
      currencyCode: 'USD',
      frequency: 'monthly' as const,
      dataOrigin: (selectedProvider ? 'suggested' : 'manual') as SubscriptionFormValues['dataOrigin'],
    },
  });

  const watchFrequency = watch('frequency');
  const watchCurrency = watch('currencyCode');

  // Load existing subscription for edit mode
  useEffect(() => {
    if (!editId) return;
    listSubscriptions().then((list) => {
      const sub = list.find((s) => s.id === editId) ?? null;
      if (!sub) return;
      setEditingSub(sub);
      // Pre-fill form
      setValue('providerId', sub.providerId ?? undefined);
      setValue('customName', sub.customName ?? undefined);
      setValue('planId', sub.planId ?? undefined);
      setValue('customPlanName', sub.customPlanName ?? undefined);
      setValue('currencyCode', sub.currencyCode);
      setValue('frequency', sub.frequency as SubscriptionFormValues['frequency']);
      setValue('categoryId', sub.categoryId ?? undefined);
      setValue('cardId', sub.cardId ?? undefined);
      setValue('notes', sub.notes ?? undefined);
      setValue('dataOrigin', sub.dataOrigin as SubscriptionFormValues['dataOrigin']);
      // Set price
      const minorUnit = sub.currency?.minorUnit ?? 2;
      const displayPrice = formatCurrency(sub.confirmedPriceMinor, sub.currencyCode, minorUnit);
      const pricePart = displayPrice.replace(/^[A-Z]+\s/, '');
      setValue('priceInput', pricePart);
      // Set renewal date
      if (sub.nextRenewalDate) {
        const d = new Date(sub.nextRenewalDate);
        setRenewalDate(d);
        setValue('nextRenewalDate', d.getTime());
      }
      // Set card
      if (sub.cardId) setSelectedCardId(sub.cardId);
    });
  }, [editId]); // eslint-disable-line

  useEffect(() => {
    listCategories().then(setCategories);
    listCards().then(setCards);
    if (selectedProvider?.id) {
      if (selectedProvider.categoryId) {
        setValue('categoryId', selectedProvider.categoryId);
      }
      getPlansForProvider(selectedProvider.id, selectedProvider.name).then((data) => {
        console.log(`[agregar-form] Plans for provider ${selectedProvider.name} (id=${selectedProvider.id}):`, data.length, 'plans');
        setProviderPlans(data);
        const firstMonthly = data.find((p) => p.frequency === 'monthly') ?? data[0];
        if (firstMonthly) setPlan(firstMonthly);
      }).catch((err) => {
        console.error(`[agregar-form] Error fetching plans for provider ${selectedProvider.id}:`, err);
      });
    }
  }, [selectedProvider]); // eslint-disable-line

  useEffect(() => {
    setRenewalDate(nextRenewalDate(new Date(), watchFrequency as Frequency));
  }, [watchFrequency]);

  useEffect(() => {
    if (!selectedPlan) return;
    setValue('planId', selectedPlan.id);
    setValue('customPlanName', selectedPlan.name);
    const minorUnit = getCurrencyMinorUnit(selectedPlan.currencyCode);
    const displayPrice = formatCurrency(selectedPlan.suggestedPriceMinor, selectedPlan.currencyCode, minorUnit);
    const pricePart = displayPrice.replace(/^[A-Z]+\s/, '');
    setValue('priceInput', pricePart);
    setValue('currencyCode', selectedPlan.currencyCode);
    setValue('frequency', selectedPlan.frequency as SubscriptionFormValues['frequency']);
  }, [selectedPlan, setValue]);

  const onSubmit = async (values: SubscriptionFormValues) => {
    setSaving(true);
    try {
      const priceDecimal = parsePriceInput(values.priceInput);
      if (priceDecimal === null) {
        Alert.alert(t('form.price'), t('form.pricePlaceholder'));
        return;
      }
      const confirmedPriceMinor = toMinorUnits(priceDecimal, getCurrencyMinorUnit(values.currencyCode));
      const renewal = values.nextRenewalDate
        ?? nextRenewalDate(new Date(), values.frequency as SubscriptionFormValues['frequency']).getTime();

      const payload = {
        providerId: values.providerId ?? null,
        customName: values.customName || selectedProvider?.name || null,
        planId: values.planId ?? null,
        customPlanName: values.customPlanName || null,
        confirmedPriceMinor,
        currencyCode: values.currencyCode,
        convertedPriceMinor: null,
        convertedCurrencyCode: null,
        exchangeRate: null,
        exchangeRateDate: null,
        exchangeRateSource: null,
        frequency: values.frequency,
        nextRenewalDate: renewal,
        categoryId: values.categoryId ?? null,
        cardId: values.cardId ?? null,
        creditsIncluded: values.creditsIncluded ?? null,
        dataOrigin: values.dataOrigin,
        isActive: true,
        notes: values.notes || null,
      };

      if (editId && editingSub) {
        await updateSubscription(editId, { ...payload, startDate: editingSub.startDate ?? Date.now() });
        router.dismiss();
      } else {
        await insertSubscription({ ...payload, startDate: Date.now() });
        const allSubs = await listSubscriptions();
        const count = allSubs.length;
        const name = values.customName ?? selectedProvider?.name ?? '';
        setSavedName(name);
        setSavedCount(count);
        setShowPostSave(true);
      }
    } catch {
      Alert.alert(t('form.errorSaving'), t('form.errorSaving'));
    } finally {
      setSaving(false);
    }
  };

  const providerName = selectedProvider?.name ?? '';

  const sectionNum = (() => {
    let n = 0;
    return () => { n += 1; return n; };
  })();

  function GradChip({
    active, onPress, style, smStyle, children,
  }: {
    active: boolean;
    onPress: () => void;
    style?: object;
    smStyle?: boolean;
    children: React.ReactNode;
  }) {
    const chipStyle = [styles.chip, smStyle && styles.chipSm, style];
    if (active) {
      return (
        <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
          <LinearGradient
            colors={['#8B72FF', '#6B52E0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={chipStyle}
          >
            {children}
          </LinearGradient>
        </TouchableOpacity>
      );
    }
    return (
      <TouchableOpacity onPress={onPress} style={chipStyle} activeOpacity={0.75}>
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={['#EDE9FF', '#F5F3FF', '#FAFAFE']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.2, y: 1 }}
        style={[styles.container, { paddingBottom: insets.bottom }]}
      >
        <AppHeader onBack={() => router.back()} transparent />

        <View style={styles.heroSection}>
          <Text style={styles.title}>{editId ? t('subs.editTitle') : t('subs.addTitle')}</Text>
          <Text style={styles.subtitle}>{t('subs.addSubtitle')}</Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.scroll}
        >
          {/* Provider card */}
          {selectedProvider ? (
            <View style={styles.providerCard}>
              <ProviderAvatar name={providerName} size={48} />
              <View style={styles.providerInfo}>
                <Text style={styles.providerName}>{providerName}</Text>
                {selectedProvider.category && (
                  <View style={styles.providerCatBadge}>
                    <Text style={styles.providerCatText}>{selectedProvider.category.name}</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity style={styles.editBtn} onPress={() => router.back()} activeOpacity={0.7}>
                <Ionicons name="pencil-outline" size={14} color={Colors.textSecondary} />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{`${sectionNum()}. ${t('form.customName')}`}</Text>
              <Controller
                control={control}
                name="customName"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.textInput, errors.customName && styles.inputError]}
                    value={value ?? ''}
                    onChangeText={onChange}
                    placeholder="Netflix, Gym, Parking…"
                    placeholderTextColor={Colors.textTertiary}
                  />
                )}
              />
              {errors.customName && <Text style={styles.errorMsg}>{errors.customName.message}</Text>}
            </View>
          )}

          {/* Quick links — help user find their subscription info */}
          {selectedProvider && (
            <View style={styles.quickLinks}>
              {selectedProvider.websiteUrl && (
                <TouchableOpacity
                  style={styles.quickLinkBtn}
                  onPress={() => Linking.openURL(selectedProvider.websiteUrl!)}
                  activeOpacity={0.7}
                >
                  <View style={styles.quickLinkTop}>
                    <Ionicons name="globe-outline" size={16} color={Colors.primary} />
                    <Text style={styles.quickLinkText}>{t('form.visitWebsite')}</Text>
                    <Ionicons name="open-outline" size={12} color={Colors.textTertiary} />
                  </View>
                  <Text style={styles.quickLinkSub}>{t('form.visitWebsiteHint')}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.quickLinkBtn}
                onPress={() => {
                  const url = Platform.OS === 'ios'
                    ? 'https://apps.apple.com/account/subscriptions'
                    : 'https://play.google.com/store/account/subscriptions';
                  Linking.openURL(url);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.quickLinkTop}>
                  <Ionicons name="list-outline" size={16} color={Colors.primary} />
                  <Text style={styles.quickLinkText}>{t('form.mySubs')}</Text>
                  <Ionicons name="open-outline" size={12} color={Colors.textTertiary} />
                </View>
                <Text style={styles.quickLinkSub}>{t('form.mySubsHint')}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Plan */}
          {providerPlans.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{`${sectionNum()}. ${t('form.plan')}`}</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.chipRow}>
                  {providerPlans.map((plan) => {
                    const active = selectedPlan?.id === plan.id;
                    return (
                      <GradChip key={plan.id} active={active} onPress={() => setPlan(plan)}>
                        {active && <Ionicons name="checkmark" size={13} color="#FFF" style={styles.chipCheck} />}
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>
                          {plan.name} · {getFreqLabel(plan.frequency)}
                        </Text>
                      </GradChip>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          )}

          {/* Price + Currency (compact) */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{`${sectionNum()}. ${t('form.price')} & ${t('form.currency')}`}</Text>
            <View style={styles.priceCompact}>
              <Controller
                control={control}
                name="priceInput"
                render={({ field: { onChange, value } }) => (
                  <TextInput
                    style={[styles.priceInput, errors.priceInput && styles.inputError]}
                    value={value ?? ''}
                    onChangeText={onChange}
                    placeholder="0"
                    placeholderTextColor={Colors.textTertiary}
                    keyboardType="decimal-pad"
                  />
                )}
              />
              {selectedPlan ? (
                <View style={styles.currencyLocked}>
                  <Text style={styles.currencyLockedText}>{watchCurrency}</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.currencyToggle}
                  onPress={() => setShowCurrencyPicker((v) => !v)}
                  activeOpacity={0.75}
                >
                  <Text style={styles.currencyToggleText}>{watchCurrency}</Text>
                  <Ionicons
                    name={showCurrencyPicker ? 'chevron-up' : 'chevron-down'}
                    size={13}
                    color={Colors.primary}
                  />
                </TouchableOpacity>
              )}
            </View>
            {showCurrencyPicker && !selectedPlan && (
              <Controller
                control={control}
                name="currencyCode"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.currencyPanel}>
                    {CURRENCIES.map((c) => {
                      const active = value === c;
                      return (
                        <GradChip
                          key={c}
                          active={active}
                          smStyle
                          onPress={() => { onChange(c); setShowCurrencyPicker(false); }}
                        >
                          <Text style={[styles.chipText, active && styles.chipTextActive]}>{c}</Text>
                        </GradChip>
                      );
                    })}
                  </View>
                )}
              />
            )}
            {errors.priceInput && <Text style={styles.errorMsg}>{errors.priceInput.message}</Text>}
          </View>

          {/* Frequency */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{`${sectionNum()}. ${t('form.frequency')}`}</Text>
            <Controller
              control={control}
              name="frequency"
              render={({ field: { onChange, value } }) => (
                <View style={styles.chipRow}>
                  {FREQUENCIES.map((f) => {
                    const active = value === f;
                    return (
                      <GradChip key={f} active={active} onPress={() => onChange(f)}>
                        {active && <Ionicons name="checkmark" size={13} color="#FFF" style={styles.chipCheck} />}
                        <Text style={[styles.chipText, active && styles.chipTextActive]}>{getFreqLabel(f)}</Text>
                      </GradChip>
                    );
                  })}
                </View>
              )}
            />
          </View>

          {/* Category (manual only) */}
          {!selectedProvider && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>{`${sectionNum()}. ${t('form.category')}`}</Text>
              <Controller
                control={control}
                name="categoryId"
                render={({ field: { onChange, value } }) => (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.chipRow}>
                      {categories.map((cat) => {
                        const active = value === cat.id;
                        return (
                          <GradChip
                            key={cat.id}
                            active={active}
                            onPress={() => onChange(active ? undefined : cat.id)}
                          >
                            <Text style={[styles.chipText, active && styles.chipTextActive]}>{cat.name}</Text>
                          </GradChip>
                        );
                      })}
                    </View>
                  </ScrollView>
                )}
              />
            </View>
          )}

          {/* Renewal + Card — side by side */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{`${sectionNum()}. ${t('form.startDate')} & ${t('form.card')}`}</Text>
            <View style={styles.twoColRow}>
              <TouchableOpacity
                style={styles.infoCell}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Ionicons name="calendar-outline" size={20} color={Colors.primary} />
                <View style={styles.infoCellText}>
                  <Text style={styles.infoCellLabel}>{t('home.upcomingRenewals')}</Text>
                  <Text style={styles.infoCellValue}>
                    {renewalDate.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={14} color={Colors.textTertiary} />
              </TouchableOpacity>

              {cards.length > 0 ? (
                <TouchableOpacity
                  style={styles.infoCell}
                  onPress={() => {
                    const idx = cards.findIndex((c) => c.id === selectedCardId);
                    const next = cards[(idx + 1) % (cards.length + 1)];
                    const nextId = next?.id;
                    setSelectedCardId(nextId);
                    setValue('cardId', nextId);
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name="card-outline" size={20} color={Colors.primary} />
                  <View style={styles.infoCellText}>
                    <Text style={styles.infoCellLabel}>{t('form.card')}</Text>
                    <Text style={styles.infoCellValue} numberOfLines={1}>
                      {selectedCardId
                        ? (cards.find((c) => c.id === selectedCardId)?.alias ?? '—')
                        : t('form.noCard')}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={Colors.textTertiary} />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={styles.infoCell}
                  onPress={() => setShowCardModal(true)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="add-circle-outline" size={20} color={Colors.primary} />
                  <View style={styles.infoCellText}>
                    <Text style={styles.infoCellLabel}>{t('form.card')}</Text>
                    <Text style={[styles.infoCellValue, { color: Colors.primary }]}>{t('cards.addQuick')}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={14} color={Colors.textTertiary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {Platform.OS === 'android' && showDatePicker && (
            <DateTimePicker
              value={renewalDate}
              mode="date"
              display="default"
              minimumDate={new Date()}
              onChange={(_event: DateTimePickerEvent, date?: Date) => {
                setShowDatePicker(false);
                if (date) { setRenewalDate(date); setValue('nextRenewalDate', date.getTime()); }
              }}
            />
          )}

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>{`${sectionNum()}. ${t('form.notes')}`}</Text>
            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, value } }) => (
                <View>
                  <TextInput
                    style={[styles.textInput, styles.textInputMulti]}
                    value={value ?? ''}
                    onChangeText={onChange}
                    placeholder="Netflix, Gym, Parking…"
                    placeholderTextColor={Colors.textTertiary}
                    multiline
                    maxLength={200}
                    numberOfLines={3}
                  />
                  <Text style={styles.charCount}>{(value ?? '').length}/200</Text>
                </View>
              )}
            />
          </View>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: insets.bottom > 0 ? insets.bottom : Spacing.lg }]}>
          <PrimaryButton
            label={`Guardar · ${watchCurrency} ${watch('priceInput') || '0'} / ${frequencyLabel(watchFrequency as Frequency)}`}
            onPress={() => void handleSubmit(onSubmit)()}
            loading={saving}
          />
        </View>
      </LinearGradient>

      {Platform.OS === 'ios' && (
        <Modal
          visible={showDatePicker}
          transparent
          animationType="slide"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <View style={styles.dateModalOverlay}>
            <View style={styles.dateModalSheet}>
              <View style={styles.dateModalHeader}>
                <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                  <Text style={styles.dateModalCancel}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <Text style={styles.dateModalTitle}>{t('form.startDate')}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setValue('nextRenewalDate', renewalDate.getTime());
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={styles.dateModalDone}>{t('common.confirm')}</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={renewalDate}
                mode="date"
                display="spinner"
                minimumDate={new Date()}
                locale="es-AR"
                onChange={(_event: DateTimePickerEvent, date?: Date) => {
                  if (date) setRenewalDate(date);
                }}
                style={styles.datePicker}
              />
            </View>
          </View>
        </Modal>
      )}

      {/* Quick card modal — create a card without leaving the page */}
      <Modal
        visible={showCardModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCardModal(false)}
      >
        <View style={styles.dateModalOverlay}>
          <View style={styles.dateModalSheet}>
            <View style={styles.dateModalHeader}>
              <TouchableOpacity onPress={() => setShowCardModal(false)}>
                <Text style={styles.dateModalCancel}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <Text style={styles.dateModalTitle}>{t('cards.new')}</Text>
              <TouchableOpacity
                onPress={async () => {
                  const trimAlias = cardAlias.trim();
                  if (!trimAlias) { Alert.alert(t('cards.noAlias')); return; }
                  const trimFour = cardLastFour.trim();
                  if (trimFour && !/^\d{4}$/.test(trimFour)) { Alert.alert(t('cards.lastFourError')); return; }
                  setSavingCard(true);
                  try {
                    const newId = await insertCard({ alias: trimAlias, lastFour: trimFour || null });
                    const updated = await listCards();
                    setCards(updated);
                    setSelectedCardId(newId);
                    setValue('cardId', newId);
                    setCardAlias(''); setCardLastFour('');
                    setShowCardModal(false);
                  } finally {
                    setSavingCard(false);
                  }
                }}
              >
                <Text style={styles.dateModalDone}>{savingCard ? '...' : t('common.save')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.cardModalBody}>
              <Text style={styles.cardModalLabel}>{t('cards.alias')}</Text>
              <TextInput
                style={styles.textInput}
                value={cardAlias}
                onChangeText={setCardAlias}
                placeholder={t('cards.aliasPlaceholder')}
                placeholderTextColor={Colors.textTertiary}
                autoCapitalize="words"
              />
              <Text style={[styles.cardModalLabel, { marginTop: Spacing.md }]}>{t('cards.lastFour')} {t('cards.optional')}</Text>
              <TextInput
                style={styles.textInput}
                value={cardLastFour}
                onChangeText={setCardLastFour}
                placeholder="1234"
                placeholderTextColor={Colors.textTertiary}
                keyboardType="number-pad"
                maxLength={4}
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* Post-save popup */}
      <Modal
        visible={showPostSave}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPostSave(false)}
      >
        <Pressable style={styles.postSaveOverlay} onPress={() => setShowPostSave(false)}>
          <Pressable style={styles.postSaveSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.postSaveCheck}>
              <Ionicons name="checkmark-circle" size={48} color={Colors.primary} />
            </View>
            <Text style={styles.postSaveTitle}>
              {t('postSave.title', { name: savedName })}
            </Text>
            <Text style={styles.postSaveSubtitle}>
              {t('postSave.subtitle', { count: savedCount })}
            </Text>

            <TouchableOpacity
              style={styles.postSaveBtnPrimary}
              onPress={() => {
                setShowPostSave(false);
                router.dismiss();
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.postSaveBtnPrimaryText}>{t('postSave.addAnother')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.postSaveBtnSecondary}
              onPress={() => {
                setShowPostSave(false);
                if (!isPaid) {
                  setShowPaywall(true);
                }
                router.dismiss();
                setTimeout(() => router.push('/'), 100);
              }}
              activeOpacity={0.8}
            >
              <Text style={styles.postSaveBtnSecondaryText}>{t('postSave.finish')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const CHIP_RADIUS = 10;
const CARD_SHADOW = {
  shadowColor: '#6B52E0',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.07,
  shadowRadius: 8,
  elevation: 2,
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.appBackground },

  /* Hero header */
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
  },
  title: { fontSize: 28, fontWeight: '800', color: Colors.textPrimary, letterSpacing: -0.8, textAlign: 'center' },
  subtitle: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 6, textAlign: 'center' },
  scroll: { paddingHorizontal: Spacing.xl, paddingBottom: 120 },

  /* Provider card */
  providerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
    padding: Spacing.md,
    borderRadius: 16,
    backgroundColor: Colors.background,
    ...CARD_SHADOW,
  },
  providerInfo: { flex: 1 },
  providerName: { fontSize: 16, fontWeight: '700', color: Colors.textPrimary },
  providerCatBadge: {
    alignSelf: 'flex-start',
    marginTop: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: Colors.primaryLight,
  },
  providerCatText: { fontSize: 11, fontWeight: '600', color: Colors.primary },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  editBtnText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },

  /* Quick links */
  quickLinks: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  quickLinkBtn: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: 12,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickLinkTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickLinkText: { flex: 1, fontSize: 12, fontWeight: '600', color: Colors.primary },
  quickLinkSub: { fontSize: 10, color: Colors.textTertiary, marginTop: 4 },

  /* Sections — white cards */
  section: {
    marginBottom: Spacing.md,
    padding: Spacing.md,
    borderRadius: 16,
    backgroundColor: Colors.background,
    ...CARD_SHADOW,
  },
  sectionLabel: { fontSize: 13, fontWeight: '700', color: Colors.textSecondary, marginBottom: Spacing.sm + 2, letterSpacing: 0.2 },
  sectionLabelRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  sectionOptional: { ...Typography.caption, color: Colors.textTertiary },

  /* Text input */
  textInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    ...Typography.body,
    color: Colors.textPrimary,
    backgroundColor: Colors.appBackground,
  },
  textInputMulti: { height: 88, textAlignVertical: 'top', paddingTop: Spacing.md },
  inputError: { borderColor: Colors.error },
  errorMsg: { ...Typography.caption, color: Colors.error, marginTop: 4 },
  charCount: { ...Typography.caption, color: Colors.textTertiary, textAlign: 'right', marginTop: 4 },

  /* Chips — solid active */
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: CHIP_RADIUS,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.appBackground,
  },
  chipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  chipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  chipTextActive: { color: '#FFFFFF', fontWeight: '700' },
  chipCheck: { marginRight: 4 },
  chipSm: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs + 2 },
  chipEmoji: { fontSize: 13, marginRight: 5 },

  /* Price compact */
  priceCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.appBackground,
    gap: Spacing.sm,
  },
  priceInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -1,
    padding: 0,
  },
  currencyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: Colors.primaryLight,
  },
  currencyToggleText: { fontSize: 14, fontWeight: '700', color: Colors.primary },
  currencyLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.backgroundSecondary,
  },
  currencyLockedText: { fontSize: 14, fontWeight: '700', color: Colors.textSecondary },
  currencyPanel: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.md,
    backgroundColor: Colors.appBackground,
  },

  /* Two-column info cells (renewal + card) */
  twoColRow: { flexDirection: 'row', gap: Spacing.sm },
  infoCell: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderRadius: 12,
    backgroundColor: Colors.appBackground,
  },
  infoCellDisabled: { opacity: 0.5 },
  infoCellText: { flex: 1 },
  infoCellLabel: { fontSize: 10, fontWeight: '600', color: Colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.3 },
  infoCellValue: { fontSize: 13, fontWeight: '700', color: Colors.textPrimary, marginTop: 2 },

  /* Card chips */
  cardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: CHIP_RADIUS,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.appBackground,
  },
  cardChipText: { fontSize: 13, color: Colors.textSecondary, fontWeight: '500' },
  addCardChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: CHIP_RADIUS,
    backgroundColor: Colors.primaryLight,
  },
  addCardText: { fontSize: 13, color: Colors.primary, fontWeight: '600' },
  noCardsHint: { ...Typography.bodySmall, color: Colors.textTertiary, fontStyle: 'italic' },

  /* Footer */
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    backgroundColor: Colors.appBackground,
  },

  /* Modals */
  dateModalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(20,10,40,0.4)',
  },
  dateModalSheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 24,
  },
  dateModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  dateModalTitle: { ...Typography.sectionTitle, color: Colors.textPrimary },
  dateModalCancel: { ...Typography.body, color: Colors.textSecondary },
  dateModalDone: { ...Typography.body, color: Colors.primary, fontWeight: '600' },
  datePicker: { width: '100%', height: 200 },
  cardModalBody: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg },
  cardModalLabel: { fontSize: 13, fontWeight: '600', color: Colors.textSecondary, marginBottom: Spacing.xs },

  postSaveOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  postSaveSheet: {
    backgroundColor: Colors.background,
    borderRadius: 24,
    padding: Spacing.xxl,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
  },
  postSaveCheck: {
    marginBottom: Spacing.md,
  },
  postSaveTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  postSaveSubtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  postSaveBtnPrimary: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Radius.md,
    width: '100%',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  postSaveBtnPrimaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  postSaveBtnSecondary: {
    paddingVertical: 14,
    borderRadius: Radius.md,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  postSaveBtnSecondaryText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
