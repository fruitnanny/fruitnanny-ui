import Vue from "vue";
import App from "./App.vue";
import vuetify from "./plugins/vuetify";
import router from "./plugins/router";
import "roboto-fontface/css/roboto/roboto-fontface.css";
import "@mdi/font/css/materialdesignicons.css";
// import "roboto-fontface/css/roboto/sass/roboto-fontface.scss";
// import "@mdi/font/scss/materialdesignicons.scss "

Vue.config.productionTip = false;

const app = new Vue({
  router,
  vuetify,
  render: h => h(App)
}).$mount("#app");
