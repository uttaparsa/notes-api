<template>
  <div>

    <div class="container" dir="ltr">
      <b-pagination
        v-model="currentPage"
        :total-rows="totalCount"
        :per-page="perPage"
        aria-controls="notesListt"
        class="mt-3"
        align="center"
        @input="getRecords()"
      ></b-pagination>

      <NoteList
        @refresh="getRecords()"
        :notes="notes"
        :isBusy="isBusy"
        ref="noteList"
        :hideEdits="true"
        :showArchived="showArchived"
      ></NoteList>
    </div>

  </div>
</template>

<script>
export default {
  props: ["notes"],
  data() {
    return {
      notes: "",
      totalCount: 0,
      perPage: 20,
      currentPage: 1,
      isBusy: true,
       date: ""
    };
  },
    methods: {
    getRecords: async function (date = null) {
      console.log("getting records!");
      this.isBusy = true;
      try {
        let url = "/api/note/pp/";
        const response = await this.$axios.$get(url, {
          params: {
            page: this.currentPage,
            date: date,
          },
        });

        console.log("results  "+response.results);

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
