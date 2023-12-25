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
                  :placeholder="'Search in '+slug "
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

     <div dir="ltr">
      <b-pagination
        v-model="currentPage"
        :total-rows="totalCount"
        :per-page="perPage"
        aria-controls="notesListt"
        align="center"
        class="mt-3"
        @input="getRecords()"
        use-router
      ></b-pagination>

      <div class="d-flex row m-0 p-0">
        <div class="col-lg-2 mx-0 mb-3 mb-lg-0">
          <label class="text-light" for="example-datepicker"
            >Show messages for</label
          >
          <b-form-datepicker
            id="example-datepicker"
            v-model="date"
            @input="showMessagesForDate"
          ></b-form-datepicker>
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
        </div>
        

        <div class="col-lg-8 mx-0 px-3 px-lg-0" dir="ltr">
          <NoteList
            @refresh="getRecords()"
            :notes="notes"
            :isBusy="isBusy"
            ref="noteList"
            :showArchived.sync="showArchived"
          ></NoteList>
        </div>

        <div class="col-lg-2"></div>
      </div>
      
    </div>
    <SendMessage @note-saved="addNewNote" :listSlug="slug"></SendMessage>
  </div>
</template>

<script>
export default {
    layout: "default",
  middleware: ["auth"],
  async asyncData({ params }) {
    const slug = params.slug; // When calling /abc the slug will be "abc"
    // this.listSlug = slug
    return { slug };
  },
  data(){
    return {
      searchText: "",
      notes: "",
      totalCount: 0,
      perPage: 20,
      currentPage: 1,
      isBusy: true,
      date: "",
      showArchived: false,
    }
  },
  methods: {
    addNewNote: function (note) {
      this.$refs.noteList.addNewNote(note);
    },
    sendSearch() {
      this.$router.push("/search/?q=" + this.searchText + "&list_slug="+this.slug);
    },
     showMessagesForDate(date) {
      console.log("showing messages for date " + date);
      this.getRecords(date);
    },
    getRecords: async function (date = null) {
      console.log("getting records!");
      this.isBusy = true;
      try {
        let url = "/api/note/";
        url += this.slug + "/";
        const response = await this.$axios.$get(url, {
          params: {
            page: this.currentPage,
            date: date,
          },
        });

        if(date != null){
          if (response.next !== null) {
            let all = response.next.split("=");
            let nextPage = parseInt(all[all.length - 1]);
            this.currentPage = nextPage - 1;
            console.log("nextPage is " + nextPage);
          } else if (response.previous !== null) {
            let all = response.previous.split("=");
            let nextPage = parseInt(all[all.length - 1]);
            console.log("nextPage is " + nextPage);
            this.currentPage = nextPage + 1;
          }
        }
      
        // if (response.next !== null) {
        //   let all = response.next.split("=");
        //   let nextPage = parseInt(all[all.length - 1]);
        //   this.currentPage = nextPage - 1;
        //   console.log("nextPage is " + nextPage);
        // } else if (response.previous !== null) {
        //   let all = response.previous.split("=");
        //   let nextPage = parseInt(all[all.length - 1]);
        //   console.log("nextPage is " + nextPage);
          
        //   if(isNaN(nextPage)){
        //     this.currentPage +=1;
        //   }else{
        //     this.currentPage = nextPage + 1;
        //   }
        // }

        this.notes = response.results;

        for (const element of this.notes) {
          element["created_date"] = Date.parse(element["created_date"]);
        }

        this.totalCount = response.count;
        this.isBusy = false;
      } catch (err) {
        console.log(`err: ${err}`);
        let handler = new ResponseHandler();
        handler.handle(err, this);
      }
    },
    mounted() {
      this.getRecords();
    },
  },
};
</script>

<style></style>
