import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProviderAvatar } from './ProviderAvatar';
import { CategoryBadge } from './CategoryBadge';
import { Colors, Spacing, Typography } from '@/ui/theme';
import { formatShortDate } from '@/utils/date';
import type { SubscriptionWithRelations } from '@/data/repositories/subscriptions';

interface SubscriptionRowProps {
  item: SubscriptionWithRelations;
  onPress: () => void;
}

export function SubscriptionRow({ item, onPress }: SubscriptionRowProps) {
  const name = item.customName ?? item.provider?.name ?? '—';
  const renewalText =
    item.nextRenewalDate != null
      ? `Renueva ${formatShortDate(item.nextRenewalDate)}`
      : null;
  const subtitle = renewalText ?? '';

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <ProviderAvatar name={name} size={42} />
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>{name}</Text>
        <Text style={styles.subtitle} numberOfLines={1}>{subtitle}</Text>
      </View>
      {item.category && <CategoryBadge name={item.category.name} />}
      <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} style={styles.chevron} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.background,
    gap: Spacing.md,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...Typography.subscriptionName,
    color: Colors.textPrimary,
  },
  subtitle: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
  },
  chevron: {
    marginLeft: Spacing.xs,
  },
});
