// This component is now deprecated for the home page but kept for compatibility
import React, { useState, useEffect } from 'react';
import { 
  View, 
  FlatList, 
  StyleSheet, 
  ActivityIndicator, 
  Text, 
  TouchableOpacity,
  Animated,
  Modal,
  Pressable
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import NoteCard from './notecard/NoteCard';
import { colors, typography, spacing, commonStyles } from '../styles/theme';
import { useRouter } from 'expo-router';

// Utility function to format date for display
const formatDateDisplay = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const formatDate = (d) => {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  if (formatDate(date) === formatDate(today)) {
    return 'Today';
  } else if (formatDate(date) === formatDate(yesterday)) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
};

export default function NoteList({ 
  flatListData,
  isBusy,
  isLoadingMore,
  isRefreshing,
  newNoteId,
  showDatePicker,
  selectedDate,
  onRefresh,
  onLoadMore,
  onDeleteNote,
  onDatePress,
  onDateChange,
}) {
  const router = useRouter();
  const [showTip, setShowTip] = useState(false);

  useEffect(() => {
    checkFirstTime();
  }, []);

  const checkFirstTime = async () => {
    try {
      const hasSeenTip = await AsyncStorage.getItem('hasSeenSwipeDeleteTip');
      if (!hasSeenTip && flatListData.some(item => item.type === 'note')) {
        setShowTip(true);
      }
    } catch (error) {
      console.error('Error checking first time:', error);
    }
  };

  const dismissTip = async () => {
    try {
      await AsyncStorage.setItem('hasSeenSwipeDeleteTip', 'true');
      setShowTip(false);
    } catch (error) {
      console.error('Error saving tip dismissal:', error);
    }
  };

  const renderRightActions = (progress, dragX, note) => {
    const trans = dragX.interpolate({
      inputRange: [-100, 0],
      outputRange: [0, 100],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.deleteAction,
          {
            transform: [{ translateX: trans }],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDeleteNote(note.id)}
        >
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const renderItem = ({ item }) => {
    if (item.type === 'date') {
      return (
        <TouchableOpacity
          style={styles.dateHeader}
          onPress={onDatePress}
          activeOpacity={0.7}
        >
          <Text style={styles.dateHeaderText}>{formatDateDisplay(item.date)}</Text>
          <Text style={styles.dateHeaderIcon}>📅</Text>
        </TouchableOpacity>
      );
    }
    
    return (
      <Swipeable
        renderRightActions={(progress, dragX) =>
          renderRightActions(progress, dragX, item.data)
        }
        overshootRight={false}
        friction={2}
      >
        <TouchableOpacity
          onPress={() => router.push(`/list/note/${item.id}`)}
          activeOpacity={0.9}
        >
          <NoteCard
            note={item.data}
            onDelete={onDeleteNote}
            isNew={newNoteId === item.data.id}
          />
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={colors.buttonPrimary} />
      </View>
    );
  };

  if (isBusy) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.buttonPrimary} />
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={flatListData}
        renderItem={renderItem}
        keyExtractor={(item, index) => 
          item.type === 'date' ? `date-${item.date}` : `note-${item.data.id}`
        }
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        refreshing={isRefreshing}
        onRefresh={onRefresh}
        contentContainerStyle={styles.listContent}
      />
      
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={onDateChange}
        />
      )}

      <Modal
        visible={showTip}
        transparent={true}
        animationType="fade"
        onRequestClose={dismissTip}
      >
        <Pressable style={styles.modalOverlay} onPress={dismissTip}>
          <View style={styles.tipContainer}>
            <Text style={styles.tipTitle}>💡 Tip</Text>
            <Text style={styles.tipText}>
              Swipe left on any note to delete it
            </Text>
            <TouchableOpacity style={styles.tipButton} onPress={dismissTip}>
              <Text style={styles.tipButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  listContent: {
    padding: spacing.md,
  },
  dateHeader: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
    marginTop: spacing.md,
  },
  dateHeaderText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    letterSpacing: typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  dateHeaderIcon: {
    fontSize: typography.fontSize.base,
  },
  loadingContainer: {
    ...commonStyles.loadingContainer,
  },
  footerLoader: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  deleteAction: {
    backgroundColor: colors.error || '#EF4444',
    justifyContent: 'center',
    alignItems: 'flex-end',
    marginBottom: spacing.sm,
  },
  deleteButton: {
    paddingHorizontal: spacing.xl,
    height: '100%',
    justifyContent: 'center',
  },
  deleteText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipContainer: {
    backgroundColor: colors.backgroundPrimary || '#FFFFFF',
    borderRadius: 12,
    padding: spacing.xl,
    marginHorizontal: spacing.xl,
    alignItems: 'center',
    ...commonStyles.shadow,
  },
  tipTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing.md,
  },
  tipText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  tipButton: {
    backgroundColor: colors.buttonPrimary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  tipButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
