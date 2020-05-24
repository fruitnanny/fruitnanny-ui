<template>
  <v-container>
    <div class="text-center pa-4" v-if="loading">
      <v-progress-circular indeterminate color="primary"></v-progress-circular>
    </div>
    <v-card v-else flat>
      <v-tabs v-model="activeTab">
        <v-tab><v-icon left>mdi-thermometer-lines</v-icon>Sensor</v-tab>
        <v-tab><v-icon left>mdi-cogs</v-icon>System</v-tab>

        <v-tab-item>
          <v-container>
            <v-row>
              <v-col cols="12" sm="6">
                <v-text-field
                  label="Temperatur Offset"
                  type="number"
                  prepend-icon="mdi-thermometer"
                  append-icon="mdi-temperature-celsius"
                  required
                  :disabled="saving"
                  v-model="temperatureOffset"
                ></v-text-field>
              </v-col>
              <v-col cols="12" sm="6">
                <v-text-field
                  label="Humidity Offset"
                  type="number"
                  prepend-icon="mdi-water-percent"
                  append-icon="mdi-percent"
                  required
                  :disabled="saving"
                  v-model="humidityOffset"
                ></v-text-field>
              </v-col>
            </v-row>
          </v-container>
          <v-card-actions>
            <v-spacer></v-spacer>
            <v-btn color="blue" text :disabled="saving" @click="cancel"
              >Cancel</v-btn
            >
            <v-btn color="blue" text :disabled="saving" @click="save"
              >Save</v-btn
            >
          </v-card-actions>
        </v-tab-item>

        <v-tab-item>
          <v-container>
            <v-row>
              <v-col>
                <v-btn :disabled="checkingForUpdates" @click="checkForUpdates">
                  <v-progress-circular
                    v-if="checkingForUpdates"
                    indeterminate
                    size="18"
                    width="2"
                    class="mr-1"
                  >
                  </v-progress-circular>
                  <v-icon left v-else>mdi-download</v-icon>
                  Check for Updates
                </v-btn>
              </v-col>
            </v-row>
            <v-row>
              <v-col>
                <v-btn
                  :disabled="checkingForCheckpoint"
                  @click="checkForCheckpoint"
                >
                  <v-progress-circular
                    v-if="checkingForCheckpoint"
                    indeterminate
                    size="18"
                    width="2"
                    class="mr-1"
                  >
                  </v-progress-circular>
                  <v-icon left v-else>mdi-wifi</v-icon>
                  Check for network changes
                </v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-tab-item>
      </v-tabs>
    </v-card>
  </v-container>
</template>

<script lang="ts">
import Vue from "vue";
import { Prop } from "vue-property-decorator";
import Component from "vue-class-component";
import {
  Settings as SettingsInterface,
  readSettings,
  updateSettings,
  readUpdatesWithDownload
} from "../api";

@Component
export default class Settings extends Vue {
  @Prop({ default: false }) readonly updatesAvailable!: boolean;

  settings: SettingsInterface | null = null;
  loading: boolean = true;
  saving: boolean = false;
  activeTab: number = 0;
  checkingForUpdates: boolean = false;
  checkingForCheckpoint: boolean = false;

  temperatureOffset: string = "0";
  humidityOffset: string = "0";

  async created() {
    try {
      this.settings = await readSettings();
      this.loading = false;
    } catch (err) {
      console.error(err);
      this.$notify.send({
        color: "error",
        text: "Failed to load settings"
      });
    }
    this.copy();
  }

  cancel() {
    this.copy();
  }

  copy() {
    if (this.settings) {
      this.temperatureOffset = this.settings!.temperatureOffset.toString();
      this.humidityOffset = this.settings!.humidityOffset.toString();
    } else {
      this.temperatureOffset = "0";
      this.humidityOffset = "0";
    }
  }

  async save() {
    if (this.saving) {
      return;
    }

    let temperatureOffset;
    let humidityOffset;

    try {
      temperatureOffset = parseFloat(this.temperatureOffset);
      humidityOffset = parseFloat(this.humidityOffset);
    } catch (err) {
      this.$notify.send({
        color: "error",
        text: "Invalid offset values"
      });
      return;
    }

    this.saving = true;
    try {
      this.settings = await updateSettings({
        temperatureOffset: temperatureOffset,
        humidityOffset: humidityOffset
      });
    } catch (err) {
      console.error(err);
      this.$notify.send({
        color: "error",
        text: "Failed to save settings"
      });
    } finally {
      this.saving = false;
    }
  }

  async checkForUpdates() {
    if (this.checkingForUpdates) {
      return;
    }
    this.checkingForUpdates = true;
    try {
      const updatesAvailable = await readUpdatesWithDownload();
      this.$emit("updates-changed", updatesAvailable);
    } catch (err) {
      console.error(err);
      this.$notify.send({
        color: "error",
        text: "Failed to check updates"
      });
    } finally {
      this.checkingForUpdates = false;
    }
  }

  async checkForCheckpoint() {
    if (this.checkingForCheckpoint) {
      return;
    }
    try {
      this.checkingForCheckpoint = true;
      let wait = new Promise<void>((resolve, reject) => {
        this.$emit("check-checkpoint", resolve, reject);
      });
      await wait;
    } catch (err) {
      console.error(err);
      this.$notify.send({
        color: "error",
        text: "Failed to check for network changes"
      });
    } finally {
      this.checkingForCheckpoint = false;
    }
  }
}
</script>
