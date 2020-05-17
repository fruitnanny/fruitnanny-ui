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
        <v-tab><v-icon left>mdi-access-point</v-icon>Hotspot</v-tab>

        <v-tab-item>
          <WLAN
            @reload="reload"
            :active="activeConnection"
            :visible="activeTab == 0"
          ></WLAN>
        </v-tab-item>

        <v-tab-item>
          <Hotspot :active="activeConnection" @reload="reload"></Hotspot>
        </v-tab-item>
      </v-tabs>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Connection, readActiveConnection } from "../api";
import WLAN from "./WLAN.vue";
import Hotspot from "./Hotspot.vue";

@Component({
  components: {
    WLAN,
    Hotspot: Hotspot
  }
})
export default class NetworkSettings extends Vue {
  activeTab: number = 0;
  loading: boolean = false;
  error: string | null = null;

  activeConnection: Connection | null = null;

  async created() {
    this.loading = true;
    this.activeConnection = await readActiveConnection();
    if (this.activeConnection) {
      if (this.activeConnection.type == "hotspot") {
        this.activeTab = 1;
      }
    }
    this.loading = false;
  }

  async reload(resolve: () => void) {
    this.activeConnection = await readActiveConnection();
    resolve();
  }
}
</script>
