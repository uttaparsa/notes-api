import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Markdown from 'react-native-markdown-display';

export default function NoteCard({ note, onDelete, isNew = false }) {
  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <View style={[styles.noteCard, isNew && styles.noteCardNew]}>
      <Markdown style={markdownStyles}>{note.text}</Markdown>
      <View style={styles.noteFooter}>
        <Text style={styles.noteDate}>{formatDate(note.created_date)}</Text>
        <TouchableOpacity onPress={() => onDelete(note.id)} style={styles.deleteButton}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  noteFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
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
});

const markdownStyles = {
  body: {
    fontSize: 16,
    color: '#333',
  },
  heading1: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  heading2: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#000',
  },
  heading3: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#000',
  },
  strong: {
    fontWeight: 'bold',
  },
  em: {
    fontStyle: 'italic',
  },
  link: {
    color: '#007AFF',
    textDecorationLine: 'underline',
  },
  bullet_list: {
    marginVertical: 4,
  },
  ordered_list: {
    marginVertical: 4,
  },
  list_item: {
    marginVertical: 2,
  },
  code_inline: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  code_block: {
    backgroundColor: '#F8F9FA',
    padding: 12,
    borderRadius: 8,
    fontFamily: 'monospace',
    fontSize: 14,
  },
  blockquote: {
    backgroundColor: '#F8F9FA',
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    paddingLeft: 12,
    paddingVertical: 8,
    marginVertical: 8,
  },
};
