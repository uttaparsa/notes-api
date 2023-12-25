<template>
  <ForgetPasswordForm
    v-if="!tokenSent"
    @confirm-code-sent="tokenSent = true"
  ></ForgetPasswordForm>
  <ForgetPasswordConfirmationForm
    @cancel="tokenSent = false"
    v-else
  ></ForgetPasswordConfirmationForm>
</template>

<script>
import ForgetPasswordForm from "~/components/ForgetPasswordForm.vue";
import ForgetPasswordConfirmationForm from "~/components/ForgetPasswordConfirmationForm.vue";

export default {
  layout: "auth",
  components: {
    ForgetPasswordForm,
    ForgetPasswordConfirmationForm,
  },
  data: () => ({
    tokenSent: false,
  }),
};
</script>

<style>
</style>