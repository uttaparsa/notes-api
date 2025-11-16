import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { AuthContext, ToastContext } from '../_layout';
import { fetchWithAuth } from '../../lib/api';
import { useRouter } from 'expo-router';

export default function ListPage() {
  const { isAuthenticated } = useContext(AuthContext);
  const showToast = useContext(ToastContext);
  const router = useRouter();
  
  const [noteLists, setNoteLists] = useState([]);
  const [isBusy, setIsBusy] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [selectedList, setSelectedList] = useState(null);
  const [renameListName, setRenameListName] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchNoteLists();
    }
  }, [isAuthenticated]);

  const fetchNoteLists = async () => {
    setIsBusy(true);
    try {
      const response = await fetchWithAuth('/api/note/list/', {}, 5000, router);
      if (!response.ok) throw new Error('Failed to fetch lists');
      
      const data = await response.json();
      setNoteLists(data);
      setIsBusy(false);
    } catch (err) {
      console.error('Error fetching lists:', err);
      showToast('Error', err.message || 'Failed to fetch lists', 3000, 'error');
      setIsBusy(false);
    }
  };

  const toggleShowInFeed = async (list) => {
    try {
      const response = await fetchWithAuth(`/api/note/list/${list.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ show_in_feed: !list.show_in_feed }),
      }, 5000, router);
      
      if (!response.ok) throw new Error('Failed to update list');
      
      setNoteLists(prevLists =>
        prevLists.map(l =>
          l.id === list.id ? { ...l, show_in_feed: !l.show_in_feed } : l
        )
      );
    } catch (err) {
      console.error('Error updating list:', err);
      showToast('Error', err.message || 'Failed to update list', 3000, 'error');
    }
  };

  const archiveTopic = async (topicId) => {
    try {
      const response = await fetchWithAuth(`/api/note/list/${topicId}/archive/`, {}, 5000, router);
      if (!response.ok) throw new Error('Failed to archive list');
      
      await fetchNoteLists();
      showToast('Success', 'List archived', 2000, 'success');
    } catch (err) {
      console.error('Error archiving list:', err);
      showToast('Error', err.message || 'Failed to archive list', 3000, 'error');
    }
  };

  const unArchiveTopic = async (topicId) => {
    try {
      const response = await fetchWithAuth(`/api/note/list/${topicId}/unarchive/`, {}, 5000, router);
      if (!response.ok) throw new Error('Failed to unarchive list');
      
      await fetchNoteLists();
      showToast('Success', 'List unarchived', 2000, 'success');
    } catch (err) {
      console.error('Error unarchiving list:', err);
      showToast('Error', err.message || 'Failed to unarchive list', 3000, 'error');
    }
  };

  const createNewList = async () => {
    if (!newListName.trim()) {
      showToast('Error', 'Please enter a list name', 2000, 'error');
      return;
    }

    try {
      const response = await fetchWithAuth('/api/note/list/', {
        method: 'POST',
        body: JSON.stringify({ name: newListName }),
      }, 5000, router);
      
      if (!response.ok) throw new Error('Failed to create list');
      
      await fetchNoteLists();
      setShowModal(false);
      setNewListName('');
      showToast('Success', 'List created', 2000, 'success');
    } catch (err) {
      console.error('Error creating list:', err);
      showToast('Error', err.message || 'Failed to create list', 3000, 'error');
    }
  };

  const renameList = async () => {
    if (!renameListName.trim()) {
      showToast('Error', 'Please enter a list name', 2000, 'error');
      return;
    }

    try {
      const response = await fetchWithAuth(`/api/note/list/${selectedList.id}/`, {
        method: 'PATCH',
        body: JSON.stringify({ name: renameListName }),
      }, 5000, router);
      
      if (!response.ok) throw new Error('Failed to rename list');
      
      await fetchNoteLists();
      setShowRenameModal(false);
      setRenameListName('');
      showToast('Success', 'List renamed', 2000, 'success');
    } catch (err) {
      console.error('Error renaming list:', err);
      showToast('Error', err.message || 'Failed to rename list', 3000, 'error');
    }
  };

  const openRenameModal = (list) => {
    setSelectedList(list);
    setRenameListName(list.name);
    setShowRenameModal(true);
  };

  const renderListItem = ({ item, index }) => {
    const showDivider = index > 0 && 
      index < noteLists.length - 1 && 
      item.archived !== noteLists[index - 1].archived;

    return (
      <>
        {showDivider && <View style={styles.divider} />}
        <View style={styles.listItem}>
          <TouchableOpacity
            style={styles.listItemContent}
            onPress={() => router.push(`/list/${item.slug}`)}
          >
            <Text style={styles.listName}>{item.name}</Text>
            
            <View style={styles.switchContainer}>
              <Text style={styles.switchLabel}>Show in feed</Text>
              <Switch
                value={item.show_in_feed}
                onValueChange={() => toggleShowInFeed(item)}
                trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
                thumbColor={item.show_in_feed ? '#007AFF' : '#F3F4F6'}
              />
            </View>
          </TouchableOpacity>

          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.button, item.archived ? styles.buttonSuccess : styles.buttonWarning]}
              onPress={() => item.archived ? unArchiveTopic(item.id) : archiveTopic(item.id)}
            >
              <Text style={styles.buttonText}>
                {item.archived ? 'Unarchive' : 'Archive'}
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.button, styles.buttonPrimary]}
              onPress={() => openRenameModal(item)}
            >
              <Text style={styles.buttonText}>Rename</Text>
            </TouchableOpacity>
          </View>
        </View>
      </>
    );
  };

  if (isBusy) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={noteLists}
        renderItem={renderListItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
      />

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.createButtonText}>Create New List</Text>
      </TouchableOpacity>

      {/* Create List Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New List</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter list name"
              placeholderTextColor="#999"
              value={newListName}
              onChangeText={setNewListName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={createNewList}
              >
                <Text style={styles.modalButtonTextConfirm}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Rename List Modal */}
      <Modal
        visible={showRenameModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRenameModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rename List</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Enter new list name"
              placeholderTextColor="#999"
              value={renameListName}
              onChangeText={setRenameListName}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel]}
                onPress={() => setShowRenameModal(false)}
              >
                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonConfirm]}
                onPress={renameList}
              >
                <Text style={styles.modalButtonTextConfirm}>Rename</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  listContainer: {
    padding: 12,
  },
  listItem: {
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
  listItemContent: {
    marginBottom: 12,
  },
  listName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: 14,
    color: '#666',
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonPrimary: {
    backgroundColor: '#007AFF',
  },
  buttonWarning: {
    backgroundColor: '#FF9500',
  },
  buttonSuccess: {
    backgroundColor: '#34C759',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 12,
  },
  createButton: {
    backgroundColor: '#007AFF',
    margin: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  createButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#333',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#E0E0E0',
  },
  modalButtonConfirm: {
    backgroundColor: '#007AFF',
  },
  modalButtonTextCancel: {
    color: '#333',
    fontSize: 16,
    fontWeight: '600',
  },
  modalButtonTextConfirm: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
