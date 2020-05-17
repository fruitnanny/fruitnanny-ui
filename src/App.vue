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

        <v-list-item :color="navColor" link :to="{ name: 'settings' }">
          <v-list-item-action>
            <v-icon>mdi-cogs</v-icon>
          </v-list-item-action>
          <v-list-item-content>
            <v-list-item-title>
              Settings
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

      <v-tooltip bottom v-if="noConnectivity">
        <template v-slot:activator="{ on }">
          <v-btn icon v-on="on">
            <v-icon>mdi-wifi-strength-alert-outline</v-icon>
          </v-btn>
        </template>
        <span>No internet connection</span>
      </v-tooltip>

      <v-tooltip bottom v-else-if="updatesAvailable">
        <template v-slot:activator="{ on }">
          <v-btn icon v-on="on" @click="upgrade">
            <v-progress-circular
              indeterminate
              size="18"
              width="2"
              v-if="upgrading"
            >
            </v-progress-circular>
            <v-icon v-else>mdi-download</v-icon>
          </v-btn>
        </template>
        <span v-if="upgrading">Upgrading …</span>
        <span v-else>Updates available</span>
      </v-tooltip>

      <v-switch
        color="white"
        light
        v-model="$vuetify.theme.dark"
        @change="toggleDarkMode"
        prepend-icon="mdi-moon-waning-crescent"
        class="night-mode ml-1"
      ></v-switch>

      <v-btn icon href="https://github.com/f3anaro/fruitnanny">
        <v-icon>mdi-github-circle</v-icon>
      </v-btn>
    </v-app-bar>
    <v-content>
      <router-view :updates-available="updatesAvailable"></router-view>
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
import { probeHealthStatus, sleep } from "./probe";
import {
  reboot,
  poweroff,
  readConnectivity,
  readUpdates,
  upgrade
} from "./api";
import { putDarkMode } from "./settings";

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

  connectivityInterval = -1;
  connectivity = "full";
  updatesAvailable = true;
  upgrading = false;

  get noConnectivity() {
    return this.connectivity !== "full";
  }

  created() {
    this.connectivityInterval = setInterval(async () => {
      this.connectivity = await readConnectivity();
      this.updatesAvailable = await readUpdates();
    }, 10000);
  }

  beforeDestroy() {
    clearInterval(this.connectivityInterval);
  }

  get navColor() {
    if (this.$vuetify.theme.dark) {
      return null;
    }
    return "blue";
  }

  toggleDarkMode(state) {
    putDarkMode(state);
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

    // We do not await the request because it will most probably not return
    // since the server will reboot.
    reboot();
    await sleep(10000);

    let response = null;
    while (!response) {
      try {
        response = await probeHealthStatus();
      } catch (err) {
        console.error(err);
        await sleep(2000);
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

  async upgrade() {
    if (this.upgrading) {
      return;
    }
    this.upgrading = true;
    try {
      await upgrade();
    } catch (err) {
      console.error(err);
      this.$notify.send({
        color: "error",
        text: "Failed to upgrade"
      });
    } finally {
      this.upgrading = false;
    }
  }
}
</script>
