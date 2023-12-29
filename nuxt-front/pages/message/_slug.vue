<template>

  <div class="container-fluid py-5" dir="ltr">
    <div class="row" v-if="!busy">
<div class="col-lg-2"></div>
      <div class="col-lg-8 ">
        <Note ref="note-component" :note="note" @edit-note="editNote" :singleView="true"></Note>
      </div>
    <div class="col-lg-2 px-0">
      
      <span class="text-white" v-if="note.source_links.length > 0">
        backlinks
      </span>
        <ul class="list-group">
          <nuxt-link v-for="link in note.source_links" :to="'/message/'+link.source_message">
          <li  class="list-group-item list-group-item-secondary">{{link.source_message}}</li>
          
          </nuxt-link>
  
</ul>
      </div>
    </div>
  </div>
</template>

<script>
import NoteModals from "@/components/NoteModals.vue";

export default {
  layout: "default",
  middleware: ["auth"],
  components: {
    NoteModals,
  },
  
  async asyncData({ params }) {
    const slug = params.slug;
    return { slug };
  },
  data() {
    return {
      busy: true,
      note: "",
    };
  },
  methods: {
    getCurrentNote: async function () {
      const response = await this.$axios.$get(
        "/api/note/message/" + this.slug + "/",
        {}
      );
      this.note = response;
      console.log("current note is");
      console.log( this.note);
      this.busy=false;
    },
    async editNote(targetNoteId,newText) {
      this.$root.$emit("showWaitingModal", "در انتظار پاسخ سرور");

      try {

      const response = await this.$axios.put(
        "/api/note/message/" + this.note.id + "/",
        {
          text: newText,
        }
      );
      this.note.text = newText
      this.$refs["note-component"].hideEditModal();
      this.$bvToast.toast("یادداشت با موفقیت ویرایش شد", {
          title: "ثبت شد",
          autoHideDelay: 2000,
          variant: "success",
          toaster: "b-toaster-top-left",
        });
      } catch (err) {
        console.log(`err: ${err}`);
        let handler = new ResponseHandler();
        handler.handle(err, this);
      }

      this.$root.$emit("hideWaitingModal");
    },
  },
  mounted() {
    this.getCurrentNote();
  },
};
</script>

<style></style>
