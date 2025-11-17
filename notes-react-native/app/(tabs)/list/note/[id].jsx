import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { AuthContext, ToastContext } from '../../../_layout';
import { fetchWithAuth } from '../../../../lib/api';
import { colors, typography, spacing, commonStyles } from '../../../../styles/theme';

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { isAuthenticated } = useContext(AuthContext);
  const showToast = useContext(ToastContext);

  const [note, setNote] = useState(null);
  const [editedText, setEditedText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isAuthenticated && id) {
      fetchNote();
    }
  }, [id, isAuthenticated]);

  const fetchNote = async () => {
    try {
      const response = await fetchWithAuth(`/api/note/message/${id}/`, {}, 5000);
      if (!response.ok) throw new Error('Failed to fetch note');
      
      const data = await response.json();
      setNote(data);
      setEditedText(data.text);
      setOriginalText(data.text);
    } catch (err) {
      console.error('Error fetching note:', err);
      showToast('Error', err.message || 'Failed to fetch note', 3000, 'error');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!hasChanges) return;

    setIsSaving(true);
    try {
      const response = await fetchWithAuth(`/api/note/message/${id}/`, {
        method: 'PUT',
        body: JSON.stringify({ text: editedText }),
      }, 5000);

      if (!response.ok) throw new Error('Failed to save note');

      const updatedNote = await response.json();
      setNote(updatedNote);
      setOriginalText(editedText);
      showToast('Success', 'Note saved', 2000, 'success');
    } catch (err) {
      console.error('Error saving note:', err);
      showToast('Error', err.message || 'Failed to save note', 3000, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges = editedText !== originalText;

  if (isLoading) {
    return (
      <View style={commonStyles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.buttonPrimary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>← Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleSave}
          disabled={!hasChanges || isSaving}
          style={[
            styles.saveButton,
            !hasChanges && styles.saveButtonDisabled,
            hasChanges && styles.saveButtonActive,
          ]}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <Text style={styles.saveButtonText}>
              {hasChanges ? 'Save ●' : 'Saved ✓'}
            </Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          style={styles.textInput}
          value={editedText}
          onChangeText={setEditedText}
          multiline
          autoFocus
          placeholder="Enter your note..."
          placeholderTextColor={colors.textTertiary}
        />

        {note && (
          <View style={styles.metadata}>
            <Text style={styles.metadataText}>
              Created: {new Date(note.created_at).toLocaleString()}
            </Text>
            {note.updated_at && note.updated_at !== note.created_at && (
              <Text style={styles.metadataText}>
                Updated: {new Date(note.updated_at).toLocaleString()}
              </Text>
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  backButton: {
    padding: spacing.sm,
  },
  backButtonText: {
    fontSize: typography.fontSize.base,
    color: colors.buttonPrimary,
    fontWeight: typography.fontWeight.semibold,
  },
  saveButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: colors.backgroundSecondary,
  },
  saveButtonActive: {
    backgroundColor: colors.success,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: spacing.lg,
  },
  textInput: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
    lineHeight: 24,
    minHeight: 300,
    textAlignVertical: 'top',
  },
  metadata: {
    marginTop: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
  },
  metadataText: {
    fontSize: typography.fontSize.xs,
    color: colors.textTertiary,
    marginBottom: spacing.xs,
  },
});
