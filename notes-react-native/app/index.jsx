import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Switch,
  TouchableOpacity,
} from 'react-native';
import { AuthContext, ToastContext, ModalContext } from './_layout';
import { fetchWithAuth } from '../lib/api';
import { useRouter } from 'expo-router';
import NoteList from '../components/NoteList';
import { colors, typography, spacing, borderRadius, shadows, commonStyles } from '../styles/theme';

// Utility function to sort notes
const sortNotesList = (notes) => {
  return [...notes].sort((a, b) => b.created_date - a.created_date);
};

export default function HomePage() {
  const { isAuthenticated } = useContext(AuthContext);
  const showToast = useContext(ToastContext);
  const { setShowModal, setModalTitle } = useContext(ModalContext);
  const router = useRouter();
  
  const [notes, setNotes] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isBusy, setIsBusy] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [date, setDate] = useState('');
  const [showHidden, setShowHidden] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [newNoteId, setNewNoteId] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  
  const perPage = 20;
  const listSlug = 'All';

  useEffect(() => {
    if (isAuthenticated) {
      getRecords();
    }
  }, [currentPage, showHidden, isAuthenticated]);

  const getRecords = async (selectedDate = null) => {
    setIsBusy(true);
    try {
      let url = `/api/note/${listSlug}/`;
      const params = new URLSearchParams({
        page: currentPage,
        per_page: perPage,
        ...(selectedDate && { date: selectedDate }),
        ...(showHidden && { show_hidden: 'true' }),
      });
      
      const response = await fetchWithAuth(`${url}?${params}`, {}, 5000, router);
      if (!response.ok) throw new Error('Failed to fetch notes');
      
      const data = await response.json();
      
      setNotes(data.results.map(note => ({
        ...note,
        created_date: Date.parse(note.created_date)
      })));
      setTotalCount(data.count);
      setIsBusy(false);
    } catch (err) {
      console.error(`Error: ${err}`);
      showToast('Error', err.message || 'Failed to fetch notes', 3000, 'error');
      setIsBusy(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await getRecords();
    setIsRefreshing(false);
  }, []);

  const updateNote = async (noteId, updates) => {
    try {
      const response = await fetchWithAuth(`/api/note/${noteId}/`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
      }, 5000, router);
      
      if (!response.ok) throw new Error('Failed to update note');
      
      setNotes(prevNotes =>
        prevNotes.map(note =>
          note.id === noteId ? { ...note, ...updates } : note
        )
      );
      showToast('Success', 'Note updated', 2000, 'success');
    } catch (err) {
      console.error('Update error:', err);
      showToast('Error', err.message || 'Failed to update note', 3000, 'error');
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

  const addNewNote = async () => {
    if (!messageInput.trim()) {
      showToast('Error', 'Please enter a message', 2000, 'error');
      return;
    }

    try {
      const response = await fetchWithAuth('/api/note/', {
        method: 'POST',
        body: JSON.stringify({ 
          message: messageInput, 
          list_slug: listSlug 
        }),
      }, 5000, router);
      
      if (!response.ok) throw new Error('Failed to create note');
      
      const note = await response.json();
      const noteWithDate = {
        ...note,
        created_date: Date.parse(note.created_date)
      };
      
      setNotes(prevNotes => [noteWithDate, ...prevNotes]);
      setNewNoteId(note.id);
      
      setTimeout(() => {
        setNotes(prevNotes => sortNotesList(prevNotes));
      }, 1000);
      setTimeout(() => setNewNoteId(null), 2000);
      
      setMessageInput('');
      setTotalCount(prev => prev + 1);
      showToast('Success', 'Note created', 2000, 'success');
    } catch (err) {
      console.error('Create error:', err);
      showToast('Error', err.message || 'Failed to create note', 3000, 'error');
    }
  };

  // const handleSearch = () => {
  //   if (!searchText.trim()) {
  //     showToast('Info', 'Please enter a search query', 2000, 'info');
  //     return;
  //   }
  //   // TODO: Navigate to search screen or implement inline search
  //   router.push(`/search?q=${encodeURIComponent(searchText)}`);
  // };

  const filteredNotes = notes.filter(note => 
    showHidden || !note.hidden
  );

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <View style={styles.container}>
      {/* Search Bar - Commented out until search functionality is implemented */}
      {/* <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search notes..."
          placeholderTextColor="#999"
          value={searchText}
          onChangeText={setSearchText}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View> */}

      {/* Pagination Info */}
      <View style={styles.paginationInfo}>
        <Text style={styles.paginationText}>
          Page {currentPage} of {totalPages} • {totalCount} total notes
        </Text>
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
        
        <View style={styles.filterRow}>
          <Text style={styles.filterLabel}>Filter by date:</Text>
          <TextInput
            style={styles.dateInput}
            placeholder="YYYY-MM-DD"
            placeholderTextColor="#999"
            value={date}
            onChangeText={(text) => {
              setDate(text);
              if (text.match(/^\d{4}-\d{2}-\d{2}$/)) {
                getRecords(text);
              }
            }}
          />
        </View>
      </View>

      {/* Notes List */}
      <NoteList
        notes={notes}
        isBusy={isBusy}
        showHidden={showHidden}
        onDeleteNote={deleteNote}
        newNoteId={newNoteId}
        isRefreshing={isRefreshing}
        onRefresh={onRefresh}
      />

      {/* Pagination Controls */}
      <View style={styles.paginationControls}>
        <TouchableOpacity
          style={[styles.pageButton, currentPage === 1 && styles.pageButtonDisabled]}
          onPress={() => setCurrentPage(prev => Math.max(1, prev - 1))}
          disabled={currentPage === 1}
        >
          <Text style={styles.pageButtonText}>Previous</Text>
        </TouchableOpacity>
        
        <Text style={styles.pageNumber}>{currentPage}</Text>
        
        <TouchableOpacity
          style={[styles.pageButton, currentPage === totalPages && styles.pageButtonDisabled]}
          onPress={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
          disabled={currentPage === totalPages}
        >
          <Text style={styles.pageButtonText}>Next</Text>
        </TouchableOpacity>
      </View>

      {/* Message Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.messageInput}
          placeholder="Enter your note..."
          placeholderTextColor="#999"
          value={messageInput}
          onChangeText={setMessageInput}
          multiline
          numberOfLines={2}
        />
        <TouchableOpacity style={styles.sendButton} onPress={addNewNote}>
          <Text style={styles.sendButtonText}>Add Note</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...commonStyles.container,
  },
  paginationInfo: {
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.sm,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  paginationText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.regular,
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
    marginBottom: spacing.sm,
  },
  filterLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  dateInput: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    marginLeft: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  paginationControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  pageButton: {
    backgroundColor: colors.buttonPrimary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    ...shadows.sm,
  },
  pageButtonDisabled: {
    backgroundColor: colors.buttonDisabled,
    ...shadows.sm,
  },
  pageButtonText: {
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.sm,
    letterSpacing: typography.letterSpacing.wide,
  },
  pageNumber: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
  },
  inputContainer: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  messageInput: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    minHeight: 60,
  },
  sendButton: {
    backgroundColor: colors.buttonPrimary,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.lg,
  },
  sendButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wide,
  },
});
