require("dotenv").config();



export default {
  // Disable server-side rendering: https://go.nuxtjs.dev/ssr-mode
  ssr: false,

  // Target: https://go.nuxtjs.dev/config-target
  target: "static",

  // Global page headers: https://go.nuxtjs.dev/config-head
  head: {
    title: "Notes",
    htmlAttrs: {
      lang: "fa",
      dir: "rtl",
    },
    meta: [
      { charset: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { hid: "description", name: "description", content: "" },
      { name: "format-detection", content: "telephone=no" },

      { hid: 'og-type', property: 'og:type', content: 'website' },
      { hid: 'og-title', property: 'og:title', content: "Notes" },
      { hid: 'og-desc', property: 'og:description', content: "Notes" },

    ],
    link: [{ rel: "icon", type: "image/x-icon", href: "/favicon.ico" }],
  },

  // Global CSS: https://go.nuxtjs.dev/config-css
  css: [
    "@/assets/fonts/Vazir.css",
    "@/assets/css/styles.scss",
  ],



  loadingIndicator: {
    name: "circle",
    color: "#3B8070",
    background: "white",
  },

  // Plugins to run before rendering page: https://go.nuxtjs.dev/config-plugins
  plugins: [
    "~/plugins/vee-validate.js",
    "~/plugins/mixins.js",
    "~/plugins/filters.js",
  ],

  // Auto import components: https://go.nuxtjs.dev/config-components
  components: true,

  // Modules for dev and build (recommended): https://go.nuxtjs.dev/config-modules
  buildModules: ["@nuxtjs/dotenv"],

  // Modules: https://go.nuxtjs.dev/config-modules
  modules: [
    // https://go.nuxtjs.dev/bootstrap
    "bootstrap-vue/nuxt",
    // https://go.nuxtjs.dev/axios
    "@nuxtjs/axios",
    "@nuxtjs/auth-next",
    '@nuxtjs/proxy'
  ],

  bootstrapVue: {
    // bootstrapCSS: false, // Or `css: false`
    // bootstrapVueCSS: false,
    componentPlugins: [
      'ToastPlugin',
      'NavbarPlugin',
      'FormDatepickerPlugin',
      'FormCheckboxPlugin'
    ],
    components: ['BPagination', 'BTable', 'BFormTextarea', 	'BFormText', 'BModal', 'BFormGroup', 'BCardGroup' , 'BNavbar', 'BNavbarNav', 'BFormInput', 'BFormFile', 'BProgress', 'BSpinner'],
    directives: ['VBModal']
  },

  // Axios module configuration: https://go.nuxtjs.dev/config-axios
  axios: {
    // Workaround to avoid enforcing hard-coded localhost:3000: https://github.com/nuxt-community/axios-module/issues/308
    baseURL: process.env.BASE_URL,
    headers: {
      common: {
        "Accept-Language": "fa",
      },
    },
    proxy: true
  },

  // proxy: {
  //   '/api': {
  //     target: 'http://localhost:3000',
  //     changeOrigin: true,
  //     pathRewrite: { '^/api': '/' },
  //   },
  // },
  // proxy: {
  //   "/api": "http://localhost:8000"
  // },
  proxy: {
    '/api/': { target: 'http://localhost:8000/', pathRewrite: {'^/api/': '/api/'}, changeOrigin: true }
  },

  auth: {
    strategies: {
      local: {
        scheme: 'refresh',
        token: {
          property: 'access',
          maxAge: 24*3600,
          global: true,
        },
        refreshToken: {
          property: 'refresh',
          data: 'refresh',
          maxAge: 7*24*3600
        },
        user: {
          property: false,
        },
        endpoints: {
          login: { url: '/api/token/', method: 'post' },
          refresh: { url: '/api/token/refresh/', method: 'post' },
          logout: { url: '/api/identity/logout/', method: 'post' },
          user: {
            url: '/api/account/profile/',
            method: 'get',
            propertyName: false,
          },
        },
      },
    },
  },

  // Build Configuration: https://go.nuxtjs.dev/config-build
  build: {
    transpile: ["vee-validate/dist/rules"],
    extractCSS: true,
  },
};
