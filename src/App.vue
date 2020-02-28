<template>
  <v-app id="inspire">
    <v-navigation-drawer
      v-model="drawer"
      :clipped="$vuetify.breakpoint.lgAndUp"
      app
    >
      <v-list>
        <v-list-item>
          <v-list-item-content>
            <v-list-item-title class="title">
              FruitNanny
            </v-list-item-title>
            <v-list-item-subtitle>
              NoIR Baby Monitor
            </v-list-item-subtitle>
          </v-list-item-content>
        </v-list-item>

        <v-list-item :color="navColor" exact link :to="{ name: 'camera' }">
          <v-list-item-action>
            <v-icon>mdi-video-wireless</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>
              Camera
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item :color="navColor" link :to="{ name: 'network' }">
          <v-list-item-action>
            <v-icon>mdi-wifi</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>
              Network
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item :color="navColor" link @click="showPowerSheet">
          <v-list-item-action>
            <v-icon>mdi-power</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>
              Power
            </v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-app-bar
      :clipped-left="$vuetify.breakpoint.lgAndUp"
      app
      color="blue"
      dark
    >
      <v-app-bar-nav-icon @click.stop="drawer = !drawer" />
      <v-toolbar-title>
        {{ $route.meta.title }}
      </v-toolbar-title>

      <v-spacer />

      <v-switch
        color="accent"
        light
        :value="$vuetify.theme.dark"
        @change="$vuetify.theme.dark = !$vuetify.theme.dark"
        prepend-icon="mdi-moon-waning-crescent"
        class="night-mode"
      ></v-switch>

      <v-btn icon href="https://github.com/f3anaro/fruitnanny">
        <v-icon>mdi-github-circle</v-icon>
      </v-btn>
    </v-app-bar>
    <v-content>
      <router-view></router-view>
    </v-content>

    <v-snackbar v-model="$notify.show" :color="$notify.color">
      {{ $notify.text }}
      <v-btn dark text @click="$notify.show = false">
        Close
      </v-btn>
    </v-snackbar>

    <v-bottom-sheet v-model="powerSheet">
      <v-sheet class="text-center">
        <v-container class="fill-height">
          <v-row justify="center">
            <v-col class="flex-grow-0">
              <v-btn fab color="accent" @click="poweroff">
                <v-icon>mdi-power</v-icon>
              </v-btn>
            </v-col>
            <v-col class="flex-grow-0">
              <v-btn fab color="accent" @click="restart">
                <v-icon>mdi-restart</v-icon>
              </v-btn>
            </v-col>
          </v-row>
        </v-container>
      </v-sheet>
    </v-bottom-sheet>

    <v-bottom-sheet v-model="restartSheet" persistent>
      <v-sheet class="text-center">
        <v-container>
          <v-row justify="center">
            <v-col md="6">
              <p class="headline">
                Restarting …
              </p>
            </v-col>
          </v-row>
          <v-row justify="center">
            <v-col md="6">
              <v-progress-linear indeterminate></v-progress-linear>
            </v-col>
          </v-row>
        </v-container>
      </v-sheet>
    </v-bottom-sheet>
  </v-app>
</template>

<style type="text/css">
.v-toolbar .v-input.night-mode {
  margin-top: 28px;
}
</style>

<script language="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { probeHealthStatus } from "./probe";
import { reboot, poweroff } from "./api";

@Component({
  props: {
    source: String
  }
})
export default class App extends Vue {
  dialog = false;
  drawer = null;
  powerSheet = false;
  restartSheet = false;

  get navColor() {
    if (this.$vuetify.theme.dark) {
      return null;
    }
    return "blue";
  }

  hideDrawerOnMobile() {
    if (!this.$vuetify.breakpoint.lgAndUp) {
      this.drawer = false;
    }
  }

  showPowerSheet() {
    this.hideDrawerOnMobile();
    this.powerSheet = true;
  }

  async restart() {
    this.hideDrawerOnMobile();
    this.powerSheet = false;
    this.restartSheet = true;

    await reboot();
    await new Promise(resolve => setTimeout(resolve, 3000));

    let response = null;
    while (!response) {
      try {
        response = await probeHealthStatus();
      } catch (err) {
        console.error(err);
      }
    }

    this.restartSheet = false;
  }

  poweroff() {
    this.hideDrawerOnMobile();
    this.powerSheet = false;
    this.$notify.send({
      text: "Powering off …"
    });
    poweroff();
  }
}
</script>
