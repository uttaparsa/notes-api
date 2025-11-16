// This component is now deprecated for the home page but kept for compatibility
import React from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, Text, RefreshControl } from 'react-native';
import NoteCard from './notecard/NoteCard';

export default function NoteList({ 
  notes, 
  isBusy, 
  showHidden, 
  onDeleteNote, 
  newNoteId,
  isRefreshing,
  onRefresh 
}) {
  const filteredNotes = notes.filter(note => showHidden || !note.archived);

  if (isBusy) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (filteredNotes.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No notes found</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={filteredNotes}
      renderItem={({ item }) => (
        <NoteCard
          note={item}
          onDelete={onDeleteNote}
          isNew={newNoteId === item.id}
        />
      )}
      keyExtractor={(item) => item.id.toString()}
      style={styles.notesList}
      contentContainerStyle={styles.notesListContent}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    />
  );
}

const styles = StyleSheet.create({
  notesList: {
    flex: 1,
  },
  notesListContent: {
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
});
