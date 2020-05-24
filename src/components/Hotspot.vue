<template>
  <v-card flat>
    <v-card-text>
      <v-container class="px-0">
        <v-row>
          <v-col cols="12">
            <v-switch
              v-model="enabled"
              :loading="loading"
              :disabled="loading"
              @change="changeState"
              label="Enable"
            ></v-switch>
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              label="SSID"
              required
              :disabled="loading || enabled"
              v-model="ssid"
              persistent-hint
              hint="Network name seen by other devices"
            ></v-text-field>
          </v-col>
          <v-col cols="12" sm="6">
            <v-text-field
              label="Password"
              required
              :disabled="loading || enabled"
              type="text"
              v-model="password"
            ></v-text-field>
          </v-col>
        </v-row>
      </v-container>
    </v-card-text>
    <v-card-actions v-if="!enabled">
      <v-spacer></v-spacer>
      <v-btn color="blue" text :disabled="loading" @click="cancel">
        Cancel
      </v-btn>
      <v-btn color="blue" text :disabled="loading" @click="save">Save</v-btn>
    </v-card-actions>
  </v-card>
</template>

<script lang="ts">
import Vue from "vue";
import Component from "vue-class-component";
import { Prop, Watch } from "vue-property-decorator";
import {
  Hotspot,
  Connection,
  readHotspot,
  updateHotspot,
  activate,
  disconnect,
  withCheckpoint,
  ResolveError
} from "../api";
import copy from "../copy";

@Component
export default class HotspotSettings extends Vue {
  @Prop({ default: false }) readonly active!: Connection | null;

  hotspot!: Hotspot;
  loading: boolean = true;
  enabled: boolean = false;
  password: string = "";
  ssid: string = "";

  async created() {
    this.hotspot = await readHotspot();
    this.loading = false;
    this.password = this.hotspot.password;
    this.ssid = this.hotspot.ssid;
    this.enabled = this._isEnabled();
  }

  @Watch("active")
  activeChanged() {
    this.enabled = this._isEnabled();
  }

  changeState(value: boolean) {
    if (value) {
      this.activate();
    } else {
      this.disconnect();
    }
  }

  async save() {
    if (this.loading) {
      return;
    }
    const changes = copy(this.hotspot);
    changes.ssid = this.ssid;
    changes.password = this.password;

    this.loading = true;
    try {
      await updateHotspot(changes);

      this.hotspot.ssid = changes.ssid;
      this.hotspot.password = changes.password;
    } catch (err) {
      console.error(err);
      this.$notify.send({
        color: "error",
        text: "Could not update hotspot"
      });
    } finally {
      this.loading = false;
    }
  }

  async activate() {
    if (this.loading) {
      return;
    }
    this.loading = true;

    try {
      await withCheckpoint(() => activate({ type: "hotspot" }));
      // await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (err) {
      if (err instanceof ResolveError) {
        await new Promise(resolve => this.$emit("resolve-error", err, resolve));
      } else {
        console.error(err);
        this.$notify.send({
          color: "error",
          text: "Failed to enable hotspot"
        });
      }
    } finally {
      let wait = new Promise<void>(resolve => this.$emit("reload", resolve));
      await wait;
      this.loading = false;
    }
  }

  async disconnect() {
    if (this.loading) {
      return;
    }
    this.loading = true;

    try {
      await withCheckpoint(() => disconnect());
      // await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (err) {
      console.error(err);
      this.$notify.send({
        color: "error",
        text: "Failed to disconnect hotspot"
      });
    } finally {
      await new Promise(resolve => this.$emit("reload", resolve));
      this.loading = false;
    }
  }

  cancel() {
    this.ssid = this.hotspot.ssid;
    this.password = this.hotspot.password;
  }

  _isEnabled(): boolean {
    if (!this.active) {
      return false;
    }
    return this.active.type == "hotspot";
  }
}
</script>
