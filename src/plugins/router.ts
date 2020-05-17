import Vue from "vue";
import VueRouter from "vue-router";
import Camera from "../components/Camera.vue";
import Network from "../components/Network.vue";
import Settings from "../components/Settings.vue";

Vue.use(VueRouter);

export default new VueRouter({
  routes: [
    {
      path: "/",
      component: Camera,
      name: "camera",
      meta: { title: "Camera" }
    },
    {
      path: "/network/:tab?",
      component: Network,
      name: "network",
      meta: { title: "Network" },
      props: true
    },
    {
      path: "/settings/:section?",
      component: Settings,
      name: "settings",
      meta: { title: "Settings" },
      props: true
    }
  ]
});
