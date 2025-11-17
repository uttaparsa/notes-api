import { Stack } from 'expo-router';
import { colors, typography } from '../../../styles/theme';

export default function ListLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.white || '#FFFFFF',
        },
        headerTitleStyle: {
          fontSize: typography?.fontSize?.lg || 18,
          fontWeight: typography?.fontWeight?.bold || '700',
          color: colors.textPrimary || '#000',
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerTitle: 'Note Lists',
        }}
      />
      <Stack.Screen
        name="[slug]"
        options={{
          headerTitle: '',
        }}
      />
    </Stack>
  );
}
