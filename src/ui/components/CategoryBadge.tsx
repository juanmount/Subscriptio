import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, Spacing, Typography } from '@/ui/theme';

const CATEGORY_KEY_MAP: Record<string, keyof typeof Colors.badge> = {
  'IA': 'ia',
  'Entretenimiento': 'entertainment',
  'Trabajo': 'work',
  'Música': 'music',
  'Almacenamiento': 'storage',
  'Fitness': 'fitness',
  'Noticias': 'news',
  'Seguridad': 'security',
  'Diseño': 'design',
  'Otras': 'other',
};

interface CategoryBadgeProps {
  name: string;
}

export function CategoryBadge({ name }: CategoryBadgeProps) {
  const key = CATEGORY_KEY_MAP[name] ?? 'other';
  const colors = Colors.badge[key];

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{name}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 3,
    borderRadius: 20,
  },
  text: {
    ...Typography.caption,
  },
});
