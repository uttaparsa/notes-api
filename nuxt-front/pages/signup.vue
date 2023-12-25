<template>
  <div>
    <SignUpForm
      v-if="!signupFormFinished"
      @confirm-code-sent="signupFormFinished = true"
    ></SignUpForm>
    <SignupConfirmationForm
      @cancel="signupFormFinished = false"
      v-else
    ></SignupConfirmationForm>
  </div>
</template>

<script>
import { ValidationProvider, extend } from "vee-validate";
import { required, email, regex } from "vee-validate/dist/rules";
import SignUpForm from "~/components/SignUpForm.vue";
import SignupConfirmationForm from "~/components/SignupConfirmationForm.vue";

export default {
  layout: "auth",
  components: {
    ValidationProvider,
    SignUpForm,
    SignupConfirmationForm,
  },
  data: () => ({
    signupFormFinished: false,
  }),
};
</script>

<style>
</style>
