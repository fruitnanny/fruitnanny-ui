import Vue from "vue";
import VueRouter from "vue-router";
import Camera from "../components/Camera.vue";
import Settings from "../components/Settings.vue";

Vue.use(VueRouter);

export default new VueRouter({
  routes: [
    { path: "/", component: Camera, name: "camera" },
    { path: "/settings", component: Settings, name: "settings" }
  ]
});
