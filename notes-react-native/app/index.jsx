import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TextInput,
  Switch,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { AuthContext, ToastContext, ModalContext } from './_layout';
// import { fetchWithAuth } from '../lib/api';
// import { handleApiError } from '../utils/errorHandler';

// Utility function to sort notes
const sortNotesList = (notes) => {
  return [...notes].sort((a, b) => b.created_date - a.created_date);
};

export default function HomePage() {
  const { isAuthenticated } = useContext(AuthContext);
  const showToast = useContext(ToastContext);
  const { setShowModal, setModalTitle } = useContext(ModalContext);
  
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
      // TODO: Implement actual API call
      // let url = `/api/note/${listSlug}/`;
      // const params = new URLSearchParams({
      //   page: currentPage,
      //   ...(selectedDate && { date: selectedDate }),
      // });
      // 
      // const response = await fetchWithAuth(`${url}?${params}`);
      // if (!response.ok) throw new Error('Failed to fetch notes');
      // const data = await response.json();
      // 
      // setNotes(data.results.map(note => ({
      //   ...note,
      //   created_date: Date.parse(note.created_date)
      // })));
      // setTotalCount(data.count);

      // Temporary mock data
      setTimeout(() => {
        const mockNotes = [
          {
            id: 1,
            message: 'First note example',
            created_date: Date.now() - 1000000,
            hidden: false,
          },
          {
            id: 2,
            message: 'Second note example',
            created_date: Date.now() - 2000000,
            hidden: false,
          },
          {
            id: 3,
            message: 'Hidden note example',
            created_date: Date.now() - 3000000,
            hidden: true,
          },
        ];
        
        setNotes(mockNotes);
        setTotalCount(mockNotes.length);
        setIsBusy(false);
      }, 500);
    } catch (err) {
      console.error(`Error: ${err}`);
      // handleApiError(err);
      showToast('Error', 'Failed to fetch notes', 3000, 'error');
      setIsBusy(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await getRecords();
    setIsRefreshing(false);
  }, []);

  const updateNote = async (noteId, updates) => {
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === noteId ? { ...note, ...updates } : note
      )
    );
  };

  const deleteNote = async (noteId) => {
    // TODO: Implement actual delete API call
    // try {
    //   const response = await fetchWithAuth(`/api/note/${noteId}/`, {
    //     method: 'DELETE',
    //   });
    //   if (!response.ok) throw new Error('Failed to delete note');
    //   setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
    //   showToast('Success', 'Note deleted', 2000, 'success');
    // } catch (err) {
    //   handleApiError(err);
    // }
    
    setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
    showToast('Success', 'Note deleted', 2000, 'success');
  };

  const addNewNote = async () => {
    if (!messageInput.trim()) {
      showToast('Error', 'Please enter a message', 2000, 'error');
      return;
    }

    // TODO: Implement actual create API call
    // try {
    //   const response = await fetchWithAuth('/api/note/', {
    //     method: 'POST',
    //     headers: { 'Content-Type': 'application/json' },
    //     body: JSON.stringify({ message: messageInput, list_slug: listSlug }),
    //   });
    //   if (!response.ok) throw new Error('Failed to create note');
    //   const note = await response.json();
    //   // Add note and sort
    //   setNotes(prevNotes => [note, ...prevNotes]);
    //   setNewNoteId(note.id);
    //   setTimeout(() => {
    //     setNotes(prevNotes => sortNotesList(prevNotes));
    //   }, 1000);
    //   setTimeout(() => setNewNoteId(null), 2000);
    //   setMessageInput('');
    //   showToast('Success', 'Note created', 2000, 'success');
    // } catch (err) {
    //   handleApiError(err);
    // }

    // Temporary mock
    const newNote = {
      id: Date.now(),
      message: messageInput,
      created_date: Date.now(),
      hidden: false,
    };
    
    setNotes(prevNotes => [newNote, ...prevNotes]);
    setNewNoteId(newNote.id);
    setTimeout(() => {
      setNotes(prevNotes => sortNotesList(prevNotes));
    }, 1000);
    setTimeout(() => setNewNoteId(null), 2000);
    setMessageInput('');
    showToast('Success', 'Note created', 2000, 'success');
  };

  const handleSearch = () => {
    // TODO: Implement search navigation
    // Navigation to search screen with query params
    console.log('Search:', searchText);
    showToast('Info', 'Search feature coming soon', 2000, 'info');
  };

  const filteredNotes = notes.filter(note => 
    showHidden || !note.hidden
  );

  const totalPages = Math.ceil(totalCount / perPage);

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
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
      </View>

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
      <ScrollView
        style={styles.notesList}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        {isBusy ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : filteredNotes.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No notes found</Text>
          </View>
        ) : (
          filteredNotes.map(note => (
            <View
              key={note.id}
              style={[
                styles.noteCard,
                newNoteId === note.id && styles.noteCardNew,
              ]}
            >
              <Text style={styles.noteMessage}>{note.message}</Text>
              <View style={styles.noteFooter}>
                <Text style={styles.noteDate}>
                  {new Date(note.created_date).toLocaleString()}
                </Text>
                <TouchableOpacity
                  onPress={() => deleteNote(note.id)}
                  style={styles.deleteButton}
                >
                  <Text style={styles.deleteButtonText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

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
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginRight: 8,
  },
  searchButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  paginationInfo: {
    backgroundColor: '#FFFFFF',
    padding: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  paginationText: {
    fontSize: 12,
    color: '#666',
  },
  filtersContainer: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  filterLabel: {
    fontSize: 14,
    color: '#333',
  },
  dateInput: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 8,
    marginLeft: 12,
    fontSize: 14,
  },
  notesList: {
    flex: 1,
    padding: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  noteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  noteCardNew: {
    borderColor: '#007AFF',
    borderWidth: 2,
  },
  noteMessage: {
    fontSize: 16,
    color: '#333',
    marginBottom: 12,
  },
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  noteDate: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  deleteButtonText: {
    color: '#DC3545',
    fontSize: 14,
    fontWeight: '600',
  },
  paginationControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  pageButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  pageButtonDisabled: {
    backgroundColor: '#A0C4E8',
  },
  pageButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  pageNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  messageInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 8,
    minHeight: 60,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
