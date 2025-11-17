import { useState, useEffect, useCallback, useContext } from 'react';
import { AuthContext, ToastContext } from '../app/_layout';
import { fetchWithAuth } from '../lib/api';
import { useRouter } from 'expo-router';

// Utility function to format date as YYYY-MM-DD
const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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
  // Group by importance first, then by date
  const importanceGroups = {};
  
  notes.forEach(note => {
    const importance = note.importance || 0;
    if (!importanceGroups[importance]) {
      importanceGroups[importance] = {};
    }
    
    const dateKey = formatDate(note.created_at);
    if (!importanceGroups[importance][dateKey]) {
      importanceGroups[importance][dateKey] = [];
    }
    importanceGroups[importance][dateKey].push(note);
  });
  
  const flatData = [];
  
  // Sort importance levels (4 to 0)
  const sortedImportanceLevels = Object.keys(importanceGroups)
    .map(Number)
    .sort((a, b) => b - a);
  
  sortedImportanceLevels.forEach(importance => {
    // Add dates and notes for this importance level
    const dates = importanceGroups[importance];
    Object.keys(dates).sort((a, b) => new Date(b) - new Date(a)).forEach(date => {
      // Only add date header for non-important notes (importance 0)
      if (importance === 0) {
        flatData.push({ type: 'date', date, importance });
      }
      dates[date].forEach(note => {
        flatData.push({ type: 'note', data: note });
      });
    });
  });
  
  return flatData;
};

export const useNoteList = (listSlug, perPage = 20) => {
  const { isAuthenticated } = useContext(AuthContext);
  const showToast = useContext(ToastContext);
  const router = useRouter();
  
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

  useEffect(() => {
    if (isAuthenticated) {
      resetAndFetch();
    }
  }, [showHidden, isAuthenticated, listSlug]);

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
      let url = `/api/note/${listSlug}/`;
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
  }, [showHidden, listSlug]);

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
          list_slug: listSlug 
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

  const filteredFlatListData = flatListData.filter(item => {
    if (item.type === 'date') return true;
    return showHidden || !item.archived;
  });

  return {
    notes,
    flatListData: filteredFlatListData,
    isBusy,
    isLoadingMore,
    isRefreshing,
    showHidden,
    setShowHidden,
    newNoteId,
    showDatePicker,
    selectedDate,
    onRefresh,
    loadMore,
    deleteNote,
    addNewNote,
    handleDatePress,
    handleDateChange,
  };
};

export { formatDate };
