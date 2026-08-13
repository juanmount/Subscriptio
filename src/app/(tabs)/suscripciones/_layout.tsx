import { Stack } from 'expo-router';
import { Colors } from '@/ui/theme';

export default function SuscripcionesStack() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    />
  );
}
