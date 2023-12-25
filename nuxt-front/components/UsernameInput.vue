<template>
  <ValidationProvider rules="required" vid="username" v-slot="{ errors }">
    <input
      type="text"
      class="form-control form-control-lg"
      id="username"
      placeholder="نام کاربری"
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
import { required,} from "vee-validate/dist/rules";

extend("required", required);


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