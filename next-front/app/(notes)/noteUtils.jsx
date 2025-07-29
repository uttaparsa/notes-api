export const sortNotesList = (notesList) => {
    return [...notesList].sort((a, b) => {
      console.log("a pinned:", a.importance, "b pinned:", b.importance);
      
      if (a.importance === b.importance) {
        if (a.archived === b.archived) {
          return new Date(b.created_at) - new Date(a.created_at);
        }
        return a.archived > b.archived ? 1 : -1;
      }
      return b.importance- a.importance;
    });
  };