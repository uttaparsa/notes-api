<template>
  <div
    class="d-flex min-vh-100 justify-content-center align-items-center root-div"
  >
    <div class="background1 min-vh-100 min-vw-100"></div>
    <div class="card shadow-sm">
      <div class="card-body auth-card">
        <div class="d-flex justify-content-center   ">
          <div class="p-4"><nuxt /></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { ValidationProvider } from "vee-validate";
export default {
  name: "Login",
  components: {
    ValidationProvider,
  },
  data() {
    return {};
  },
};
</script>

<style >
body {
  height: 100%;
}

::-webkit-input-placeholder {
  text-align: right;
}
::-moz-placeholder {
  /* Firefox 19+ */
  text-align: right;
}

:-ms-input-placeholder {
  text-align: right;
}

.card {
  border: none;
}
.auth-card {
  display: inline-block;
  padding: 0;
  margin: 0;
  overflow: auto;
  max-width: 500px;
}

.auth-card img {
  width: 100%;
  max-width: 300px;
  min-width: 200px;
  object-fit: cover;
}

.background2 {
  background-image: url("/logo-img.png");
  background-repeat: no-repeat;
  background-position: center;
  background-size: contain, cover;
  filter: alpha(opacity=10);
  z-index: -2;
  position: absolute;
  opacity: 0.15;
}

.background1 {
  background-color: #fbfcfe;
  position: absolute;
  z-index: -3;
}
</style>
