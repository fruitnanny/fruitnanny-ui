import Vue from "vue";
import { NotifyPlugin } from "./plugins/notify";

declare module "vue/types/vue" {
  interface Vue {
    $notify: NotifyPlugin;
  }
}

declare module "vue/types/options" {
  interface ComponentOptions<V extends Vue> {
    notify?: NotifyPlugin;
  }
}
