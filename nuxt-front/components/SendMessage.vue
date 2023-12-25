<template>
  <span dir="ltr">
    <div v-if="file !== null" style="position: fixed; bottom: 45px; left: 0;width: 100vw;background-color: #765285; height: 35px;" id="status-bar-bottom">
      <div class="d-flex text-light px-2" >
          <div class="d-flex py-1">
               You've attached {{file.name}}
          </div>
          <div id="uploadPreview" class="mx-2" style="width:30px; height:35px">
        </div>
        <button type="button" class="ml-2 close" aria-label="Close" @click="clearFile()">
          <span aria-hidden="true">&times;</span>
        </button>
        </div>

</div>
    <div
      style="
        position: fixed;
        bottom: 45px;
        left: 0;
        display: none;
        width: 100vw;
        background-color: #765285;
        height: 35px;
      "
      id="status-bar-bottom"
    >
      <div class="d-flex text-light px-2">
        <div class="d-flex py-1">You've attached an image</div>
        <div
          id="uploadPreview"
          class="mx-2"
          style="width: 30px; height: 35px"
        ></div>
        <button
          type="button"
          class="ml-2 close"
          aria-label="Close"
          onclick="hideStatusBarBottom()"
        >
          <span aria-hidden="true">&times;</span>
        </button>
      </div>
    </div>
    <div
      style="
        position: fixed;
        bottom: 0;
        left: 0;
        display: block;
        width: 100vw;
        background-color: gray;
        height: 45px;
      "
    >
      <form @submit.prevent="sendMessage()">
        <div class="d-flex">
          <textarea
            id="message_text"
            dir="auto"
            placeholder="Say something..."
            class="form-control"
            rows="1"
            v-model="text"
            name="message_text"
            @keydown.enter="handleEnter"
          ></textarea>
          <input type="hidden" name="replyTo" id="replyTo" value="" />
          <button
            type="button"
            class="btn btn-outline-light h-80 px-1 shadow-none"
            @click="$refs.imagepicker.click()"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              fill="currentColor"
              class="bi bi-paperclip"
              viewBox="0 0 16 16"
            >
              <path
                d="M4.5 3a2.5 2.5 0 0 1 5 0v9a1.5 1.5 0 0 1-3 0V5a.5.5 0 0 1 1 0v7a.5.5 0 0 0 1 0V3a1.5 1.5 0 1 0-3 0v9a2.5 2.5 0 0 0 5 0V5a.5.5 0 0 1 1 0v7a3.5 3.5 0 1 1-7 0V3z"
              />
            </svg>
          </button>
          
          <input
            class="d-none"
            type="file"
            ref="imagepicker"
            name="image"
            @change="handleInput"
          />

          <button type="submit" class="btn btn-primary mr-2 ml-1">Send</button>
        </div>
      </form>
    </div>
  </span>
</template>

<script>
export default {
  props: ["listSlug"],
  emits: ["note-saved"],
  data() {
    return {
      text: "",
      file: null
    };
  },
  methods: {
    handleEnter: function (e) {
      if (e.ctrlKey) {
        this.sendMessage();
      }
    },
    sendMessage: async function () {
      this.$root.$emit("showWaitingModal", "در انتظار پاسخ سرور");

      try {

        const obj = {
          text: this.text,
        };
        const json = JSON.stringify(obj);
        const blob = new Blob([json], {
          type: 'application/json'
        });
        const data = new FormData();
        data.append("meta", blob);
        if(this.file === null){
          console.log("no file selected");
        }else{
          data.append("file", this.file);
          console.log("file selected");
          
        }

        let url = "/api/note/";
        if (this.listSlug.length >= 0) {
          url += this.listSlug + "/";
        }
        let response = await this.$axios.post(url, data);
        this.text = "";
        this.file = null;
        this.$emit("note-saved", response.data);
      } catch (err) {
        let handler = new ResponseHandler();
        handler.handle(err, this);
      }

      this.$root.$emit("hideWaitingModal");
    },
    handleInput: async function(e){
      this.file = e.target.files[0]
    },
    clearFile: function (){
      this.file = null;
    }
  },
};
</script>

<style></style>
