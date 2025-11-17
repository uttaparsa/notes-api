import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { colors, typography, spacing, borderRadius, shadows } from '../styles/theme';
import Svg, { Path } from 'react-native-svg';

export default function MessageInput({ onSend, listSlug = null }) {
  const [text, setText] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [justSent, setJustSent] = useState(false);
  const [keyboardOffset, setKeyboardOffset] = useState(0);
  const slideAnim = useRef(new Animated.Value(300)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const textInputRef = useRef(null);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardOffset(e.endCoordinates.height);
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (e) => {
        setKeyboardOffset(0);
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  useEffect(() => {
    if (isExpanded) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
      
      setTimeout(() => {
        textInputRef.current?.focus();
      }, 300);
    } else {
      Animated.spring(slideAnim, {
        toValue: 300,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    }
  }, [isExpanded]);

  useEffect(() => {
    if (justSent) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      setTimeout(() => setJustSent(false), 2000);
    }
  }, [justSent]);

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleCollapse = () => {
    if (!text.trim()) {
      Keyboard.dismiss();
      setIsExpanded(false);
    }
  };

  const handleSend = async () => {
    if (!text.trim()) return;

    try {
      await onSend(text);
      setText('');
      setIsExpanded(false);
      setJustSent(true);
      Keyboard.dismiss();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleCancel = () => {
    setText('');
    setIsExpanded(false);
    Keyboard.dismiss();
  };

  if (!isExpanded) {
    return (
      <Animated.View
        style={[
          styles.fabContainer,
          {
            transform: [{ scale: scaleAnim }],
            backgroundColor: justSent ? colors.success : colors.buttonPrimary,
            bottom: spacing.xl + keyboardOffset,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.fab}
          onPress={handleExpand}
          activeOpacity={0.8}
        >
          <Svg width="28" height="28" viewBox="0 0 25 25" fill="none">
            <Path
              d="M17 6L19 8M14 5.5H5.5V19.5H19.5V11M9 16L9.5 13.5L19 4L21 6L11.5 15.5L9 16Z"
              stroke={colors.white}
              strokeWidth="1.5"
            />
          </Svg>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <Animated.View
        style={[
          styles.expandedContainer,
          {
            transform: [{ translateY: slideAnim }],
            bottom: spacing.xl + keyboardOffset,
          },
        ]}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.headerTitle}>
              <View style={[styles.indicator, justSent && styles.indicatorSuccess]} />
            </View>
            <TouchableOpacity
              onPress={handleCollapse}
              disabled={!!text.trim()}
              style={styles.minimizeButton}
            >
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M5 12H19"
                  stroke={text.trim() ? colors.textTertiary : colors.textPrimary}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>

          <TextInput
            ref={textInputRef}
            style={styles.textInput}
            placeholder="What's on your mind?"
            placeholderTextColor={colors.textTertiary}
            value={text}
            onChangeText={setText}
            multiline
            textAlignVertical="top"
          />

          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={!!text.trim()}
            >
              <Svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M18 6L6 18M6 6L18 18"
                  stroke={text.trim() ? colors.textTertiary : colors.textPrimary}
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </Svg>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.sendButton,
                !text.trim() && styles.sendButtonDisabled,
              ]}
              onPress={handleSend}
              disabled={!text.trim()}
              activeOpacity={0.8}
            >
              <Svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <Path
                  d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13"
                  stroke={colors.white}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    right: spacing.xl,
    borderRadius: 30,
    ...shadows.lg,
  },
  fab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedContainer: {
    position: 'absolute',
    left: spacing.xl,
    right: spacing.xl,
    zIndex: 1000,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    ...shadows.lg,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.buttonPrimary,
  },
  indicatorSuccess: {
    backgroundColor: colors.success,
  },
  minimizeButton: {
    padding: spacing.sm,
  },
  textInput: {
    minHeight: 120,
    maxHeight: 300,
    padding: spacing.lg,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: colors.backgroundSecondary,
  },
  sendButton: {
    backgroundColor: colors.buttonPrimary,
    ...shadows.sm,
  },
  sendButtonDisabled: {
    backgroundColor: colors.buttonDisabled,
  },
});
