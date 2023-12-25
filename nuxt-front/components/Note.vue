<template>
  <div class="card rounded bg-secondary mb-2">
    <div class="card-body pb-1">
      <div class="row">
        <div class="col-sm-1">
          <b-dropdown
            id="dropdown-1"
            toggle-class="dropdown"
            variant="dark"
            no-caret
          >
            <template #button-content>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
              >
                <path
                  d="M24 6h-24v-4h24v4zm0 4h-24v4h24v-4zm0 8h-24v4h24v-4z"
                />
              </svg>
            </template>
            <b-dropdown-item-button v-if="!hideEdits" @click="$refs.moveModal.show()"
              >Move</b-dropdown-item-button
            >
            <b-dropdown-divider></b-dropdown-divider>
            <b-dropdown-item-button
              @click="copyElementTextToClipboard($refs['text-' + note.id])"
              >Copy</b-dropdown-item-button
            >
            <b-dropdown-item-button  v-if="!hideEdits" @click.prevent="showEditModal"
              >Edit</b-dropdown-item-button
            >
            <template v-if="!singleView && !hideEdits">
              <b-dropdown-item-button
                v-if="!note.pinned"
                @click.prevent="pinMessage(note.id)"
                >Pin</b-dropdown-item-button
              >
              <b-dropdown-item-button
                v-else
                @click.prevent="unPinMessage(note.id)"
                >Unpin</b-dropdown-item-button
              >
              <b-dropdown-item-button
                v-if="!note.archived"
                @click.prevent="archiveMessage(note.id)"
                >Archive</b-dropdown-item-button
              >
              <b-dropdown-item-button
                v-else
                @click.prevent="unArchiveMessage(note.id)"
                >UnArchive</b-dropdown-item-button
              >
            </template>

            <b-dropdown-item-button
              @click.prevent="showDeleteModal"
              v-if="!singleView  && !hideEdits"
              >Delete</b-dropdown-item-button
            >
          </b-dropdown>
        </div>

        <div class="col-sm-11 pl-md-1 pl-md-1">
          <h6 class="card-subtitle mb-2 text-info">
            {{ note.sender_name }}
          </h6>

          <img
            v-if="note.image"
            :src="
              note.image
            "
            style="max-height: 200px"
            alt="..."
            class="img-thumbnail"
          />
          <a :href="note.file"  v-if="note.file">
            <div class="bg-info float-left p-1 rounded text-dark">
              <svg
                height="20px"
                width="20px"
                version="1.1"
                id="Layer_1"
                xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink"
                viewBox="0 0 280.067 280.067"
                xml:space="preserve"
              >
         
                <g>
                  <path
                    d="M149.823,257.142c-31.398,30.698-81.882,30.576-113.105-0.429
		c-31.214-30.987-31.337-81.129-0.42-112.308l-0.026-0.018L149.841,31.615l14.203-14.098c23.522-23.356,61.65-23.356,85.172,0
		s23.522,61.221,0,84.586l-125.19,123.02l-0.044-0.035c-15.428,14.771-40.018,14.666-55.262-0.394
		c-15.244-15.069-15.34-39.361-0.394-54.588l-0.044-0.053l13.94-13.756l69.701-68.843l13.931,13.774l-83.632,82.599
		c-7.701,7.596-7.701,19.926,0,27.53s20.188,7.604,27.88,0L235.02,87.987l-0.035-0.026l0.473-0.403
		c15.682-15.568,15.682-40.823,0-56.39s-41.094-15.568-56.776,0l-0.42,0.473l-0.026-0.018l-14.194,14.089L50.466,158.485
		c-23.522,23.356-23.522,61.221,0,84.577s61.659,23.356,85.163,0l99.375-98.675l14.194-14.089l14.194,14.089l-14.194,14.098
		l-99.357,98.675C149.841,257.159,149.823,257.142,149.823,257.142z"
                  />
                </g>
              </svg>
              <span>{{note.file.split('/').pop()}}</span>
            </div>
          </a>

          <p
            :ref="'text-' + note.id"
            style="white-space: pre-line"
            class="card-text text-light"
            :dir="isRTL(note.text) ? 'rtl' : 'ltr'"
            :class="isRTL(note.text) ? 'text-right' : ''"
          >
          <span v-html="(singleView || note.text.length < 1000 || note.expand===true ) ? this.linkify(note.text) : this.linkify(note.text.substring(0,1000)) "></span>
          
          <span  @click="expandNote(note)" v-if="(!singleView && note.text.length > 1000 && note.expand!==true)" class='h4 mx-2 px-1 rounded py-0 bg-dark flex-sn-wrap'><b>...{{note.expand}}</b></span>
          </p>
        </div>
      </div>

      <div class="mt-2 mb-0">
        <div class="float-right d-flex">
          <nuxt-link
            :to="'/list/' + getListSlug() + '/'"
            class="my-0 mr-2 text-dark"
            style="font-size: 2 em"
            >{{ getListName() }}</nuxt-link
          >
          <span class="text-info">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              class="bi bi-pin"
              viewBox="0 0 16 16"
              v-if="note.pinned"
            >
              <path
                d="M4.146.146A.5.5 0 0 1 4.5 0h7a.5.5 0 0 1 .5.5c0 .68-.342 1.174-.646 1.479-.126.125-.25.224-.354.298v4.431l.078.048c.203.127.476.314.751.555C12.36 7.775 13 8.527 13 9.5a.5.5 0 0 1-.5.5h-4v4.5c0 .276-.224 1.5-.5 1.5s-.5-1.224-.5-1.5V10h-4a.5.5 0 0 1-.5-.5c0-.973.64-1.725 1.17-2.189A5.921 5.921 0 0 1 5 6.708V2.277a2.77 2.77 0 0 1-.354-.298C4.342 1.674 4 1.179 4 .5a.5.5 0 0 1 .146-.354zm1.58 1.408-.002-.001.002.001zm-.002-.001.002.001A.5.5 0 0 1 6 2v5a.5.5 0 0 1-.276.447h-.002l-.012.007-.054.03a4.922 4.922 0 0 0-.827.58c-.318.278-.585.596-.725.936h7.792c-.14-.34-.407-.658-.725-.936a4.915 4.915 0 0 0-.881-.61l-.012-.006h-.002A.5.5 0 0 1 10 7V2a.5.5 0 0 1 .295-.458 1.775 1.775 0 0 0 .351-.271c.08-.08.155-.17.214-.271H5.14c.06.1.133.191.214.271a1.78 1.78 0 0 0 .37.282z"
              />
            </svg>
          </span>

          <span class="text-info mx-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 512 512"
              v-if="note.archived"
            >
              <path
                d="M32 448c0 17.7 14.3 32 32 32h384c17.7 0 32-14.3 32-32V160H32v288zm160-212c0-6.6 5.4-12 12-12h104c6.6 0 12 5.4 12 12v8c0 6.6-5.4 12-12 12H204c-6.6 0-12-5.4-12-12v-8zM480 32H32C14.3 32 0 46.3 0 64v48c0 8.8 7.2 16 16 16h480c8.8 0 16-7.2 16-16V64c0-17.7-14.3-32-32-32z"
              />
            </svg>
          </span>

          <span class="d-md-none">
            {{ note.created_at | formatDateSmall }}</span
          >
          <span class="d-none d-md-block">
            {{ note.created_at | formatDateLarge }}
          </span>
        </div>

        <span class="ml-2"
          ><nuxt-link :to="'/message/' + note.id + '/'">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              fill="currentColor"
              class="bi bi-link"
              viewBox="0 0 16 16"
            >
              <path
                d="M6.354 5.5H4a3 3 0 0 0 0 6h3a3 3 0 0 0 2.83-4H9c-.086 0-.17.01-.25.031A2 2 0 0 1 7 10.5H4a2 2 0 1 1 0-4h1.535c.218-.376.495-.714.82-1z"
              />
              <path
                d="M9 5.5a3 3 0 0 0-2.83 4h1.098A2 2 0 0 1 9 6.5h3a2 2 0 1 1 0 4h-1.535a4.02 4.02 0 0 1-.82 1H12a3 3 0 1 0 0-6H9z"
              />
            </svg>
          </nuxt-link>
        </span>
      </div>
    </div>

    <div id="NoteModals">
      <b-modal
        dir="ltr"
        ref="moveModal"
        title="Moving note"
        ok-only
        ok-title="close"
      >
        <template v-for="lst in $store.state.noteLists">
          <button
            v-show="lst.id !== note.list"
            type="button"
            @click="moveNote(lst.id)"
            class="m-1 btn btn-info"
          >
            {{ lst.name }}
          </button>
        </template>
      </b-modal>
      <b-modal
        dir="ltr"
        ref="deleteModal"
        title="Are you sure you want to delete this message?"
        ok-variant="danger"
        @ok="$emit('delete-note', note.id)"
      >
        <p :class="isRTL(textInsideDeleteModal) ? 'text-right' : 'text-left'">
          {{ textInsideDeleteModal }}
        </p>
      </b-modal>

      <b-modal
        dir="ltr"
        ref="editModal"
        size="xl"
        title="Editing message"
        @ok.prevent="editNote"
        ok-title="Save"
        no-close-on-backdrop
      >
        <div class="mb-5 mt-0 px-2">
          <button
            type="button"
            @click.prevent="toggleEditorRtl()"
            class="btn btn-outline-dark btn-sm float-right"
          >
            <svg
              ref="rtlIcon"
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 0 24 24"
              width="24px"
              fill="#000000"
            >
              <path d="M0 0h24v24H0z" fill="none" />
              <path
                d="M10 10v5h2V4h2v11h2V4h2V2h-8C7.79 2 6 3.79 6 6s1.79 4 4 4zm-2 7v-3l-4 4 4 4v-3h12v-2H8z"
              />
            </svg>
            <svg
              ref="ltrIcon"
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              style="display: none"
              viewBox="0 0 24 24"
              width="24px"
              fill="#000000"
            >
              <path d="M0 0h24v24H0z" fill="none" />
              <path
                d="M9 10v5h2V4h2v11h2V4h2V2H9C6.79 2 5 3.79 5 6s1.79 4 4 4zm12 8l-4-4v3H5v2h12v3l4-4z"
              />
            </svg>
          </button>
        </div>
        <textarea
          dir="rtl"
          ref="editMessageTextArea"
          @keydown.enter="handleEnter"
          @input="updateTextAreaHeight(arguments[0].target)"
          class="w-100"
          style="white-space: pre-line; max-height: 60vh"
          >{{ note.text }}</textarea
        >
      </b-modal>
    </div>
  </div>
