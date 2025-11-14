import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { useRouter, usePathname } from 'expo-router';

export default function BottomNavbar({ onLogout }) {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (path) => pathname === path;

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/lists', label: 'Lists', icon: '📋' },
    { path: '/search', label: 'Search', icon: '🔍' },
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <View style={styles.container}>
      {navItems.map((item) => (
        <TouchableOpacity
          key={item.path}
          style={[
            styles.navItem,
            isActive(item.path) && styles.navItemActive
          ]}
          onPress={() => router.push(item.path)}
          activeOpacity={0.6}
        >
          <View style={[
            styles.iconContainer,
            isActive(item.path) && styles.iconContainerActive
          ]}>
            <Text style={styles.icon}>{item.icon}</Text>
          </View>
          <Text style={[
            styles.label,
            isActive(item.path) && styles.labelActive
          ]}>
            {item.label}
          </Text>
        </TouchableOpacity>
      ))}
      
      <TouchableOpacity
        style={styles.navItem}
        onPress={onLogout}
        activeOpacity={0.6}
      >
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🚪</Text>
        </View>
        <Text style={styles.label}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    paddingVertical: 8,
    paddingHorizontal: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  navItemActive: {
    backgroundColor: '#F0F7FF',
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    marginBottom: 2,
  },
  iconContainerActive: {
    backgroundColor: '#E3F2FD',
  },
  icon: {
    fontSize: 22,
  },
  label: {
    fontSize: 11,
    color: '#666',
    fontWeight: '500',
    marginTop: 2,
  },
  labelActive: {
    color: '#007AFF',
    fontWeight: '600',
  },
});