<template>

</template>

<script>
export default {
//   expose: ["showEditModal", "showDeleteModal","modalNote"],
  data() {
    return {
      modalNote: "",
    };
  },
  methods: {
    showEditModal() {
      this.$refs["editModal"].show();
    },
    toggleEditorRtl() {
      let current = this.$refs.editMessageTextArea.dir;
      if (current === "rtl") {
        this.$refs.rtlIcon.style.display = "none";
        this.$refs.ltrIcon.style.display = "block";
      } else if (current === "ltr") {
        this.$refs.ltrIcon.style.display = "none";
        this.$refs.rtlIcon.style.display = "block";
      }
      this.$refs.editMessageTextArea.dir = current === "rtl" ? "ltr" : "rtl";
    },
    showDeleteModal() {
      const textInModal =
        note.text.length > 30 ? note.text.substring(0, 30) + " ..." : note.text;
      this.textInsideDeleteModal = textInModal;
      this.$refs["deleteModal"].show();
    },
  },
};
</script>

<style></style>
