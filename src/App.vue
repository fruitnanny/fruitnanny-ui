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

      <v-btn icon href="https://fruitnanny.github.io/">
        <v-icon>mdi-github-circle</v-icon>
      </v-btn>
    </v-app-bar>
    <v-content>
      <router-view
        :updates-available="updatesAvailable"
        @updates-changed="updatesChanged"
        @check-checkpoint="handleCheckCheckpoint"
        @resolve-error="handleResolveError"
      ></router-view>
    </v-content>

    <v-snackbar v-model="$notify.show" :color="$notify.color">
      {{ $notify.text }}
      <v-btn dark text @click="$notify.show = false">
        Close
      </v-btn>
    </v-snackbar>

    <v-dialog :value="checkpoint" persistent max-width="600px">
      <v-card>
        <v-card-title class="headline">
          New network detected
        </v-card-title>

        <v-card-subtitle>
          Confirmation
        </v-card-subtitle>

        <v-card-text>
          FruitNanny detected a change in its network configuration. Do you want
          to keep the changes?
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            color="primary"
            v-if="!deletingCheckpoint"
            text
            @click="rollbackCheckpoint"
          >
            Rollback in {{ rollbackIn }}
            <v-progress-linear
              color="primary"
              class="rollback-timer"
              absolute
              bottom
              :value="100 - (rollbackIn / rollbackTimeout) * 100"
            >
            </v-progress-linear>
          </v-btn>
          <v-btn
            color="accent"
            v-if="!deletingCheckpoint"
            text
            @click="deleteCheckpoint"
          >
            Keep
          </v-btn>
          <v-progress-circular
            indeterminate
            color="accent"
            class="rollback-progress"
            v-if="deletingCheckpoint"
          ></v-progress-circular>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog :value="showResolveErrorDialog" persistent max-width="600px">
      <v-card>
        <v-card-title class="headline">
          Network configuration changed
        </v-card-title>

        <v-card-text>
          The network configuration was changed but the new network address
          could not be resolved. Please connect manually to the new address.
        </v-card-text>

        <v-card-text>
          The network configuration will automatically reset in
          <strong>{{ rollbackIn }} seconds</strong>.
        </v-card-text>

        <v-card-text>
          <v-progress-linear
            color="primary"
            :value="100 - (rollbackIn / rollbackTimeout) * 100"
          >
          </v-progress-linear>
        </v-card-text>

        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn color="accent" text @click="reloadPage">
            Reload Page
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

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

/* Add a little bit vertical space between button text and progress bar. */
.rollback-timer {
  bottom: -4px !important; /* "!important" because of inline styling. */
}

/* Add a little bottom margin to account for the extra vertical space of
 * rollback timer. */
.rollback-progress {
  margin-bottom: 4px;
}
</style>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { probeHealthStatus, sleep } from "./probe";
import {
  HTTPError,
  reboot,
  poweroff,
  readConnectivity,
  readUpdates,
  Checkpoint,
  ResolveError,
  readCheckpoint,
  deleteCheckpoint,
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
  drawer: boolean | null = null;
  powerSheet = false;
  restartSheet = false;

  connectivityInterval = -1;
  connectivity = "full";
  updatesAvailable = false;
  upgrading = false;

  checkpoint: Checkpoint | null = null;

  rollbackTimeout = 0;
  rollbackIn = 0;
  rollbackTimeoutTimer = -1;
  deletingCheckpoint = false;

  resolveError: ResolveError | null = null;
  resolveErrorCallback: (() => void) | null = null;

  get noConnectivity() {
    return this.connectivity !== "full";
  }

  async created() {
    this.connectivityInterval = setInterval(async () => {
      this.connectivity = await readConnectivity();
    }, 10000);

    this.checkCheckpoint();

    try {
      this.updatesAvailable = await readUpdates();
    } catch (err) {
      console.error(err);
      this.$notify.send({
        color: "warning",
        text: "Could not read update status"
      });
    }
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

  get showResolveErrorDialog(): boolean {
    return this.resolveError !== null;
  }

  toggleDarkMode(state: boolean) {
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

    let healthy = false;
    while (!healthy) {
      try {
        healthy = await probeHealthStatus();
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

  updatesChanged(updatesAvailable: boolean) {
    this.updatesAvailable = updatesAvailable;
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

  async handleCheckCheckpoint(
    resolve: () => void,
    reject: (reason: any) => void
  ) {
    try {
      await this.checkCheckpoint();
      resolve();
    } catch (err) {
      reject(err);
    }
  }

  async checkCheckpoint() {
    try {
      this.checkpoint = await readCheckpoint();
    } catch (err) {
      if (err instanceof HTTPError === false || err.status != 410) {
        console.error(err);
        this.$notify.send({
          color: "warning",
          text: "Could not check for network changes"
        });
      }
    }
    if (this.checkpoint) {
      this.setupRollbackTimer(this.checkpoint);
    } else {
      clearInterval(this.rollbackTimeoutTimer);
      this.rollbackTimeoutTimer = -1;
    }
  }

  setupRollbackTimer(checkpoint: Checkpoint) {
    clearInterval(this.rollbackTimeoutTimer);

    this.rollbackTimeout = checkpoint.rollbackTimeout;
    this.rollbackTimeoutTimer = setInterval(async () => {
      const now = new Date();
      const diff = (checkpoint.rollbackAt.getTime() - now.getTime()) / 1000;
      this.rollbackIn = Math.max(Math.floor(diff), 0);

      if (this.rollbackIn == 0) {
        clearInterval(this.rollbackTimeoutTimer);
        this.rollbackTimeoutTimer = -1;

        this.deletingCheckpoint = true;
        await this.waitForRollback();
        this.deletingCheckpoint = false;
        this.clearCheckpoint();
      }
    });
  }

  async deleteCheckpoint() {
    if (this.deletingCheckpoint) {
      return;
    }
    this.deletingCheckpoint = true;
    try {
      await await deleteCheckpoint(
        {
          mode: "destroy"
        },
        5000
      );
      this.clearCheckpoint();
    } catch (err) {
      console.error(err);
      this.$notify.send({
        color: "error",
        text: "Failed to Could not delete network checkpoint"
      });
    } finally {
      this.deletingCheckpoint = false;
    }
  }

  async rollbackCheckpoint() {
    if (this.deletingCheckpoint) {
      return;
    }
    this.deletingCheckpoint = true;
    try {
      deleteCheckpoint({ mode: "rollback" });

      // Wait until connectivity is established again.
      await sleep(3000);
      await this.waitForRollback();

      this.clearCheckpoint();
    } catch (err) {
      console.error(err);
      this.$notify.send({
        color: "error",
        text: "Failed to rollback network checkpoint"
      });
    } finally {
      this.deletingCheckpoint = false;
    }
  }

  async waitForRollback() {
    let healthy = false;
    while (!healthy) {
      try {
        healthy = await probeHealthStatus();
      } catch (err) {
        console.error(err);
        await sleep(1000);
      }
    }
  }

  clearCheckpoint() {
    clearInterval(this.rollbackTimeoutTimer);
    this.checkpoint = null;

    this.resolveError = null;
    if (this.resolveErrorCallback) {
      let callback = this.resolveErrorCallback;
      this.resolveErrorCallback = null;
      callback();
    }
  }

  async handleResolveError(error: ResolveError, callback: () => void) {
    this.resolveError = error;
    this.resolveErrorCallback = callback;
    this.setupRollbackTimer(error.checkpoint);
  }

  reloadPage() {
    document.location.reload();
  }
}
</script>
