<template>
  <form @submit.prevent="sendResetPasswordData(resetPasswordData)">
    <span class="h6 mb-3 d-block text-secondary text-right"
      >تغییر رمز عبور</span
    >
    <div class="form-group ">
      <ValidationProvider rules="required" v-slot="{ errors }">
        <input
          type="number"
          class="form-control"
          size="50"
          placeholder="کد تایید"
          :class="errors[0] ? 'is-invalid' : ''"
          v-model="resetPasswordData.token"
        />
        <div class="invalid-feedback text-right">{{ errors[0] }}</div>
      </ValidationProvider>
    </div>

    <div class="py-3 form-group">
      <ValidationProvider
        rules="required|confirmed:confirmation"
        v-slot="{ errors }"
      >
        <input
          type="password"
          class="form-control"
          size="50"
          placeholder="گذرواژه جدید"
          :class="errors[0] ? 'is-invalid' : ''"
          v-model="resetPasswordData.password"
        />

        <div class="invalid-feedback text-right">{{ errors[0] }}</div>
      </ValidationProvider>
    </div>

    <div class="form-group">
      <ValidationProvider
        rules="required"
        v-slot="{ errors }"
        vid="confirmation"
      >
        <input
          type="password"
          class="form-control"
          size="50"
          id="password_confirmation"
          placeholder="تکرار گذرواژه جدید"
          :class="errors[0] ? 'is-invalid' : ''"
          v-model="resetPasswordData.password_confirmation"
        />

        <div class="invalid-feedback text-right">{{ errors[0] }}</div>
      </ValidationProvider>
    </div>

    <div class="d-flex pb-3">
      <span class="text-danger" v-if="errors">{{ errors[0] }}</span>
    </div>
    <div class="d-flex align-items-right">
      <button class="btn btn-primary" type="submit">ارسال</button>
      <button @click="$emit('cancel')" class="btn btn-light mx-2" type="button">
        لغو
      </button>
    </div>
    <b-modal
      ref="confirmedModal"
      id="confirmedModal"
      class="text-right"
      title="تغییر رمز عبور با موفقیت انجام شد"
      hide-header-close
      ok-only
      ok-title="انتقال به صفحه ورود"
      @ok="$router.push('/login')"
      >تغییر رمز عبور با موفقیت انجام شد، تا چند ثانیه دیگر به صفحه ورود منتقل
      می‌شوید</b-modal
    >
  </form>
</template>

<script>
import { ValidationProvider, extend } from "vee-validate";
import { required, confirmed } from "vee-validate/dist/rules";
extend("confirmed", confirmed);
extend("required", required);

extend("confirmed", {
  message: "فیلد رمز عبور با تکرار آن همخوانی ندارد",
});

export default {
  emits: ["cancel"],
  components: {
    ValidationProvider,
  },
  data: () => ({
    resetPasswordData: {
      token: "",
      password: "",
      password_confirmation: "",
    },
    errors: null,
  }),
  methods: {
    async sendResetPasswordData(resetPasswordData) {
      try {
        let response = await this.$axios.post(
          "/identity/forget-password/verify/",
          resetPasswordData
        );
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