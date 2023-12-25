<template>
  <ValidationObserver slot="{ invalid }" ref="formValidator">
    <form @submit.prevent="registerUser(userInfo)">
      <h4 class="text-right mb-4">ثبت نام</h4>
      <div class="form-group">
        <PhoneNumberInput
          v-model="userInfo.phone"
          :serverErrors="phoneServerErrors"
          v-slot="{ errors }"
        ></PhoneNumberInput>
        <div class="py-2">
          <EmailInput
            v-model="userInfo.email"
            :serverErrors="emailServerErrors"
          ></EmailInput>
        </div>

        <ValidationProvider
          rules="required|confirmed:confirmation"
          vid="password"
          v-slot="{ errors }"
        >
          <div class="py-2">
            <input
              type="password"
              class="form-control form-control-lg"
              id="password"
              placeholder="گذرواژه"
              :class="errors[0] ? 'is-invalid' : ''"
              v-model="userInfo.password"
            />

            <div class="invalid-feedback text-right">{{ errors[0] }}</div>
          </div>
        </ValidationProvider>
        <ValidationProvider
          rules="required"
          v-slot="{ errors }"
          vid="confirmation"
        >
          <div class="py-2">
            <input
              type="password"
              class="form-control form-control-lg"
              id="password_confirmation"
              placeholder="تکرار گذرواژه"
              :class="errors[0] ? 'is-invalid' : ''"
              v-model="userInfo.password_confirmation"
            />

            <div class="invalid-feedback text-right">{{ errors[0] }}</div>
          </div>
        </ValidationProvider>
        <div class="form-group">
          <div class="form-check text-right p-2">
            <input
              class="form-check-input"
              required
              type="checkbox"
              id="gridCheck"
            />
            <label class="form-check-label mr-4 text-secondary" for="gridCheck"
              >شرایط و قوانین را مطالعه کرده و می‌پذیرم</label
            >
          </div>
        </div>
      </div>

      <div class="d-flex">
        <button type="submit" class="btn btn-primary btn-lg w-100">
          ثبت نام
        </button>
      </div>

      <hr />

      <div class="d-flex py-2">
        <NuxtLink class="mr-auto text-primary align-self-end" to="/login"
          >برای ورود کلیک کنید</NuxtLink
        >
      </div>
    </form>
  </ValidationObserver>
</template>

<script>
import { ValidationProvider, extend, ValidationObserver } from "vee-validate";
import { required, regex, confirmed } from "vee-validate/dist/rules";

extend("confirmed", confirmed);

extend("required", {
  ...required,
  message: "لطفا این فیلد را تکمیل کنید",
});

extend("confirmed", {
  message: "فیلد رمز عبور با تکرار آن مطابقت ندارد",
});

export default {
  emits: ["confirm-code-sent"],
  components: {
    ValidationProvider,
    ValidationObserver,
  },
  data: () => ({
    userInfo: {
      phone: "",
      email: "",
      password: "",
      password_confirmation: "",
    },
    phoneServerErrors: "",
    emailServerErrors: "",
  }),
  watch: {
    // Note: only simple paths. Expressions are not supported.
    "userInfo.phone"(newValue) {
      this.phoneServerErrors = "";
    },
    "userInfo.email"(newValue) {
      this.emailServerErrors = "";
    },
  },
  methods: {
    async registerUser(userInfo) {
      try {
        userInfo.phone = this.getCleanedPhoneNumber(userInfo.phone);
        let response = await this.$axios.post("/identity/register/", userInfo);
        this.$emit("confirm-code-sent");
      } catch (err) {
        if (err.response) {
          if (err.response.status == 400) {
            this.$refs.formValidator.setErrors(err.response.data.field_errors);
            this.phoneServerErrors = err.response.data.field_errors.phone && err.response.data.field_errors.phone[0];
            this.emailServerErrors = err.response.data.field_errors.email && err.response.data.field_errors.email[0];
          }
        }
        let handler = new ResponseHandler()
        handler.handle(err,this)
      }
    },
  },
};
</script>

<style>
</style>
