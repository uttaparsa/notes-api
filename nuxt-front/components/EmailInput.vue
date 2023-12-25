<template>
  <ValidationProvider rules="required|email" vid="email" v-slot="{ errors }">
    <input
      type="text"
      class="form-control form-control-lg"
      id="email"
      placeholder="ایمیل"
      :class="(errors[0] || serverErrors )? 'is-invalid' : ''"
      v-model="value"
      v-on:input="$emit('input', $event.target.value)"
    />

    <div class="invalid-feedback text-right">
      {{ errors[0] || serverErrors}}
    </div>
  </ValidationProvider>
</template>

<script>
import { ValidationProvider, extend } from "vee-validate";
import { required, email } from "vee-validate/dist/rules";

extend("email", email);
extend("required", required);

extend("email", {
  message: "فرمت ایمیل وارد شده صحیح نیست",
});

extend("required", {
  ...required,
  message: "لطفا این فیلد را تکمیل کنید",
});

export default {
  props: ["value", "serverErrors"],
  components: {
    ValidationProvider,
  },
};
</script>

<style>
</style>