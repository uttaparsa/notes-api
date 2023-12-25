<template>
  <div class="bg-dark h-100" style="min-height:100vh">
    <TopNavbar></TopNavbar>

      <!-- Page Content  -->
        <nuxt />
      <div v-if="showModal">
        <transition name="modal">
          <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-dialog modal-dialog-centered" role="document">
                  <div class="modal-content">
                    <div class="modal-header">
                      <h5 class="modal-title">{{modalTitle}}</h5>
                    </div>
                    <div class="modal-body d-flex">
                      <div
                        class="spinner-border mx-auto my-2 text-info"
                        role="status"
                        style="width: 8rem; height: 8rem"
                      >
                        <span class="sr-only">Loading...</span>
                      </div>
                    </div>
                  </div>
                </div>
            </div>
          </div>
        </transition>
      </div>
    </div>
  </div>
</template>

<script>
import TopNavbar from "~/components/TopNavbar.vue";

export default {
  components: {
    TopNavbar,
  },
  data() {
    return {
      sidebar: "",
      showModal: false,
      modalTitle: "در انتظار پاسخ سرور",
    };
  },
  methods: {
    toggleSidebar: function () {
      this.$refs.sidebar.classList.toggle("active");
      if (this.$refs.arrow.classList.contains("left")) {
        this.$refs.arrow.classList.remove("left");
        this.$refs.arrow.classList.add("right");
      } else {
        this.$refs.arrow.classList.remove("right");
        this.$refs.arrow.classList.add("left");
      }
    },
    logout: async function () {
      this.$auth.strategies.local.reset();
      this.$router.push("/login");
    },
    getLists: async function () {

      try {
        const response = await this.$axios.$get("/api/note/list/", {});
        function compare( a, b ) {
          if ( a.archived < b.archived ){
            return -1;
          }
          if ( a.archived > b.archived ){
            return 1;
          }
          return 0;
        }

        let topicsSorted = response.sort(compare)
        this.$store.commit('SET_NOTE_LISTS', response);

      } catch (err) {
        console.log(`err: ${err}`);
        let handler = new ResponseHandler();
        handler.handle(err, this);
      }
    },
  },
  mounted() {
    this.$root.$on("showWaitingModal", (title) => {
      this.showModal = true
      this.modalTitle = title

    });
    this.$root.$on("hideWaitingModal", () => this.showModal = false);
    this.$root.$on("updateNoteLists", () => {
      this.getLists();
    });
    this.getLists();
    
  },
};
</script>
<style lang="scss" scoped>
.arrow {
  border: solid white;
  border-width: 0 3px 3px 0;
  display: inline-block;
  padding: 3px;
  width: 20px;
  height: 20px;
}
.right {
  transform: rotate(-45deg);
  -webkit-transform: rotate(-45deg);
}
.left {
  transform: rotate(135deg);
  -webkit-transform: rotate(135deg);
}

.nav-link {
  color: lightgray;
}

.active .profile-brief {
  display: none;
}
.profile-brief {
  position: absolute;
  right: 50px;
  bottom: 30px;
  color: white;
}


.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, .5);
  display: table;
  transition: opacity .3s ease;
}

.modal-wrapper {
  display: table-cell;
  vertical-align: middle;
}

</style>