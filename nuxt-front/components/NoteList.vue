<template>
  <div>
    
    <div class="mt-1 d-flex row justify-content-center">
      <div class="col-xl-12 d-flex flex-vertical flex-column" v-if="!isBusy">
        <div id="notesListt" v-for="item in notes" :key="item.id">
          <Note
            :ref="'note-component-' + item.id"
            @pin="updatePinned(item, true)"
            @unpin="updatePinned(item, false)"
            @archived="updateArchived(item, true)"
            @unarchived="updateArchived(item, false)"
            @delete-note="deleteNote"
            @edit-note="editNote"
            v-show="showArchived=='show' || !item.archived"
            :note="item"
            :hideEdits="hideEdits ? true : false"
          />
        </div>
      </div>
      <div v-else class="text-center">
        <b-spinner
          class="mt-5"
          style="width: 3rem; height: 3rem"
          label="Large Spinner"
          variant="primary"
        ></b-spinner>
      </div>
    </div>

    <br class="my-5" />
    <br class="my-5" />
    <br class="my-5" />
  </div>
</template>

<script>
import NoteModals from "@/components/NoteModals.vue";
export default {
  props: ["notes", "isBusy", "hideEdits","showArchived"],
  emits: ["refresh"],
  components: {
    NoteModals,
  },
  data() {
    return {};
  },
  methods: {
    updatePinned(item, pinned) {
      item.pinned = pinned;
      this.$emit("refresh");
    },
    updateArchived(item, archived) {
      item.archived = archived;
      this.$emit("refresh");
    },
    addNewNote(note) {
      this.notes.unshift(note);
      this.sortNotes();
    },
    showDeleteModal(note) {
      console.log("noteModals " + this.$refs.noteModals);
      this.$refs.noteModals.showDeleteModal(note);
    },
    showEditModal(note) {
      console.log("noteModals " + this.$refs.noteModals);
      this.$refs.noteModals.showEditModal(note);
    },
    async deleteNote(targetNoteId) {
      this.$root.$emit("showWaitingModal", "در انتظار پاسخ سرور");
      try {
        const response = await this.$axios.$delete(
          "/api/note/message/" + targetNoteId + "/",
          {}
        );
        this.notes = this.notes.filter((obj) => {
          return obj.id !== targetNoteId;
        });
      } catch (err) {
        this.$root.$emit("hideWaitingModal");

        let handler = new ResponseHandler();
        handler.handle(err, this);
      }
      this.$root.$emit("hideWaitingModal");
    },

    async editNote(targetNoteId, newText) {
      this.$root.$emit("showWaitingModal", "در انتظار پاسخ سرور");
      try {
        const response = await this.$axios.put(
          "/api/note/message/" + targetNoteId + "/",
          {
            text: newText,
          }
        );
        this.$refs["note-component-" + targetNoteId][0].hideEditModal();
        this.notes.forEach(function (note) {
          if (note.id === targetNoteId) {
            note.text = newText;
          }
        });
        this.$bvToast.toast("یادداشت با موفقیت ویرایش شد", {
          title: "ثبت شد",
          autoHideDelay: 2000,
          variant: "success",
          toaster: "b-toaster-top-left",
        });
        
      } catch (err) {
        this.$root.$emit("hideWaitingModal");

        let handler = new ResponseHandler();
        handler.handle(err, this);
      }

      this.$root.$emit("hideWaitingModal");
    },

    sortNotes() {
      this.notes.sort(function (a, b) {
        if (a.pinned === b.pinned) {
          // Price is only important when cities are the same
          if (a.archived === b.archived) {
            return b.created_at - a.created_at;
          }
          return a.archived > b.archived ? 1 : -1;
        }
        return a.pinned < b.pinned ? 1 : -1;
      });
    },
  },
  mounted: function () {
    this.$emit("refresh");
  },
};
</script>

<style></style>
