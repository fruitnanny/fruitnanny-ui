import Vue from "vue";
import Vuetify from "vuetify/lib";
import { readDarkMode } from "../settings";

Vue.use(Vuetify);

export default new Vuetify({
  theme: {
    dark: readDarkMode(),
    themes: {
      light: {
        primary: "#82B1FF",
        secondary: "#424242",
        accent: "#EE44AA",
        error: "#FF5252",
        info: "#2196F3",
        success: "#4CAF50",
        warning: "#FFC107"
      }
    }
  }
});
