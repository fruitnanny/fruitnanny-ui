<template>
  <v-card>
    <v-card-title>
      <span class="headline">Edit settings</span>
      <v-spacer></v-spacer>
      <v-progress-circular
        indeterminate
        color="primary"
        v-if="disabled"
      ></v-progress-circular>
    </v-card-title>
    <v-card-text>
      <v-container>
        <v-row>
          <v-col>
            <v-text-field
              label="Name"
              required
              :disabled="disabled"
              v-model="settings.connection.name"
            ></v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-text-field
              label="Password"
              required
              :disabled="disabled"
              :type="showPassword ? 'text' : 'password'"
              :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append="showPassword = !showPassword"
              v-model="settings.wifi_sec.psk"
            ></v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-text-field
              label="SSID"
              required
              :disabled="disabled"
              v-model="settings.wifi.ssid"
            ></v-text-field>
          </v-col>
          <v-col>
            <v-select
              :items="wifiModes"
              :disabled="disabled"
              v-model="settings.wifi.mode"
              label="Mode"
            ></v-select>
          </v-col>
        </v-row>
        <v-row>
          <v-col>
            <v-switch
              label="Autoconnect"
              :disabled="disabled"
              v-model="settings.connection.autoconnect"
            ></v-switch>
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>

    <v-card-actions>
      <v-btn
        color="red"
        text
        :disabled="disabled"
        @click="$emit('delete', settings)"
      >
        <v-icon left>mdi-delete</v-icon>
        Delete
      </v-btn>
      <v-spacer></v-spacer>
      <v-btn color="blue" text :disabled="disabled" @click="$emit('close')"
        >Close</v-btn
      >
      <v-btn
        color="blue"
        text
        :disabled="disabled"
        @click="$emit('save', settings)"
        >Save</v-btn
      >
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";
import { Settings } from "../api";

@Component
export default class WLANSettings extends Vue {
  @Prop({ required: true }) readonly settings!: Settings;
  @Prop({ default: false }) readonly disabled!: boolean;

  showPassword: boolean = false;

  readonly wifiModes = [
    { text: "Infrastructure", value: "infra" },
    { text: "Hotspot", value: "ap" }
  ];
}
</script>
