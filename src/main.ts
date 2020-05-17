import Vue from "vue";
import App from "./App.vue";
import vuetify from "./plugins/vuetify";
import router from "./plugins/router";
import notify from "./plugins/notify";
import "roboto-fontface/css/roboto/roboto-fontface.css";
import "@mdi/font/css/materialdesignicons.css";
// import "roboto-fontface/css/roboto/sass/roboto-fontface.scss";
// import "@mdi/font/scss/materialdesignicons.scss "
import { makeServer } from "./server";

Vue.config.productionTip = false;

// Update document title
router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title} • FruitNanny`;
  next();
});

if (process.env.NODE_ENV === "development") {
  makeServer();
}

const app = new Vue({
  router,
  vuetify,
  notify,
  render: h => h(App)
}).$mount("#app");
