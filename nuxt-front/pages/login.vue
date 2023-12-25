<template>
  <form @submit.prevent="loginUser(loginInfo)">
    <h4 class="text-right mb-4">ورود به حساب کاربری</h4>
    <div class="form-group">
      <username-input v-model="loginInfo.username"></username-input>
      <ValidationProvider rules="required" v-slot="{ errors }">
        <div class="py-2">
          <input
            type="password"
            class="form-control form-control-lg"
            id="password"
            placeholder="گذرواژه"
            :class="errors[0] ? 'is-invalid' : ''"
            v-model="loginInfo.password"
          />

          <div class="invalid-feedback text-right">{{ errors[0] }}</div>
        </div>
      </ValidationProvider>
    </div>
    <div class="d-flex w-100">
      <button type="submit" class="btn btn-primary btn-lg w-100">ورود</button>
    </div>
    <div class="d-flex pt-2 pb-0 mb-0">
      <span class="text-danger mt-2">{{ errorMessage }}</span>
    </div>

    <hr />

    <div class="d-flex py-2">
      <NuxtLink class="mx-2 text-secondary" to="/auth/forget-password"
        >فراموشی گذرواژه</NuxtLink
      >
      <NuxtLink class="mr-auto text-primary align-self-end" to="/signup"
        >برای عضویت کلیک کنید</NuxtLink
      >
    </div>
  </form>
</template>

<script>
import { ValidationProvider, extend } from "vee-validate";
import { required, regex } from "vee-validate/dist/rules";
import UsernameInput from "~/components/UsernameInput.vue";

extend("required", {
  message: "لطفا این فیلد را تکمیل کنید.",
});

export default {
  name: "Login",
  layout: "auth",
  components: {
    ValidationProvider,
    UsernameInput,
  },
  data: () => ({
    loginInfo: {
      username: "",
      password: "",
    },
    errorMessage: "",
  }),
  methods: {
    async loginUser(loginInfo) {

      try {
          console.log("before doing anything")
        let response = await this.$auth.loginWith("local", { data: loginInfo });
        console.log("response "+response.data)
        this.$router.push("/");
      } catch (err) {
        console.log("err is "+err)
        if (err.response && err.response.data && err.response.data.detail) {
          console.log(`error message : ${err.response.data.detail}`);

          this.errorMessage = err.response.data.detail;
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
