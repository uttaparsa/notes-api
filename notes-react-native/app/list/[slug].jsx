import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { AuthContext, ToastContext } from '../_layout';
import { fetchWithAuth } from '../../lib/api';
import { useRouter, useLocalSearchParams } from 'expo-router';
import NoteCard from '../../components/notecard/NoteCard';
import MessageInput from '../../components/MessageInput';
import { colors, typography, spacing, borderRadius, shadows, commonStyles } from '../../styles/theme';

// Utility function to format date as YYYY-MM-DD
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Utility function to format date for display
const formatDateDisplay = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
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

// Group notes by date
const groupNotesByDate = (notes) => {
  const grouped = {};
  notes.forEach(note => {
    const dateKey = formatDate(note.created_at);
    if (!grouped[dateKey]) {
      grouped[dateKey] = [];
    }
    grouped[dateKey].push(note);
  });
  return grouped;
};

// Convert grouped notes to flat list with headers
const createFlatListData = (notes) => {
  const grouped = groupNotesByDate(notes);
  const flatData = [];
  
  Object.keys(grouped).sort((a, b) => new Date(b) - new Date(a)).forEach(date => {
    flatData.push({ type: 'date', date });
    grouped[date].forEach(note => {
      flatData.push({ type: 'note', data: note });
    });
  });
  
  return flatData;
};

export default function ListSlugPage() {
  const { isAuthenticated } = useContext(AuthContext);
  const showToast = useContext(ToastContext);
  const router = useRouter();
  const { slug } = useLocalSearchParams();
  
  const [notes, setNotes] = useState([]);
  const [flatListData, setFlatListData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [isBusy, setIsBusy] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const [newNoteId, setNewNoteId] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  const perPage = 20;

  useEffect(() => {
    if (isAuthenticated) {
      resetAndFetch();
    }
  }, [showHidden, isAuthenticated, slug]);

  useEffect(() => {
    setFlatListData(createFlatListData(notes));
  }, [notes]);

  const resetAndFetch = async () => {
    setCurrentPage(1);
    setHasMore(true);
    setNotes([]);
    await getRecords(1, true);
  };

  const getRecords = async (page = currentPage, reset = false, targetDate = null) => {
    if (reset) {
      setIsBusy(true);
    } else {
      setIsLoadingMore(true);
    }
    
    try {
      let url = `/api/note/${slug}/`;
      const params = new URLSearchParams({
        page: page,
        per_page: perPage,
        ...(targetDate && { date: targetDate }),
        ...(showHidden && { show_hidden: 'true' }),
      });
      
      const response = await fetchWithAuth(`${url}?${params}`, {}, 5000, router);
      if (!response.ok) throw new Error('Failed to fetch notes');
      
      const data = await response.json();
      
      const newNotes = data.results;
      
      if (reset) {
        setNotes(newNotes);
      } else {
        setNotes(prev => [...prev, ...newNotes]);
      }
      
      setHasMore(data.next !== null);
      setIsBusy(false);
      setIsLoadingMore(false);
    } catch (err) {
      console.error(`Error: ${err}`);
      showToast('Error', err.message || 'Failed to fetch notes', 3000, 'error');
      setIsBusy(false);
      setIsLoadingMore(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await resetAndFetch();
    setIsRefreshing(false);
  }, [showHidden, slug]);

  const loadMore = () => {
    if (!isLoadingMore && hasMore && !isBusy) {
      const nextPage = currentPage + 1;
      setCurrentPage(nextPage);
      getRecords(nextPage, false);
    }
  };

  const deleteNote = async (noteId) => {
    try {
      const response = await fetchWithAuth(`/api/note/${noteId}/`, {
        method: 'DELETE',
      }, 5000, router);
      
      if (!response.ok) throw new Error('Failed to delete note');
      
      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
      showToast('Success', 'Note deleted', 2000, 'success');
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Error', err.message || 'Failed to delete note', 3000, 'error');
    }
  };

  const addNewNote = async (message) => {
    if (!message.trim()) {
      showToast('Error', 'Please enter a message', 2000, 'error');
      return;
    }

    try {
      const response = await fetchWithAuth('/api/note/', {
        method: 'POST',
        body: JSON.stringify({ 
          text: message,
          list_slug: slug 
        }),
      }, 5000, router);
      
      if (!response.ok) throw new Error('Failed to create note');
      
      const note = await response.json();
      
      setNotes(prevNotes => [note, ...prevNotes]);
      setNewNoteId(note.id);
      
      setTimeout(() => setNewNoteId(null), 2000);
      
      showToast('Success', 'Note created', 2000, 'success');
    } catch (err) {
      console.error('Create error:', err);
      showToast('Error', err.message || 'Failed to create note', 3000, 'error');
      throw err;
    }
  };

  const handleDatePress = () => {
    setShowDatePicker(true);
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      const dateString = formatDate(date);
      setCurrentPage(1);
      setHasMore(true);
      setNotes([]);
      getRecords(1, true, dateString);
    }
  };

  const renderItem = ({ item }) => {
    if (item.type === 'date') {
      return (
        <TouchableOpacity
          style={styles.dateHeader}
          onPress={handleDatePress}
          activeOpacity={0.7}
        >
          <Text style={styles.dateHeaderText}>{formatDateDisplay(item.date)}</Text>
          <Text style={styles.dateHeaderIcon}>📅</Text>
        </TouchableOpacity>
      );
    }
    
    return (
      <NoteCard
        note={item.data}
        onDelete={deleteNote}
        isNew={newNoteId === item.data.id}
      />
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

  const filteredFlatListData = flatListData.filter(item => {
    if (item.type === 'date') return true;
    return showHidden || !item.data.archived;
  });

  return (
    <View style={styles.container}>
      {/* List Title */}
      <View style={styles.headerContainer}>
        <Text style={styles.headerTitle}>{slug}</Text>
      </View>

      {/* Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Show Hidden</Text>
          <Switch
            value={showHidden}
            onValueChange={setShowHidden}
            trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
            thumbColor={showHidden ? '#007AFF' : '#F3F4F6'}
          />
        </View>
      </View>

      {/* Notes List */}
      {isBusy ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.buttonPrimary} />
        </View>
      ) : (
        <FlatList
          data={filteredFlatListData}
          renderItem={renderItem}
          keyExtractor={(item, index) => 
            item.type === 'date' ? `date-${item.date}` : `note-${item.data.id}`
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={renderFooter}
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          contentContainerStyle={styles.listContent}
        />
      )}

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}

      {/* Message Input FAB */}
      <MessageInput onSend={addNewNote} listSlug={slug} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
  },
  headerContainer: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
    ...shadows.sm,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    letterSpacing: typography.letterSpacing.tight,
  },
  filtersContainer: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  filterLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
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
});
