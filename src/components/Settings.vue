<template>
  <v-container>
    <div class="text-center pa-4" v-if="loading">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <div class="pa-4" v-else-if="error">
      <v-alert type="error">{{ error }}</v-alert>
    </div>
    <v-card v-else flat>
      <v-tabs v-model="activeTab">
        <v-tab><v-icon left>mdi-wifi</v-icon>WLAN</v-tab>
        <v-tab><v-icon left>mdi-network-outline</v-icon>Ethernet</v-tab>

        <v-tab-item>
          <WLAN
            @reload="reloadSettings"
            @delete="deleteSettings"
            @save="updateSettings"
            :settings="wlanSettings"
            :access-points="accessPoints"
            :access-points-loading="loadingAccessPoints"
            :active="activeWlanConnection"
          ></WLAN>
        </v-tab-item>

        <v-tab-item>
          <Ethernet></Ethernet>
        </v-tab-item>
      </v-tabs>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import {
  Settings,
  ActiveConnection,
  AccessPoint,
  listSettings,
  deleteSettings,
  updateSettings,
  getActiveConnection,
  getAccessPoints
} from "../api";
import WLAN from "./WLAN.vue";
import Ethernet from "./Ethernet.vue";

@Component({
  components: {
    WLAN,
    Ethernet
  }
})
export default class FruitNannySettings extends Vue {
  activeTab: number = 0;
  loading: boolean = false;
  error: string | null = null;
  scanTimer: number = -1;

  ethernetSettings: Settings[] = [];
  wlanSettings: Settings[] = [];
  accessPoints: AccessPoint[] = [];
  loadingAccessPoints: boolean = false;

  activeWlanConnection: ActiveConnection | null = null;

  created() {
    this.loading = true;
    this.fetchSettings().finally(() => (this.loading = false));
    this.fetchWirelessNetworks();
  }

  beforeDestroy() {
    clearInterval(this.scanTimer);
  }

  async fetchSettings() {
    try {
      const settings = await listSettings();

      this.ethernetSettings = settings.filter(
        c => c.connection.type === "ethernet"
      );
      this.wlanSettings = settings.filter(
        c => c.connection.type === "wireless"
      );

      this.activeWlanConnection = await getActiveConnection("wlan0");
    } catch (err) {
      console.error(err);
      this.error = "Could not load network settings";
    }
  }

  async fetchWirelessNetworks() {
    this.loadingAccessPoints = true;
    try {
      this.accessPoints = await getAccessPoints();
    } finally {
      this.loadingAccessPoints = false;
    }

    // Scan wireless networks every 10s
    this.scanTimer = setTimeout(() => this.fetchWirelessNetworks(), 10000);
  }

  async deleteSettings(
    settings: Settings,
    resolve?: (value?: any) => void,
    reject?: (reason?: any) => void
  ) {
    try {
      await deleteSettings(settings.connection.uuid);
    } catch (err) {
      if (reject) {
        reject(err);
      } else {
        console.error(err);
      }
      return;
    }

    await this.reloadSettings();

    if (resolve) {
      resolve();
    }
  }

  async updateSettings(
    settings: Settings,
    resolve?: (value?: any) => void,
    reject?: (reason?: any) => void
  ) {
    try {
      await updateSettings(settings);
    } catch (err) {
      if (reject) {
        reject();
      } else {
        console.error(err);
      }
      return;
    }

    await this.reloadSettings();

    if (resolve) {
      resolve();
    }
  }

  async reloadSettings(callback?: () => void) {
    console.info("Reload network settings");
    await this.fetchSettings();
    if (callback) {
      callback();
    }
  }
}
</script>
