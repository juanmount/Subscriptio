import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  Modal, TextInput, Alert,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '@/ui/components/AppHeader';
import { ScreenBackground } from '@/ui/components/ScreenBackground';
import { PrimaryButton } from '@/ui/components/PrimaryButton';
import { Colors, Spacing, Typography, Radius } from '@/ui/theme';
import { t } from '@/i18n';
import { listCards, insertCard, deleteCard, type CardRow } from '@/data/repositories/cards';
import { listSubscriptions } from '@/data/repositories/subscriptions';

const CARD_SHADOW = {
  shadowColor: '#6B52E0',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.07,
  shadowRadius: 8,
  elevation: 2,
};

const BRAND_COLORS: Record<string, [string, string]> = {
  visa:       ['#1565C0', '#1976D2'],
  mastercard: ['#E65100', '#F57C00'],
  amex:       ['#1B5E20', '#388E3C'],
  default:    ['#8B72FF', '#6B52E0'],
};

function cardGradient(alias: string): [string, string] {
  const lower = alias.toLowerCase();
  if (lower.includes('visa'))       return BRAND_COLORS.visa;
  if (lower.includes('master'))     return BRAND_COLORS.mastercard;
  if (lower.includes('amex') || lower.includes('american')) return BRAND_COLORS.amex;
  return BRAND_COLORS.default;
}

