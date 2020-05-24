<template>
  <v-container>
    <div class="text-center pa-4" v-if="loading">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <v-card v-else flat>
      <v-tabs v-model="activeTab">
        <v-tab><v-icon left>mdi-wifi</v-icon>WLAN</v-tab>
        <v-tab><v-icon left>mdi-access-point</v-icon>Hotspot</v-tab>

        <v-tab-item>
          <WLAN
            @reload="reload"
            @resolve-error="resolve"
            :active="activeConnection"
            :visible="activeTab == 0"
          ></WLAN>
        </v-tab-item>

        <v-tab-item>
          <Hotspot
            :active="activeConnection"
            @reload="reload"
            @resolve-error="resolve"
          ></Hotspot>
        </v-tab-item>
      </v-tabs>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import {
  Connection,
  readActiveConnection,
  HTTPError,
  ResolveError
} from "../api";
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

  activeConnection: Connection | null = null;

  async created() {
    this.loading = true;
    try {
      this.activeConnection = await readActiveConnection();
    } catch (err) {
      if (err instanceof HTTPError === false || err.status !== 404) {
        console.error(err);
        this.$notify.send({
          color: "error",
          text: "Failed to fetch network connection"
        });
      }
      this.activeConnection = null;
    }
    if (this.activeConnection) {
      if (this.activeConnection.type == "hotspot") {
        this.activeTab = 1;
      }
    }
    this.loading = false;
  }

  async reload(resolve: () => void) {
    try {
      this.activeConnection = await readActiveConnection();
      resolve();
    } catch (err) {
      if (err instanceof HTTPError && err.status === 404) {
        this.activeConnection = null;
        resolve();
      } else {
        console.error(err);
        this.$notify.send({
          color: "error",
          text: "Failed to fetch network connection"
        });
      }
    }
  }

  async resolve(error: ResolveError, resolve: () => void) {
    await new Promise<void>(_resolve =>
      this.$emit("resolve-error", error, _resolve)
    );
    resolve();
  }
}
</script>
