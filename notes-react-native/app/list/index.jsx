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
import { colors, typography, spacing, borderRadius, shadows, commonStyles } from '../../styles/theme';

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
    ...commonStyles.container,
  },
  loadingContainer: {
    ...commonStyles.loadingContainer,
  },
  listContainer: {
    padding: spacing.md,
  },
  listItem: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  listItemContent: {
    marginBottom: spacing.md,
  },
  listName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: typography.letterSpacing.tight,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  switchLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    ...shadows.sm,
  },
  buttonPrimary: {
    backgroundColor: colors.buttonPrimary,
  },
  buttonWarning: {
    backgroundColor: colors.warning,
  },
  buttonSuccess: {
    backgroundColor: colors.success,
  },
  buttonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wide,
  },
  divider: {
    ...commonStyles.divider,
  },
  createButton: {
    backgroundColor: colors.buttonPrimary,
    margin: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    ...shadows.lg,
  },
  createButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wide,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    width: '80%',
    maxWidth: 400,
    ...shadows.lg,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    letterSpacing: typography.letterSpacing.tight,
  },
  modalInput: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    padding: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  modalButtonConfirm: {
    backgroundColor: colors.buttonPrimary,
    ...shadows.sm,
  },
  modalButtonTextCancel: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
  },
  modalButtonTextConfirm: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: typography.letterSpacing.wide,
  },
});
