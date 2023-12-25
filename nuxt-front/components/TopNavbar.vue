<template>
  <div>
      <b-navbar dir="ltr"  type="light" variant="primary">
        <b-navbar-brand href="/">Notes</b-navbar-brand>

        <b-navbar-toggle target="nav-collapse"></b-navbar-toggle>

        <b-collapse id="nav-collapse" is-nav v-if="this.$auth.loggedIn">
          <b-navbar-nav class=" navbar-light text-right">
            <li class="nav-item"><nuxt-link class="nav-link" to="/">Home</nuxt-link></li>
            <li class="nav-item"><nuxt-link class="nav-link" to="/list/">Notes</nuxt-link></li>
            <b-nav-item @click="logout()" >
              Logout
            </b-nav-item>
          </b-navbar-nav>

          <!-- Right aligned nav items -->
          <b-navbar-nav class="ml-auto"> </b-navbar-nav>
        </b-collapse>
      </b-navbar>
    </div>
</template>

<script>
export default {
  methods: {
    logout: async function () {
      this.$auth.strategies.local.reset();
      this.$router.push("/login");
    },
  }
}
</script>

<style>

</style>