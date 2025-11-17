import { Tabs } from 'expo-router';
import { colors, typography } from '../../styles/theme';
import { Ionicons } from '@expo/vector-icons';

function TabIcon({ name, focused }) {
  return (
    <Ionicons 
      name={name} 
      size={24} 
      color={focused ? colors.buttonPrimary || '#007AFF' : '#666'} 
    />
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.buttonPrimary || '#007AFF',
        tabBarInactiveTintColor: '#666',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0E0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          marginTop: 2,
        },
        headerShown: true,
        headerStyle: {
          backgroundColor: colors.white || '#FFFFFF',
          elevation: 2,
          shadowOpacity: 0.1,
        },
        headerTitleStyle: {
          fontSize: typography?.fontSize?.lg || 18,
          fontWeight: typography?.fontWeight?.bold || '700',
          color: colors.textPrimary || '#000',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "home" : "home-outline"} focused={focused} />,
          headerTitle: 'Notes Feed',
        }}
      />
      <Tabs.Screen
        name="list"
        options={{
          title: 'Lists',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "list" : "list-outline"} focused={focused} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "search" : "search-outline"} focused={focused} />,
          headerTitle: 'Search Notes',
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => <TabIcon name={focused ? "settings" : "settings-outline"} focused={focused} />,
          headerTitle: 'Settings',
        }}
      />
    </Tabs>
  );
}
