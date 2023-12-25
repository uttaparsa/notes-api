<template>
  <div class="d-flex justify-content-center flex-column">
    <form id="confirmationCodeForm" @submit.prevent="sendEnteredCode(code)">
      <span class="h6 text-secondary mb-4 d-block" >لطفا کد ارسال شده را در این بخش وارد کنید:</span>
      <div class="form-group">
        <input
          class="form-control"
          placeholder="کد تایید ثبت نام"
          type="number"
          name="ota"
          id="ota"
          v-model="code"
        />
      </div>
      <div class="d-flex pb-3">
        <span class="text-danger" v-if="errors">{{ errors[0] }}</span>
      </div>
      <div class="d-flex align-items-right">
        <button class="btn btn-primary" type="submit">ارسال</button>
        <button
          @click="$emit('cancel')"
          class="btn btn-light mx-2"
          type="button"
        >
          لغو
        </button>
      </div>
      <b-modal
        ref="confirmedModal"
        id="confirmedModal"
        class="text-right"
        title="ثبت نام با موفقیت انجام شد"
        hide-header-close
        ok-only
        ok-title="انتقال به صفحه ورود"
        @ok="$router.push('/login')"
        >ثبت نام شما با موفقیت انجام شد. تا چند ثانیه دیگر به صفحه ورود منتقل می‌شوید</b-modal
      >
    </form>
  </div>
</template>

<script>
export default {
  emits: ["cancel"],
  data: () => ({
    code: "",
    errors: null,
  }),
  methods: {
    async sendEnteredCode(code) {
      try {
        let response = await this.$axios.post("/identity/register/verify/", {
          token: code,
        });
        this.$refs["confirmedModal"].show();
        const myTimeout = setTimeout(() => {
          this.$router.push("/login");
        }, 10000);
      } catch (err) {
        if (err.response) {
          this.errors = err.response.data.errors;
        } 
        let handler = new ResponseHandler()
        handler.handle(err,this)
      }
    },
  },
};
</script>

<style scoped>
/* Chrome, Safari, Edge, Opera */
input::-webkit-outer-spin-button,
input::-webkit-inner-spin-button {
  -webkit-appearance: none;
  margin: 0;
}

/* Firefox */
input[type="number"] {
  -moz-appearance: textfield;
}

input {
  max-width: 80%;
}
</style>