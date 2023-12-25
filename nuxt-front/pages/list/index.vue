<template>
  <div class="container">
    <div class="py-4">
      <span
        v-for="(lst,lst_idx) in $store.state.noteLists"
        :key="lst.id"
      >
      <div v-if="lst_idx > 0 && lst_idx < ($store.state.noteLists.length -1) && lst.archived !== $store.state.noteLists[lst_idx - 1].archived">
        <hr />
      </div>
        <li
          class="list-group-item text-light rounded d-flex"
          style="background-color: gray"
          dir="ltr"
        >
          <div class="d-flex flex-row align-items-center"> <nuxt-link class="text-dark" :to="'/list/' + lst.slug + '/'" >{{ lst.name }}</nuxt-link></div>

          <div class="ml-auto">
            <button v-if="lst.archived" @click="unArchiveTopic(lst.id)" class="btn btn-sm">UnArchive</button>
            <button v-if="!lst.archived" @click="archiveTopic(lst.id)" class="btn btn-sm">Archive</button>
            <button class="btn btn-info btn-sm">rename</button>
          </div>
        </li>
      </span>
    </div>

    <div
      class="modal fade"
      id="exampleModal"
      tabindex="-1"
      role="dialog"
      aria-labelledby="exampleModalLabel"
      aria-hidden="true"
    >
      <div class="modal-dialog" role="document">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title" id="exampleModalLabel">ایجاد لیست جدید</h5>
            <button
              type="button"
              class="close"
              data-dismiss="modal"
              aria-label="Close"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <form id="createList" action="{% url 'store-list' %}" method="POST">
            {% csrf_token %}
            <div class="modal-body">
              <div class="form-group d-flex flex-column">
                <label
                  for="recipient-name"
                  class="col-form-label align-self-start"
                  >نام لیست</label
                >
                <input
                  type="text"
                  class="form-control"
                  id="recipient-name"
                  for="createList"
                  name="list_name"
                />
              </div>
            </div>
            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-secondary"
                data-dismiss="modal"
              >
                لغو
              </button>

              <button type="submit" for="createList" class="btn btn-primary">
                ایجاد
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <b-modal
      ref="create-list-modal"
      title="ایجاد لیست جدید"
      @ok="sendNewListName"
    >
      <div class="form-group d-flex flex-column">
        <label for="recipient-name" class="col-form-label align-self-start"
          >نام لیست</label
        >
        <input class="form-control" v-model="newListName" />
      </div>
    </b-modal>

    <div class="text-center m-4">
      <button
        @click="showModal()"
        type="button"
        class="btn btn-primary p-3"
        id="CreateNewList"
      >
        ایجاد لیست جدید
      </button>
    </div>
  </div>
</template>

<script>
export default {
  layout: "default",
  middleware: ["auth"],
  data() {
    return {
      // noteLists: [],
      text: "",
      newListName: "",
    };
  },
  methods: {
    archiveTopic: async function (topicId) {
      try {
        this.$root.$emit("showWaitingModal", "در انتظار پاسخ سرور");
        const response = await this.$axios.$get(
          "/api/note/list/archive/" + topicId + "/",
          {}
        );
        this.$root.$emit("hideWaitingModal");
      } catch (err) {
        this.$root.$emit("hideWaitingModal");

        let handler = new ResponseHandler();
        handler.handle(err, this);
      }
    },
    unArchiveTopic: async function (topicId) {
      try {
        this.$root.$emit("showWaitingModal", "در انتظار پاسخ سرور");
        const response = await this.$axios.$get(
          "/api/note/list/unarchive/" + topicId + "/",
          {}
        );
        this.$root.$emit("hideWaitingModal");
      } catch (err) {
        this.$root.$emit("hideWaitingModal");

        let handler = new ResponseHandler();
        handler.handle(err, this);
      }
    },
    sendNewListName: async function () {
      let response = await this.$axios.post("/api/note/list/", {
        name: this.newListName,
      });
      // this.noteLists.unshift(response.data);
      this.$root.$emit("updateNoteLists");
      this.$refs["create-list-modal"].hide();
    },
    showModal() {
      this.$refs["create-list-modal"].show();
    },
  },
  mounted: function () {
    this.$root.$emit("updateNoteLists");
  },
};
</script>

<style></style>
