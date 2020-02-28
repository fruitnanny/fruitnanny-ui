<template>
  <v-list subheader>
    <v-list-item-group color="primary">
      <v-list-item>
        <v-list-item-icon>
          <v-icon color="primary">mdi-check</v-icon>
        </v-list-item-icon>
        <v-list-item-content>
          <v-list-item-title>wired-dhcp</v-list-item-title>
        </v-list-item-content>

        <v-list-item-icon>
          <v-icon>mdi-network-outline</v-icon>
        </v-list-item-icon>
      </v-list-item>
    </v-list-item-group>

    <v-subheader>My Networks</v-subheader>
    <v-list-item v-for="setting in settings" :key="setting.uuid">
      <v-list-item-icon>
        <v-icon></v-icon>
      </v-list-item-icon>
      <v-list-item-content>
        <v-list-item-title v-text="setting.name"></v-list-item-title>
      </v-list-item-content>

      <v-list-item-icon>
        <v-icon>mdi-network-outline</v-icon>
      </v-list-item-icon>
    </v-list-item>
  </v-list>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Settings } from "../api";

@Component
export default class Ethernet extends Vue {
  settings: Settings[] = [
    // { connection: { name: "wired-dhcp",          uuid: "0f948e53-9b67-4426-8f84-2ac8ea5224d0",  type: "ethernet",  device: "eth0", icon: "mdi-network-outline"} },
    // { connection: { name: "fruitnanny-wired",    uuid: "54757525-1356-3bed-8169-26a6182b917a",  type: "ethernet",  device: null, icon: "mdi-network-outline"} },
  ];
}
</script>
