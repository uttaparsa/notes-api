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
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [selectedList, setSelectedList] = useState(null);
  const [renameMode, setRenameMode] = useState(false);
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
      showToast('Success', 'List updated', 2000, 'success');
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
      setShowActionsModal(false);
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
      setShowActionsModal(false);
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
      setShowActionsModal(false);
      setRenameMode(false);
      setRenameListName('');
      showToast('Success', 'List renamed', 2000, 'success');
    } catch (err) {
      console.error('Error renaming list:', err);
      showToast('Error', err.message || 'Failed to rename list', 3000, 'error');
    }
  };

  const openActionsModal = (list) => {
    setSelectedList(list);
    setRenameListName(list.name);
    setRenameMode(false);
    setShowActionsModal(true);
  };

  const renderListItem = ({ item }) => {
    const isArchived = item.archived;
    const isInFeed = item.show_in_feed;

    return (
      <View style={styles.listItem}>
        <TouchableOpacity
          style={styles.listItemMain}
          onPress={() => router.push(`/list/${item.slug}`)}
          activeOpacity={0.7}
        >
          <View style={styles.listItemLeft}>
            <Text style={[styles.listName, isArchived && styles.listNameArchived]}>
              {item.name}
            </Text>
            <View style={styles.statusContainer}>
              {isArchived && (
                <View style={[styles.statusBadge, styles.statusBadgeArchived]}>
                  <Text style={styles.statusBadgeText}>📦 Archived</Text>
                </View>
              )}
              {isInFeed && !isArchived && (
                <View style={[styles.statusBadge, styles.statusBadgeActive]}>
                  <Text style={styles.statusBadgeText}>👁️ In Feed</Text>
                </View>
              )}
            </View>
          </View>
          
          <TouchableOpacity
            style={styles.moreButton}
            onPress={(e) => {
              e.stopPropagation();
              openActionsModal(item);
            }}
          >
            <Text style={styles.moreButtonText}>⋯</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSectionHeader = (title) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  const activeLists = noteLists.filter(list => !list.archived);
  const archivedLists = noteLists.filter(list => list.archived);

  if (isBusy) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.buttonPrimary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={[
          { type: 'header', title: 'Active Lists' },
          ...activeLists.map(list => ({ ...list, type: 'item' })),
          ...(archivedLists.length > 0 ? [{ type: 'header', title: 'Archived' }] : []),
          ...archivedLists.map(list => ({ ...list, type: 'item' })),
        ]}
        renderItem={({ item }) => {
          if (item.type === 'header') {
            return renderSectionHeader(item.title);
          }
          return renderListItem({ item });
        }}
        keyExtractor={(item, index) => item.type === 'header' ? `header-${index}` : item.id.toString()}
        contentContainerStyle={styles.listContainer}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />

      <TouchableOpacity
        style={styles.createButton}
        onPress={() => setShowModal(true)}
      >
        <Text style={styles.createButtonText}>+ New List</Text>
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
              placeholder="List name"
              placeholderTextColor="#999"
              value={newListName}
              onChangeText={setNewListName}
              autoFocus
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

      {/* Actions Modal */}
      <Modal
        visible={showActionsModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setShowActionsModal(false);
          setRenameMode(false);
        }}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1}
          onPress={() => {
            setShowActionsModal(false);
            setRenameMode(false);
          }}
        >
          <TouchableOpacity 
            style={styles.actionsModalContent}
            activeOpacity={1}
          >
            {renameMode ? (
              <>
                <Text style={styles.actionsModalTitle}>Rename List</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="New list name"
                  placeholderTextColor="#999"
                  value={renameListName}
                  onChangeText={setRenameListName}
                  autoFocus
                />
                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel]}
                    onPress={() => setRenameMode(false)}
                  >
                    <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonConfirm]}
                    onPress={renameList}
                  >
                    <Text style={styles.modalButtonTextConfirm}>Save</Text>
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.actionsModalTitle}>{selectedList?.name}</Text>
                
                <View style={styles.actionsList}>
                  <TouchableOpacity
                    style={styles.actionItem}
                    onPress={() => setRenameMode(true)}
                  >
                    <Text style={styles.actionItemIcon}>✏️</Text>
                    <Text style={styles.actionItemText}>Rename</Text>
                  </TouchableOpacity>

                  <View style={styles.actionItemDivider} />

                  <View style={styles.actionItem}>
                    <Text style={styles.actionItemIcon}>👁️</Text>
                    <Text style={styles.actionItemText}>Show in Feed</Text>
                    <Switch
                      value={selectedList?.show_in_feed}
                      onValueChange={() => toggleShowInFeed(selectedList)}
                      trackColor={{ false: colors.switchInactive, true: colors.switchActive }}
                      thumbColor={colors.white}
                    />
                  </View>

                  <View style={styles.actionItemDivider} />

                  <TouchableOpacity
                    style={styles.actionItem}
                    onPress={() => 
                      selectedList?.archived 
                        ? unArchiveTopic(selectedList.id)
                        : archiveTopic(selectedList.id)
                    }
                  >
                    <Text style={styles.actionItemIcon}>
                      {selectedList?.archived ? '📂' : '📦'}
                    </Text>
                    <Text style={[
                      styles.actionItemText,
                      selectedList?.archived && styles.actionItemTextWarning
                    ]}>
                      {selectedList?.archived ? 'Unarchive' : 'Archive'}
                    </Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={() => setShowActionsModal(false)}
                >
                  <Text style={styles.closeButtonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
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
    paddingBottom: 100,
  },
  sectionHeader: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  sectionHeaderText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    letterSpacing: typography.letterSpacing.wide,
    textTransform: 'uppercase',
  },
  listItem: {
    backgroundColor: colors.white,
  },
  listItemMain: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  listItemLeft: {
    flex: 1,
  },
  listName: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  listNameArchived: {
    color: colors.textSecondary,
  },
  statusContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statusBadgeActive: {
    backgroundColor: '#E3F2FD',
  },
  statusBadgeArchived: {
    backgroundColor: '#F5F5F5',
  },
  statusBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  moreButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  moreButtonText: {
    fontSize: 24,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.bold,
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginLeft: spacing.lg,
  },
  createButton: {
    position: 'absolute',
    bottom: spacing.lg,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.buttonPrimary,
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
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.xl,
  },
  actionsModalContent: {
    backgroundColor: colors.white,
    borderTopLeftRadius: borderRadius.lg,
    borderTopRightRadius: borderRadius.lg,
    padding: spacing.xl,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  actionsModalTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    textAlign: 'center',
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
  },
  modalButtonTextCancel: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  modalButtonTextConfirm: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  actionsList: {
    marginBottom: spacing.lg,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  actionItemIcon: {
    fontSize: 20,
  },
  actionItemText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    fontWeight: typography.fontWeight.medium,
  },
  actionItemTextWarning: {
    color: colors.warning,
  },
  actionItemDivider: {
    height: 1,
    backgroundColor: colors.borderLight,
  },
  closeButton: {
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
});
