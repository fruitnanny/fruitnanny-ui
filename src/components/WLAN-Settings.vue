<template>
  <v-card>
    <v-card-title>
      <span class="headline">Edit connection</span>
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
              v-model="connection.name"
            ></v-text-field>
          </v-col>
        </v-row>
        <!-- <v-row>
          <v-col>
            <v-text-field
              label="Password"
              required
              :disabled="disabled"
              :type="showPassword ? 'text' : 'password'"
              :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append="showPassword = !showPassword"
              v-model="password"
            ></v-text-field>
          </v-col>
        </v-row> -->
        <v-row>
          <v-col>
            <v-text-field
              label="SSID"
              required
              :disabled="disabled"
              v-model="connection.ssid"
            ></v-text-field>
          </v-col>
        </v-row>
        <v-row>
          <v-col cols="12" md="6">
            <v-switch
              label="Autoconnect"
              :disabled="disabled"
              v-model="connection.autoconnect"
            ></v-switch>
          </v-col>
          <v-col cols="12" md="6">
            <v-text-field
              label="Autoconnect Priority"
              type="number"
              :disabled="disabled"
              v-model="priority"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>

    <v-card-actions>
      <v-btn color="red" text :disabled="disabled" @click="deleteConnection">
        <v-icon left>mdi-delete</v-icon>
        Delete
      </v-btn>
      <v-spacer></v-spacer>
      <v-btn color="blue" text :disabled="disabled" @click="$emit('close')"
        >Close</v-btn
      >
      <v-btn color="blue" text :disabled="disabled" @click="save">Save</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop } from "vue-property-decorator";
import { Connection } from "../api";

@Component
export default class WLANSettings extends Vue {
  @Prop({ required: true }) readonly connection!: Connection;
  @Prop({ default: false }) readonly disabled!: boolean;

  priority: string = "";
  // password: string = "";
  // showPassword: boolean = false;
  processing: Promise<void> | null = null;

  created() {
    this.priority = this.connection.priority.toString();
  }

  async save() {
    if (this.processing) {
      return;
    }

    try {
      this.connection.priority = parseInt(this.priority);
    } catch (err) {
      this.$notify.send({
        color: "error",
        text: "Invalid priority"
      });
      return;
    }

    this.processing = new Promise((resolve, reject) => {
      this.$emit("save", this.connection, resolve, reject);
    });

    try {
      await this.processing;
    } catch (err) {
      console.error(err);
      this.$notify.send({
        color: "error",
        text: "Failed to update connect"
      });
    } finally {
      this.processing = null;
    }
  }

  async deleteConnection() {
    if (this.processing) {
      return;
    }
    this.processing = new Promise((resolve, reject) => {
      this.$emit("delete", this.connection, resolve, reject);
    });

    try {
      await this.processing;
    } catch (err) {
      console.error(err);
      this.$notify.send({
        color: "error",
        text: "Failed to update connect"
      });
    } finally {
      this.processing = null;
    }
  }

  // readonly wifiModes = [
  //   { text: "Infrastructure", value: "infra" },
  //   { text: "Hotspot", value: "ap" }
  // ];
}
</script>
