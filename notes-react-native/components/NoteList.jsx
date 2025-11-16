import React from 'react';
import { View, ScrollView, StyleSheet, ActivityIndicator, Text, RefreshControl } from 'react-native';
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
    <ScrollView
      style={styles.notesList}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      {filteredNotes.map(note => (
        <NoteCard
          key={note.id}
          note={note}
          onDelete={onDeleteNote}
          isNew={newNoteId === note.id}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
});
