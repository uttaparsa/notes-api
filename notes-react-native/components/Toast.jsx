import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Platform } from 'react-native';

export default function Toast({ title, body, duration = 3000, type = 'info', onHide }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    // Slide up and fade in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        tension: 65,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto hide after duration
    const timer = setTimeout(() => {
      hideToast();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 100,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) onHide();
    });
  };

  const getStyles = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: '#28A745',
          icon: '✓',
        };
      case 'error':
      case 'danger':
        return {
          backgroundColor: '#DC3545',
          icon: '✕',
        };
      case 'warning':
        return {
          backgroundColor: '#FFC107',
          icon: '⚠',
          textColor: '#000',
        };
      case 'info':
      default:
        return {
          backgroundColor: '#007AFF',
          icon: 'ℹ',
        };
    }
  };

  const toastStyles = getStyles();
  const textColor = toastStyles.textColor || '#FFFFFF';

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.toast,
          { backgroundColor: toastStyles.backgroundColor }
        ]}
        onPress={hideToast}
        activeOpacity={0.95}
      >
        <View style={styles.iconContainer}>
          <Text style={[styles.icon, { color: textColor }]}>{toastStyles.icon}</Text>
        </View>
        <View style={styles.textContainer}>
          {title ? (
            <Text style={[styles.title, { color: textColor }]} numberOfLines={1}>
              {title}
            </Text>
          ) : null}
          <Text style={[styles.body, { color: textColor }]} numberOfLines={2}>
            {body}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 90, // Above the bottom navbar
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 4,
        },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  iconContainer: {
    marginRight: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    opacity: 0.95,
  },
});