</template>

<script>
export default {
  props: ["note", "singleView", "hideEdits"],
  emits: ["pin", "unpin", "archived", "unarchived", "delete-note", "edit-note"],
  data() {
    return {
      textInsideDeleteModal: "",
    };
  },
  methods: {
    expandNote(note){
      note.expand = true;
      this.$forceUpdate();
      
    },
    async moveNote(lst_id) {
      console.log("lst_id is " + lst_id);
      try {
        this.$root.$emit("showWaitingModal", "در انتظار پاسخ سرور");
        const response = await this.$axios.post(
          "/api/note/message/move/" + this.note.id + "/",
          {
            list_id: lst_id,
          }
        );
        this.note.list = lst_id;
        this.$refs.moveModal.hide();
        this.$root.$emit("hideWaitingModal");
      } catch (err) {
        this.$root.$emit("hideWaitingModal");

        let handler = new ResponseHandler();
        handler.handle(err, this);
      }
    },
    editNote() {
      let newText = this.$refs.editMessageTextArea.value;
      this.$emit("edit-note", this.note.id, newText);
      // this.$refs["editModal"].hide();
    },
    hideEditModal: function () {
      this.$refs["editModal"].hide();
    },
    pinMessage: async function (note_id) {
      try {
        this.$root.$emit("showWaitingModal", "در انتظار پاسخ سرور");
        const response = await this.$axios.$get(
          "/api/note/message/pin/" + note_id + "/",
          {}
        );
        this.$root.$emit("hideWaitingModal");
        this.$emit("pin", note_id);
      } catch (err) {
        this.$root.$emit("hideWaitingModal");

        let handler = new ResponseHandler();
        handler.handle(err, this);
      }
    },
    unPinMessage: async function (note_id) {
      try {
        this.$root.$emit("showWaitingModal", "در انتظار پاسخ سرور");
        const response = await this.$axios.$get(
          "/api/note/message/unpin/" + note_id + "/",
          {}
        );
        this.$root.$emit("hideWaitingModal");
        this.$emit("unpin", note_id);
      } catch (err) {
        this.$root.$emit("hideWaitingModal");

        let handler = new ResponseHandler();
        handler.handle(err, this);
      }
    },
    archiveMessage: async function (note_id) {
      try {
        this.$root.$emit("showWaitingModal", "در انتظار پاسخ سرور");
        const response = await this.$axios.$get(
          "/api/note/message/archive/" + note_id + "/",
          {}
        );
        this.$root.$emit("hideWaitingModal");
        this.$emit("archived", note_id);
      } catch (err) {
        this.$root.$emit("hideWaitingModal");

        let handler = new ResponseHandler();
        handler.handle(err, this);
      }
    },
    unArchiveMessage: async function (note_id) {
      try {
        this.$root.$emit("showWaitingModal", "در انتظار پاسخ سرور");
        const response = await this.$axios.$get(
          "/api/note/message/unarchive/" + note_id + "/",
          {}
        );
        this.$root.$emit("hideWaitingModal");
        this.$emit("unarchived", note_id);
      } catch (err) {
        this.$root.$emit("hideWaitingModal");

        let handler = new ResponseHandler();
        handler.handle(err, this);
      }
    },
    showEditModal() {
      this.$refs["editModal"].show();
      setTimeout(() => {
        this.updateTextAreaHeight(this.$refs.editMessageTextArea);

        this.$refs.editMessageTextArea.focus();
        let current = (this.$refs.editMessageTextArea.dir = this.isRTL(
          this.note.text
        )
          ? "rtl"
          : "ltr");
      }, 100);
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
        this.note.text.length > 30
          ? this.note.text.substring(0, 30) + " ..."
          : this.note.text;
      this.textInsideDeleteModal = textInModal;
      this.$refs["deleteModal"].show();
    },
    getListName() {
      for (const lst of this.$store.state.noteLists) {
        if (lst.id === this.note.list) {
          return lst.name;
        }
      }
      return "";
    },
    getListSlug() {
      for (const lst of this.$store.state.noteLists) {
        if (lst.id === this.note.list) {
          return lst.slug;
        }
      }

      return "";
    },
    handleEnter: function (e) {
      if (e.ctrlKey) {
        this.editNote();
      }
    },
  },
};
</script>

<style></style>
