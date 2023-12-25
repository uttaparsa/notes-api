<template>
  <div class="d-flex align-items-center flex-column pt-4 h-100">
    <form @submit.prevent="sendToken(phone)">
      <div class="form-group">
        <PhoneNumberInput v-model="phone"></PhoneNumberInput>
      </div>
      <div class="text-right">
        <button class="btn btn-primary" type="submit">تایید</button>
        <nuxt-link class="btn btn-secondary" to="/login">بازگشت</nuxt-link>
      </div>
    </form>
  </div>
</template>

<script>
export default {
  emits: ["confirm-code-sent"],
  data: () => ({
    phone: "",
  }),
  methods: {
    async sendToken(phone) {
      try {
        let cleanedPhone = this.getCleanedPhoneNumber(phone);
        let response = await this.$axios.post("/identity/forget-password/", {
          phone: cleanedPhone,
        });
        console.log(response.data);
        this.$emit("confirm-code-sent");
      } catch (err) {
        if (err.response.status == 406) {
          this.$bvToast.toast(`حساب کاربری مورد نظر یافت نشد`, {
            title: "خطا",
            autoHideDelay: 5000,
            variant: "danger",
            toaster: "b-toaster-top-left",
          });
        }
        let handler = new ResponseHandler();
        handler.handle(err, this);
      }
    },
  },
};
</script>

<style>
</style>