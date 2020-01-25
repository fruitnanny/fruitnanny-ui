<template>
  <v-app id="inspire">
    <!-- <v-navigation-drawer
      v-model="drawer"
      :clipped="$vuetify.breakpoint.lgAndUp"
      app
    >
      <v-list>
        <template v-for="item in items">
          <v-row v-if="item.heading" :key="item.heading" align="center">
            <v-col cols="6">
              <v-subheader v-if="item.heading">
                {{ item.heading }}
              </v-subheader>
            </v-col>
            <v-col cols="6" class="text-center">
              <a href="#!" class="body-2 black--text">EDIT</a>
            </v-col>
          </v-row>
          <v-list-group
            v-else-if="item.children"
            :key="item.text"
            v-model="item.model"
            :prepend-icon="item.model ? item.icon : item['icon-alt']"
            append-icon=""
          >
            <template v-slot:activator>
              <v-list-item>
                <v-list-item-content>
                  <v-list-item-title>
                    {{ item.text }}
                  </v-list-item-title>
                </v-list-item-content>
              </v-list-item>
            </template>
            <v-list-item v-for="(child, i) in item.children" :key="i" link>
              <v-list-item-action v-if="child.icon">
                <v-icon>{{ child.icon }}</v-icon>
              </v-list-item-action>
              <v-list-item-content>
                <v-list-item-title>
                  {{ child.text }}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list-group>
          <v-list-item
            v-else
            :key="item.text"
            link
            :to="item.to"
            :exact="item.exact"
            color="blue"
          >
            <v-list-item-action>
              <v-icon>{{ item.icon }}</v-icon>
            </v-list-item-action>
            <v-list-item-content>
              <v-list-item-title>
                {{ item.text }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </template>
      </v-list>
    </v-navigation-drawer> -->

    <v-app-bar
      :clipped-left="$vuetify.breakpoint.lgAndUp"
      app
      color="blue darken-3"
      dark
    >
      <!-- <v-app-bar-nav-icon @click.stop="drawer = !drawer" /> -->
      <v-toolbar-title style="width: 300px" class="ml-0 pl-4">
        FruitNanny
      </v-toolbar-title>
      <!-- <v-text-field
        flat
        solo-inverted
        hide-details
        prepend-inner-icon="mdi-magnify"
        label="Search"
        class="hidden-sm-and-down"
      /> -->
      <v-spacer />
      <!-- <v-btn icon>
        <v-icon>mdi-apps</v-icon>
      </v-btn> -->
      <!-- <v-btn icon>
        <v-icon>mdi-camera-iris</v-icon>
      </v-btn> -->

      <v-btn
        v-if="$vuetify.theme.dark"
        fab
        small
        color="pink"
        :dark="false"
        @click="$vuetify.theme.dark = !$vuetify.theme.dark"
      >
        <v-icon>mdi-moon-waxing-crescent</v-icon>
      </v-btn>
      <v-btn
        v-else
        fab
        small
        color="blue"
        @click="$vuetify.theme.dark = !$vuetify.theme.dark"
      >
        <v-icon>mdi-white-balance-sunny</v-icon>
      </v-btn>

      <v-btn icon href="https://github.com/f3anaro/fruitnanny">
        <v-icon>mdi-github-circle</v-icon>
      </v-btn>

      <!-- <v-btn icon large>
        <v-avatar size="32px" item>
          <v-img
            src="https://cdn.vuetifyjs.com/images/logos/logo.svg"
            alt="Vuetify"
        /></v-avatar>
      </v-btn> -->
    </v-app-bar>
    <v-content>
      <router-view></router-view>
    </v-content>

    <!-- <v-bottom-navigation fixed>
      <v-btn value="recent">
        <span>Recent</span>
        <v-icon>mdi-history</v-icon>
      </v-btn>

      <v-btn value="favorites">
        <span>Favorites</span>
        <v-icon>mdi-heart</v-icon>
      </v-btn>

      <v-btn value="nearby">
        <span>Nearby</span>
        <v-icon>mdi-map-marker</v-icon>
      </v-btn>
    </v-bottom-navigation> -->
  </v-app>
</template>

<script language="ts">
import Vue from "vue";
import Component from "vue-class-component";

@Component({
  props: {
    source: String
  }
})
export default class App extends Vue {
  dialog = false;
  drawer = null;
  items = [
    {
      icon: "mdi-video-wireless",
      text: "Camera",
      to: { name: "camera" },
      exact: true
    },
    // { icon: "mdi-camera-iris", text: "Camera" },
    // { icon: "mdi-history", text: "Frequently contacted" },
    // { icon: "mdi-content-copy", text: "Duplicates" },
    // {
    //   icon: "mdi-chevron-up",
    //   "icon-alt": "mdi-chevron-down",
    //   text: "Labels",
    //   model: true,
    //   children: [{ icon: "mdi-plus", text: "Create label" }]
    // },
    // {
    //   icon: "mdi-chevron-up",
    //   "icon-alt": "mdi-chevron-down",
    //   text: "More",
    //   model: false,
    //   children: [
    //     { text: "Import" },
    //     { text: "Export" },
    //     { text: "Print" },
    //     { text: "Undo changes" },
    //     { text: "Other contacts" }
    //   ]
    // },
    { icon: "mdi-settings", text: "Settings", to: { name: "settings" } }
    // { icon: "mdi-message", text: "Send feedback" },
    // { icon: "mdi-help-circle", text: "Help" },
    // { icon: "mdi-cellphone-link", text: "App downloads" },
    // { icon: "mdi-keyboard", text: "Go to the old version" }
  ];
}
</script>
