<template>
  <div dir="ltr" class="bg-dark">
    <form @submit.prevent="sendSearch">
      <nav class="navbar navbar-dark bg-info py-1">
        <div class="container px-0" dir="auto">
          <div
            class="d-flex row justify-content-center w-100 px-0 px-lg-5 mx-0"
          >
            <div class="col-10 d-flex flex-row px-0 px-lg-5">
              <div class="input-group">
                <input
                  dir="auto"
                  class="rounded form-control"
                  :placeholder="'Search in ' + listSlug"
                  type="text"
                  v-model="searchText"
                />
                <div class="input-group-append">
                  <button type="submit" class="input-group-text">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="16"
                      height="16"
                      fill="currentColor"
                      class="bi bi-search"
                      viewBox="0 0 16 16"
                    >
                      <path
                        d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a1.007 1.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>
    </form>
    <div class="container" dir="ltr">
      <b-pagination
        v-model="currentPage"
        :total-rows="totalCount"
        :per-page="perPage"
        aria-controls="notesListt"
        class="mt-3"
        align="center"
        @input="getRecords($route.query.q)"
      ></b-pagination>
  <b-form-checkbox
      id="checkbox-1"
      v-model="showArchived"
      name="checkbox-1"
      value="show"
      :unchecked-value="false"
      class="text-light"
    >
      Show Archived
    </b-form-checkbox>
      <NoteList :notes="notes" :isBusy="isBusy" :showArchived="showArchived" ref="noteList"></NoteList>
    </div>
  </div>
</template>

<script>
export default {
  layout: "default",
  middleware: ["auth"],
  data() {
    return {
      searchText: "",
      notes: "",
      totalCount: 0,
      perPage: 20,
      currentPage: 1,
      isBusy: false,
      showArchived: false,
    };
  },
  methods: {
    getRecords: async function (query, list_slug = false) {
      console.log("getting records for " + query);
      this.isBusy = true;
      try {
        let url = "/api/note/search/?q=" + query;
        if (list_slug) {
          url += "&list_slug=" + this.$route.query.list_slug;
        }

        const response = await this.$axios.$get(url, {
          params: {
            page: this.currentPage,
          },
        });

        this.notes = response.results;

        this.totalCount = response.count;
        this.isBusy = false;
      } catch (err) {
        console.log(`err: ${err}`);
        let handler = new ResponseHandler();
        handler.handle(err, this);
      }
    },
    sendSearch() {
      let url = "/search/?q=" + this.searchText;
      if (this.$route.query.list_slug) {
        url += "&list_slug=" + this.$route.query.list_slug;
      }
      this.$router.push(url);
      this.getRecords(this.searchText);
      if (this.$route.query.list_slug) {
        this.getRecords(this.searchText, this.$route.query.list_slug);
      } else {
        this.getRecords(this.searchText);
      }
    },
  },
  mounted() {
    if (this.$route.query.list_slug) {
      this.getRecords(this.$route.query.q, this.$route.query.list_slug);
    } else {
      this.getRecords(this.$route.query.q);
    }
  },
  computed: {
    // a computed getter
    listSlug() {
      // `this` points to the component instance
      return this.$route.query.list_slug ? this.$route.query.list_slug : "All";
    },
  },
};
</script>

<style></style>
