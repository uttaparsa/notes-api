export const sortNotesList = (notesList) => {
    return [...notesList].sort((a, b) => {
      // Sort archived notes to the bottom, then by created_at descending
      if (a.archived !== b.archived) {
        return a.archived > b.archived ? 1 : -1;
      }
      return new Date(b.created_at) - new Date(a.created_at);
    });
  };