export default function TarjetasScreen() {
  const insets = useSafeAreaInsets();
  const [cards, setCards] = useState<CardRow[]>([]);
  const [subCounts, setSubCounts] = useState<Map<number, number>>(new Map());
  const [showModal, setShowModal] = useState(false);
  const [alias, setAlias] = useState('');
  const [lastFour, setLastFour] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [cardList, subs] = await Promise.all([listCards(), listSubscriptions()]);
    setCards(cardList);
    const counts = new Map<number, number>();
    for (const s of subs) {
      if (s.cardId) counts.set(s.cardId, (counts.get(s.cardId) ?? 0) + 1);
    }
    setSubCounts(counts);
  }, []);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const handleAdd = async () => {
    const trimAlias = alias.trim();
    const trimFour = lastFour.trim();
    if (!trimAlias) { Alert.alert(t('cards.noAlias')); return; }
    if (trimFour && !/^\d{4}$/.test(trimFour)) { Alert.alert(t('cards.lastFourError')); return; }
    setSaving(true);
    try {
      await insertCard({ alias: trimAlias, lastFour: trimFour || null });
      setAlias(''); setLastFour('');
      setShowModal(false);
      await load();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (card: CardRow) => {
    const count = subCounts.get(card.id) ?? 0;
    const msg = count > 0
      ? t('cards.deleteConfirmWithSubs', { count, count_plural: count > 1 ? 's' : '' })
      : t('cards.deleteConfirm');
    Alert.alert(t('cards.deleteTitle'), msg, [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: async () => {
        await deleteCard(card.id);
        await load();
      }},
    ]);
  };

  return (
    <ScreenBackground paddingBottom={insets.bottom}>
      <AppHeader transparent />

      <View style={styles.titleRow}>
        <View>
          <Text style={styles.title}>{t('cards.title')}</Text>
          <Text style={styles.subtitle}>{t('cards.saved', { count: cards.length, count_plural: cards.length !== 1 ? 's' : '' })}</Text>
        </View>
        <TouchableOpacity onPress={() => setShowModal(true)} activeOpacity={0.8}>
          <LinearGradient
            colors={['#8B72FF', '#6B52E0']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.addBtn}
          >
            <Ionicons name="add" size={22} color="#FFF" />
          </LinearGradient>
        </TouchableOpacity>
      </View>

      <FlatList
        data={cards}
        keyExtractor={(c) => String(c.id)}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
        renderItem={({ item }) => {
          const count = subCounts.get(item.id) ?? 0;
          const [c1, c2] = cardGradient(item.alias);
          return (
            <View style={styles.cardItem}>
              <LinearGradient colors={[c1, c2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0.8 }} style={styles.cardVisual}>
                <Ionicons name="card-outline" size={28} color="rgba(255,255,255,0.7)" />
                <View>
                  <Text style={styles.cardAlias}>{item.alias}</Text>
                  {item.lastFour
                    ? <Text style={styles.cardNumber}>···· ···· ···· {item.lastFour}</Text>
                    : <Text style={styles.cardNumber}>···· ···· ···· ····</Text>
                  }
                </View>
              </LinearGradient>
              <View style={styles.cardMeta}>
                <Text style={styles.cardSubCount}>
                  {count > 0
                    ? t('cards.linkedSubs', { count, count_plural: count > 1 ? 's' : '' })
                    : t('cards.noLinkedSubs')}
                </Text>
                <TouchableOpacity onPress={() => handleDelete(item)} style={styles.deleteBtn} activeOpacity={0.7}>
                  <Ionicons name="trash-outline" size={16} color={Colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="card-outline" size={40} color={Colors.textTertiary} />
            <Text style={styles.emptyTitle}>{t('cards.empty.title')}</Text>
            <Text style={styles.emptySubtitle}>{t('cards.empty.desc')}</Text>
          </View>
        }
      />

      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>{t('cards.new')}</Text>
            <Text style={styles.sheetLabel}>{t('cards.alias')}</Text>
            <TextInput
              style={styles.input}
              placeholder={t('cards.aliasPlaceholder')}
              placeholderTextColor={Colors.textTertiary}
              value={alias}
              onChangeText={setAlias}
              autoFocus
            />
            <Text style={styles.sheetLabel}>{t('cards.lastFour')} <Text style={styles.optional}>{t('cards.optional')}</Text></Text>
            <TextInput
              style={styles.input}
              placeholder="1234"
              placeholderTextColor={Colors.textTertiary}
              value={lastFour}
              onChangeText={(t) => setLastFour(t.replace(/\D/g, '').slice(0, 4))}
              keyboardType="number-pad"
              maxLength={4}
            />
            <View style={styles.sheetActions}>
              <TouchableOpacity onPress={() => { setShowModal(false); setAlias(''); setLastFour(''); }} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              <View style={{ flex: 1 }}>
                <PrimaryButton label={t('common.save')} onPress={handleAdd} loading={saving} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
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
  subtitle: { ...Typography.bodySmall, color: Colors.textSecondary, marginTop: 2 },
  addBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 4 },

  list: { paddingHorizontal: Spacing.xl, paddingBottom: 40 },

  cardItem: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.background,
    ...CARD_SHADOW,
  },
  cardVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  cardAlias: { fontSize: 16, fontWeight: '700', color: '#FFF' },
  cardNumber: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 2, letterSpacing: 1 },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
  },
  cardSubCount: { ...Typography.bodySmall, color: Colors.textSecondary },
  deleteBtn: { padding: Spacing.xs },

  empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.sm },
  emptyTitle: { ...Typography.sectionTitle, color: Colors.textPrimary },
  emptySubtitle: { ...Typography.bodySmall, color: Colors.textSecondary, textAlign: 'center' },

  overlay: { flex: 1, backgroundColor: 'rgba(20,10,40,0.4)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: Colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.xl,
    paddingBottom: 40,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: Spacing.lg,
  },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: Colors.textPrimary, marginBottom: Spacing.lg },
  sheetLabel: { ...Typography.caption, color: Colors.textSecondary, marginBottom: Spacing.xs, textTransform: 'uppercase', letterSpacing: 0.5 },
  optional: { color: Colors.textTertiary, textTransform: 'none' },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    ...Typography.body,
    color: Colors.textPrimary,
    backgroundColor: Colors.appBackground,
    marginBottom: Spacing.md,
  },
  sheetActions: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.sm },
  cancelBtn: {
    height: 52,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.lg,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  cancelText: { ...Typography.body, color: Colors.textSecondary, fontWeight: '500' },
});
